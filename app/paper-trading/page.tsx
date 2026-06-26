"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, Input, Label, Select } from "@/components/ui/primitives";
import { formatUSD, formatPct } from "@/lib/utils";

interface Posicion {
  id: string;
  ticker: string;
  cantidad: number;
  precioEntrada: number;
  lastPrice: number;
  marketValue: number;
  unrealized: number;
}

interface Summary {
  portfolio: { id: string; nombre: string; cash: number };
  posiciones: Posicion[];
  totalEquity: number;
  totalMarketValue: number;
  totalUnrealized: number;
}

export default function PaperTradingPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [ticker, setTicker] = useState("AAPL");
  const [lado, setLado] = useState<"BUY" | "SELL">("BUY");
  const [tipo, setTipo] = useState<"MARKET" | "LIMIT">("MARKET");
  const [cantidad, setCantidad] = useState(10);
  const [precio, setPrecio] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderOk, setOrderOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/paper/summary");
      if (!res.ok) throw new Error(`${res.status}`);
      const json = (await res.json()) as Summary;
      setSummary(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const submit = async () => {
    setSubmitting(true);
    setOrderError(null);
    setOrderOk(null);
    try {
      const body: Record<string, unknown> = { ticker, lado, tipo, cantidad };
      if (tipo === "LIMIT" && precio !== "") body.precio = precio;
      const res = await fetch("/api/paper/orden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `${res.status}`);
      }
      const result = await res.json();
      setOrderOk(
        `Orden ${result.orden.estado} para ${result.orden.ticker} @ ${result.orden.precioEjecucion ?? "—"}`
      );
      load();
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paper Trading</h1>
        <p className="text-sm text-foreground/60">
          Capital virtual. Las órdenes no se ejecutan en el mercado real.
        </p>
      </div>

      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-xs text-foreground/60">Cash</div>
          <div className="text-2xl font-semibold">
            {formatUSD(summary?.portfolio.cash ?? null)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-foreground/60">Valor de mercado</div>
          <div className="text-2xl font-semibold">
            {formatUSD(summary?.totalMarketValue ?? null)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-foreground/60">Equity total</div>
          <div className="text-2xl font-semibold">
            {formatUSD(summary?.totalEquity ?? null)}
          </div>
          {summary && (
            <div className="text-xs mt-1">
              No realizado:{" "}
              <span
                className={
                  summary.totalUnrealized >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {formatUSD(summary.totalUnrealized)} ({formatPct(summary.totalUnrealized / (summary.totalEquity - summary.totalUnrealized || 1))})
              </span>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          <div>
            <Label>Ticker</Label>
            <Input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
          </div>
          <div>
            <Label>Lado</Label>
            <Select value={lado} onChange={(e) => setLado(e.target.value as "BUY" | "SELL")}>
              <option value="BUY">Compra</option>
              <option value="SELL">Venta</option>
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as "MARKET" | "LIMIT")}>
              <option value="MARKET">Market</option>
              <option value="LIMIT">Limit</option>
            </Select>
          </div>
          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Precio (LIMIT)</Label>
            <Input
              type="number"
              value={precio}
              onChange={(e) => setPrecio(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={tipo === "MARKET"}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Enviando…" : "Enviar orden paper"}
          </Button>
          {orderError && <span className="ml-3 text-sm text-red-600">{orderError}</span>}
          {orderOk && <span className="ml-3 text-sm text-green-600">{orderOk}</span>}
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold mb-2">Posiciones</div>
        {!summary || summary.posiciones.length === 0 ? (
          <p className="text-sm text-foreground/50">Sin posiciones abiertas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-foreground/60">
                <tr>
                  <th className="text-left py-2">Ticker</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">Entrada</th>
                  <th className="text-right">Precio actual</th>
                  <th className="text-right">Valor mercado</th>
                  <th className="text-right">No realizado</th>
                </tr>
              </thead>
              <tbody>
                {summary.posiciones.map((p) => (
                  <tr key={p.id} className="border-t border-foreground/5">
                    <td className="py-2 font-medium">{p.ticker}</td>
                    <td className="text-right">{p.cantidad}</td>
                    <td className="text-right">{formatUSD(p.precioEntrada)}</td>
                    <td className="text-right">{formatUSD(p.lastPrice)}</td>
                    <td className="text-right">{formatUSD(p.marketValue)}</td>
                    <td
                      className={`text-right ${
                        p.unrealized >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatUSD(p.unrealized)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}