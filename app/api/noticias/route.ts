import { NextRequest, NextResponse } from "next/server";
import { searchBalancedNews } from "@/lib/mcp/helium-client";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "parámetro 'q' requerido" }, { status: 400 });
  try {
    const data = await searchBalancedNews(q);
    return NextResponse.json({ query: q, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}