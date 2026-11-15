"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cleanCostEdits, COST_STORAGE, costKey, priceConstruction, validCost, type CostEdit, type CostEdits, type Resource } from "@/lib/construction/costs";
import type { ModelId } from "@/lib/construction/learning";
import type { RateBankItem } from "@/lib/rates/defaults";
import { RATE_LOCATIONS } from "@/lib/rates/locations";

export function useConstructionCosts(model: ModelId) {
  const [locationId, setLocationId] = useState("fct"), [edits, setEdits] = useState<CostEdits>({}), [loaded, setLoaded] = useState(false), [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COST_STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version === 1) { setEdits(cleanCostEdits(parsed.edits)); if (RATE_LOCATIONS.some(location => location.id === parsed.locationId)) setLocationId(parsed.locationId); }
      } else {
        const old = JSON.parse(window.localStorage.getItem("charismak-walkthrough-v1") ?? "null");
        if (old?.overrides && typeof old.overrides === "object") {
          const migrated: CostEdits = {};
          for (const [key, value] of Object.entries(old.overrides)) { const [region, id] = key.split(":"), edit = value as CostEdit; if (region && id && edit && typeof edit === "object") migrated[costKey("bungalow", region, id)] = edit; }
          setEdits(cleanCostEdits(migrated));
          if (RATE_LOCATIONS.some(location => location.id === old.locationId)) setLocationId(old.locationId);
        }
      }
    } catch { /* Invalid or unavailable browser storage does not prevent calculations. */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(COST_STORAGE, JSON.stringify({ version: 1, locationId, edits })); setSaved(true); } catch { setSaved(false); }
  }, [loaded, locationId, edits]);
  const priced = useMemo(() => priceConstruction(model, locationId, edits), [model, locationId, edits]);
  const patch = useCallback((id: string, update: (old: CostEdit) => CostEdit) => {
    const key = costKey(model, locationId, id);
    setEdits(current => ({ ...current, [key]: update(current[key] ?? {}) }));
  }, [model, locationId]);
  const editWork = (id: string, field: "quantity" | "rate", raw: string) => {
    if (raw !== "" && !validCost(Number(raw))) return;
    patch(id, old => { const next = { ...old }; if (raw === "") delete next[field]; else next[field] = Number(raw); return next; });
  };
  const editResource = (id: string, resourceId: string, field: "quantity" | "unitRate", raw: string) => {
    if (raw !== "" && !validCost(Number(raw))) return;
    patch(id, old => {
      const resource = { ...old.resources?.[resourceId] };
      if (field === "quantity") { if (raw === "") delete resource.quantity; else resource.quantity = Number(raw); }
      else resource.unitRate = raw === "" ? null : Number(raw);
      return { ...old, rate: undefined, resources: { ...old.resources, [resourceId]: resource } };
    });
  };
  const editAllowance = (id: string, field: keyof RateBankItem["allowances"], raw: string) => {
    const value = Number(raw) / 100; if (!validCost(value) || value > 1) return;
    patch(id, old => ({ ...old, rate: undefined, allowances: { ...old.allowances, [field]: value } }));
  };
  const addResource = (id: string, line: Omit<Resource, "id">) => patch(id, old => ({ ...old, rate: undefined, added: [...old.added ?? [], { ...line, id: `extra-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}` }] }));
  const resetWork = (id: string) => setEdits(current => { const next = { ...current }; delete next[costKey(model, locationId, id)]; return next; });
  const resetModel = () => setEdits(current => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${locationId}:${model}:`))));
  return { priced, locationId, setLocationId, saved, editWork, editResource, editAllowance, addResource, resetWork, resetModel };
}
export type ConstructionCosts = ReturnType<typeof useConstructionCosts>;
