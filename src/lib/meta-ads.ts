import { prisma } from "./db";
import { mesAtual } from "./mesReferencia";
import { mesParaIntervalo } from "./metrics";

const GRAPH_API_VERSION = "v21.0";

type MetaInsightRow = {
  date_start: string;
  spend?: string;
};

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function fetchMetaAdsSpend(since: Date, until: Date): Promise<{ data: string; valor: number }[]> {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId) {
    throw new Error("META_ACCESS_TOKEN ou META_AD_ACCOUNT_ID não configurados no .env.local.");
  }

  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/act_${accountId}/insights`);
  url.searchParams.set("fields", "spend");
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("time_range", JSON.stringify({ since: fmt(since), until: fmt(until) }));
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta Ads API respondeu ${res.status}: ${body}`);
  }

  const json = (await res.json()) as { data?: MetaInsightRow[] };
  const rows = json.data ?? [];
  return rows.map((r) => ({ data: r.date_start, valor: Number(r.spend ?? 0) }));
}

/**
 * Busca o gasto diário do mês de referência inteiro na Meta Ads API (até hoje,
 * se for o mês atual) e faz upsert em InvestimentoDiario. Retorna quantos dias
 * foram sincronizados.
 */
export async function syncMetaAdsInvestimento(mes: string) {
  const { inicio, fim } = mesParaIntervalo(mes);
  const hoje = new Date();
  const ateOntem = new Date(fim.getTime() - 1);
  const until = mes === mesAtual() ? hoje : ateOntem;

  const rows = await fetchMetaAdsSpend(inicio, until);

  for (const row of rows) {
    // Constrói a data em horário local (mesma convenção usada no resto do
    // painel — mesParaIntervalo, MesSelector etc.) para não criar um
    // registro duplicado do mesmo dia com um horário diferente.
    const [ano, mesNum, dia] = row.data.split("-").map(Number);
    const data = new Date(ano, mesNum - 1, dia);
    await prisma.investimentoDiario.upsert({
      where: { data },
      update: { valor: row.valor },
      create: { data, valor: row.valor },
    });
  }

  return rows.length;
}
