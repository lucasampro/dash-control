"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

function num(formData: FormData, key: string) {
  return Number(formData.get(key) ?? 0);
}

export async function upsertMetricaMensal(formData: FormData) {
  const mes = String(formData.get("mes") ?? "");
  if (!mes) throw new Error("Mês é obrigatório.");

  const data = {
    custoComercial: num(formData, "custoComercial"),
    logosInicio: num(formData, "logosInicio"),
    logosPerdidos: num(formData, "logosPerdidos"),
    mrrInicio: num(formData, "mrrInicio"),
    mrrPerdido: num(formData, "mrrPerdido"),
    mrrExpansao: num(formData, "mrrExpansao"),
    clientesAtivos: num(formData, "clientesAtivos"),
    promotores: num(formData, "promotores"),
    neutros: num(formData, "neutros"),
    detratores: num(formData, "detratores"),
    faturamento: num(formData, "faturamento"),
  };

  await prisma.metricaMensal.upsert({
    where: { mes },
    update: data,
    create: { mes, ...data },
  });

  revalidatePath("/financeiro");
}

export async function upsertMetaMensal(formData: FormData) {
  const mes = String(formData.get("mes") ?? "");
  if (!mes) throw new Error("Mês é obrigatório.");

  const data = {
    metaLeads: num(formData, "metaLeads"),
    metaFechamentos: num(formData, "metaFechamentos"),
    metaReceita: num(formData, "metaReceita"),
    metaCplQualificado: num(formData, "metaCplQualificado"),
  };

  await prisma.metaMensal.upsert({
    where: { mes },
    update: data,
    create: { mes, ...data },
  });

  revalidatePath("/financeiro");
  revalidatePath("/admin");
}
