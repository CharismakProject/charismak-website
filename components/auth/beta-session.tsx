"use client";

import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

type BetaSessionValue = {
  user: User | null;
  email: string | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

export const BetaSessionContext = createContext<BetaSessionValue>({
  user: null,
  email: null,
  isAdmin: false,
  signOut: async () => {},
});

export function useBetaSession() {
  return useContext(BetaSessionContext);
}
