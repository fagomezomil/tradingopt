import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const HELIUM_URL = process.env.HELMCP_URL || "https://heliumtrades.com/mcp";

let clientPromise: Promise<Client> | null = null;
const cache = new Map<string, { ts: number; data: unknown }>();
const CACHE_TTL_MS = 60_000;

async function getClient(): Promise<Client> {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const transport = new StreamableHTTPClientTransport(new URL(HELIUM_URL));
    const client = new Client(
      { name: "analisismercado", version: "0.1.0" },
      { capabilities: {} }
    );
    await client.connect(transport);
    return client;
  })();
  return clientPromise;
}

function key(tool: string, args: Record<string, unknown>): string {
  return `${tool}:${JSON.stringify(args)}`;
}

function readCache(k: string): unknown | undefined {
  const e = cache.get(k);
  if (!e) return undefined;
  if (Date.now() - e.ts > CACHE_TTL_MS) {
    cache.delete(k);
    return undefined;
  }
  return e.data;
}

export async function callHelium<T = unknown>(
  tool: string,
  args: Record<string, unknown> = {},
  opts: { cache?: boolean } = {}
): Promise<T> {
  const k = key(tool, args);
  if (opts.cache) {
    const c = readCache(k);
    if (c !== undefined) return c as T;
  }
  const client = await getClient();
  const res = await client.callTool({ name: tool, arguments: args });
  const blocks = (res.content as unknown as Array<{ type: string; text?: string }>) ?? [];
  const data = blocks.map((b) => (b.type === "text" ? b.text ?? "" : "")).join("");
  let parsed: unknown = data;
  try {
    parsed = JSON.parse(data);
  } catch {
    // keep as string
  }
  if (opts.cache) cache.set(k, { ts: Date.now(), data: parsed });
  return parsed as T;
}

export async function getTicker(ticker: string) {
  return callHelium("get_ticker", { ticker }, { cache: true });
}

export async function getOptionPrice(
  ticker: string,
  strike: number,
  expiration: string,
  type: "call" | "put"
) {
  return callHelium("get_option_price", { ticker, strike, expiration, type });
}

export async function getTopTradingStrategies(ticker: string) {
  return callHelium("get_top_trading_strategies", { ticker }, { cache: true });
}

export async function searchNews(query: string) {
  return callHelium("search_news", { query }, { cache: true });
}

export async function searchBalancedNews(query: string) {
  return callHelium("search_balanced_news", { query }, { cache: true });
}

export async function getSourceBias(source: string) {
  return callHelium("get_source_bias", { source }, { cache: true });
}

export async function getBiasFromUrl(url: string) {
  return callHelium("get_bias_from_url", { url }, { cache: true });
}

export async function closeHelium() {
  if (!clientPromise) return;
  const client = await clientPromise;
  await client.close();
  clientPromise = null;
}