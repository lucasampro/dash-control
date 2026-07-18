import {
  Users,
  CheckCircle2,
  Tag,
  Wallet,
  CalendarCheck,
  UserX,
  FileText,
  Percent,
  Trophy,
  Banknote,
  Receipt,
  Target,
  CircleDollarSign,
  Clock,
  TrendingUp,
  Smile,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/db";
import {
  getFunilPeriodo,
  getFunilDiario,
  getResumoPeriodo,
  getPorSdr,
  getPorCloser,
  getMotivosNaoFechamento,
  getCriativosPerformance,
  getCriativosRanking,
  getFinanceiroMensal,
  mesParaIntervalo,
  mesAnterior,
  pctChange,
} from "@/lib/metrics";
import { getMesReferencia } from "@/lib/mesReferencia";
import { getCompararMesAnterior } from "@/lib/compararMes";
import { KpiCard } from "@/components/KpiCard";
import { TrendChart, type TrendPoint } from "@/components/TrendChart";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MesSelector } from "@/components/ui/MesSelector";
import { ResumoSelector } from "@/components/ui/ResumoSelector";
import { AutoRefresh } from "@/components/ui/AutoRefresh";
import { sincronizarLeads } from "@/app/(app)/leads/actions";
import { CompararToggle } from "./CompararToggle";
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

function mesesAnteriores(mes: string, quantidade: number) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const lista: string[] = [];
  for (let i = quantidade - 1; i >= 0; i--) {
    const d = new Date(ano, mesNum - 1 - i, 1);
    lista.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return lista;
}

function fmtMoeda(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(v: number) {
  return `${v.toFixed(1)}%`;
}

function fmtX(v: number) {
  return `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}x`;
}

function fmtDataCompleta(d: Date) {
  const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
  return label;
}

/** Resolve o valor do filtro do card "Resumo" (hoje, ontem, 7d, semana ou
 * uma data específica no formato YYYY-MM-DD) no intervalo de datas a
 * consultar e no título a exibir. */
function periodoResumo(valor: string | undefined) {
  const UM_DIA = 24 * 60 * 60 * 1000;
  // "Hoje" tem que ser o dia no fuso de São Paulo, não o do servidor (UTC na
  // Vercel). Pegamos a data atual em SP (YYYY-MM-DD) e fixamos a meia-noite de
  // SP (UTC-3) — senão um lead das 21h de SP (= 00h UTC) vazava pro dia seguinte.
  const hojeSP = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const inicioHoje = new Date(`${hojeSP}T00:00:00-03:00`);
  const fimHoje = new Date(inicioHoje.getTime() + UM_DIA);

  if (valor === "ontem") {
    const inicio = new Date(inicioHoje.getTime() - UM_DIA);
    return { inicio, fim: inicioHoje, titulo: `Resumo de ontem — ${fmtDataCompleta(inicio)}` };
  }

  if (valor === "7d") {
    const inicio = new Date(inicioHoje.getTime() - 6 * UM_DIA);
    return {
      inicio,
      fim: fimHoje,
      titulo: `Resumo dos últimos 7 dias — ${fmtDataCompleta(inicio)} a ${fmtDataCompleta(inicioHoje)}`,
    };
  }

  if (valor === "semana") {
    // Semana começa no domingo (getDay() === 0).
    const diasDesdeDomingo = inicioHoje.getDay();
    const inicio = new Date(inicioHoje.getTime() - diasDesdeDomingo * UM_DIA);
    return {
      inicio,
      fim: fimHoje,
      titulo: `Resumo desta semana — ${fmtDataCompleta(inicio)} a ${fmtDataCompleta(inicioHoje)}`,
    };
  }

  if (valor && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const inicio = new Date(`${valor}T00:00:00-03:00`);
    return { inicio, fim: new Date(inicio.getTime() + UM_DIA), titulo: `Resumo de ${fmtDataCompleta(inicio)}` };
  }

  return { inicio: inicioHoje, fim: fimHoje, titulo: `Resumo de hoje — ${fmtDataCompleta(inicioHoje)}` };
}

function fmtDia(dia: string) {
  return new Date(dia).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "short" });
}

function fmtMes(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const label = new Date(ano, mesNum - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function ProgressBar({ atual, meta }: { atual: number; meta: number }) {
  const pct = meta ? Math.min(100, (atual / meta) * 100) : 0;
  const acima = atual >= meta;
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-control-bg">
      <div
        className={`h-full rounded-full transition-all ${acima ? "bg-control-success-600" : "bg-control-blue-600"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; resumo?: string }>;
}) {
  const params = await searchParams;
  const mes = await getMesReferencia(params.mes);
  const comparar = await getCompararMesAnterior();
  const { inicio, fim } = mesParaIntervalo(mes);
  const mesAnt = mesAnterior(mes);
  const anterior = mesParaIntervalo(mesAnt);
  const resumoValor = params.resumo ?? "hoje";
  const { inicio: resumoInicio, fim: resumoFim, titulo: resumoTitulo } = periodoResumo(params.resumo);

  const [funil, funilAnterior, porSdr, porCloser, motivos, criativos, criativosRanking, financeiro, meta, diario, hoje] =
    await Promise.all([
      getFunilPeriodo(inicio, fim, "PAGO"),
      getFunilPeriodo(anterior.inicio, anterior.fim, "PAGO"),
      getPorSdr(inicio, fim, "PAGO"),
      getPorCloser(inicio, fim, "PAGO"),
      getMotivosNaoFechamento(inicio, fim, "PAGO"),
      getCriativosPerformance(mes, "PAGO"),
      getCriativosRanking(inicio, fim, "PAGO"),
      getFinanceiroMensal(mes),
      prisma.metaMensal.findUnique({ where: { mes } }),
      getFunilDiario(mes, "PAGO"),
      getResumoPeriodo(resumoInicio, resumoFim, "PAGO"),
    ]);

  const meses = mesesAnteriores(mes, 6);
  const trend: TrendPoint[] = [];
  for (const m of meses) {
    const range = mesParaIntervalo(m);
    const f = await getFunilPeriodo(range.inicio, range.fim, "PAGO");
    trend.push({ periodo: m, leadsTotais: f.totalLeads, receitaNova: f.receita });
  }

  const diarioTrend: TrendPoint[] = diario.map((d) => ({
    periodo: String(Number(d.dia.slice(8, 10))),
    leadsTotais: d.totalLeads,
    receitaNova: d.receita,
  }));

  const motivosMax = Math.max(1, ...motivos.map((m) => m.quantidade));

  return (
    <div className="flex flex-col gap-8">
      <AutoRefresh intervalMs={60000} syncAction={sincronizarLeads} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-control-ink">
            {fmtMes(mes)}
          </h1>
          <p className="mt-0.5 text-sm text-control-ink/45">
            Funil, comercial e financeiro da mídia paga. Vendas por origem em Vendas.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <MesSelector mes={mes} redirectTo="/dashboard" />
          <CompararToggle ativo={comparar} mes={mes} />
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={sectionTitleClass}>{resumoTitulo}</p>
          <ResumoSelector
            resumo={resumoValor}
            hoje={new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })}
          />
        </div>
        {hoje.totalLeads === 0 ? (
          <div className="mt-2">
            <EmptyState
              icon={Users}
              title="Nenhum lead no período"
              description="Assim que o primeiro lead entrar, o resumo aparece aqui."
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-control-ink/50">Leads</p>
              <p className="text-2xl font-semibold tabular-nums text-control-ink">{hoje.totalLeads}</p>
            </div>
            <div>
              <p className="text-xs text-control-ink/50">Qualificação</p>
              <p className="text-2xl font-semibold tabular-nums text-control-ink">
                {hoje.qualificados}/{hoje.totalLeads}{" "}
                <span className="text-sm font-normal text-control-ink/40">({fmtPct(hoje.pctQualif)})</span>
              </p>
            </div>
            {hoje.agendados > 0 && (
              <div>
                <p className="text-xs text-control-ink/50">Reuniões agendadas</p>
                <p className="text-2xl font-semibold tabular-nums text-control-ink">{hoje.agendados}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <p className={sectionTitleClass}>Aquisição</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard
            label="Leads totais"
            value={String(funil.totalLeads)}
            icon={Users}
            delta={comparar ? pctChange(funil.totalLeads, funilAnterior.totalLeads) : undefined}
          />
          <KpiCard
            label="Leads qualificados"
            value={String(funil.qualificados)}
            icon={CheckCircle2}
            delta={comparar ? pctChange(funil.qualificados, funilAnterior.qualificados) : undefined}
          />
          <KpiCard
            label="CPL"
            value={fmtMoeda(funil.cpl)}
            accent="gold"
            icon={Tag}
            delta={comparar ? pctChange(funil.cpl, funilAnterior.cpl) : undefined}
            invertDelta
            tooltip={`${fmtMoeda(funil.investimentoTotal)} investidos ÷ ${funil.totalLeads} leads totais`}
          />
          <KpiCard
            label="Invest. mídia"
            value={fmtMoeda(funil.investimentoTotal)}
            accent="gold"
            icon={Wallet}
            delta={comparar ? pctChange(funil.investimentoTotal, funilAnterior.investimentoTotal) : undefined}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className={sectionTitleClass}>Comercial</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard
            label="Reuniões feitas"
            value={String(funil.reunioesFeitas)}
            icon={CalendarCheck}
            delta={comparar ? pctChange(funil.reunioesFeitas, funilAnterior.reunioesFeitas) : undefined}
          />
          <KpiCard
            label="Tx no-show"
            value={fmtPct(funil.txNoShow)}
            icon={UserX}
            delta={comparar ? pctChange(funil.txNoShow, funilAnterior.txNoShow) : undefined}
            invertDelta
            tooltip={`${funil.noShows} de ${funil.reunioesFeitas + funil.noShows} reuniões agendadas`}
          />
          <KpiCard
            label="Propostas"
            value={String(funil.propostas)}
            icon={FileText}
            delta={comparar ? pctChange(funil.propostas, funilAnterior.propostas) : undefined}
          />
          <KpiCard
            label="Win rate"
            value={fmtPct(funil.winRate)}
            icon={Percent}
            delta={comparar ? pctChange(funil.winRate, funilAnterior.winRate) : undefined}
            tooltip={`${funil.fechamentos} fechamentos de ${funil.propostas} propostas`}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className={sectionTitleClass}>Resultado</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard
            label="Fechamentos"
            value={String(funil.fechamentos)}
            icon={Trophy}
            delta={comparar ? pctChange(funil.fechamentos, funilAnterior.fechamentos) : undefined}
          />
          <KpiCard
            label="Receita nova"
            value={fmtMoeda(funil.receita)}
            accent="gold"
            icon={Banknote}
            delta={comparar ? pctChange(funil.receita, funilAnterior.receita) : undefined}
          />
          <KpiCard
            label="Ticket médio"
            value={fmtMoeda(funil.ticketMedio)}
            accent="gold"
            icon={Receipt}
            delta={comparar ? pctChange(funil.ticketMedio, funilAnterior.ticketMedio) : undefined}
            tooltip={`${fmtMoeda(funil.receita)} de receita ÷ ${funil.fechamentos} fechamentos`}
          />
          <KpiCard
            label="CPA"
            value={fmtMoeda(funil.cpa)}
            accent="gold"
            icon={Target}
            delta={comparar ? pctChange(funil.cpa, funilAnterior.cpa) : undefined}
            invertDelta
            tooltip={`${fmtMoeda(funil.investimentoTotal)} investidos ÷ ${funil.fechamentos} fechamentos`}
          />
        </div>
      </section>

      {financeiro && (
        <section className="flex flex-col gap-3">
          <p className={sectionTitleClass}>Financeiro</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard label="CAC" value={fmtMoeda(financeiro.cac)} accent="gold" icon={CircleDollarSign} />
            <KpiCard
              label="Payback CAC"
              value={`${financeiro.paybackMeses.toFixed(1)} meses`}
              icon={Clock}
              tooltip={`CAC (${fmtMoeda(financeiro.cac)}) ÷ ARPA (${fmtMoeda(financeiro.arpa)})`}
            />
            <KpiCard label="NRR" value={fmtPct(financeiro.nrr)} icon={TrendingUp} />
            <KpiCard label="NPS" value={financeiro.nps.toFixed(0)} icon={Smile} />
          </div>
        </section>
      )}

      {meta && (
        <div className={cardClass}>
          <p className={`${sectionTitleClass} mb-4`}>Metas do mês</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-control-ink/50">Leads</p>
                <p className="text-sm font-semibold tabular-nums">
                  {funil.totalLeads} <span className="text-control-ink/35">/ {meta.metaLeads}</span>
                </p>
              </div>
              <ProgressBar atual={funil.totalLeads} meta={meta.metaLeads} />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-control-ink/50">Fechamentos</p>
                <p className="text-sm font-semibold tabular-nums">
                  {funil.fechamentos}{" "}
                  <span className="text-control-ink/35">/ {meta.metaFechamentos}</span>
                </p>
              </div>
              <ProgressBar atual={funil.fechamentos} meta={meta.metaFechamentos} />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-control-ink/50">Receita</p>
                <p className="text-sm font-semibold tabular-nums">
                  {fmtMoeda(funil.receita)}
                  <span className="text-control-ink/35"> / {fmtMoeda(meta.metaReceita)}</span>
                </p>
              </div>
              <ProgressBar atual={funil.receita} meta={meta.metaReceita} />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-control-ink/50">CPL alvo</p>
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    funil.cpl <= meta.metaCplQualificado ? "text-control-success-600" : "text-control-danger-600"
                  }`}
                >
                  {fmtMoeda(funil.cpl)}
                  <span className="text-control-ink/35"> / {fmtMoeda(meta.metaCplQualificado)}</span>
                </p>
              </div>
              <p className="mt-2 text-[11px] text-control-ink/40">
                {funil.cpl <= meta.metaCplQualificado ? "Dentro da meta" : "Acima da meta"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={cardClass}>
        <p className={`${sectionTitleClass} mb-4`}>Tendência (últimos 6 meses)</p>
        <TrendChart data={trend} />
      </div>

      <div className={cardClass}>
        <p className={sectionTitleClass}>Análise diária — {fmtMes(mes)}</p>
        <p className="mb-4 mt-1 text-xs text-control-ink/40">
          Coortes por dia de entrada do lead. Win rate, ROAS e CAC mídia dos dias mais recentes
          ainda podem mudar conforme esses leads avançam no funil.
        </p>
        <TrendChart data={diarioTrend} />
        <div className={`${tableWrapClass} mt-4 max-h-[20rem] overflow-y-auto`}>
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-control-surface">
              <tr className={theadRowClass}>
                <th className={`${thClass} whitespace-nowrap`}>Dia</th>
                <th className={`${thClass} whitespace-nowrap`}>Leads</th>
                <th className={`${thClass} whitespace-nowrap`}>CPL pago</th>
                <th className={`${thClass} whitespace-nowrap`}>CPL qualif.</th>
                <th className={`${thClass} whitespace-nowrap`}>% qualif.</th>
                <th className={`${thClass} whitespace-nowrap`}>Tx agend.</th>
                <th className={`${thClass} whitespace-nowrap`}>Tx reunião feita</th>
                <th className={`${thClass} whitespace-nowrap`}>Tx no-show</th>
                <th className={`${thClass} whitespace-nowrap`}>Tx proposta</th>
                <th className={`${thClass} whitespace-nowrap`}>Conv. lead→cliente</th>
                <th className={`${thClass} whitespace-nowrap`}>Win rate</th>
                <th className={`${thClass} whitespace-nowrap`}>ROAS</th>
                <th className={`${thClass} whitespace-nowrap`}>CAC mídia</th>
              </tr>
            </thead>
            <tbody>
              {diario.map((d) => (
                <tr key={d.dia} className={trClass}>
                  <td className={`${tdClass} whitespace-nowrap font-medium`}>{fmtDia(d.dia)}</td>
                  <td className={`${tdClass} tabular-nums`}>{d.totalLeads}</td>
                  <td className={`${tdClass} tabular-nums whitespace-nowrap`}>{fmtMoeda(d.cplPago)}</td>
                  <td className={`${tdClass} tabular-nums whitespace-nowrap`}>{fmtMoeda(d.cplQualificado)}</td>
                  <td className={`${tdClass} tabular-nums`}>{fmtPct(d.pctQualif)}</td>
                  <td className={`${tdClass} tabular-nums`}>{fmtPct(d.txAgendamento)}</td>
                  <td className={`${tdClass} tabular-nums`}>{fmtPct(d.txReuniaoFeita)}</td>
                  <td className={`${tdClass} tabular-nums`}>{fmtPct(d.txNoShow)}</td>
                  <td className={`${tdClass} tabular-nums`}>{fmtPct(d.txProposta)}</td>
                  <td className={`${tdClass} tabular-nums`}>{fmtPct(d.convLeadCliente)}</td>
                  <td className={`${tdClass} tabular-nums`}>{fmtPct(d.winRate)}</td>
                  <td className={`${tdClass} tabular-nums`}>{fmtX(d.roas)}</td>
                  <td className={`${tdClass} tabular-nums whitespace-nowrap`}>{fmtMoeda(d.cacMidia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {diario.length === 0 && (
            <EmptyState icon={Users} title="Nenhum lead lançado" description="Cadastre leads em Leads para começar a ver a análise diária aqui." />
          )}
        </div>
      </div>

      <div className={cardClass}>
        <p className={`${sectionTitleClass} mb-4`}>Desempenho por SDR</p>
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>SDR</th>
                <th className={thClass}>Leads recebidos</th>
                <th className={thClass}>Leads qualif.</th>
                <th className={thClass}>Agend. totais</th>
                <th className={thClass}>No-shows</th>
                <th className={thClass}>Tx agend. geral</th>
              </tr>
            </thead>
            <tbody>
              {porSdr.map((s) => (
                <tr key={s.id} className={trClass}>
                  <td className={`${tdClass} font-medium`}>{s.nome}</td>
                  <td className={`${tdClass} tabular-nums`}>{s.leadsRecebidos}</td>
                  <td className={`${tdClass} tabular-nums`}>{s.leadsQualifRecebidos}</td>
                  <td className={`${tdClass} tabular-nums`}>{s.agendTotais}</td>
                  <td className={`${tdClass} tabular-nums`}>{s.noShows}</td>
                  <td className={`${tdClass} tabular-nums`}>{fmtPct(s.txAgendGeral)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {porSdr.length === 0 && (
            <EmptyState icon={Users} title="Nenhum SDR cadastrado" description="Cadastre a equipe em Equipe para começar a ver o desempenho aqui." />
          )}
        </div>
      </div>

      <div className={cardClass}>
        <p className={`${sectionTitleClass} mb-4`}>Desempenho por Closer</p>
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Closer</th>
                <th className={thClass}>Reuniões agendadas</th>
                <th className={thClass}>Feitas</th>
                <th className={thClass}>No-shows</th>
                <th className={thClass}>Propostas</th>
                <th className={thClass}>Fechamentos</th>
                <th className={thClass}>Receita</th>
                <th className={thClass}>Win rate</th>
                <th className={thClass}>Ticket médio</th>
              </tr>
            </thead>
            <tbody>
              {porCloser.map((c) => (
                <tr key={c.id} className={trClass}>
                  <td className={`${tdClass} font-medium`}>{c.nome}</td>
                  <td className={`${tdClass} tabular-nums`}>{c.reunioesAgendadas}</td>
                  <td className={`${tdClass} tabular-nums`}>{c.reunioesFeitas}</td>
                  <td className={`${tdClass} tabular-nums`}>{c.noShows}</td>
                  <td className={`${tdClass} tabular-nums`}>{c.propostas}</td>
                  <td className={`${tdClass} tabular-nums`}>{c.fechamentos}</td>
                  <td className={`${tdClass} tabular-nums`}>{fmtMoeda(c.receita)}</td>
                  <td className={`${tdClass} tabular-nums`}>{fmtPct(c.winRate)}</td>
                  <td className={`${tdClass} tabular-nums`}>{fmtMoeda(c.ticketMedio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {porCloser.length === 0 && (
            <EmptyState icon={Trophy} title="Nenhum closer cadastrado" description="Cadastre a equipe em Equipe para começar a ver o desempenho aqui." />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <p className={`${sectionTitleClass} mb-4`}>Motivos de não-fechamento</p>
          <ul className="flex flex-col gap-3">
            {motivos.map((m) => (
              <li key={m.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-control-ink/75">{m.nome}</span>
                  <span className="font-semibold tabular-nums">
                    {m.quantidade} <span className="text-control-ink/40">({fmtPct(m.percentual)})</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-control-bg">
                  <div
                    className="h-full rounded-full bg-control-blue-500"
                    style={{ width: `${(m.quantidade / motivosMax) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={cardClass}>
          <p className={`${sectionTitleClass} mb-4`}>Criativos — {mes}</p>
          <div className={tableWrapClass}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={theadRowClass}>
                  <th className={thClass}>Criativo</th>
                  <th className={thClass}>Invest.</th>
                  <th className={thClass}>Leads</th>
                  <th className={thClass}>Fech.</th>
                  <th className={thClass}>CPL</th>
                  <th className={thClass}>Vencedor</th>
                </tr>
              </thead>
              <tbody>
                {criativos.map((c) => (
                  <tr key={c.id} className={trClass}>
                    <td className={`${tdClass} font-medium`}>{c.nome}</td>
                    <td className={`${tdClass} tabular-nums`}>{fmtMoeda(c.investimento)}</td>
                    <td className={`${tdClass} tabular-nums`}>{c.leads}</td>
                    <td className={`${tdClass} tabular-nums`}>{c.fechamentos}</td>
                    <td className={`${tdClass} tabular-nums`}>{fmtMoeda(c.cpl)}</td>
                    <td className={tdClass}>
                      {c.vencedor ? <Badge variant="gold">Vencedor</Badge> : <span className="text-control-ink/30">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {criativos.length === 0 && (
              <EmptyState icon={Tag} title="Nenhum investimento lançado" description="Lance o investimento do mês em Criativos." />
            )}
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <p className={sectionTitleClass}>Desempenho por Campanha/Anúncio — {fmtMes(mes)}</p>
        <p className="mb-4 mt-1 text-xs text-control-ink/40">
          Quais campanhas, conjuntos e anúncios trazem mais leads e mais
          fechamentos, considerando todos os leads do período (independe de
          ter investimento lançado em Criativos).
        </p>

        {criativosRanking.anuncios.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Nenhum lead com criativo vinculado"
            description="Vincule um criativo (campanha/conjunto/anúncio) ao criar ou editar um lead pra ver o ranking aqui."
          />
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-control-ink/40">
                Por campanha
              </p>
              <div className={tableWrapClass}>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className={theadRowClass}>
                      <th className={thClass}>Campanha</th>
                      <th className={thClass}>Leads</th>
                      <th className={thClass}>Desqualificados</th>
                      <th className={thClass}>Fech.</th>
                      <th className={thClass}>Receita</th>
                      <th className={thClass}>Win rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criativosRanking.campanhas.map((c) => (
                      <tr key={c.nome} className={trClass}>
                        <td className={`${tdClass} font-medium`}>{c.nome}</td>
                        <td className={`${tdClass} tabular-nums`}>{c.leads}</td>
                        <td className={`${tdClass} tabular-nums`}>{c.desqualificados}</td>
                        <td className={`${tdClass} tabular-nums`}>{c.fechamentos}</td>
                        <td className={`${tdClass} tabular-nums`}>{fmtMoeda(c.receita)}</td>
                        <td className={`${tdClass} tabular-nums`}>{fmtPct(c.winRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-control-ink/40">
                Por conjunto
              </p>
              <div className={tableWrapClass}>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className={theadRowClass}>
                      <th className={thClass}>Conjunto</th>
                      <th className={thClass}>Leads</th>
                      <th className={thClass}>Desqualificados</th>
                      <th className={thClass}>Fech.</th>
                      <th className={thClass}>Receita</th>
                      <th className={thClass}>Win rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criativosRanking.conjuntos.map((c) => (
                      <tr key={c.nome} className={trClass}>
                        <td className={`${tdClass} font-medium`}>{c.nome}</td>
                        <td className={`${tdClass} tabular-nums`}>{c.leads}</td>
                        <td className={`${tdClass} tabular-nums`}>{c.desqualificados}</td>
                        <td className={`${tdClass} tabular-nums`}>{c.fechamentos}</td>
                        <td className={`${tdClass} tabular-nums`}>{fmtMoeda(c.receita)}</td>
                        <td className={`${tdClass} tabular-nums`}>{fmtPct(c.winRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-control-ink/40">
                Por anúncio
              </p>
              <div className={tableWrapClass}>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className={theadRowClass}>
                      <th className={thClass}>Anúncio</th>
                      <th className={thClass}>Campanha › Conjunto</th>
                      <th className={thClass}>Leads</th>
                      <th className={thClass}>Desqualificados</th>
                      <th className={thClass}>Fech.</th>
                      <th className={thClass}>Receita</th>
                      <th className={thClass}>Win rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criativosRanking.anuncios.map((a) => (
                      <tr key={a.id} className={trClass}>
                        <td className={`${tdClass} font-medium`}>{a.nome}</td>
                        <td className={`${tdClass} text-control-ink/50`}>
                          {[a.campanha, a.conjunto].filter(Boolean).join(" › ") || "—"}
                        </td>
                        <td className={`${tdClass} tabular-nums`}>{a.leads}</td>
                        <td className={`${tdClass} tabular-nums`}>{a.desqualificados}</td>
                        <td className={`${tdClass} tabular-nums`}>{a.fechamentos}</td>
                        <td className={`${tdClass} tabular-nums`}>{fmtMoeda(a.receita)}</td>
                        <td className={`${tdClass} tabular-nums`}>{fmtPct(a.winRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
