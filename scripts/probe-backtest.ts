import { runBacktest } from "../lib/backtesting/engine";

async function main() {
  console.log("Backtest SMA(20,50) sobre AAPL 1y...");
  const r = await runBacktest("AAPL", "sma_cross", { fast: 20, slow: 50 }, 10000);
  console.log("Trades:", r.trades.length);
  console.log("Métricas:", JSON.stringify(r.metrics, null, 2));
  console.log("Primeros 3 trades:", JSON.stringify(r.trades.slice(0, 3), null, 2));
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});