import { NextRequest, NextResponse } from "next/server";
import { getTicker } from "@/lib/mcp/helium-client";
import { heliumSupports, isIndex } from "@/lib/market-data/symbols";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  if (!ticker) return NextResponse.json({ error: "ticker requerido" }, { status: 400 });
  const upper = ticker.toUpperCase();
  const soportaHelium = heliumSupports(upper);
  if (!soportaHelium) {
    return NextResponse.json({
      ticker: upper,
      esIndice: true,
      heliumCompatible: false,
      data: {
        ticker: upper,
        name: upper,
        latest_price: null,
        bullish_case: null,
        bearish_case: null,
        nota:
          "Los índices bursátiles no están soportados por helium-mcp. El precio live no está disponible; el gráfico histórico se obtiene vía Yahoo Finance.",
      },
    });
  }
  try {
    const data = await getTicker(upper);
    return NextResponse.json({
      ticker: upper,
      esIndice: false,
      heliumCompatible: true,
      data,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}