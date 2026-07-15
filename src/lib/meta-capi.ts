// Envio de eventos de funil de volta pro Meta via Conversions API (fluxo de
// "Leads de conversão" pra Lead Ads). Ao avançar o lead no funil aqui no
// painel, mandamos um evento server-side casando pelo Meta Lead ID (leadgen_id)
// — assim o algoritmo do Meta otimiza por leads que realmente avançam/fecham,
// não só por volume.
//
// Requer, do lado do Meta (Events Manager): um Dataset (Pixel) com integração
// de CRM e um token da CAPI, além de a campanha estar em otimização "Leads de
// conversão". Enquanto META_DATASET_ID / META_CAPI_TOKEN não existirem, o envio
// é um no-op (não quebra o salvamento do lead).

import { prisma } from "@/lib/db";

const GRAPH_API_VERSION = "v21.0";

export type FunilStage = "qualificado" | "agendou" | "reuniao_feita" | "ganho";

// Lê a configuração da CAPI: primeiro do banco (editável no Admin), com
// fallback pras variáveis de ambiente. Assim o Lucas troca Pixel/token pelo
// painel sem redeploy, mas o env continua valendo se o banco estiver vazio.
async function getConfigCapi(): Promise<{
  datasetId: string | null;
  token: string | null;
  sourceName: string;
}> {
  const cfg = await prisma.integracaoMeta.findUnique({ where: { id: "meta" } });
  const datasetId = cfg?.datasetId || process.env.META_DATASET_ID || null;
  const token = cfg?.capiToken || process.env.META_CAPI_TOKEN || null;
  const sourceName =
    cfg?.sourceName || process.env.META_CAPI_SOURCE_NAME || "Painel CONTROL";
  return { datasetId, token, sourceName };
}

// Nome do evento enviado ao Meta pra cada estágio. É esse nome que aparece no
// Events Manager e que o Lucas escolhe no Ads Manager como evento de otimização
// da campanha "Leads de conversão".
const EVENT_NAME: Record<FunilStage, string> = {
  qualificado: "lead_qualificado",
  agendou: "reuniao_agendada",
  reuniao_feita: "reuniao_feita",
  ganho: "cliente_fechado",
};

export async function enviarEventoFunilMeta(params: {
  metaLeadId: string | null | undefined;
  stage: FunilStage;
  eventTime?: Date;
  valor?: number | null;
}): Promise<void> {
  const { datasetId, token, sourceName } = await getConfigCapi();

  // Sem credenciais ou sem lead vindo do Meta (leadgen_id), não há o que enviar.
  if (!datasetId || !token || !params.metaLeadId) return;

  const custom_data: Record<string, unknown> = {
    // Campos exigidos pelo Meta pra eventos de CRM (Leads de conversão).
    event_source: "crm",
    lead_event_source: sourceName,
  };

  // No fechamento, manda o valor da venda pra otimizar por receita.
  if (params.stage === "ganho" && params.valor && params.valor > 0) {
    custom_data.value = params.valor;
    custom_data.currency = "BRL";
  }

  const body = {
    data: [
      {
        event_name: EVENT_NAME[params.stage],
        event_time: Math.floor((params.eventTime ?? new Date()).getTime() / 1000),
        // CRM lead events usam "system_generated" (não "website").
        action_source: "system_generated",
        // O casamento com o anúncio/campanha é feito pelo lead_id (numérico).
        user_data: { lead_id: Number(params.metaLeadId) },
        custom_data,
      },
    ],
  };

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${datasetId}/events?access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`Meta CAPI respondeu ${res.status}: ${await res.text()}`);
    }
  } catch (erro) {
    // Falha no envio ao Meta nunca deve quebrar o salvamento do lead.
    console.error("Falha ao enviar evento de funil pro Meta (CAPI):", erro);
  }
}
