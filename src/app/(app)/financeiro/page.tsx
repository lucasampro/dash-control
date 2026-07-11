import { CircleDollarSign, Clock, Smile, TrendingDown, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db";
import { getFinanceiroMensal } from "@/lib/metrics";
import { getMesReferencia } from "@/lib/mesReferencia";
import { upsertMetricaMensal, upsertMetaMensal } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { MesSelector } from "@/components/ui/MesSelector";
import { inputClass, labelClass, sectionTitleClass, cardClass } from "@/lib/ui";
import { KpiCard } from "@/components/KpiCard";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const mes = await getMesReferencia(params.mes);

  const [metrica, meta, financeiro] = await Promise.all([
    prisma.metricaMensal.findUnique({ where: { mes } }),
    prisma.metaMensal.findUnique({ where: { mes } }),
    getFinanceiroMensal(mes),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-control-ink">Financeiro</h1>
          <p className="mt-0.5 text-sm text-control-ink/45">
            Métricas operacionais e metas mensais.
          </p>
        </div>
        <MesSelector mes={mes} redirectTo="/financeiro" />
      </div>

      {financeiro ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard label="CAC" value={`R$ ${financeiro.cac.toFixed(2)}`} accent="gold" icon={CircleDollarSign} />
          <KpiCard label="ARPA" value={`R$ ${financeiro.arpa.toFixed(2)}`} accent="gold" icon={CircleDollarSign} />
          <KpiCard label="LTV" value={`R$ ${financeiro.ltv.toFixed(2)}`} accent="gold" icon={TrendingUp} />
          <KpiCard label="Payback CAC" value={`${financeiro.paybackMeses.toFixed(1)} meses`} icon={Clock} />
          <KpiCard label="Churn logo" value={`${financeiro.churnLogo.toFixed(1)}%`} icon={TrendingDown} />
          <KpiCard label="Revenue churn" value={`${financeiro.churnReceita.toFixed(1)}%`} icon={TrendingDown} />
          <KpiCard label="NRR" value={`${financeiro.nrr.toFixed(1)}%`} icon={TrendingUp} />
          <KpiCard label="NPS" value={financeiro.nps.toFixed(0)} icon={Smile} />
        </div>
      ) : (
        <div className={`${cardClass} text-center text-sm text-control-ink/45`}>
          Lance as métricas operacionais abaixo para calcular os indicadores financeiros deste mês.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <p className={`${sectionTitleClass} mb-4`}>Métricas mensais de operação — {mes}</p>
          <form action={upsertMetricaMensal} className="grid grid-cols-2 gap-3">
            <input type="hidden" name="mes" value={mes} />

            <div>
              <label className={labelClass}>Custo comercial (R$)</label>
              <input
                type="number" step="0.01" name="custoComercial"
                defaultValue={metrica?.custoComercial ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Faturamento (R$)</label>
              <input
                type="number" step="0.01" name="faturamento"
                defaultValue={metrica?.faturamento ?? ""}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Logos início</label>
              <input
                type="number" name="logosInicio"
                defaultValue={metrica?.logosInicio ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Logos perdidos</label>
              <input
                type="number" name="logosPerdidos"
                defaultValue={metrica?.logosPerdidos ?? ""}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>MRR início (R$)</label>
              <input
                type="number" step="0.01" name="mrrInicio"
                defaultValue={metrica?.mrrInicio ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>MRR perdido (R$)</label>
              <input
                type="number" step="0.01" name="mrrPerdido"
                defaultValue={metrica?.mrrPerdido ?? ""}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>MRR expansão (R$)</label>
              <input
                type="number" step="0.01" name="mrrExpansao"
                defaultValue={metrica?.mrrExpansao ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Clientes ativos</label>
              <input
                type="number" name="clientesAtivos"
                defaultValue={metrica?.clientesAtivos ?? ""}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Promotores (NPS)</label>
              <input
                type="number" name="promotores"
                defaultValue={metrica?.promotores ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Neutros (NPS)</label>
              <input
                type="number" name="neutros"
                defaultValue={metrica?.neutros ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Detratores (NPS)</label>
              <input
                type="number" name="detratores"
                defaultValue={metrica?.detratores ?? ""}
                className={inputClass}
              />
            </div>

            <div className="col-span-2 mt-2">
              <SubmitButton>Salvar métricas</SubmitButton>
            </div>
          </form>
        </div>

        <div className={cardClass}>
          <p className={`${sectionTitleClass} mb-4`}>Metas do mês — {mes}</p>
          <form action={upsertMetaMensal} className="grid grid-cols-2 gap-3">
            <input type="hidden" name="mes" value={mes} />

            <div>
              <label className={labelClass}>Meta de leads</label>
              <input
                type="number" name="metaLeads"
                defaultValue={meta?.metaLeads ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Meta de fechamentos</label>
              <input
                type="number" name="metaFechamentos"
                defaultValue={meta?.metaFechamentos ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Meta de receita (R$)</label>
              <input
                type="number" step="0.01" name="metaReceita"
                defaultValue={meta?.metaReceita ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Meta CPL qualificado (R$)</label>
              <input
                type="number" step="0.01" name="metaCplQualificado"
                defaultValue={meta?.metaCplQualificado ?? ""}
                className={inputClass}
              />
            </div>

            <div className="col-span-2 mt-2">
              <SubmitButton>Salvar metas</SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
