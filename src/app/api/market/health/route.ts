import { NextResponse } from "next/server";
import { alpacaConfigured, getQuotes } from "@/server/alpaca";

/** "ok" only when the provider actually answers with a price — this drives the MARKETS ONLINE indicator. */
export async function GET() {
  if (!alpacaConfigured()) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const [q] = await getQuotes(["SPY"]);
    const ok = Boolean(q && Number.isFinite(q.price));
    return NextResponse.json({ ok }, { headers: { "Cache-Control": "public, s-maxage=30" } });
  } catch {
    return NextResponse.json({ ok: false, reason: "provider_error" }, { headers: { "Cache-Control": "no-store" } });
  }
}
