"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";

interface Props {
  equity: number[];
  startTime?: number;
}

export function BacktestEquity({ equity, startTime = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { color: "transparent" }, textColor: "#888" },
      grid: {
        vertLines: { color: "rgba(0,0,0,0.05)" },
        horzLines: { color: "rgba(0,0,0,0.05)" },
      },
      width: containerRef.current.clientWidth,
      height: 300,
    });
    chartRef.current = chart;
    const series = chart.addSeries(AreaSeries, {
      lineColor: "#2563eb",
      topColor: "rgba(37,99,235,0.4)",
      bottomColor: "rgba(37,99,235,0.02)",
      lineWidth: 2,
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
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || equity.length === 0) return;
    const step = startTime || Math.floor(Date.now() / 1000);
    const data = equity.map((v, i) => ({ time: (step + i * 86400) as never, value: v }));
    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [equity, startTime]);

  return <div ref={containerRef} className="w-full" />;
}