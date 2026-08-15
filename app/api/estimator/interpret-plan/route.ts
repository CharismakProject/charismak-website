import { NextResponse } from "next/server";

export const runtime = "nodejs";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["suitable", "drawingType", "summary", "projectType", "floorCount", "floorAreaM2", "buildingLengthM", "buildingWidthM", "doors", "windows", "rooms", "confidence", "warnings", "requiresKnownDimension"],
  properties: {
    suitable: { type: "boolean" },
    drawingType: { type: "string", enum: ["architectural-plan", "hand-sketch", "other", "unreadable"] },
    summary: { type: "string" },
    projectType: { type: "string" },
    floorCount: { type: ["number", "null"] },
    floorAreaM2: { type: ["number", "null"] },
    buildingLengthM: { type: ["number", "null"] },
    buildingWidthM: { type: ["number", "null"] },
    doors: { type: ["number", "null"] },
    windows: { type: ["number", "null"] },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    requiresKnownDimension: { type: "boolean" },
    warnings: { type: "array", items: { type: "string" } },
    rooms: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "count", "lengthM", "widthM", "confidence"],
        properties: {
          name: { type: "string" },
          count: { type: "number" },
          lengthM: { type: ["number", "null"] },
          widthM: { type: ["number", "null"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
  },
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI plan interpretation is not configured on this deployment." }, { status: 503 });

  const form = await request.formData();
  const file = form.get("file");
  const knownDimension = String(form.get("knownDimension") ?? "").trim();
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF, plan image or sketch first." }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "The file must be smaller than 20 MB." }, { status: 413 });
  const allowed = file.type === "application/pdf" || file.type.startsWith("image/");
  if (!allowed) return NextResponse.json({ error: "Only PDF and image files are supported for plan interpretation." }, { status: 415 });

  const dataUrl = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
  const fileInput = file.type === "application/pdf"
    ? { type: "input_file", filename: file.name, file_data: dataUrl, detail: "high" }
    : { type: "input_image", image_url: dataUrl, detail: "high" };
  const prompt = `You are assisting a construction estimator. Interpret this simple architectural floor plan or hand-drawn construction sketch only for project setup. Do not produce a BOQ and do not invent unreadable dimensions. Extract visible rooms, counts, overall dimensions, floor area, doors and windows. Written dimensions take priority over scale. If scale is uncertain, return null dimensions and requiresKnownDimension=true. The user supplied this optional known dimension: ${knownDimension || "none"}. A hand sketch must have low or medium confidence and be described as preliminary. List every material uncertainty in warnings.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_ESTIMATOR_MODEL || "gpt-4.1-mini",
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }, fileInput] }],
      text: { format: { type: "json_schema", name: "construction_plan_interpretation", strict: true, schema } },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || "The AI service could not interpret this plan.";
    return NextResponse.json({ error: message }, { status: response.status });
  }
  const outputText = payload?.output?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? []).find((item: { type?: string }) => item.type === "output_text")?.text;
  if (!outputText) return NextResponse.json({ error: "The AI response did not contain a reviewable interpretation." }, { status: 502 });
  try {
    return NextResponse.json({ interpretation: JSON.parse(outputText) });
  } catch {
    return NextResponse.json({ error: "The AI response could not be converted into project information." }, { status: 502 });
  }
}
