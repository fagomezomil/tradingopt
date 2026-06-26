import { NextRequest, NextResponse } from "next/server";
import { fetchHistoricalCandles } from "@/lib/market-data/yfinance";
import { toYahooSymbol } from "@/lib/market-data/symbols";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const range = req.nextUrl.searchParams.get("range") || "1y";
  const interval = req.nextUrl.searchParams.get("interval") || "1d";
  try {
    const yahooSymbol = toYahooSymbol(ticker);
    const candles = await fetchHistoricalCandles(yahooSymbol, range, interval);
    return NextResponse.json({ ticker: ticker.toUpperCase(), yahooSymbol, candles });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}