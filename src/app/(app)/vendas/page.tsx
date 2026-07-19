import {
  Banknote,
  Trophy,
  Receipt,
  PieChart,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Clock,
  Smile,
  Users,
  UserPlus,
  Scale,
  Repeat,
} from "lucide-react";
import {
  getVendasPorOrigem,
  getFinanceiroMensal,
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
  FaturamentoTendenciaChart,
  UnitEconomicsChart,
  type OrigemChartData,
  type TendenciaPonto,
  type FinanceiroPonto,
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

  const [vendas, vendasAnterior, financeiro, financeiroAnterior] = await Promise.all([
    getVendasPorOrigem(inicio, fim),
    getVendasPorOrigem(anterior.inicio, anterior.fim),
    getFinanceiroMensal(mes),
    getFinanceiroMensal(mesAnt),
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

  // Tendência dos indicadores financeiros nos mesmos 6 meses.
  const financeiroMeses = await Promise.all(meses.map((m) => getFinanceiroMensal(m)));
  const financeiroTendencia: FinanceiroPonto[] = meses.map((m, i) => {
    const f = financeiroMeses[i];
    return {
      periodo: fmtMesCurto(m),
      faturamento: f?.faturamento ?? 0,
      cac: f?.cac ?? 0,
      ltv: f?.ltv ?? 0,
      arpa: f?.arpa ?? 0,
      nps: f?.nps ?? 0,
    };
  });

  // Comparação financeira mês a mês (só quando o toggle está ativo).
  const finAnt = comparar ? financeiroAnterior : null;
  const ltvCac = financeiro && financeiro.cac ? financeiro.ltv / financeiro.cac : null;
  const ltvCacAnt =
    finAnt && finAnt.cac ? finAnt.ltv / finAnt.cac : null;

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

      <div className="flex flex-col gap-4">
        <div>
          <p className={`${sectionTitleClass} mb-1`}>Financeiro — {fmtMes(mes)}</p>
          <p className="text-xs text-control-ink/40">
            Aquisição, valor de cliente, retenção e satisfação (lançados na aba Financeiro).
          </p>
        </div>
        {financeiro ? (
          <>
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <KpiCard
                label="Faturamento recorrente"
                value={fmtMoeda(financeiro.faturamento)}
                accent="gold"
                icon={Repeat}
                delta={finAnt ? pctChange(financeiro.faturamento, finAnt.faturamento) : undefined}
                tooltip="MRR/receita recorrente lançada no mês na aba Financeiro."
              />
              <KpiCard
                label="Clientes ativos"
                value={String(financeiro.clientesAtivos)}
                icon={Users}
                delta={finAnt ? pctChange(financeiro.clientesAtivos, finAnt.clientesAtivos) : undefined}
              />
              <KpiCard
                label="Novos clientes"
                value={String(financeiro.novosClientes)}
                icon={UserPlus}
                delta={finAnt ? pctChange(financeiro.novosClientes, finAnt.novosClientes) : undefined}
                tooltip="Leads marcados como Ganho no mês."
              />
              <KpiCard
                label="ARPA"
                value={fmtMoeda(financeiro.arpa)}
                accent="gold"
                icon={CircleDollarSign}
                delta={finAnt ? pctChange(financeiro.arpa, finAnt.arpa) : undefined}
                tooltip="Receita média por cliente ativo (faturamento ÷ clientes ativos)."
              />
            </section>

            <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <KpiCard
                label="CAC"
                value={fmtMoeda(financeiro.cac)}
                accent="gold"
                icon={CircleDollarSign}
                delta={finAnt ? pctChange(financeiro.cac, finAnt.cac) : undefined}
                invertDelta
                tooltip="Custo de aquisição por cliente (mídia + custo comercial ÷ novos clientes)."
              />
              <KpiCard
                label="LTV"
                value={fmtMoeda(financeiro.ltv)}
                accent="gold"
                icon={TrendingUp}
                delta={finAnt ? pctChange(financeiro.ltv, finAnt.ltv) : undefined}
                tooltip="Valor do tempo de vida do cliente (ARPA ÷ churn de logo)."
              />
              <KpiCard
                label="LTV / CAC"
                value={ltvCac === null ? "—" : fmtX(ltvCac)}
                icon={Scale}
                delta={ltvCac !== null && ltvCacAnt ? pctChange(ltvCac, ltvCacAnt) : undefined}
                tooltip="Quanto o cliente retorna sobre o custo de aquisição. Saudável a partir de 3x."
              />
              <KpiCard
                label="Payback CAC"
                value={`${financeiro.paybackMeses.toFixed(1)} meses`}
                icon={Clock}
                delta={finAnt ? pctChange(financeiro.paybackMeses, finAnt.paybackMeses) : undefined}
                invertDelta
                tooltip="Meses para recuperar o CAC (CAC ÷ ARPA)."
              />
            </section>

            <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <KpiCard
                label="Churn logo"
                value={fmtPct(financeiro.churnLogo)}
                icon={TrendingDown}
                delta={finAnt ? pctChange(financeiro.churnLogo, finAnt.churnLogo) : undefined}
                invertDelta
                tooltip="% de clientes perdidos sobre a base do início do mês."
              />
              <KpiCard
                label="Revenue churn"
                value={fmtPct(financeiro.churnReceita)}
                icon={TrendingDown}
                delta={finAnt ? pctChange(financeiro.churnReceita, finAnt.churnReceita) : undefined}
                invertDelta
                tooltip="% de MRR perdido sobre o MRR do início do mês."
              />
              <KpiCard
                label="NRR"
                value={fmtPct(financeiro.nrr)}
                icon={TrendingUp}
                delta={finAnt ? pctChange(financeiro.nrr, finAnt.nrr) : undefined}
                tooltip="Net Revenue Retention: receita retida + expansão da base existente."
              />
              <KpiCard
                label="NPS"
                value={financeiro.nps.toFixed(0)}
                icon={Smile}
                delta={finAnt ? pctChange(financeiro.nps, finAnt.nps) : undefined}
                tooltip="% promotores − % detratores."
              />
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className={cardClass}>
                <p className={`${sectionTitleClass} mb-2`}>Faturamento recorrente (6 meses)</p>
                <p className="mb-2 text-xs text-control-ink/40">
                  Evolução da receita recorrente lançada mês a mês.
                </p>
                <FaturamentoTendenciaChart data={financeiroTendencia} />
              </div>
              <div className={cardClass}>
                <p className={`${sectionTitleClass} mb-2`}>Unit economics — CAC × LTV (6 meses)</p>
                <p className="mb-2 text-xs text-control-ink/40">
                  Quanto mais distante o LTV (verde) do CAC (vermelho), mais saudável.
                </p>
                <UnitEconomicsChart data={financeiroTendencia} />
              </div>
            </div>
          </>
        ) : (
          <div className={cardClass}>
            <EmptyState
              icon={CircleDollarSign}
              title="Sem indicadores financeiros no mês"
              description="Lance faturamento, CAC, LTV, churn e NPS na aba Financeiro para vê-los aqui."
            />
          </div>
        )}
      </div>
    </div>
  );
}
