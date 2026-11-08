"use client";

import { useCallback, useEffect, useState } from "react";

import { BASE_LOCATION_ID, getLocation, type RateLocation } from "./locations";

const KEY = "charismak-rate-location-v1";
const EVENT = "charismak:rate-location";

/**
 * The visitor's chosen state, shared by the Rate Bank, rate pages and estimator.
 * Order of precedence: ?state= in the URL, then the last choice on this device,
 * then Abuja. Changing it updates the URL (shareable) and every open component.
 */
export function useRateLocation(): [RateLocation, (id: string) => void] {
  const [id, setId] = useState(BASE_LOCATION_ID);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("state");
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(KEY);
    } catch {
      // storage unavailable
    }
    const initial = getLocation(fromUrl ?? stored).id;
    setId(initial);
    const onChange = (event: Event) => setId((event as CustomEvent<string>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const choose = useCallback((next: string) => {
    const location = getLocation(next);
    setId(location.id);
    try {
      window.localStorage.setItem(KEY, location.id);
    } catch {
      // storage unavailable
    }
    const url = new URL(window.location.href);
    if (location.id === BASE_LOCATION_ID) url.searchParams.delete("state");
    else url.searchParams.set("state", location.id);
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: location.id }));
  }, []);

  return [getLocation(id), choose];
}
