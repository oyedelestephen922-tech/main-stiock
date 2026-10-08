import { NextResponse, type NextRequest } from "next/server";
import { getAsset } from "@/lib/assets";
import { RANGES, type Range } from "@/services/market/types";
import { getHistory, MarketDataError } from "@/server/alpaca";

const CDN_SECONDS: Record<Range, number> = { "1D": 60, "1W": 300, "1M": 900, "3M": 3600, "1Y": 3600, "5Y": 3600, ALL: 3600 };

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "").toUpperCase();
  const range = req.nextUrl.searchParams.get("range") as Range;
  if (!getAsset(symbol)) return NextResponse.json({ error: "Unknown symbol" }, { status: 400 });
  if (!RANGES.includes(range)) return NextResponse.json({ error: "Unknown range" }, { status: 400 });

  try {
    const points = await getHistory(symbol, range);
    const s = CDN_SECONDS[range];
    return NextResponse.json(
      { points },
      { headers: { "Cache-Control": `public, s-maxage=${s}, stale-while-revalidate=${s * 3}` } },
    );
  } catch (e) {
    const status = e instanceof MarketDataError ? e.status : 502;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Market data unavailable" }, { status });
  }
}
