"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Props {
  ticker: string;
  range?: string;
  interval?: string;
}

export function LiveChart({ ticker, range = "1y", interval = "1d" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#888",
      },
      grid: {
        vertLines: { color: "rgba(0,0,0,0.05)" },
        horzLines: { color: "rgba(0,0,0,0.05)" },
      },
      timeScale: { timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: "rgba(0,0,0,0.1)" },
      width: containerRef.current.clientWidth,
      height: 400,
    });
    chartRef.current = chart;
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderVisible: false,
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
    });
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!seriesRef.current) return;
      // Limpia la serie mientras carga para que no queden velas del ticker anterior.
      seriesRef.current.setData([]);
      try {
        const res = await fetch(
          `/api/mercado/${encodeURIComponent(ticker)}/candles?range=${range}&interval=${interval}`
        );
        if (!res.ok) return;
        const json = (await res.json()) as { candles: Candle[]; error?: string };
        if (cancelled || !seriesRef.current) return;
        if (json.error || !json.candles || json.candles.length === 0) return;
        const data = json.candles.map((c) => ({
          time: c.time as never,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));
        seriesRef.current.setData(data);
        chartRef.current?.timeScale().fitContent();
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticker, range, interval]);

  return <div ref={containerRef} className="w-full" />;
}