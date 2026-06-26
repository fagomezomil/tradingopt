import { NextResponse } from "next/server";
import { getPortfolioSummary } from "@/lib/paper-trading/book";

export async function GET() {
  const summary = await getPortfolioSummary();
  if (!summary) return NextResponse.json({ error: "No hay portfolio" }, { status: 404 });
  return NextResponse.json(summary);
}