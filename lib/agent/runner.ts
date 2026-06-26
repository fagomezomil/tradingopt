import { Ollama, type Message } from "ollama";
import { agentTools, executeTool } from "./tools";
import { ANALYST_SYSTEM_PROMPT } from "./prompts";

export interface Estrategia {
  ticker: string;
  tesis: string;
  indicadores_clave: string[];
  entrada: number | null;
  stop: number | null;
  objetivo: number | null;
  riesgo: string;
  horizonte: string;
}

const MODEL = process.env.OLLAMA_MODEL || "glm-5.2:cloud";
const HOST = process.env.OLLAMA_URL || "http://localhost:11434";

let client: Ollama | null = null;
function getClient(): Ollama {
  if (!client) client = new Ollama({ host: HOST });
  return client;
}

function parseEstrategia(text: string): Estrategia {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("Respuesta del agente sin JSON");
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error("JSON incompleto en respuesta del agente");
  const json = JSON.parse(text.slice(start, end + 1));
  return json as Estrategia;
}

export async function generarEstrategia(ticker: string): Promise<Estrategia> {
  const ollama = getClient();
  const messages: Message[] = [
    { role: "system", content: ANALYST_SYSTEM_PROMPT },
    { role: "user", content: `Genera una estrategia de inversión para el ticker ${ticker}.` },
  ];

  for (let iter = 0; iter < 8; iter++) {
    const response = await ollama.chat({
      model: MODEL,
      messages,
      tools: agentTools,
      stream: false,
    });
    const msg = response.message;

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: msg.content ?? "",
        tool_calls: msg.tool_calls,
      });
      for (const tc of msg.tool_calls) {
        const fn = tc.function;
        const args = (fn.arguments ?? {}) as Record<string, unknown>;
        const result = await executeTool({
          name: fn.name,
          arguments: args,
        });
        messages.push({
          role: "tool",
          content: result,
        });
      }
      continue;
    }

    const text = msg.content ?? "";
    if (!text.trim()) {
      throw new Error("Agente respondió sin contenido");
    }
    return parseEstrategia(text);
  }

  throw new Error("Agente superó el máximo de iteraciones sin producir estrategia");
}