"use client";

import { useEffect, useState } from "react";

/**
 * The slug in the address (`/atlas#japan`), or null. It drives the scatter's
 * ringed dot and the table row's highlight together, and follows the hash when
 * a map link, the jump bar or the back button changes it. Read in an effect, so
 * the server render has no target.
 */
export function useTargetSlug(): string | null {
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setSlug(window.location.hash.slice(1) || null);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  return slug;
}
