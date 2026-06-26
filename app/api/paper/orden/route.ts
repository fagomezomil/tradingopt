import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { placeOrder } from "@/lib/paper-trading/book";

const Body = z.object({
  ticker: z.string().min(1).max(20),
  lado: z.enum(["BUY", "SELL"]),
  tipo: z.enum(["MARKET", "LIMIT"]),
  cantidad: z.number().positive(),
  precio: z.number().positive().optional(),
  portfolioId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.tipo === "LIMIT" && parsed.data.precio == null) {
    return NextResponse.json({ error: "precio requerido para LIMIT" }, { status: 400 });
  }
  try {
    const result = await placeOrder(parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}