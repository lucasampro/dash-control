"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { syncMetaAdsInvestimento } from "@/lib/meta-ads";

export async function upsertInvestimentoDiario(formData: FormData) {
  const dataStr = String(formData.get("data") ?? "");
  const valor = Number(formData.get("valor") ?? 0);

  if (!dataStr) throw new Error("Data é obrigatória.");

  // Horário local (mesma convenção de mesParaIntervalo/MesSelector), pra não
  // criar um registro duplicado do mesmo dia com um horário diferente.
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  await prisma.investimentoDiario.upsert({
    where: { data },
    update: { valor },
    create: { data, valor },
  });

  revalidatePath("/investimento");
}

export async function sincronizarMetaAds(formData: FormData) {
  const mes = String(formData.get("mes") ?? "");
  if (!mes) throw new Error("Mês é obrigatório.");
  await syncMetaAdsInvestimento(mes);
  revalidatePath("/investimento");
}
