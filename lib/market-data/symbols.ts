// Mapeo de tickers comunes a sus símbolos Yahoo Finance.
// helium-mcp no soporta índices bursátiles (SPX, NDX, etc.) — Yahoo sí con prefijo ^.
const YAHOO_ALIAS: Record<string, string> = {
  SPX: "^GSPC",
  "S&P500": "^GSPC",
  "S&P 500": "^GSPC",
  GSPC: "^GSPC",
  NDX: "^NDX",
  NASDAQ: "^IXIC",
  IXIC: "^IXIC",
  DJI: "^DJI",
  DJX: "^DJI",
  "DOW": "^DJI",
  RUT: "^RUT",
  VIX: "^VIX",
  FTSE: "^FTSE",
  DAX: "^GDAXI",
  NIKKEI: "^N225",
  HANGSENG: "^HSI",
};

export function toYahooSymbol(ticker: string): string {
  const upper = ticker.toUpperCase().trim();
  if (upper.startsWith("^")) return upper;
  return YAHOO_ALIAS[upper] ?? upper;
}

export function isIndex(ticker: string): boolean {
  const upper = ticker.toUpperCase().trim();
  return upper.startsWith("^") || upper in YAHOO_ALIAS;
}

// Tickers válidos para helium-mcp (stocks/ETFs). Para índices, helium devuelve null.
export function heliumSupports(ticker: string): boolean {
  return !isIndex(ticker);
}

export const QUICK_PICKS = [
  { label: "AAPL", value: "AAPL" },
  { label: "MSFT", value: "MSFT" },
  { label: "TSLA", value: "TSLA" },
  { label: "NVDA", value: "NVDA" },
  { label: "S&P 500", value: "SPX" },
  { label: "NASDAQ", value: "NASDAQ" },
  { label: "Dow Jones", value: "DJI" },
  { label: "VIX", value: "VIX" },
  { label: "BTC-USD", value: "BTC-USD" },
  { label: "ETH-USD", value: "ETH-USD" },
];