import type { Candle, Signal } from "../indicators";
import { smaCrossSignal, rsiThresholdSignal } from "../indicators";
import { fetchHistoricalCandles } from "../market-data/yfinance";
import { computeMetrics, type BacktestMetrics } from "./metrics";

export interface BacktestTrade {
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  side: "LONG";
  pnl: number;
  pnlPct: number;
}

export interface BacktestResult {
  ticker: string;
  strategy: string;
  params: Record<string, unknown>;
  candles: Candle[];
  equityCurve: number[];
  trades: BacktestTrade[];
  metrics: BacktestMetrics;
}

export type StrategyName = "sma_cross" | "rsi_threshold";

export interface BacktestParams {
  fast?: number;
  slow?: number;
  period?: number;
  oversold?: number;
  overbought?: number;
}

function getSignals(strategy: StrategyName, closes: number[], params: BacktestParams): Signal[] {
  if (strategy === "sma_cross") {
    return smaCrossSignal(closes, params.fast ?? 20, params.slow ?? 50);
  }
  if (strategy === "rsi_threshold") {
    return rsiThresholdSignal(
      closes,
      params.period ?? 14,
      params.oversold ?? 30,
      params.overbought ?? 70
    );
  }
  throw new Error(`Estrategia desconocida: ${strategy}`);
}

export async function runBacktest(
  ticker: string,
  strategy: StrategyName,
  params: BacktestParams = {},
  initialEquity = 10000,
  range = "1y",
  interval = "1d"
): Promise<BacktestResult> {
  const candles = await fetchHistoricalCandles(ticker, range, interval);
  if (candles.length < 30) {
    throw new Error(`Insuficientes velas para ${ticker} (${candles.length})`);
  }
  const closes = candles.map((c) => c.close);
  const signals = getSignals(strategy, closes, params);

  let position: { entryPrice: number; entryTime: number } | null = null;
  let cash = initialEquity;
  let units = 0;
  const trades: BacktestTrade[] = [];
  const equityCurve: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const sig = signals[i];
    const price = candle.close;

    if (sig === "BUY" && !position) {
      units = Math.floor(cash / price);
      if (units > 0) {
        position = { entryPrice: price, entryTime: candle.time };
        cash -= units * price;
      }
    } else if (sig === "SELL" && position) {
      const proceeds = units * price;
      const cost = units * position.entryPrice;
      const pnl = proceeds - cost;
      trades.push({
        entryTime: position.entryTime,
        entryPrice: position.entryPrice,
        exitTime: candle.time,
        exitPrice: price,
        side: "LONG",
        pnl,
        pnlPct: cost > 0 ? pnl / cost : 0,
      });
      cash += proceeds;
      units = 0;
      position = null;
    }

    const equity = cash + units * price;
    equityCurve.push(equity);
  }

  // Cierra posición abierta al final
  if (position && units > 0) {
    const last = candles[candles.length - 1];
    const proceeds = units * last.close;
    const cost = units * position.entryPrice;
    const pnl = proceeds - cost;
    trades.push({
      entryTime: position.entryTime,
      entryPrice: position.entryPrice,
      exitTime: last.time,
      exitPrice: last.close,
      side: "LONG",
      pnl,
      pnlPct: cost > 0 ? pnl / cost : 0,
    });
    cash += proceeds;
    units = 0;
    equityCurve[equityCurve.length - 1] = cash;
  }

  const metrics = computeMetrics(
    equityCurve,
    trades.map((t) => ({ pnl: t.pnl })),
    initialEquity
  );

  return {
    ticker,
    strategy,
    params: params as Record<string, unknown>,
    candles,
    equityCurve,
    trades,
    metrics,
  };
}