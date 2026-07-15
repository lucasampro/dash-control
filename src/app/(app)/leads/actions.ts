"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Origem, ReuniaoStatus, Resultado } from "@prisma/client";
import { sincronizarLeadsMeta } from "@/lib/meta-leads";
import { enviarPushParaTodos } from "@/lib/push";
import { nomeExibicaoLead } from "@/lib/lead-nome";

function toNullableBool(value: FormDataEntryValue | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function toNullableString(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}

// O input de data manda "YYYY-MM-DD"; `new Date` interpretaria como meia-noite
// UTC, o que faz o lead "voltar" um dia quando exibido no fuso de São Paulo
// (UTC-3). Aqui fixamos a meia-noite de São Paulo pra a data bater na lista.
function dataInputParaData(valor: string): Date {
  return new Date(`${valor}T00:00:00-03:00`);
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

// Dispara o push de reunião agendada só na transição do agendamento pra "Sim"
// (não estava marcado antes), evitando re-notificar em re-marcações.
async function notificarAgendamento(
  agendouAntes: boolean | null,
  agendouAgora: boolean | null,
  lead: { nome?: string | null; dadosFormulario?: unknown },
) {
  if (agendouAgora === true && agendouAntes !== true) {
    await enviarPushParaTodos({
      title: "Nova Reunião Agendada ✅",
      body: `Reunião agendada com o lead ${nomeExibicaoLead(lead)}`,
      url: "/leads",
    });
  }
}

// Dispara o push de cliente fechado só na transição do resultado pra "Ganho"
// (não estava ganho antes), evitando re-notificar em re-salvamentos.
async function notificarFechamento(
  resultadoAntes: Resultado | null,
  resultadoAgora: Resultado,
) {
  if (resultadoAgora === Resultado.GANHO && resultadoAntes !== Resultado.GANHO) {
    await enviarPushParaTodos({
      title: "NOVO CLIENTE FECHADO 🔔🔷",
      body: "Toca o sinooo e atualiza a META!!!!!",
      url: "/leads",
    });
  }
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
      data: dataInputParaData(data),
      origem,
      criativoId,
      sdrId,
      nome: toNullableString(formData.get("nome")),
      telefone: toNullableString(formData.get("telefone")),
      email: toNullableString(formData.get("email")),
      instagram: toNullableString(formData.get("instagram")),
      observacoes: toNullableString(formData.get("observacoes")),
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

  const anterior = await prisma.lead.findUnique({
    where: { id },
    select: { agendou: true, resultado: true, nome: true, dadosFormulario: true },
  });

  await prisma.lead.update({
    where: { id },
    data: {
      data: dataInputParaData(data),
      origem,
      criativoId,
      sdrId,
      nome: toNullableString(formData.get("nome")),
      telefone: toNullableString(formData.get("telefone")),
      email: toNullableString(formData.get("email")),
      instagram: toNullableString(formData.get("instagram")),
      observacoes: toNullableString(formData.get("observacoes")),
      qualificado,
      agendou,
      reuniaoStatus,
      closerId,
      motivoNaoFechamentoId,
      resultado,
      receita,
    },
  });

  await notificarAgendamento(anterior?.agendou ?? null, agendou, {
    nome: anterior?.nome,
    dadosFormulario: anterior?.dadosFormulario,
  });
  await notificarFechamento(anterior?.resultado ?? null, resultado);

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

export async function deleteLead(id: string) {
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/leads");
  redirect("/leads");
}

// Sincronização manual: busca na Graph API do Meta os leads que ainda não
// chegaram aqui (ex.: webhook fora do ar num momento) e cria os que faltam.
export async function sincronizarLeads() {
  await sincronizarLeadsMeta();
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

// Atualizações rápidas de um único campo, usadas pelos badges clicáveis da
// lista de leads (sem precisar entrar na tela de edição).
export async function updateReuniaoStatus(id: string, status: string) {
  await prisma.lead.update({ where: { id }, data: { reuniaoStatus: parseReuniaoStatus(status) } });
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

export async function updateQualificado(id: string, value: string) {
  await prisma.lead.update({ where: { id }, data: { qualificado: toNullableBool(value) } });
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

export async function updateAgendou(id: string, value: string) {
  const novoAgendou = toNullableBool(value);
  const anterior = await prisma.lead.findUnique({
    where: { id },
    select: { agendou: true, nome: true, dadosFormulario: true },
  });
  await prisma.lead.update({ where: { id }, data: { agendou: novoAgendou } });

  await notificarAgendamento(anterior?.agendou ?? null, novoAgendou, {
    nome: anterior?.nome,
    dadosFormulario: anterior?.dadosFormulario,
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/dashboard");
}

export async function updateResultado(id: string, resultado: string) {
  const novoResultado = parseResultado(resultado);
  const anterior = await prisma.lead.findUnique({
    where: { id },
    select: { resultado: true },
  });
  await prisma.lead.update({ where: { id }, data: { resultado: novoResultado } });

  await notificarFechamento(anterior?.resultado ?? null, novoResultado);

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/dashboard");
}

export async function updateSdr(id: string, sdrId: string) {
  await prisma.lead.update({ where: { id }, data: { sdrId: toNullableString(sdrId) } });
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}
