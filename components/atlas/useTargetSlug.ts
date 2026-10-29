"use client";

import { useEffect, useState } from "react";

import { parseHashParts } from "@/lib/atlas-url";

/**
 * The country row the hash names (`/atlas#japan`), or null; a section (`#map`) is not a row. It drives the scatter's
 * ringed dot and the table row's highlight together, and follows the hash when
 * a map link or the back button changes it. Read in an effect, so
 * the server render has no target.
 */
export function useTargetSlug(): string | null {
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setSlug(parseHashParts(window.location.hash).target);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  return slug;
}
