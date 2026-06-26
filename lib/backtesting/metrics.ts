export interface BacktestMetrics {
  totalReturn: number;
  cagr: number;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  finalEquity: number;
  initialEquity: number;
}

export function computeMetrics(
  equityCurve: number[],
  trades: { pnl: number }[],
  initialEquity: number,
  barsPerYear = 252
): BacktestMetrics {
  const finalEquity = equityCurve[equityCurve.length - 1] ?? initialEquity;
  const totalReturn = (finalEquity - initialEquity) / initialEquity;
  const years = equityCurve.length / barsPerYear;
  const cagr = years > 0 ? Math.pow(finalEquity / initialEquity, 1 / years) - 1 : 0;

  const dailyReturns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    if (equityCurve[i - 1] > 0) {
      dailyReturns.push((equityCurve[i] - equityCurve[i - 1]) / equityCurve[i - 1]);
    }
  }
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1);
  const variance =
    dailyReturns.reduce((a, b) => a + (b - mean) ** 2, 0) / (dailyReturns.length || 1);
  const std = Math.sqrt(variance);
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(barsPerYear) : 0;

  let peak = equityCurve[0] ?? initialEquity;
  let maxDD = 0;
  for (const eq of equityCurve) {
    if (eq > peak) peak = eq;
    const dd = (eq - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }

  const wins = trades.filter((t) => t.pnl > 0).length;
  const winRate = trades.length > 0 ? wins / trades.length : 0;

  return {
    totalReturn,
    cagr,
    sharpe,
    maxDrawdown: maxDD,
    winRate,
    totalTrades: trades.length,
    finalEquity,
    initialEquity,
  };
}