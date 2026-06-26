"use client";

import { useEffect, useState } from "react";
import { LiveChart } from "@/components/charts/LiveChart";
import { Button, Card, Input, Label } from "@/components/ui/primitives";
import { QUICK_PICKS } from "@/lib/market-data/symbols";
import { cn } from "@/lib/utils";

interface TickerData {
  latest_price?: string | number | null;
  name?: string;
  bullish_case?: string | null;
  bearish_case?: string | null;
  previous_close?: number;
  change?: number;
  change_pct?: number;
  day_high?: number;
  day_low?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  currency?: string;
  nota?: string;
}

interface ApiResponse {
  ticker: string;
  esIndice?: boolean;
  fuente?: "helium" | "yahoo";
  data: TickerData;
  error?: string;
}

export default function DashboardPage() {
  const [ticker, setTicker] = useState("AAPL");
  const [active, setActive] = useState("AAPL");
  const [data, setData] = useState<TickerData | null>(null);
  const [meta, setMeta] = useState<{ esIndice: boolean; fuente: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mercado/${encodeURIComponent(t)}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const json = (await res.json()) as ApiResponse;
      setData(json.data);
      setMeta({
        esIndice: json.esIndice ?? false,
        fuente: json.fuente ?? "helium",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(active);
    const id = setInterval(() => load(active), 60_000);
    return () => clearInterval(id);
  }, [active]);

  const price =
    data?.latest_price != null
      ? typeof data.latest_price === "string"
        ? parseFloat(data.latest_price)
        : data.latest_price
      : null;

  const buscar = (valor: string) => {
    const limpio = valor.trim().toUpperCase();
    if (!limpio) return;
    setTicker(limpio);
    setActive(limpio);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-foreground/60">
          Datos live vía helium-mcp (stocks/ETFs). Gráfico histórico vía Yahoo Finance (stocks,
          ETFs e índices con prefijo ^).
        </p>
      </div>

      <Card>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            buscar(ticker);
          }}
        >
          <div className="flex-1 min-w-[180px]">
            <Label htmlFor="ticker">Ticker</Label>
            <Input
              id="ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="AAPL, MSFT, SPX, ^GSPC…"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <Button type="submit" disabled={loading || !ticker.trim()}>
            {loading ? "Cargando…" : "Ver"}
          </Button>
          {price != null && (
            <div className="ml-4">
              <div className="text-xs text-foreground/60">{data?.name ?? active}</div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-semibold">
                  {price.toLocaleString("en-US", {
                    style: "currency",
                    currency: data?.currency ?? "USD",
                  })}
                </div>
                {data?.change != null && data?.change_pct != null && (
                  <div
                    className={cn(
                      "text-sm font-medium",
                      data.change >= 0 ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {data.change >= 0 ? "+" : ""}
                    {data.change.toFixed(2)} ({(data.change_pct * 100).toFixed(2)}%)
                  </div>
                )}
              </div>
              {data?.day_high != null && data?.day_low != null && (
                <div className="text-xs text-foreground/50 mt-0.5">
                  Día: {data.day_low.toFixed(2)} – {data.day_high.toFixed(2)} · Cierre prev:{" "}
                  {data.previous_close?.toFixed(2) ?? "—"}
                </div>
              )}
            </div>
          )}
          {error && <div className="text-sm text-red-600">Error: {error}</div>}
        </form>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {QUICK_PICKS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => buscar(p.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs border transition",
                active === p.value
                  ? "bg-foreground text-background border-foreground"
                  : "border-foreground/15 text-foreground/70 hover:bg-foreground/5"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      {meta?.esIndice && (
        <Card className="border-amber-400/40 bg-amber-50/40">
          <p className="text-xs text-amber-900">
            <strong>{active}</strong> es un índice bursátil. Precio live vía Yahoo Finance. Sin
            casos bullish/bearish de IA (helium-mcp no los soporta).
          </p>
        </Card>
      )}

      <Card>
        <div className="text-sm text-foreground/60 mb-2">Gráfico {active}</div>
        <LiveChart ticker={active} range="1y" interval="1d" />
      </Card>

      {data && (data.bullish_case || data.bearish_case) && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
              Caso Bullish
            </div>
            <p className="text-sm leading-relaxed">{data.bullish_case}</p>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wide text-foreground/60 mb-2">
              Caso Bearish
            </div>
            <p className="text-sm leading-relaxed">{data.bearish_case}</p>
          </Card>
        </div>
      )}
    </div>
  );
}