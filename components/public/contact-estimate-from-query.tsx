"use client";

import { useEffect, useState } from "react";

import ContactEstimateForm from "@/components/public/contact-estimate-form";

type Prefill = {
  service: string;
  location: string;
  estimate: string;
};

export default function ContactEstimateFromQuery() {
  const [prefill, setPrefill] = useState<Prefill | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("source") !== "estimator") return;
    setPrefill({
      service: params.get("service")?.trim() || "Construction enquiry",
      location: params.get("location")?.trim() || "",
      estimate: params.get("estimate")?.trim() || "",
    });
  }, []);

  if (!prefill) return <ContactEstimateForm />;

  return (
    <ContactEstimateForm
      key={`${prefill.service}-${prefill.location}-${prefill.estimate}`}
      initialService={prefill.service}
      initialLocation={prefill.location}
      initialEstimate={prefill.estimate}
    />
  );
}
