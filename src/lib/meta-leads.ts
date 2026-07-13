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
export async function resolverCriativo(adId: string | undefined, token: string) {
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

type CampoFormulario = { name: string; values: string[] };

/**
 * Busca as respostas que o lead preencheu no formulário nativo do Meta
 * (nome, telefone, e-mail etc.) pelo leadgen_id, pra guardar e exibir na
 * tela de detalhe do lead.
 */
async function buscarDadosFormulario(leadgenId: string, token: string): Promise<Record<string, string>> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${leadgenId}`);
  url.searchParams.set("fields", "field_data");
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Meta Graph API (dados do formulário) respondeu ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { field_data?: CampoFormulario[] };
  const campos: Record<string, string> = {};
  for (const campo of data.field_data ?? []) {
    campos[campo.name] = campo.values.join(", ");
  }
  return campos;
}

/**
 * Processa um único evento de leadgen: resolve/cria o Criativo pelo ad_id,
 * busca as respostas do formulário e cria o Lead correspondente. Os campos
 * de qualificação, agendamento, reunião e fechamento ficam em aberto pro SDR
 * preencher ao assumir o lead — igual já acontece hoje com leads cadastrados
 * manualmente.
 */
export async function processarLeadgen(value: LeadgenValue) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("META_PAGE_ACCESS_TOKEN não configurado.");

  const criativo = await resolverCriativo(value.ad_id, token);
  const dadosFormulario = await buscarDadosFormulario(value.leadgen_id, token);

  // Upsert por metaLeadId: se o Meta reenviar o mesmo evento de webhook (ou
  // se esse lead já tiver sido trazido pelo backfill histórico), não cria
  // duplicado.
  await prisma.lead.upsert({
    where: { metaLeadId: value.leadgen_id },
    update: {},
    create: {
      metaLeadId: value.leadgen_id,
      data: new Date(value.created_time * 1000),
      origem: "PAGO",
      criativoId: criativo?.id ?? null,
      dadosFormulario,
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

async function buscarTokenDaPagina(token: string) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts`);
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Meta Graph API (contas) respondeu ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { data?: { id: string; access_token: string }[] };
  const pagina = data.data?.[0];
  if (!pagina) throw new Error("Nenhuma Página encontrada para o META_PAGE_ACCESS_TOKEN configurado.");
  return { pageId: pagina.id, pageToken: pagina.access_token };
}

async function listarFormularios(pageId: string, pageToken: string) {
  const formularios: { id: string }[] = [];
  let url: string | undefined = (() => {
    const u = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/leadgen_forms`);
    u.searchParams.set("access_token", pageToken);
    u.searchParams.set("fields", "id");
    return u.toString();
  })();

  while (url) {
    const res: Response = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Meta Graph API (formulários) respondeu ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as { data?: { id: string }[]; paging?: { next?: string } };
    formularios.push(...(data.data ?? []));
    url = data.paging?.next;
  }

  return formularios;
}

async function listarLeadsDoFormulario(formId: string, pageToken: string) {
  const leads: {
    id: string;
    created_time: string;
    ad_id?: string;
    adset_id?: string;
    campaign_id?: string;
  }[] = [];
  let url: string | undefined = (() => {
    const u = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${formId}/leads`);
    u.searchParams.set("access_token", pageToken);
    u.searchParams.set("fields", "id,created_time,ad_id,adset_id,campaign_id");
    return u.toString();
  })();

  while (url) {
    const res: Response = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Meta Graph API (leads) respondeu ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      data?: { id: string; created_time: string; ad_id?: string; adset_id?: string; campaign_id?: string }[];
      paging?: { next?: string };
    };
    leads.push(...(data.data ?? []));
    url = data.paging?.next;
  }

  return leads;
}

/**
 * Sincronização manual: busca na Graph API todos os formulários da Página e
 * seus leads, criando (via upsert por metaLeadId, igual ao webhook) qualquer
 * lead que ainda não esteja no banco. Serve tanto de "primeira carga" quanto
 * de botão de "puxar o que tiver" caso o webhook tenha perdido algum evento.
 */
export async function sincronizarLeadsMeta() {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("META_PAGE_ACCESS_TOKEN não configurado.");

  const { pageId, pageToken } = await buscarTokenDaPagina(token);
  const formularios = await listarFormularios(pageId, pageToken);

  let criados = 0;
  let existentes = 0;
  let semAdId = 0;

  for (const form of formularios) {
    const leads = await listarLeadsDoFormulario(form.id, pageToken);
    for (const lead of leads) {
      if (!lead.ad_id) {
        semAdId += 1;
        continue;
      }

      const jaExiste = await prisma.lead.findUnique({ where: { metaLeadId: lead.id } });
      if (jaExiste) {
        existentes += 1;
        continue;
      }

      await processarLeadgen({
        leadgen_id: lead.id,
        page_id: pageId,
        form_id: form.id,
        ad_id: lead.ad_id,
        adset_id: lead.adset_id,
        campaign_id: lead.campaign_id,
        created_time: Math.floor(new Date(lead.created_time).getTime() / 1000),
      });
      criados += 1;
    }
  }

  return { criados, existentes, semAdId, formularios: formularios.length };
}
