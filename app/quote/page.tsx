"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Send,
  XCircle,
} from "lucide-react";
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
    <main className="overflow-hidden bg-white pt-20 text-[#151B22]">
      <section className="relative min-h-[590px] overflow-hidden bg-[#071E33] text-white">
        <Image
          src="/Images/Projects/fabrication/cover.jpg"
          alt="Charismak construction project"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071E33]/97 via-[#071E33]/82 to-[#071E33]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071E33]/70 via-transparent to-transparent" />

        <div className="relative mx-auto flex min-h-[590px] max-w-7xl items-center px-5 py-20 md:px-8">
          <div className="max-w-4xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">
              Start A Project
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Tell us what you need.
              <span className="mt-2 block text-[#E8C77F]">We’ll help define the next step.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
              Share the project type, location and what stage you are at. Our team
              will review the information and respond with the most practical next
              step, including a site visit where required.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.58fr_1.42fr]">
          <aside className="lg:pt-3">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
              Before You Submit
            </p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-4xl">
              A few details help us understand the project faster.
            </h2>
            <div className="mt-8 space-y-6">
              {[
                ["01", "Project type", "Tell us whether it is a new build, renovation, fit-out, fabrication or another requirement."],
                ["02", "Location", "The site location helps us understand logistics, access and likely next steps."],
                ["03", "Current stage", "Let us know whether you already have drawings, a BOQ, a budget or only an initial idea."],
              ].map(([number, title, text]) => (
                <div key={title} className="border-t border-[#0D3B66]/12 pt-5">
                  <div className="flex gap-4">
                    <span className="text-xs font-bold tracking-[0.2em] text-[#C8A45D]">{number}</span>
                    <div>
                      <h3 className="font-semibold text-[#071E33]">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#3A4653]">{text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 shadow-[0_16px_50px_rgba(7,30,51,0.08)] md:p-10"
          >
            <div className="flex items-start justify-between gap-6 border-b border-[#0D3B66]/10 pb-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
                  Project Enquiry
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#071E33]">
                  Request a quote
                </h2>
              </div>
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-[#0D3B66] text-white">
                <FileText className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-8 grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <input name="name" required placeholder="Full name" className="border border-[#0D3B66]/15 bg-white px-4 py-4 outline-none" />
                <input name="phone" required placeholder="Phone / WhatsApp" className="border border-[#0D3B66]/15 bg-white px-4 py-4 outline-none" />
              </div>
              <input name="email" required type="email" placeholder="Email address" className="border border-[#0D3B66]/15 bg-white px-4 py-4 outline-none" />

              <div className="grid gap-5 sm:grid-cols-2">
                <select name="service" required defaultValue="" className="border border-[#0D3B66]/15 bg-white px-4 py-4 outline-none">
                  <option value="" disabled>Select a service</option>
                  {services.map((service) => <option key={service.title}>{service.title}</option>)}
                </select>

                <select name="referenceProject" defaultValue="" className="border border-[#0D3B66]/15 bg-white px-4 py-4 outline-none">
                  <option value="" disabled>Similar project? (optional)</option>
                  {projects.map((project) => <option key={project.slug}>{project.title}</option>)}
                  <option>New Custom Project</option>
                </select>
              </div>

              <textarea
                name="details"
                required
                placeholder="Tell us about the project, location, budget range, expected timeline and what information you already have"
                rows={7}
                className="border border-[#0D3B66]/15 bg-white px-4 py-4 outline-none"
              />
            </div>

            <button
              disabled={status === "loading"}
              className="mt-6 inline-flex w-full items-center justify-center gap-3 bg-[#0D3B66] px-7 py-4 font-bold text-white transition hover:bg-[#C8A45D] hover:text-[#071E33] disabled:opacity-60"
            >
              {status === "loading" ? (
                <>Sending <Loader2 className="h-5 w-5 animate-spin" /></>
              ) : (
                <>Submit Quote Request <Send className="h-5 w-5" /></>
              )}
            </button>

            {status === "success" && (
              <div className="mt-5 flex gap-3 border border-[#C8A45D]/35 bg-[#F7F8FA] p-4 text-sm text-[#3A4653]">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0D3B66]" />
                Thank you. Your request has been sent and our team will contact you shortly.
              </div>
            )}

            {status === "error" && (
              <div className="mt-5 flex gap-3 border border-red-500/30 bg-red-50 p-4 text-sm text-red-800">
                <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                Something went wrong. Please try again, or reach us directly on WhatsApp.
              </div>
            )}

            <div className="mt-7 flex items-center justify-end gap-2 text-xs text-[#3A4653]/60">
              <span>Professional review by Charismak</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
