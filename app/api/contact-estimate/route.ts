import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

import { checkAttachments, isValidEmail } from "@/lib/enquiry/validation";

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
    if (!isValidEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (details.length > 10000) return NextResponse.json({ error: "Project details are too long (10,000 characters maximum)." }, { status: 400 });

    const files = form.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0);
    const attachmentError = checkAttachments(files.map((file) => ({ name: file.name, size: file.size, type: file.type })));
    if (attachmentError) return NextResponse.json({ error: attachmentError }, { status: 400 });
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ error: "Enquiry email is not configured on this deployment. Please call or email Charismak directly." }, { status: 503 });
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
