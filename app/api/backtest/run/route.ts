import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runBacktest, type StrategyName } from "@/lib/backtesting/engine";
import { prisma } from "@/lib/db/client";

const Body = z.object({
  ticker: z.string().min(1).max(20),
  strategy: z.enum(["sma_cross", "rsi_threshold"]),
  params: z
    .object({
      fast: z.number().int().min(2).max(200).optional(),
      slow: z.number().int().min(5).max(400).optional(),
      period: z.number().int().min(2).max(100).optional(),
      oversold: z.number().min(0).max(50).optional(),
      overbought: z.number().min(50).max(100).optional(),
    })
    .default({}),
  initialEquity: z.number().positive().default(10000),
  range: z.string().default("1y"),
  interval: z.enum(["1d", "1wk", "1mo"]).default("1d"),
  persist: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;
  try {
    const result = await runBacktest(
      b.ticker.toUpperCase(),
      b.strategy as StrategyName,
      b.params,
      b.initialEquity,
      b.range,
      b.interval
    );
    const minimal = {
      ticker: result.ticker,
      strategy: result.strategy,
      params: result.params,
      metrics: result.metrics,
      equityCurve: result.equityCurve,
      tradesCount: result.trades.length,
      tradesSample: result.trades.slice(0, 20),
      candles: result.candles,
    };
    if (b.persist) {
      await prisma.backtest.create({
        data: {
          ticker: result.ticker,
          estrategia: result.strategy,
          paramsJson: JSON.stringify(result.params),
          equityCurveJson: JSON.stringify(result.equityCurve),
          metricsJson: JSON.stringify(result.metrics),
        },
      });
    }
    return NextResponse.json(minimal);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}