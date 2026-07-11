import crypto from "crypto";
import { prisma } from "./db";

const GRAPH_API_VERSION = "v21.0";

/**
 * Valida a assinatura X-Hub-Signature-256 enviada pelo Meta em cada chamada
 * do webhook, garantindo que o payload realmente veio do Meta (HMAC-SHA256
 * do corpo bruto usando o App Secret).
 */
export function verificaAssinaturaWebhook(payload: string, signatureHeader: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signatureHeader) return false;

  const [algo, hash] = signatureHeader.split("=");
  if (algo !== "sha256" || !hash) return false;

  const esperado = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const recebido = Buffer.from(hash);
  const calculado = Buffer.from(esperado);
  if (recebido.length !== calculado.length) return false;
  return crypto.timingSafeEqual(recebido, calculado);
}

type LeadgenValue = {
  leadgen_id: string;
  page_id: string;
  form_id: string;
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
  created_time: number;
};

type WebhookPayload = {
  object: string;
  entry?: {
    id: string;
    changes?: { field: string; value: LeadgenValue }[];
  }[];
};

async function buscarDadosAnuncio(adId: string, token: string) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${adId}`);
  url.searchParams.set("fields", "name,adset{id,name},campaign{id,name}");
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Meta Graph API (anúncio) respondeu ${res.status}: ${await res.text()}`);
  }

  return (await res.json()) as {
    name: string;
    adset?: { id: string; name: string };
    campaign?: { id: string; name: string };
  };
}

/**
 * Encontra o Criativo (Anúncio) correspondente ao ad_id do Meta, ou cria um
 * novo (com campanha/conjunto vindos do Meta) se for a primeira vez que esse
 * anúncio aparece.
 */
async function resolverCriativo(adId: string | undefined, token: string) {
  if (!adId) return null;

  const existente = await prisma.criativo.findUnique({ where: { metaAdId: adId } });
  if (existente) return existente;

  const dados = await buscarDadosAnuncio(adId, token);
  return prisma.criativo.create({
    data: {
      nome: dados.name,
      campanha: dados.campaign?.name ?? null,
      conjunto: dados.adset?.name ?? null,
      metaAdId: adId,
      metaAdsetId: dados.adset?.id ?? null,
      metaCampaignId: dados.campaign?.id ?? null,
    },
  });
}

/**
 * Processa um único evento de leadgen: resolve/cria o Criativo pelo ad_id e
 * cria o Lead correspondente. Os campos de qualificação, agendamento,
 * reunião e fechamento ficam em aberto pro SDR preencher ao assumir o lead
 * — igual já acontece hoje com leads cadastrados manualmente.
 */
export async function processarLeadgen(value: LeadgenValue) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("META_PAGE_ACCESS_TOKEN não configurado.");

  const criativo = await resolverCriativo(value.ad_id, token);

  await prisma.lead.create({
    data: {
      data: new Date(value.created_time * 1000),
      origem: "PAGO",
      criativoId: criativo?.id ?? null,
    },
  });
}

export async function processarWebhookMeta(payload: WebhookPayload) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field === "leadgen") {
        await processarLeadgen(change.value);
      }
    }
  }
}
