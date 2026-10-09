import { expect, test } from "@playwright/test";

// /api/health is what the external uptime monitor polls; it must report the
// ticker chain, not just that Next is up. Needs a live ticker (integration job).
test("/api/health is ok with a live ticker", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});
