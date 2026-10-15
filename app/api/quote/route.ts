import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

import { isValidEmail } from "@/lib/enquiry/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, service, referenceProject, details } = body;

    if (!name || !email || !phone || !service || !details) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }
    if (!isValidEmail(String(email))) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (String(details).length > 10000) return NextResponse.json({ error: "Project details are too long." }, { status: 400 });
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ error: "Enquiry email is not configured on this deployment." }, { status: 503 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true, // true for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Charismak Website" <${process.env.SMTP_USER}>`,
      to: "info@charismakproject.com",
      replyTo: email,
      subject: `New Quote Request — ${service}`,
      text: `
New quote request from the website:

Name: ${name}
Email: ${email}
Phone: ${phone}
Service: ${service}
Reference Project: ${referenceProject || "N/A"}

Details:
${details}
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quote form error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}