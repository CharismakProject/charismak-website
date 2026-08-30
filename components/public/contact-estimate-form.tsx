"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, FileUp, Loader2 } from "lucide-react";

export default function ContactEstimateForm({
  initialService = "Construction enquiry",
  initialLocation = "",
  initialEstimate = "",
}: {
  initialService?: string;
  initialLocation?: string;
  initialEstimate?: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState(initialService);
  const [location, setLocation] = useState(initialLocation);
  const [preferredContact, setPreferredContact] = useState("Phone / WhatsApp");
  const [details, setDetails] = useState(initialEstimate);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const form = new FormData();
      form.set("name", name);
      form.set("phone", phone);
      form.set("email", email);
      form.set("service", service);
      form.set("location", location);
      form.set("preferredContact", preferredContact);
      form.set("details", details);
      files.slice(0, 3).forEach((file) => form.append("attachments", file));

      const response = await fetch("/api/contact-estimate", { method: "POST", body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "The enquiry could not be sent.");
      setStatus("success");
      setMessage("Your enquiry has been sent to Charismak. We now have the project information you supplied.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The enquiry could not be sent. Please try again.");
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 grid gap-5">
      {initialEstimate ? <div className="border border-[#C8A45D]/35 bg-[#FFF9ED] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9A6416]">Estimator information received</p><p className="mt-2 text-xs leading-6 text-[#74520D]">Your preliminary estimate has been carried into this form. You can edit the project details below before sending.</p></div> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[#3A4653]">Your name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm outline-none focus:border-[#0D3B66]" /></label>
        <label className="text-xs font-semibold text-[#3A4653]">Phone / WhatsApp<input required value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm outline-none focus:border-[#0D3B66]" /></label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[#3A4653]">Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm outline-none focus:border-[#0D3B66]" /></label>
        <label className="text-xs font-semibold text-[#3A4653]">Preferred contact<select value={preferredContact} onChange={(event) => setPreferredContact(event.target.value)} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm outline-none focus:border-[#0D3B66]"><option>Phone / WhatsApp</option><option>Email</option><option>Either</option></select></label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[#3A4653]">Service / project scope<input required value={service} onChange={(event) => setService(event.target.value)} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm outline-none focus:border-[#0D3B66]" /></label>
        <label className="text-xs font-semibold text-[#3A4653]">Project location<input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm outline-none focus:border-[#0D3B66]" /></label>
      </div>
      <label className="text-xs font-semibold text-[#3A4653]">Project details / estimator summary<textarea required value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Tell us about the project" className="mt-2 min-h-[210px] w-full border border-[#0D3B66]/15 bg-white p-4 text-sm leading-6 outline-none focus:border-[#0D3B66]" /></label>
      <label className="border border-dashed border-[#0D3B66]/20 bg-[#F7F8FA] p-5 text-xs font-semibold text-[#3A4653]">
        <span className="flex items-center gap-2 text-[#071E33]"><FileUp className="h-4 w-4 text-[#C8A45D]" />Attach drawings / BOQ / project images</span>
        <span className="mt-2 block font-normal leading-5 text-[#3A4653]/65">Up to 3 PDF, image, Excel or Word files; maximum 6 MB each.</span>
        <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.docx" onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 3))} className="mt-3 block w-full text-xs" />
        {files.length ? <span className="mt-2 block font-normal text-[#0D3B66]">Selected: {files.map((file) => file.name).join(", ")}</span> : null}
      </label>

      {message ? <div className={`flex gap-3 border p-4 text-xs leading-6 ${status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{status === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : null}<span>{message}</span></div> : null}

      <button type="submit" disabled={status === "sending"} className="inline-flex min-h-13 items-center justify-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D] hover:text-[#071E33] disabled:cursor-not-allowed disabled:opacity-60">{status === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}{status === "sending" ? "Sending enquiry…" : "Send Project Enquiry"}<ArrowRight className="h-5 w-5" /></button>
    </form>
  );
}
