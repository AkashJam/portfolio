import { TICKER_API_URL } from "@/lib/ticker-client";

// Same-origin SSE proxy (portfolio.md §8/§9.2, Option B) — the browser
// never talks to the Ticker API directly, only this route, over the
// Docker network. `nodejs` runtime (not edge) for the streaming fetch
// pass-through; `force-dynamic` since this must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const symbols = new URL(request.url).searchParams.get("symbols") ?? "";

  let upstream: Response;
  try {
    upstream = await fetch(
      `${TICKER_API_URL}/stream?symbols=${encodeURIComponent(symbols)}`,
      { headers: { Accept: "text/event-stream" }, cache: "no-store" }
    );
  } catch (error) {
    console.error("api/stream: upstream fetch failed", error);
    return new Response(null, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
