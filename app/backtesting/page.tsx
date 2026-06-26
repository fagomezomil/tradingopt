"use client";

import { useState } from "react";
import { BacktestEquity } from "@/components/charts/BacktestEquity";
import { Button, Card, Input, Label, Select } from "@/components/ui/primitives";

interface Metrics {
  totalReturn: number;
  cagr: number;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  finalEquity: number;
  initialEquity: number;
}

interface BacktestResponse {
  ticker: string;
  strategy: string;
  metrics: Metrics;
  equityCurve: number[];
  tradesCount: number;
}

export default function BacktestingPage() {
  const [ticker, setTicker] = useState("AAPL");
  const [strategy, setStrategy] = useState<"sma_cross" | "rsi_threshold">("sma_cross");
  const [fast, setFast] = useState(20);
  const [slow, setSlow] = useState(50);
  const [period, setPeriod] = useState(14);
  const [oversold, setOversold] = useState(30);
  const [overbought, setOverbought] = useState(70);
  const [range, setRange] = useState("1y");
  const [initialEquity, setInitialEquity] = useState(10000);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const params =
        strategy === "sma_cross"
          ? { fast, slow }
          : { period, oversold, overbought };
      const res = await fetch("/api/backtest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          strategy,
          params,
          initialEquity,
          range,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `${res.status}`);
      }
      const json = (await res.json()) as BacktestResponse;
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Backtesting</h1>
        <p className="text-sm text-foreground/60">
          Prueba estrategias sobre histórico (vía Yahoo Finance). Solo LONG.
        </p>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div>
            <Label>Ticker</Label>
            <Input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
          </div>
          <div>
            <Label>Estrategia</Label>
            <Select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as "sma_cross" | "rsi_threshold")}
            >
              <option value="sma_cross">Cruce SMA</option>
              <option value="rsi_threshold">RSI umbral</option>
            </Select>
          </div>
          <div>
            <Label>Range</Label>
            <Select value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="3mo">3 meses</option>
              <option value="6mo">6 meses</option>
              <option value="1y">1 año</option>
              <option value="2y">2 años</option>
              <option value="5y">5 años</option>
            </Select>
          </div>
          <div>
            <Label>Capital inicial</Label>
            <Input
              type="number"
              value={initialEquity}
              onChange={(e) => setInitialEquity(Number(e.target.value))}
            />
          </div>

          {strategy === "sma_cross" ? (
            <>
              <div>
                <Label>SMA rápida</Label>
                <Input
                  type="number"
                  value={fast}
                  onChange={(e) => setFast(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>SMA lenta</Label>
                <Input
                  type="number"
                  value={slow}
                  onChange={(e) => setSlow(Number(e.target.value))}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label>RSI período</Label>
                <Input
                  type="number"
                  value={period}
                  onChange={(e) => setPeriod(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Oversold</Label>
                <Input
                  type="number"
                  value={oversold}
                  onChange={(e) => setOversold(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Overbought</Label>
                <Input
                  type="number"
                  value={overbought}
                  onChange={(e) => setOverbought(Number(e.target.value))}
                />
              </div>
            </>
          )}
        </div>
        <div className="mt-4">
          <Button onClick={run} disabled={running}>
            {running ? "Ejecutando…" : "Ejecutar backtest"}
          </Button>
          {error && <span className="ml-3 text-sm text-red-600">Error: {error}</span>}
        </div>
      </Card>

      {result && (
        <>
          <Card>
            <div className="text-sm text-foreground/60 mb-2">Curva de equity</div>
            <BacktestEquity equity={result.equityCurve} />
          </Card>
          <Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Metric label="Retorno total" value={`${(result.metrics.totalReturn * 100).toFixed(2)}%`} />
              <Metric label="CAGR" value={`${(result.metrics.cagr * 100).toFixed(2)}%`} />
              <Metric label="Sharpe" value={result.metrics.sharpe.toFixed(2)} />
              <Metric label="Max DD" value={`${(result.metrics.maxDrawdown * 100).toFixed(2)}%`} />
              <Metric label="Win rate" value={`${(result.metrics.winRate * 100).toFixed(1)}%`} />
              <Metric label="Trades" value={String(result.metrics.totalTrades)} />
              <Metric label="Equity final" value={`$${result.metrics.finalEquity.toFixed(2)}`} />
              <Metric label="Inicial" value={`$${result.metrics.initialEquity.toFixed(2)}`} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-foreground/60">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}