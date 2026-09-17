"use client";

import { useClubStore } from "@/lib/data/club-store";

export function useClub() {
  return useClubStore();
}

export { clubActions } from "@/lib/data/club-store";
