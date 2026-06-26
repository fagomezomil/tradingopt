import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generarEstrategia } from "@/lib/agent/runner";
import { prisma } from "@/lib/db/client";

const Body = z.object({
  ticker: z.string().min(1).max(20),
  persist: z.boolean().default(true),
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
  const { ticker, persist } = parsed.data;
  try {
    const estrategia = await generarEstrategia(ticker.toUpperCase());
    if (persist) {
      await prisma.estrategia.create({
        data: {
          ticker: estrategia.ticker,
          tesis: estrategia.tesis,
          indicadores: JSON.stringify(estrategia.indicadores_clave),
          entrada: estrategia.entrada,
          stop: estrategia.stop,
          objetivo: estrategia.objetivo,
          riesgo: estrategia.riesgo,
          horizonte: estrategia.horizonte,
          rawJson: JSON.stringify(estrategia),
        },
      });
    }
    return NextResponse.json({ estrategia });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const estrategias = await prisma.estrategia.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ estrategias });
}