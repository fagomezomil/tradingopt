"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui/primitives";

interface Estrategia {
  id?: string;
  ticker: string;
  tesis: string;
  indicadores_clave?: string[];
  indicadores?: string;
  entrada: number | null;
  stop: number | null;
  objetivo: number | null;
  riesgo: string;
  horizonte: string;
  createdAt?: string;
}

export default function EstrategiasPage() {
  const [ticker, setTicker] = useState("AAPL");
  const [generando, setGenerando] = useState(false);
  const [estrategia, setEstrategia] = useState<Estrategia | null>(null);
  const [historicas, setHistoricas] = useState<Estrategia[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadHistoricas = async () => {
    const res = await fetch("/api/agente/estrategia");
    if (res.ok) {
      const json = await res.json();
      setHistoricas(json.estrategias as Estrategia[]);
    }
  };

  useEffect(() => {
    loadHistoricas();
  }, []);

  const generar = async () => {
    setGenerando(true);
    setError(null);
    setEstrategia(null);
    try {
      const res = await fetch("/api/agente/estrategia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, persist: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `${res.status}`);
      }
      const json = await res.json();
      setEstrategia(json.estrategia as Estrategia);
      loadHistoricas();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estrategias del Agente</h1>
        <p className="text-sm text-foreground/60">
          El agente llama a helium-mcp (get_ticker, search_balanced_news,
          get_top_trading_strategies) y produce una estrategia estructurada.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="t">Ticker</Label>
            <Input
              id="t"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
            />
          </div>
          <Button onClick={generar} disabled={generando || !ticker}>
            {generando ? "Generando…" : "Generar estrategia"}
          </Button>
          {error && <div className="text-sm text-red-600">Error: {error}</div>}
        </div>
        <p className="mt-3 text-xs text-foreground/60">
          Requiere ANTHROPIC_API_KEY configurada en .env.local.
        </p>
      </Card>

      {estrategia && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold">{estrategia.ticker}</h2>
            {estrategia.horizonte && (
              <span className="text-xs text-foreground/60">Horizonte: {estrategia.horizonte}</span>
            )}
          </div>
          <p className="text-sm mb-3">{estrategia.tesis}</p>
          {estrategia.indicadores_clave && (
            <ul className="text-sm list-disc pl-5 mb-3 text-foreground/80">
              {estrategia.indicadores_clave.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-foreground/60">Entrada</div>
              <div>{estrategia.entrada ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-foreground/60">Stop</div>
              <div>{estrategia.stop ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-foreground/60">Objetivo</div>
              <div>{estrategia.objetivo ?? "—"}</div>
            </div>
          </div>
          <div className="mt-3 text-sm">
            <span className="text-xs text-foreground/60">Riesgo: </span>
            {estrategia.riesgo}
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-semibold mb-2 text-foreground/60">Histórico</h2>
        {historicas.length === 0 ? (
          <p className="text-sm text-foreground/50">Sin estrategias guardadas todavía.</p>
        ) : (
          <div className="space-y-2">
            {historicas.map((e) => (
              <Card key={e.id}>
                <div className="flex justify-between text-sm">
                  <div className="font-medium">{e.ticker}</div>
                  <div className="text-foreground/50 text-xs">
                    {e.createdAt ? new Date(e.createdAt).toLocaleString() : ""}
                  </div>
                </div>
                <p className="text-sm mt-1">{e.tesis}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}