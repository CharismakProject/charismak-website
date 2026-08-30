"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { syncCatalogueFromCloud } from "@/lib/pricing/catalogue-cloud";
import SupplierReviewAccessGate from "@/components/pricing/supplier-review-access-gate";

export default function SupplierReviewCatalogueGate({ batchId }: { batchId: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void syncCatalogueFromCloud().finally(() => {
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  if (!ready) {
    return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  }

  return <SupplierReviewAccessGate batchId={batchId} />;
}
