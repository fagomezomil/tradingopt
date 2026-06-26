import type { Candle } from "../indicators";

// Yahoo Finance chart API (público, sin auth). Se usa solo server-side.
// Documentación no oficial: v8.chart.finance.yahoo.com/v/chart

export interface YahooQuote {
  ticker: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketTime: number;
  currency: string;
}

const priceCache = new Map<string, { ts: number; data: YahooQuote }>();
const PRICE_TTL_MS = 15_000;

export async function fetchHistoricalCandles(
  ticker: string,
  range = "1y",
  interval = "1d"
): Promise<Candle[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?range=${range}&interval=${interval}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 analisismercado/0.1",
    },
  });
  if (!res.ok) {
    throw new Error(`Yahoo Finance ${res.status}: ${await res.text()}`);
  }
  const body = await res.json();
  const result = body?.chart?.result?.[0];
  if (!result) throw new Error("Respuesta Yahoo sin datos");
  const timestamps: number[] = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0] ?? {};
  const opens: (number | null)[] = quote.open ?? [];
  const highs: (number | null)[] = quote.high ?? [];
  const lows: (number | null)[] = quote.low ?? [];
  const closes: (number | null)[] = quote.close ?? [];
  const volumes: (number | null)[] = quote.volume ?? [];
  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] == null) continue;
    candles.push({
      time: timestamps[i],
      open: opens[i] ?? closes[i]!,
      high: highs[i] ?? closes[i]!,
      low: lows[i] ?? closes[i]!,
      close: closes[i]!,
      volume: volumes[i] ?? 0,
    });
  }
  return candles;
}

export async function getLatestPriceYahoo(ticker: string): Promise<YahooQuote> {
  const cached = priceCache.get(ticker);
  if (cached && Date.now() - cached.ts < PRICE_TTL_MS) return cached.data;
  // range=1d + interval=1m devuelve la última vela y el meta con regularMarketPrice.
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?range=1d&interval=1m`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 analisismercado/0.1",
    },
  });
  if (!res.ok) {
    throw new Error(`Yahoo Finance ${res.status}`);
  }
  const body = await res.json();
  const meta = body?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error("Yahoo no devolvió meta para " + ticker);
  const price = meta.regularMarketPrice as number;
  const previousClose = (meta.chartPreviousClose ?? meta.previousClose ?? price) as number;
  const change = price - previousClose;
  const changePct = previousClose !== 0 ? change / previousClose : 0;
  const quote: YahooQuote = {
    ticker: meta.symbol ?? ticker,
    name: meta.longName ?? meta.shortName ?? ticker,
    price,
    previousClose,
    change,
    changePct,
    dayHigh: meta.regularMarketDayHigh ?? price,
    dayLow: meta.regularMarketDayLow ?? price,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? price,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? price,
    marketTime: meta.regularMarketTime ?? Math.floor(Date.now() / 1000),
    currency: meta.currency ?? "USD",
  };
  priceCache.set(ticker, { ts: Date.now(), data: quote });
  return quote;
}