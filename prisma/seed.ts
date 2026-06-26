import { prisma } from "../lib/db/client";

async function main() {
  const existente = await prisma.portfolio.findFirst();
  if (existente) {
    console.log(`Portfolio ya existe: ${existente.nombre} (cash=$${existente.cash})`);
    return;
  }
  const p = await prisma.portfolio.create({
    data: { nombre: "Paper Trading - Default", cash: 100000 },
  });
  console.log(`Creado portfolio ${p.id} (${p.nombre}) con $${p.cash}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });