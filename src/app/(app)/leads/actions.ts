"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Origem, ReuniaoStatus, Resultado } from "@prisma/client";

function toNullableBool(value: FormDataEntryValue | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function toNullableString(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}

function parseOrigem(value: FormDataEntryValue | null): Origem {
  const str = String(value ?? "");
  if (str === Origem.PAGO || str === Origem.ORGANICO) return str;
  throw new Error("Origem inválida.");
}

function parseReuniaoStatus(value: FormDataEntryValue | null): ReuniaoStatus {
  const str = String(value ?? ReuniaoStatus.PENDENTE);
  if (
    str === ReuniaoStatus.PENDENTE ||
    str === ReuniaoStatus.FEITA ||
    str === ReuniaoStatus.NO_SHOW
  ) {
    return str;
  }
  throw new Error("Status de reunião inválido.");
}

function parseResultado(value: FormDataEntryValue | null): Resultado {
  const str = String(value ?? Resultado.EM_ANDAMENTO);
  if (
    str === Resultado.EM_ANDAMENTO ||
    str === Resultado.GANHO ||
    str === Resultado.PERDIDO
  ) {
    return str;
  }
  throw new Error("Resultado inválido.");
}

async function resolverCriativoManual(nome: string, campanha: string | null, conjunto: string | null) {
  const existente = await prisma.criativo.findFirst({
    where: { nome, campanha, conjunto, metaAdId: null },
  });
  if (existente) return existente;
  return prisma.criativo.create({ data: { nome, campanha, conjunto } });
}

export async function createLead(formData: FormData) {
  const data = String(formData.get("data") ?? "");
  const origem = parseOrigem(formData.get("origem"));
  const sdrId = toNullableString(formData.get("sdrId"));

  // Se o SDR marcou "Adicionar UTM manualmente" e preencheu o Anúncio, cria/
  // reaproveita o Criativo a partir da UTM digitada (ex: lead que o Meta não
  // identificou automaticamente via webhook). Caso contrário, usa o Criativo
  // escolhido no select normal.
  const utmAnuncio = toNullableString(formData.get("utmAnuncio"));
  let criativoId = toNullableString(formData.get("criativoId"));
  if (utmAnuncio) {
    const utmCampanha = toNullableString(formData.get("utmCampanha"));
    const utmConjunto = toNullableString(formData.get("utmConjunto"));
    const criativo = await resolverCriativoManual(utmAnuncio, utmCampanha, utmConjunto);
    criativoId = criativo.id;
  }

  if (!data) {
    throw new Error("Data é obrigatória.");
  }

  const lead = await prisma.lead.create({
    data: {
      data: new Date(data),
      origem,
      criativoId,
      sdrId,
    },
  });

  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function updateLead(id: string, formData: FormData) {
  const data = String(formData.get("data") ?? "");
  const origem = parseOrigem(formData.get("origem"));
  const criativoId = toNullableString(formData.get("criativoId"));
  const sdrId = toNullableString(formData.get("sdrId"));
  const qualificado = toNullableBool(formData.get("qualificado"));
  const agendou = toNullableBool(formData.get("agendou"));
  const reuniaoStatus = parseReuniaoStatus(formData.get("reuniaoStatus"));
  const closerId = toNullableString(formData.get("closerId"));
  const motivoNaoFechamentoId = toNullableString(formData.get("motivoNaoFechamentoId"));
  const resultado = parseResultado(formData.get("resultado"));
  const receitaRaw = formData.get("receita");
  const receita = receitaRaw ? Number(receitaRaw) : null;

  await prisma.lead.update({
    where: { id },
    data: {
      data: new Date(data),
      origem,
      criativoId,
      sdrId,
      qualificado,
      agendou,
      reuniaoStatus,
      closerId,
      motivoNaoFechamentoId,
      resultado,
      receita,
    },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

export async function deleteLead(id: string) {
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/leads");
  redirect("/leads");
}
