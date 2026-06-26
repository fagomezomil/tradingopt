import { callHelium } from "../mcp/helium-client";
import type { Tool } from "ollama";

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

// Esquema en formato Ollama/OpenAI (ligeramente distinto al de Anthropic).
export const agentTools: Tool[] = [
  {
    type: "function",
    function: {
      name: "get_ticker",
      description:
        "Obtiene datos live de un ticker (stock, ETF o crypto): precio, casos bullish/bearish generados por IA y forecast. Usar siempre al inicio para entender el estado actual del activo.",
      parameters: {
        type: "object",
        properties: {
          ticker: {
            type: "string",
            description: "Símbolo del ticker, ej: AAPL, MSFT, BTC-USD",
          },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_balanced_news",
      description:
        "Busca noticias balanceadas sobre un tema, sintetizando perspectivas de izquierda, derecha y centro. Útil para entender el sentimiento del mercado y eventos catalizadores.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Tema a buscar, ej: 'Apple earnings' o 'Federal Reserve rates'",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_top_trading_strategies",
      description:
        "Devuelve las mejores estrategias de opciones para un ticker con análisis de riesgo/recompensa. Usar para sugerir estrategias concretas.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_option_price",
      description:
        "Obtiene el fair value predicho por ML y la probabilidad de terminar in-the-money para un contrato de opciones específico.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string" },
          strike: { type: "number" },
          expiration: { type: "string", description: "YYYY-MM-DD" },
          type: { type: "string", enum: ["call", "put"] },
        },
        required: ["ticker", "strike", "expiration", "type"],
      },
    },
  },
];

export async function executeTool(call: ToolCall): Promise<string> {
  try {
    const res = await callHelium(call.name, call.arguments);
    return typeof res === "string" ? res : JSON.stringify(res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return JSON.stringify({ error: msg });
  }
}