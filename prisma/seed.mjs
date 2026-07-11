// Popula a lista fixa de motivos de não-fechamento (reunião feita, proposta
// apresentada, mas o cliente não fechou).
// Rodar com: node prisma/seed.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MOTIVOS = [
  "Sócio / decisor ausente",
  "Precisou pensar",
  "Precisou falar com a esposa",
  "Precisou ver sobre o orçamento",
  "Quis fazer reunião com outras agências primeiro",
  "Sem orçamento",
  "Outro",
];

async function main() {
  for (const nome of MOTIVOS) {
    await prisma.motivoNaoFechamento.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
  }
  console.log(`Seed concluído: ${MOTIVOS.length} motivos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
