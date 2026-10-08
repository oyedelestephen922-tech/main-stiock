import { NextResponse, type NextRequest } from "next/server";
import { ASSETS } from "@/lib/assets";
import { getQuotes, MarketDataError } from "@/server/alpaca";

const ALLOWED = new Set(ASSETS.map((a) => a.ticker));

export async function GET(req: NextRequest) {
  const requested = (req.nextUrl.searchParams.get("symbols") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => ALLOWED.has(s));
  const symbols = [...new Set(requested)];
  if (symbols.length === 0) return NextResponse.json({ quotes: [] });

  try {
    const quotes = await getQuotes(symbols);
    return NextResponse.json(
      { quotes },
      { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45" } },
    );
  } catch (e) {
    const status = e instanceof MarketDataError ? e.status : 502;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Market data unavailable" }, { status });
  }
}
