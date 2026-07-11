"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createCriativo(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) throw new Error("Nome do criativo é obrigatório.");

  const campanha = String(formData.get("campanha") ?? "").trim() || null;
  const conjunto = String(formData.get("conjunto") ?? "").trim() || null;

  await prisma.criativo.create({ data: { nome, campanha, conjunto } });
  revalidatePath("/criativos");
}

export async function upsertCriativoMensal(formData: FormData) {
  const criativoId = String(formData.get("criativoId") ?? "");
  const mes = String(formData.get("mes") ?? "");
  const investimento = Number(formData.get("investimento") ?? 0);
  const vencedor = formData.get("vencedor") === "on";

  if (!criativoId || !mes) {
    throw new Error("Criativo e mês são obrigatórios.");
  }

  await prisma.criativoMensal.upsert({
    where: { criativoId_mes: { criativoId, mes } },
    update: { investimento, vencedor },
    create: { criativoId, mes, investimento, vencedor },
  });
  revalidatePath("/criativos");
}
