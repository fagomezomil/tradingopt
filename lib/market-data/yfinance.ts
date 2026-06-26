import type { Candle } from "../indicators";

// Yahoo Finance chart API (público, sin auth). Se usa solo server-side.
// Documentación no oficial: v8.chart.finance.yahoo.com/v/chart

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