"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckCircle2, FileText, Loader2, Send, XCircle } from "lucide-react";
import { projects, services } from "../site-data";

export default function QuotePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      service: formData.get("service"),
      referenceProject: formData.get("referenceProject"),
      details: formData.get("details"),
    };

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to send");

      setStatus("success");
      form.reset();
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20 text-[#111827]">
      <section className="relative bg-[#0D3B66] px-5 py-24 text-[#F5F7FA] md:px-8">
        <Image
          src="/Images/Projects/fabrication/cover.jpg"
          alt="Quote center background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-24"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D3B66] via-[#0D3B66]/92 to-[#0D3B66]/70" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8B1E00]">
            Client & Visitor Desk
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
            Request a quote for your next project.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#F5F7FA]/70">
            Tell us about your project and our team will review your
            requirements and get back to you with next steps, including a
            site inspection where needed.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="bg-[#0D3B66] p-6 text-[#F5F7FA] md:p-10"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-7 w-7 text-[#8B1E00]" />
              <h2 className="text-3xl font-semibold">Request a Quote</h2>
            </div>

            <div className="mt-8 grid gap-4">
              <input
                name="name"
                required
                placeholder="Full name"
                className="border border-white/10 bg-white/[0.06] px-4 py-3 outline-none placeholder:text-[#F5F7FA]/45 focus:border-[#8B1E00]"
              />
              <input
                name="email"
                required
                type="email"
                placeholder="Email address"
                className="border border-white/10 bg-white/[0.06] px-4 py-3 outline-none placeholder:text-[#F5F7FA]/45 focus:border-[#8B1E00]"
              />
              <input
                name="phone"
                required
                placeholder="Phone / WhatsApp"
                className="border border-white/10 bg-white/[0.06] px-4 py-3 outline-none placeholder:text-[#F5F7FA]/45 focus:border-[#8B1E00]"
              />

              <select
                name="service"
                required
                defaultValue=""
                className="border border-white/10 bg-[#10233A] px-4 py-3 outline-none focus:border-[#8B1E00]"
              >
                <option value="" disabled>
                  Select a service
                </option>
                {services.map((service) => (
                  <option key={service.title}>{service.title}</option>
                ))}
              </select>

              <select
                name="referenceProject"
                defaultValue=""
                className="border border-white/10 bg-[#10233A] px-4 py-3 outline-none focus:border-[#8B1E00]"
              >
                <option value="" disabled>
                  Similar to an existing project? (optional)
                </option>
                {projects.map((project) => (
                  <option key={project.slug}>{project.title}</option>
                ))}
                <option>New Custom Project</option>
              </select>

              <textarea
                name="details"
                required
                placeholder="Tell us about the project, location, budget range, and expected timeline"
                rows={6}
                className="border border-white/10 bg-white/[0.06] px-4 py-3 outline-none placeholder:text-[#F5F7FA]/45 focus:border-[#8B1E00]"
              />
            </div>

            <button
              disabled={status === "loading"}
              className="mt-6 inline-flex w-full items-center justify-center gap-3 bg-[#8B1E00] px-7 py-4 font-semibold text-white transition hover:bg-[#F5F7FA] hover:text-[#0D3B66] disabled:opacity-60"
            >
              {status === "loading" ? (
                <>
                  Sending <Loader2 className="h-5 w-5 animate-spin" />
                </>
              ) : (
                <>
                  Submit Quote Request <Send className="h-5 w-5" />
                </>
              )}
            </button>

            {status === "success" && (
              <div className="mt-5 flex gap-3 border border-[#8B1E00]/30 bg-white/[0.06] p-4 text-sm text-[#F5F7FA]/75">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#8B1E00]" />
                Thank you. Your request has been sent and our team will
                contact you shortly.
              </div>
            )}

            {status === "error" && (
              <div className="mt-5 flex gap-3 border border-red-500/40 bg-red-500/10 p-4 text-sm text-white/85">
                <XCircle className="h-5 w-5 shrink-0 text-red-400" />
                Something went wrong. Please try again, or reach us directly
                on WhatsApp.
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}