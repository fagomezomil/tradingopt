import { NextRequest, NextResponse } from "next/server";
import { getTicker } from "@/lib/mcp/helium-client";
import { heliumSupports, toYahooSymbol } from "@/lib/market-data/symbols";
import { getLatestPriceYahoo } from "@/lib/market-data/yfinance";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  if (!ticker) return NextResponse.json({ error: "ticker requerido" }, { status: 400 });
  const upper = ticker.toUpperCase();

  if (heliumSupports(upper)) {
    // Stocks/ETFs/crypto listados: helium da precio live + casos bull/bear IA.
    try {
      const data = await getTicker(upper);
      return NextResponse.json({
        ticker: upper,
        esIndice: false,
        fuente: "helium",
        data,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  // Índices: helium no los soporta. Yahoo da precio live + meta con cambio del día.
  try {
    const yahooSymbol = toYahooSymbol(upper);
    const q = await getLatestPriceYahoo(yahooSymbol);
    return NextResponse.json({
      ticker: upper,
      esIndice: true,
      fuente: "yahoo",
      yahooSymbol,
      data: {
        ticker: upper,
        name: q.name,
        latest_price: q.price,
        previous_close: q.previousClose,
        change: q.change,
        change_pct: q.changePct,
        day_high: q.dayHigh,
        day_low: q.dayLow,
        fifty_two_week_high: q.fiftyTwoWeekHigh,
        fifty_two_week_low: q.fiftyTwoWeekLow,
        market_time: q.marketTime,
        currency: q.currency,
        bullish_case: null,
        bearish_case: null,
        nota:
          "Índice bursátil: precio live vía Yahoo Finance. Sin casos bullish/bearish de IA (helium no los soporta).",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}