import { generarEstrategia } from "../lib/agent/runner";

async function main() {
  console.log("Generando estrategia para AAPL con Ollama glm-5.2:cloud...");
  const estrategia = await generarEstrategia("AAPL");
  console.log("Estrategia:");
  console.log(JSON.stringify(estrategia, null, 2));
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});