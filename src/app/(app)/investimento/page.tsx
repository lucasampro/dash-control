import { RefreshCw, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { upsertInvestimentoDiario, sincronizarMetaAds } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { MesSelector } from "@/components/ui/MesSelector";
import { getMesReferencia, mesAtual } from "@/lib/mesReferencia";
import { mesParaIntervalo } from "@/lib/metrics";
import { inputClass, labelClass, sectionTitleClass, cardClass, subtleCardClass } from "@/lib/ui";

export const dynamic = "force-dynamic";

function fmtMes(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const label = new Date(ano, mesNum - 1, 1).toLocaleDateString("pt-BR", { month: "long" });
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}/${ano}`;
}

/** Dias do mês selecionado: até hoje se for o mês atual, todos os dias se for um mês passado. */
function diasDoMes(mes: string, inicioMes: Date, fimMes: Date) {
  const hoje = new Date();
  const ehMesAtual = mes === mesAtual();
  const ultimoDia = ehMesAtual ? hoje.getDate() : new Date(fimMes.getTime() - 1).getDate();

  const dias: string[] = [];
  for (let d = 1; d <= ultimoDia; d++) {
    const data = new Date(inicioMes.getFullYear(), inicioMes.getMonth(), d);
    dias.push(data.toISOString().slice(0, 10));
  }
  return dias.reverse();
}

export default async function InvestimentoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const mes = await getMesReferencia(params.mes);
  const { inicio: inicioMes, fim: fimMes } = mesParaIntervalo(mes);

  const registros = await prisma.investimentoDiario.findMany({
    where: { data: { gte: inicioMes, lt: fimMes } },
  });
  const porData = new Map(
    registros.map((r) => [r.data.toISOString().slice(0, 10), r.valor])
  );

  const dias = diasDoMes(mes, inicioMes, fimMes);
  const totalMes = registros.reduce((acc, r) => acc + r.valor, 0);
  const mediaDiaria = registros.length ? totalMes / registros.length : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-control-ink">
            Investimento diário em mídia
          </h1>
          <p className="mt-0.5 text-sm text-control-ink/45">
            Lance o valor investido em mídia paga a cada dia do mês.
          </p>
          <div className="mt-3">
            <MesSelector mes={mes} redirectTo="/investimento" />
          </div>
          <form action={sincronizarMetaAds} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="mes" value={mes} />
            <SubmitButton
              variant="secondary"
              savingLabel="Sincronizando..."
              savedLabel="Sincronizado"
            >
              <RefreshCw className="size-4" />
              Sincronizar {fmtMes(mes)}
            </SubmitButton>
          </form>
        </div>
        <div className="flex gap-3">
          <div className={`${cardClass} px-4 py-3 text-right`}>
            <p className={sectionTitleClass}>Total do mês</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-control-blue-600">
              R$ {totalMes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className={`${cardClass} px-4 py-3 text-right`}>
            <p className={sectionTitleClass}>Média diária</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-control-ink">
              R$ {mediaDiaria.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex flex-col gap-2">
          {dias.map((dia) => (
            <form
              key={dia}
              action={upsertInvestimentoDiario}
              className={`${subtleCardClass} flex flex-wrap items-end gap-3`}
            >
              <input type="hidden" name="data" value={dia} />
              <div className="w-28 shrink-0">
                <span className={labelClass}>Data</span>
                <p className="text-sm font-medium">
                  {new Date(dia).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "short" })}
                </p>
              </div>
              <div className="w-40">
                <label className={labelClass}>Investimento (R$)</label>
                <input
                  type="number"
                  name="valor"
                  step="0.01"
                  min="0"
                  defaultValue={porData.get(dia) ?? ""}
                  className={inputClass}
                />
              </div>
              <SubmitButton variant="secondary">Salvar</SubmitButton>
            </form>
          ))}
          {dias.length === 0 && (
            <p className="py-4 text-center text-sm text-control-ink/40">
              <Wallet className="mx-auto mb-2 size-5" /> Sem dias disponíveis este mês.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
