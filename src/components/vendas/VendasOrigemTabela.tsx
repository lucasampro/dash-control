"use client";

import { useState } from "react";
import Link from "next/link";
import { X, TrendingUp, ChevronRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ORIGEM_LABEL, ORIGEM_VARIANT } from "@/lib/status";
import {
  sectionTitleClass,
  cardClass,
  subtleCardClass,
  ghostButtonClass,
  tableWrapClass,
  theadRowClass,
  thClass,
  trClass,
  tdClass,
} from "@/lib/ui";

export type VendaLeadResumo = {
  id: string;
  nome: string;
  dataLabel: string;
  horaLabel: string;
  receita: number;
  sdr: string | null;
  closer: string | null;
  criativoNome: string | null;
  campanha: string | null;
  conjunto: string | null;
  telefone: string | null;
  email: string | null;
};

export type LinhaOrigem = {
  origem: string;
  leads: number;
  fechamentos: number;
  receita: number;
  ticketMedio: number;
  convLeadVenda: number;
  pctReceita: number;
  roas: number | null;
  cac: number | null;
};

function fmtMoeda(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(v: number) {
  return `${v.toFixed(1)}%`;
}

function fmtX(v: number) {
  return `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}x`;
}

export function VendasOrigemTabela({
  mesLabel,
  tabela,
  leadsPorOrigem,
  semVendas,
}: {
  mesLabel: string;
  tabela: LinhaOrigem[];
  leadsPorOrigem: Record<string, VendaLeadResumo[]>;
  semVendas: boolean;
}) {
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const leadsSelecionados = selecionada ? leadsPorOrigem[selecionada] ?? [] : [];

  return (
    <div className={cardClass}>
      <p className={`${sectionTitleClass} mb-1`}>Detalhe por origem — {mesLabel}</p>
      <p className="mb-4 text-xs text-control-ink/40">
        Clique em uma origem com vendas para ver os leads que fecharam.
      </p>
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
              {tabela.map((o) => {
                const clicavel = o.fechamentos > 0;
                return (
                  <tr
                    key={o.origem}
                    className={`${trClass} ${clicavel ? "cursor-pointer hover:bg-control-blue-50/40" : ""}`}
                    onClick={clicavel ? () => setSelecionada(o.origem) : undefined}
                    title={clicavel ? "Ver leads que fecharam" : undefined}
                  >
                    <td className={tdClass}>
                      <span className="inline-flex items-center gap-1.5">
                        <Badge variant={ORIGEM_VARIANT[o.origem]}>{ORIGEM_LABEL[o.origem]}</Badge>
                        {clicavel && <ChevronRight className="size-3.5 text-control-ink/30" />}
                      </span>
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
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-control-ink/40">
            ROAS e CAC só existem para a mídia paga (as demais origens não têm custo lançado).
          </p>
        </div>
      )}

      {selecionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-control-ink/40 p-4"
          onClick={() => setSelecionada(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-control-line bg-control-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-control-line p-5">
              <div className="flex items-center gap-2">
                <Badge variant={ORIGEM_VARIANT[selecionada]}>{ORIGEM_LABEL[selecionada]}</Badge>
                <p className="text-sm font-semibold text-control-ink">
                  {leadsSelecionados.length} venda{leadsSelecionados.length === 1 ? "" : "s"} — {mesLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelecionada(null)}
                className="rounded-full p-1 text-control-ink/40 transition hover:bg-control-bg hover:text-control-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto p-5">
              {leadsSelecionados.length === 0 ? (
                <p className="text-sm text-control-ink/45">Nenhuma venda nesta origem.</p>
              ) : (
                leadsSelecionados.map((lead) => (
                  <div key={lead.id} className={`${subtleCardClass} flex flex-col gap-2`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-control-ink">{lead.nome}</p>
                        <p className="text-xs text-control-ink/45">
                          {lead.dataLabel} · {lead.horaLabel}
                        </p>
                      </div>
                      <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-control-gold-600">
                        {fmtMoeda(lead.receita)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-control-ink/60 sm:grid-cols-3">
                      <p>
                        <span className="text-control-ink/40">SDR:</span> {lead.sdr ?? "—"}
                      </p>
                      <p>
                        <span className="text-control-ink/40">Closer:</span> {lead.closer ?? "—"}
                      </p>
                      <p>
                        <span className="text-control-ink/40">Telefone:</span> {lead.telefone ?? "—"}
                      </p>
                      {lead.email && (
                        <p className="col-span-2 truncate sm:col-span-3" title={lead.email}>
                          <span className="text-control-ink/40">E-mail:</span> {lead.email}
                        </p>
                      )}
                      {lead.criativoNome && (
                        <p className="col-span-2 truncate sm:col-span-3" title={lead.criativoNome}>
                          <span className="text-control-ink/40">Anúncio:</span> {lead.criativoNome}
                        </p>
                      )}
                      {lead.campanha && (
                        <p className="col-span-2 truncate sm:col-span-3" title={lead.campanha}>
                          <span className="text-control-ink/40">Campanha:</span> {lead.campanha}
                        </p>
                      )}
                    </div>

                    <div>
                      <Link
                        href={`/leads/${lead.id}`}
                        className={`${ghostButtonClass} whitespace-nowrap`}
                      >
                        Ver detalhes do lead
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
