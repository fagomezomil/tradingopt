import { SMA, EMA, RSI, MACD, BollingerBands } from "technicalindicators";

export interface Candle {
  time: number; // epoch seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function sma(values: number[], period: number): (number | null)[] {
  const out = new Array(values.length).fill(null);
  const result = SMA.calculate({ period, values });
  for (let i = 0; i < result.length; i++) {
    out[i + period - 1] = result[i];
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out = new Array(values.length).fill(null);
  const result = EMA.calculate({ period, values });
  for (let i = 0; i < result.length; i++) {
    out[i + period - 1] = result[i];
  }
  return out;
}

export function rsi(values: number[], period = 14): (number | null)[] {
  const out = new Array(values.length).fill(null);
  const result = RSI.calculate({ period, values });
  for (let i = 0; i < result.length; i++) {
    out[i + period] = result[i];
  }
  return out;
}

export interface MacdPoint {
  MACD?: number;
  signal?: number;
  histogram?: number;
}

export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): (MacdPoint | null)[] {
  const out: (MacdPoint | null)[] = new Array(values.length).fill(null);
  const result = MACD.calculate({
    fastPeriod: fast,
    slowPeriod: slow,
    signalPeriod,
    values,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  for (let i = 0; i < result.length; i++) {
    out[i + slow - 1] = result[i];
  }
  return out;
}

export interface BollingerPoint {
  upper?: number;
  middle?: number;
  lower?: number;
}

export function bollinger(
  values: number[],
  period = 20,
  stdDev = 2
): (BollingerPoint | null)[] {
  const out: (BollingerPoint | null)[] = new Array(values.length).fill(null);
  const result = BollingerBands.calculate({ period, stdDev, values });
  for (let i = 0; i < result.length; i++) {
    out[i + period - 1] = result[i];
  }
  return out;
}

export type Signal = "BUY" | "SELL" | "HOLD";

export function smaCrossSignal(
  closes: number[],
  fast = 20,
  slow = 50
): Signal[] {
  const fastArr = sma(closes, fast);
  const slowArr = sma(closes, slow);
  const out: Signal[] = new Array(closes.length).fill("HOLD");
  for (let i = 1; i < closes.length; i++) {
    const f0 = fastArr[i - 1],
      f1 = fastArr[i],
      s0 = slowArr[i - 1],
      s1 = slowArr[i];
    if (f0 === null || f1 === null || s0 === null || s1 === null) continue;
    if (f0 <= s0 && f1 > s1) out[i] = "BUY";
    else if (f0 >= s0 && f1 < s1) out[i] = "SELL";
  }
  return out;
}

export function rsiThresholdSignal(
  closes: number[],
  period = 14,
  oversold = 30,
  overbought = 70
): Signal[] {
  const r = rsi(closes, period);
  const out: Signal[] = new Array(closes.length).fill("HOLD");
  for (let i = 1; i < closes.length; i++) {
    const r0 = r[i - 1],
      r1 = r[i];
    if (r0 === null || r1 === null) continue;
    if (r0 <= oversold && r1 > oversold) out[i] = "BUY";
    else if (r0 >= overbought && r1 < overbought) out[i] = "SELL";
  }
  return out;
}