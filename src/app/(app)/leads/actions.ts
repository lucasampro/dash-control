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

export async function createLead(formData: FormData) {
  const data = String(formData.get("data") ?? "");
  const origem = parseOrigem(formData.get("origem"));
  const criativoId = toNullableString(formData.get("criativoId"));
  const sdrId = toNullableString(formData.get("sdrId"));

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
