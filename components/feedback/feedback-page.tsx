"use client";

import { type FormEvent, useMemo, useState } from "react";

import { useBetaSession } from "@/components/auth/beta-session";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type FeedbackPageProps = {
  onBack: () => void;
};

const categories = [
  "Calculation accuracy",
  "BOQ and exports",
  "Rates and pricing",
  "Fence estimator",
  "Mobile experience",
  "Feature request",
  "Other",
];

export default function FeedbackPage({ onBack }: FeedbackPageProps) {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const { user, email } = useBetaSession();
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState(categories[0]);
  const [message, setMessage] = useState("");
  const [allowContact, setAllowContact] = useState(true);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client || !user || !message.trim()) {
      setStatus("Enter a review message before submitting.");
      return;
    }

    setSubmitting(true);
    setStatus("");
    const { error } = await client.from("beta_reviews").insert({
      user_id: user.id,
      email,
      rating,
      category,
      message: message.trim(),
      allow_contact: allowContact,
      app_version: "beta-1",
    });
    setSubmitting(false);

    if (error) {
      setStatus("Your review could not be saved yet. Please try again shortly.");
      return;
    }

    setMessage("");
    setStatus("Thank you—your review has been saved for the Charismak team.");
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] bg-[#071E33] p-7 text-white shadow-[0_28px_90px_rgba(7,30,51,0.22)] md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E7B34B]">Beta feedback</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Help us build the estimator site teams need.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
              Tell us what worked, what slowed you down and which construction workflow should be improved next.
            </p>
          </div>
          <button type="button" onClick={onBack} className="w-fit rounded-full border border-white/25 px-5 py-3 text-sm font-bold hover:bg-white/10">Back to workspace</button>
        </div>
      </section>

      <form onSubmit={submit} className="rounded-[30px] border border-[#d6dfe9] bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <label className="text-sm font-bold">Overall rating</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} star rating`} className={`grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold transition ${rating === value ? "bg-[#E7B34B] text-[#071E33]" : "bg-[#EEF3F8] text-[#0D3B66] hover:bg-[#DCE7F0]"}`}>{value}</button>
              ))}
            </div>

            <label className="mt-6 block text-sm font-bold" htmlFor="feedback-category">Feedback area</label>
            <select id="feedback-category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#C7D5E3] bg-[#F7F9FB] px-4 py-3">
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold" htmlFor="feedback-message">Your review</label>
            <textarea id="feedback-message" required rows={8} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Example: I calculated a block wall and expected the sand quantities from blockwork and concrete to consolidate in one procurement schedule…" className="mt-2 w-full resize-y rounded-2xl border border-[#C7D5E3] bg-[#F7F9FB] px-4 py-4" />
            <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-[#526579]">
              <input type="checkbox" checked={allowContact} onChange={(event) => setAllowContact(event.target.checked)} className="mt-1 h-4 w-4 accent-[#C8320A]" />
              <span>Charismak may contact me about this review.</span>
            </label>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button type="submit" disabled={submitting} className="rounded-full bg-[#C8320A] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(200,50,10,0.2)] disabled:opacity-50">{submitting ? "Saving review…" : "Submit review"}</button>
              {status ? <p role="status" className="text-sm text-[#526579]">{status}</p> : null}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
