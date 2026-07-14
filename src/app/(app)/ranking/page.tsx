import { Trophy, CalendarDays, Sparkles, Users, Handshake } from "lucide-react";
import {
  getFunilDiario,
  getCriativosRanking,
  getPorSdr,
  getPorCloser,
  mesParaIntervalo,
} from "@/lib/metrics";
import { getMesReferencia } from "@/lib/mesReferencia";
import { MesSelector } from "@/components/ui/MesSelector";
import { AutoRefresh } from "@/components/ui/AutoRefresh";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  cardClass,
  sectionTitleClass,
  tableWrapClass,
  theadRowClass,
  thClass,
  trClass,
  tdClass,
} from "@/lib/ui";

export const dynamic = "force-dynamic";

function fmtPct(v: number) {
  return `${v.toFixed(1)}%`;
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

function Posicao({ pos }: { pos: number }) {
  return <span className="tabular-nums text-control-ink/40">{pos}º</span>;
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const mes = await getMesReferencia(params.mes);
  const { inicio, fim } = mesParaIntervalo(mes);

  const [diario, criativosRanking, porSdr, porCloser] = await Promise.all([
    getFunilDiario(mes),
    getCriativosRanking(inicio, fim),
    getPorSdr(inicio, fim),
    getPorCloser(inicio, fim),
  ]);

  // Ranking de dias: só dias que tiveram lead, ordenados por quantidade de
  // leads qualificados (combina volume e qualidade — proporcional aos dois).
  const diasRanking = diario
    .filter((d) => d.totalLeads > 0)
    .sort((a, b) => b.qualificados - a.qualificados || b.totalLeads - a.totalLeads);

  // Ranking de criativos: mesma lógica, por anúncio.
  const anunciosRanking = [...criativosRanking.anuncios].sort(
    (a, b) => b.qualificados - a.qualificados || b.leads - a.leads
  );

  // Ranking de SDR: quem converte melhor (taxa de agendamento), não só quem
  // recebeu mais leads.
  const sdrRanking = [...porSdr].sort(
    (a, b) => b.txAgendGeral - a.txAgendGeral || b.leadsRecebidos - a.leadsRecebidos
  );

  // Ranking de Closer: melhor win rate, não só quem fechou mais em número
  // absoluto.
  const closerRanking = [...porCloser].sort(
    (a, b) => b.winRate - a.winRate || b.fechamentos - a.fechamentos
  );

  return (
    <div className="flex flex-col gap-8">
      <AutoRefresh />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-control-ink">Ranking</h1>
          <p className="mt-0.5 text-sm text-control-ink/45">
            Os melhores dias, criativos, SDRs e closers de {fmtMes(mes)}.
          </p>
        </div>
        <MesSelector mes={mes} redirectTo="/ranking" />
      </div>

      <div className={cardClass}>
        <p className={sectionTitleClass}>Ranking de dias</p>
        <p className="mb-4 mt-1 text-xs text-control-ink/40">
          Ordenado por quantidade de leads qualificados no dia (volume × qualificação).
        </p>
        {diasRanking.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Nenhum lead no período" description="Cadastre leads em Leads para ver o ranking de dias aqui." />
        ) : (
          <div className={`${tableWrapClass} max-h-[24rem] overflow-y-auto`}>
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-control-surface">
                <tr className={theadRowClass}>
                  <th className={thClass}>#</th>
                  <th className={thClass}>Dia</th>
                  <th className={thClass}>Leads</th>
                  <th className={thClass}>Qualificados</th>
                  <th className={thClass}>% Qualif.</th>
                  <th className={thClass}>Fech.</th>
                </tr>
              </thead>
              <tbody>
                {diasRanking.map((d, i) => (
                  <tr key={d.dia} className={trClass}>
                    <td className={tdClass}>
                      <Posicao pos={i + 1} />
                    </td>
                    <td className={`${tdClass} font-medium whitespace-nowrap`}>{fmtDia(d.dia)}</td>
                    <td className={`${tdClass} tabular-nums`}>{d.totalLeads}</td>
                    <td className={`${tdClass} tabular-nums`}>{d.qualificados}</td>
                    <td className={`${tdClass} tabular-nums`}>{fmtPct(d.pctQualif)}</td>
                    <td className={`${tdClass} tabular-nums`}>{d.fechamentos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={cardClass}>
        <p className={sectionTitleClass}>Ranking de criativos</p>
        <p className="mb-4 mt-1 text-xs text-control-ink/40">
          Anúncios ordenados por quantidade de leads qualificados que trouxeram.
        </p>
        {anunciosRanking.length === 0 ? (
          <EmptyState icon={Sparkles} title="Nenhum lead com criativo vinculado" description="Vincule um criativo ao criar ou editar um lead pra ver o ranking aqui." />
        ) : (
          <div className={tableWrapClass}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={theadRowClass}>
                  <th className={thClass}>#</th>
                  <th className={thClass}>Anúncio</th>
                  <th className={thClass}>Campanha › Conjunto</th>
                  <th className={thClass}>Leads</th>
                  <th className={thClass}>Qualificados</th>
                  <th className={thClass}>% Qualif.</th>
                  <th className={thClass}>Fech.</th>
                </tr>
              </thead>
              <tbody>
                {anunciosRanking.map((a, i) => (
                  <tr key={a.id} className={trClass}>
                    <td className={tdClass}>
                      <Posicao pos={i + 1} />
                    </td>
                    <td className={`${tdClass} font-medium`}>{a.nome}</td>
                    <td className={`${tdClass} text-control-ink/50`}>
                      {[a.campanha, a.conjunto].filter(Boolean).join(" › ") || "—"}
                    </td>
                    <td className={`${tdClass} tabular-nums`}>{a.leads}</td>
                    <td className={`${tdClass} tabular-nums`}>{a.qualificados}</td>
                    <td className={`${tdClass} tabular-nums`}>{fmtPct((a.qualificados / (a.leads || 1)) * 100)}</td>
                    <td className={`${tdClass} tabular-nums`}>{a.fechamentos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <p className={sectionTitleClass}>Ranking de SDR</p>
          <p className="mb-4 mt-1 text-xs text-control-ink/40">
            Ordenado pela taxa de agendamento — quem converte melhor os leads que recebe.
          </p>
          {sdrRanking.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum SDR cadastrado" description="Cadastre a equipe em Equipe para ver o ranking aqui." />
          ) : (
            <div className={tableWrapClass}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={theadRowClass}>
                    <th className={thClass}>#</th>
                    <th className={thClass}>SDR</th>
                    <th className={thClass}>Leads</th>
                    <th className={thClass}>Agend.</th>
                    <th className={thClass}>Tx agend.</th>
                  </tr>
                </thead>
                <tbody>
                  {sdrRanking.map((s, i) => (
                    <tr key={s.id} className={trClass}>
                      <td className={tdClass}>
                        <Posicao pos={i + 1} />
                      </td>
                      <td className={`${tdClass} font-medium`}>{s.nome}</td>
                      <td className={`${tdClass} tabular-nums`}>{s.leadsRecebidos}</td>
                      <td className={`${tdClass} tabular-nums`}>{s.agendTotais}</td>
                      <td className={`${tdClass} tabular-nums`}>{fmtPct(s.txAgendGeral)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={cardClass}>
          <p className={sectionTitleClass}>Ranking de Closer</p>
          <p className="mb-4 mt-1 text-xs text-control-ink/40">
            Ordenado por win rate — quem fecha proporcionalmente melhor.
          </p>
          {closerRanking.length === 0 ? (
            <EmptyState icon={Handshake} title="Nenhum closer cadastrado" description="Cadastre a equipe em Equipe para ver o ranking aqui." />
          ) : (
            <div className={tableWrapClass}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={theadRowClass}>
                    <th className={thClass}>#</th>
                    <th className={thClass}>Closer</th>
                    <th className={thClass}>Reuniões feitas</th>
                    <th className={thClass}>Fech.</th>
                    <th className={thClass}>Win rate</th>
                  </tr>
                </thead>
                <tbody>
                  {closerRanking.map((c, i) => (
                    <tr key={c.id} className={trClass}>
                      <td className={tdClass}>
                        <Posicao pos={i + 1} />
                      </td>
                      <td className={`${tdClass} font-medium`}>{c.nome}</td>
                      <td className={`${tdClass} tabular-nums`}>{c.reunioesFeitas}</td>
                      <td className={`${tdClass} tabular-nums`}>{c.fechamentos}</td>
                      <td className={`${tdClass} tabular-nums`}>{fmtPct(c.winRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
