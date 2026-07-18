import { Banknote, Trophy, Receipt, PieChart, TrendingUp } from "lucide-react";
import {
  getVendasPorOrigem,
  mesParaIntervalo,
  mesAnterior,
  pctChange,
  ORIGENS_ORDEM,
} from "@/lib/metrics";
import { getMesReferencia } from "@/lib/mesReferencia";
import { getCompararMesAnterior } from "@/lib/compararMes";
import { KpiCard } from "@/components/KpiCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MesSelector } from "@/components/ui/MesSelector";
import { CompararToggle } from "@/app/(app)/dashboard/CompararToggle";
import { AutoRefresh } from "@/components/ui/AutoRefresh";
import { sincronizarLeads } from "@/app/(app)/leads/actions";
import { ORIGEM_LABEL, ORIGEM_VARIANT } from "@/lib/status";
import {
  ReceitaPorOrigemPie,
  VendasPorOrigemBar,
  TendenciaOrigemChart,
  type OrigemChartData,
  type TendenciaPonto,
} from "@/components/vendas/VendasCharts";
import {
  sectionTitleClass,
  cardClass,
  tableWrapClass,
  theadRowClass,
  thClass,
  trClass,
  tdClass,
} from "@/lib/ui";

export const dynamic = "force-dynamic";

function fmtMoeda(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(v: number) {
  return `${v.toFixed(1)}%`;
}

function fmtX(v: number) {
  return `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}x`;
}

function fmtMes(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const label = new Date(ano, mesNum - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function fmtMesCurto(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const label = new Date(ano, mesNum - 1, 1).toLocaleDateString("pt-BR", {
    month: "short",
  });
  return `${label.replace(".", "")}/${String(ano).slice(2)}`;
}

function mesesAnteriores(mes: string, quantidade: number) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const lista: string[] = [];
  for (let i = quantidade - 1; i >= 0; i--) {
    const d = new Date(ano, mesNum - 1 - i, 1);
    lista.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return lista;
}

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const mes = await getMesReferencia(params.mes);
  const comparar = await getCompararMesAnterior();
  const { inicio, fim } = mesParaIntervalo(mes);
  const mesAnt = mesAnterior(mes);
  const anterior = mesParaIntervalo(mesAnt);

  const [vendas, vendasAnterior] = await Promise.all([
    getVendasPorOrigem(inicio, fim),
    getVendasPorOrigem(anterior.inicio, anterior.fim),
  ]);

  // Tendência de faturamento por origem nos últimos 6 meses.
  const meses = mesesAnteriores(mes, 6);
  const tendencia: TendenciaPonto[] = [];
  for (const m of meses) {
    const range = mesParaIntervalo(m);
    const v = await getVendasPorOrigem(range.inicio, range.fim);
    const ponto: TendenciaPonto = {
      periodo: fmtMesCurto(m),
      PAGO: 0,
      ORGANICO: 0,
      LINK_BIO: 0,
      INDICACAO: 0,
    };
    for (const o of v.origens) ponto[o.origem] = o.receita;
    tendencia.push(ponto);
  }

  const chartData: OrigemChartData[] = vendas.origens.map((o) => ({
    origem: o.origem,
    leads: o.leads,
    fechamentos: o.fechamentos,
    receita: o.receita,
    pctReceita: o.pctReceita,
  }));

  // Tabela ordenada por receita (maior primeiro).
  const tabela = [...vendas.origens].sort((a, b) => b.receita - a.receita);
  const semVendas = vendas.totalFechamentos === 0;

  return (
    <div className="flex flex-col gap-8">
      <AutoRefresh intervalMs={60000} syncAction={sincronizarLeads} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-control-ink">Vendas</h1>
          <p className="mt-0.5 text-sm text-control-ink/45">
            Faturamento do mês por origem — anúncio, orgânico, link da bio e indicação.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <MesSelector mes={mes} redirectTo="/vendas" />
          <CompararToggle ativo={comparar} mes={mes} />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Faturamento total"
          value={fmtMoeda(vendas.totalReceita)}
          accent="gold"
          icon={Banknote}
          delta={comparar ? pctChange(vendas.totalReceita, vendasAnterior.totalReceita) : undefined}
        />
        <KpiCard
          label="Vendas"
          value={String(vendas.totalFechamentos)}
          icon={Trophy}
          delta={comparar ? pctChange(vendas.totalFechamentos, vendasAnterior.totalFechamentos) : undefined}
        />
        <KpiCard
          label="Ticket médio"
          value={fmtMoeda(vendas.ticketMedioGeral)}
          accent="gold"
          icon={Receipt}
          delta={comparar ? pctChange(vendas.ticketMedioGeral, vendasAnterior.ticketMedioGeral) : undefined}
          tooltip={`${fmtMoeda(vendas.totalReceita)} de faturamento ÷ ${vendas.totalFechamentos} vendas`}
        />
        <KpiCard
          label="Origens com venda"
          value={`${vendas.origensAtivas}/${ORIGENS_ORDEM.length}`}
          icon={PieChart}
          tooltip="Quantas das 4 origens tiveram ao menos uma venda no mês."
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <p className={`${sectionTitleClass} mb-2`}>Faturamento por origem</p>
          <p className="mb-2 text-xs text-control-ink/40">
            Participação de cada origem no faturamento do mês.
          </p>
          <ReceitaPorOrigemPie data={chartData} />
        </div>
        <div className={cardClass}>
          <p className={`${sectionTitleClass} mb-2`}>Vendas e receita por origem</p>
          <p className="mb-2 text-xs text-control-ink/40">
            Número de vendas (fechamentos) e receita de cada origem.
          </p>
          <VendasPorOrigemBar data={chartData} />
        </div>
      </div>

      <div className={cardClass}>
        <p className={`${sectionTitleClass} mb-4`}>Detalhe por origem — {fmtMes(mes)}</p>
        {semVendas ? (
          <EmptyState
            icon={TrendingUp}
            title="Nenhuma venda no mês"
            description="Assim que um lead for marcado como Ganho com receita, a origem aparece aqui."
          />
        ) : (
          <div className={tableWrapClass}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={theadRowClass}>
                  <th className={thClass}>Origem</th>
                  <th className={thClass}>Leads</th>
                  <th className={thClass}>Vendas</th>
                  <th className={thClass}>Receita</th>
                  <th className={thClass}>% faturam.</th>
                  <th className={thClass}>Ticket médio</th>
                  <th className={thClass}>Conv. lead→venda</th>
                  <th className={thClass}>ROAS</th>
                  <th className={thClass}>CAC</th>
                </tr>
              </thead>
              <tbody>
                {tabela.map((o) => (
                  <tr key={o.origem} className={trClass}>
                    <td className={tdClass}>
                      <Badge variant={ORIGEM_VARIANT[o.origem]}>{ORIGEM_LABEL[o.origem]}</Badge>
                    </td>
                    <td className={`${tdClass} tabular-nums`}>{o.leads}</td>
                    <td className={`${tdClass} tabular-nums`}>{o.fechamentos}</td>
                    <td className={`${tdClass} tabular-nums whitespace-nowrap`}>{fmtMoeda(o.receita)}</td>
                    <td className={`${tdClass} tabular-nums`}>{fmtPct(o.pctReceita)}</td>
                    <td className={`${tdClass} tabular-nums whitespace-nowrap`}>{fmtMoeda(o.ticketMedio)}</td>
                    <td className={`${tdClass} tabular-nums`}>{fmtPct(o.convLeadVenda)}</td>
                    <td className={`${tdClass} tabular-nums`}>
                      {o.roas === null ? <span className="text-control-ink/30">—</span> : fmtX(o.roas)}
                    </td>
                    <td className={`${tdClass} tabular-nums whitespace-nowrap`}>
                      {o.cac === null ? <span className="text-control-ink/30">—</span> : fmtMoeda(o.cac)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] text-control-ink/40">
              ROAS e CAC só existem para a mídia paga (as demais origens não têm custo lançado).
            </p>
          </div>
        )}
      </div>

      <div className={cardClass}>
        <p className={`${sectionTitleClass} mb-2`}>Tendência de faturamento por origem (6 meses)</p>
        <p className="mb-4 text-xs text-control-ink/40">
          Como o faturamento de cada origem evoluiu nos últimos meses.
        </p>
        <TendenciaOrigemChart data={tendencia} />
      </div>
    </div>
  );
}
