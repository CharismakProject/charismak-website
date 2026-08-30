import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const MAX_FILES = 3;
const MAX_FILE_BYTES = 6 * 1024 * 1024;
const allowedTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const service = String(form.get("service") ?? "Construction enquiry").trim();
    const location = String(form.get("location") ?? "").trim();
    const preferredContact = String(form.get("preferredContact") ?? "Phone / email").trim();
    const details = String(form.get("details") ?? "").trim();

    if (!name || !email || !phone || !details) {
      return NextResponse.json({ error: "Name, email, phone and project details are required." }, { status: 400 });
    }

    const files = form.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0);
    if (files.length > MAX_FILES) return NextResponse.json({ error: `Attach a maximum of ${MAX_FILES} files.` }, { status: 400 });

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: `${file.name} is larger than 6 MB.` }, { status: 400 });
      if (file.type && !allowedTypes.has(file.type)) return NextResponse.json({ error: `${file.name} is not a supported PDF, image, Excel or Word file.` }, { status: 400 });
    }

    const port = Number(process.env.SMTP_PORT || 465);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const attachments = await Promise.all(files.map(async (file) => ({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || undefined,
    })));

    await transporter.sendMail({
      from: `"Charismak Website" <${process.env.SMTP_USER}>`,
      to: "info@charismakproject.com",
      replyTo: email,
      subject: `Estimator / Project Enquiry — ${service}`,
      text: [
        "New project enquiry from the Charismak website:",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Preferred contact: ${preferredContact}`,
        `Service / scope: ${service}`,
        `Project location: ${location || "Not supplied"}`,
        "",
        "Project / estimator details:",
        details,
      ].join("\n"),
      attachments,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Estimator contact form error:", error);
    return NextResponse.json({ error: "Something went wrong while sending the enquiry. Please try again." }, { status: 500 });
  }
}
