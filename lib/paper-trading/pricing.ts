import { getTicker } from "../mcp/helium-client";

export async function getLatestPrice(ticker: string): Promise<number> {
  const t = (await getTicker(ticker)) as { latest_price?: string | number };
  if (!t?.latest_price) {
    throw new Error(`No se pudo obtener precio para ${ticker}`);
  }
  return typeof t.latest_price === "string"
    ? parseFloat(t.latest_price)
    : t.latest_price;
}