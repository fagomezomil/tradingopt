import { prisma } from "../db/client";
import { getLatestPrice } from "./pricing";

export interface OrderRequest {
  ticker: string;
  lado: "BUY" | "SELL";
  tipo: "MARKET" | "LIMIT";
  cantidad: number;
  precio?: number; // solo para LIMIT
  portfolioId?: string;
}

async function getDefaultPortfolioId(): Promise<string> {
  const p = await prisma.portfolio.findFirst({ orderBy: { createdAt: "asc" } });
  if (!p) {
    const created = await prisma.portfolio.create({
      data: { nombre: "Paper Trading - Default", cash: 100000 },
    });
    return created.id;
  }
  return p.id;
}

export async function placeOrder(req: OrderRequest) {
  const portfolioId = req.portfolioId ?? (await getDefaultPortfolioId());
  const portfolio = await prisma.portfolio.findUniqueOrThrow({ where: { id: portfolioId } });

  let precioEjecucion: number | null = null;
  let estado: "FILLED" | "PENDING" = "PENDING";

  if (req.tipo === "MARKET") {
    precioEjecucion = await getLatestPrice(req.ticker);
    estado = "FILLED";
  } else if (req.tipo === "LIMIT" && req.precio != null) {
    const last = await getLatestPrice(req.ticker);
    if (req.lado === "BUY" && last <= req.precio) {
      precioEjecucion = req.precio;
      estado = "FILLED";
    } else if (req.lado === "SELL" && last >= req.precio) {
      precioEjecucion = req.precio;
      estado = "FILLED";
    }
  }

  const orden = await prisma.orden.create({
    data: {
      portfolioId,
      ticker: req.ticker,
      lado: req.lado,
      tipo: req.tipo,
      cantidad: req.cantidad,
      precio: req.precio ?? null,
      precioEjecucion,
      estado,
      ejecutadaAt: estado === "FILLED" ? new Date() : null,
    },
  });

  if (estado !== "FILLED" || precioEjecucion == null) {
    return { orden, posicion: null, portfolio };
  }

  const notional = precioEjecucion * req.cantidad;

  if (req.lado === "BUY") {
    if (notional > portfolio.cash) {
      throw new Error(`Cash insuficiente: necesitas $${notional}, tienes $${portfolio.cash}`);
    }
    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: { cash: { decrement: notional } },
    });
    const existente = await prisma.posicion.findUnique({
      where: { portfolioId_ticker: { portfolioId, ticker: req.ticker } },
    });
    let posicion;
    if (existente) {
      const nuevaCantidad = existente.cantidad + req.cantidad;
      const nuevoCosto = existente.cantidad * existente.precioEntrada + notional;
      const nuevoPrecio = nuevaCantidad > 0 ? nuevoCosto / nuevaCantidad : 0;
      posicion = await prisma.posicion.update({
        where: { id: existente.id },
        data: { cantidad: nuevaCantidad, precioEntrada: nuevoPrecio },
      });
    } else {
      posicion = await prisma.posicion.create({
        data: {
          portfolioId,
          ticker: req.ticker,
          cantidad: req.cantidad,
          precioEntrada: precioEjecucion,
        },
      });
    }
    return { orden, posicion, portfolio: await prisma.portfolio.findUniqueOrThrow({ where: { id: portfolioId } }) };
  }

  // SELL
  const existente = await prisma.posicion.findUnique({
    where: { portfolioId_ticker: { portfolioId, ticker: req.ticker } },
  });
  if (!existente || existente.cantidad < req.cantidad) {
    throw new Error(`Posición insuficiente de ${req.ticker}`);
  }
  await prisma.portfolio.update({
    where: { id: portfolioId },
    data: { cash: { increment: notional } },
  });
  const nuevaCantidad = existente.cantidad - req.cantidad;
  let posicion;
  if (nuevaCantidad <= 0.0000001) {
    await prisma.posicion.delete({ where: { id: existente.id } });
    posicion = null;
  } else {
    posicion = await prisma.posicion.update({
      where: { id: existente.id },
      data: { cantidad: nuevaCantidad },
    });
  }
  return {
    orden,
    posicion,
    portfolio: await prisma.portfolio.findUniqueOrThrow({ where: { id: portfolioId } }),
  };
}

export async function getPortfolioSummary() {
  const portfolio = await prisma.portfolio.findFirst({ orderBy: { createdAt: "asc" } });
  if (!portfolio) return null;
  const posiciones = await prisma.posicion.findMany({ where: { portfolioId: portfolio.id } });
  const marks = await Promise.all(
    posiciones.map(async (p) => {
      let lastPrice = p.precioEntrada;
      try {
        lastPrice = await getLatestPrice(p.ticker);
      } catch {
        // mantener entrada si falla
      }
      const marketValue = lastPrice * p.cantidad;
      const unrealized = (lastPrice - p.precioEntrada) * p.cantidad;
      return { ...p, lastPrice, marketValue, unrealized };
    })
  );
  const totalMarketValue = marks.reduce((a, b) => a + b.marketValue, 0);
  return {
    portfolio,
    posiciones: marks,
    totalEquity: portfolio.cash + totalMarketValue,
    totalMarketValue,
    totalUnrealized: marks.reduce((a, b) => a + b.unrealized, 0),
  };
}