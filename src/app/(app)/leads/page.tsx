import Link from "next/link";
import { Plus, Target, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { mesParaIntervalo } from "@/lib/metrics";
import { getMesReferencia } from "@/lib/mesReferencia";
import { MesSelector } from "@/components/ui/MesSelector";
import { AutoRefresh } from "@/components/ui/AutoRefresh";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { LeadDetailsModal } from "@/components/ui/LeadDetailsModal";
import { InlineBadgeSelect } from "@/components/ui/InlineBadgeSelect";
import {
  sincronizarLeads,
  updateReuniaoStatus,
  updateQualificado,
  updateResultado,
} from "./actions";
import {
  RESULTADO_LABEL,
  RESULTADO_VARIANT,
  REUNIAO_LABEL,
  REUNIAO_VARIANT,
  ORIGEM_LABEL,
} from "@/lib/status";
import {
  cardClass,
  primaryButtonClass,
  ghostButtonClass,
  inputClass,
  labelClass,
  tableWrapClass,
  theadRowClass,
  thClass,
  trClass,
  tdClass,
} from "@/lib/ui";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const REUNIAO_OPTIONS = Object.entries(REUNIAO_LABEL).map(([value, label]) => ({
  value,
  label,
  variant: REUNIAO_VARIANT[value],
}));

const RESULTADO_OPTIONS = Object.entries(RESULTADO_LABEL).map(([value, label]) => ({
  value,
  label,
  variant: RESULTADO_VARIANT[value],
}));

const QUALIFICADO_OPTIONS = [
  { value: "", label: "—", variant: "neutral" as const },
  { value: "true", label: "Qualificado", variant: "success" as const },
  { value: "false", label: "Desqualificado", variant: "danger" as const },
];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    sdrId?: string;
    closerId?: string;
    origem?: string;
    resultado?: string;
    page?: string;
    mes?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const mes = await getMesReferencia(params.mes);
  const { inicio, fim } = mesParaIntervalo(mes);

  const where = {
    data: { gte: inicio, lt: fim },
    ...(params.sdrId ? { sdrId: params.sdrId } : {}),
    ...(params.closerId ? { closerId: params.closerId } : {}),
    ...(params.origem ? { origem: params.origem as "PAGO" | "ORGANICO" } : {}),
    ...(params.resultado
      ? { resultado: params.resultado as "EM_ANDAMENTO" | "GANHO" | "PERDIDO" }
      : {}),
  };

  const [leads, total, sdrs, closers] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { data: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { sdr: true, closer: true, criativo: true },
    }),
    prisma.lead.count({ where }),
    prisma.teamMember.findMany({ where: { role: "SDR" }, orderBy: { nome: "asc" } }),
    prisma.teamMember.findMany({ where: { role: "CLOSER" }, orderBy: { nome: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (params.sdrId) sp.set("sdrId", params.sdrId);
    if (params.closerId) sp.set("closerId", params.closerId);
    if (params.origem) sp.set("origem", params.origem);
    if (params.resultado) sp.set("resultado", params.resultado);
    sp.set("mes", mes);
    sp.set("page", String(p));
    return `/leads?${sp.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-control-ink">Leads</h1>
          <p className="mt-0.5 text-sm text-control-ink/45">
            {total} lead{total === 1 ? "" : "s"} em {mes}.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <MesSelector mes={mes} redirectTo="/leads" />
          <form action={sincronizarLeads}>
            <SubmitButton
              variant="secondary"
              savingLabel="Sincronizando..."
              savedLabel="Sincronizado"
            >
              <RefreshCw className="size-4" />
              Sincronizar
            </SubmitButton>
          </form>
          <Link href="/leads/novo" className={primaryButtonClass}>
            <Plus className="size-4" />
            Novo lead
          </Link>
        </div>
      </div>

      <form className={`${cardClass} flex flex-wrap items-end gap-3`} method="GET">
        <input type="hidden" name="mes" value={mes} />
        <div className="min-w-[9rem]">
          <label className={labelClass}>SDR</label>
          <select name="sdrId" defaultValue={params.sdrId ?? ""} className={inputClass}>
            <option value="">Todos</option>
            {sdrs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[9rem]">
          <label className={labelClass}>Closer</label>
          <select name="closerId" defaultValue={params.closerId ?? ""} className={inputClass}>
            <option value="">Todos</option>
            {closers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[9rem]">
          <label className={labelClass}>Origem</label>
          <select name="origem" defaultValue={params.origem ?? ""} className={inputClass}>
            <option value="">Todas</option>
            <option value="PAGO">Pago</option>
            <option value="ORGANICO">Orgânico</option>
          </select>
        </div>
        <div className="min-w-[9rem]">
          <label className={labelClass}>Resultado</label>
          <select name="resultado" defaultValue={params.resultado ?? ""} className={inputClass}>
            <option value="">Todos</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="GANHO">Ganho</option>
            <option value="PERDIDO">Perdido</option>
          </select>
        </div>
        <button type="submit" className={primaryButtonClass}>
          Filtrar
        </button>
        {(params.sdrId || params.closerId || params.origem || params.resultado) && (
          <Link href={`/leads?mes=${mes}`} className={ghostButtonClass}>
            Limpar filtros
          </Link>
        )}
      </form>

      <div className={cardClass}>
        {/* Tabela — telas médias e maiores */}
        <div className={`hidden sm:block ${tableWrapClass}`}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Data</th>
                <th className={thClass}>Origem</th>
                <th className={thClass}>Criativo</th>
                <th className={thClass}>SDR</th>
                <th className={thClass}>Reunião</th>
                <th className={thClass}>Qualificação</th>
                <th className={thClass}>Resultado</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className={trClass}>
                  <td className={`${tdClass} tabular-nums`}>
                    {lead.data.toLocaleDateString("pt-BR")}
                  </td>
                  <td className={tdClass}>{ORIGEM_LABEL[lead.origem]}</td>
                  <td className={tdClass}>{lead.criativo?.nome ?? "—"}</td>
                  <td className={tdClass}>{lead.sdr?.nome ?? "—"}</td>
                  <td className={tdClass}>
                    <InlineBadgeSelect
                      value={lead.reuniaoStatus}
                      options={REUNIAO_OPTIONS}
                      action={updateReuniaoStatus.bind(null, lead.id)}
                    />
                  </td>
                  <td className={tdClass}>
                    <InlineBadgeSelect
                      value={lead.qualificado === true ? "true" : lead.qualificado === false ? "false" : ""}
                      options={QUALIFICADO_OPTIONS}
                      action={updateQualificado.bind(null, lead.id)}
                    />
                  </td>
                  <td className={tdClass}>
                    <InlineBadgeSelect
                      value={lead.resultado}
                      options={RESULTADO_OPTIONS}
                      action={updateResultado.bind(null, lead.id)}
                    />
                  </td>
                  <td className={tdClass}>
                    <div className="flex items-center gap-1">
                      <Link href={`/leads/${lead.id}`} className={ghostButtonClass}>
                        Editar
                      </Link>
                      <LeadDetailsModal
                        campanha={lead.criativo?.campanha ?? null}
                        conjunto={lead.criativo?.conjunto ?? null}
                        criativoNome={lead.criativo?.nome ?? null}
                        dadosFormulario={lead.dadosFormulario as Record<string, string> | null}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <ul className="flex flex-col gap-2 sm:hidden">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Link
                href={`/leads/${lead.id}`}
                className="flex flex-col gap-2 rounded-xl border border-control-line p-3 transition hover:bg-control-blue-50/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{lead.data.toLocaleDateString("pt-BR")}</span>
                  <Badge variant={RESULTADO_VARIANT[lead.resultado]}>
                    {RESULTADO_LABEL[lead.resultado]}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-control-ink/50">
                  <span>{ORIGEM_LABEL[lead.origem]}</span>
                  <span>·</span>
                  <span>SDR: {lead.sdr?.nome ?? "—"}</span>
                  <span>·</span>
                  <span>Closer: {lead.closer?.nome ?? "—"}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {leads.length === 0 && (
          <EmptyState
            icon={Target}
            title="Nenhum lead encontrado"
            description="Ajuste os filtros ou cadastre um novo lead."
          />
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-control-line pt-4">
            <p className="text-xs text-control-ink/45">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Link
                href={pageHref(Math.max(1, page - 1))}
                className={`${ghostButtonClass} ${page <= 1 ? "pointer-events-none opacity-30" : ""}`}
              >
                <ChevronLeft className="size-4" />
                Anterior
              </Link>
              <Link
                href={pageHref(Math.min(totalPages, page + 1))}
                className={`${ghostButtonClass} ${page >= totalPages ? "pointer-events-none opacity-30" : ""}`}
              >
                Próxima
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
