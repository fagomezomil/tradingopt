import { getTicker, searchBalancedNews, closeHelium } from "../lib/mcp/helium-client";

async function main() {
  console.log("Probando get_ticker para AAPL...");
  const ticker = await getTicker("AAPL");
  console.log("Respuesta get_ticker:");
  console.log(JSON.stringify(ticker, null, 2).slice(0, 2000));
  console.log("\n---\n");
  console.log("Probando search_balanced_news para 'Apple stock'...");
  const news = await searchBalancedNews("Apple stock");
  console.log("Respuesta search_balanced_news (truncada):");
  console.log(JSON.stringify(news, null, 2).slice(0, 1500));
  await closeHelium();
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});