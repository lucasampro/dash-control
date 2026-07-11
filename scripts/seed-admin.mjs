// Uso: node scripts/seed-admin.mjs
// Cria o usuário admin inicial no banco (idempotente), migrando o hash que
// antes vivia hardcoded em src/lib/users.ts. Rode uma vez após aplicar a
// migration do model User em um banco novo.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const existente = await prisma.user.findUnique({ where: { username: "admin" } });
if (existente) {
  console.log("Usuário admin já existe, nada a fazer.");
} else {
  await prisma.user.create({
    data: {
      username: "admin",
      name: "Admin",
      passwordHash:
        "$2b$10$kzqkOaaq5s5C4d1tQ/Kstuo4Sa1g8UNQNZQbDAf37PMWCb33IbWCe", // senha provisória: control2026
      isAdmin: true,
      ativo: true,
    },
  });
  console.log("Usuário admin criado.");
}

await prisma.$disconnect();
