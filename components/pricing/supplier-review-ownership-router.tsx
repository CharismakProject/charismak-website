"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import SupplierReviewPanel from "@/components/pricing/supplier-review-panel";
import SupplierOwnedReviewPanel from "@/components/pricing/supplier-owned-review-panel";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SupplierReviewOwnershipRouter({ batchId }: { batchId: string }) {
  const client = getSupabaseBrowserClient();
  const [linked, setLinked] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!client) {
      setError("Supplier review service is unavailable.");
      setLinked(false);
      return;
    }
    let mounted = true;
    void client.from("supplier_review_batches").select("supplier_id").eq("id", batchId).single().then(({ data, error: loadError }) => {
      if (!mounted) return;
      if (loadError) {
        setError(loadError.message);
        setLinked(false);
        return;
      }
      setLinked(Boolean(data?.supplier_id));
    });
    return () => { mounted = false; };
  }, [batchId, client]);

  if (linked === null) return <div className="grid min-h-[45vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  if (error) return <div className="rounded-2xl border border-[#F1C8C0] bg-[#FFF4F1] p-5 text-sm text-[#8B1E00]">{error}</div>;
  return linked ? <SupplierOwnedReviewPanel batchId={batchId} /> : <SupplierReviewPanel batchId={batchId} />;
}
