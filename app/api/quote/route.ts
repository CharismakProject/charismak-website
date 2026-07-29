import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

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