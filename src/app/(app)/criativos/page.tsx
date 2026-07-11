import { Sparkles, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { createCriativo, upsertCriativoMensal } from "./actions";
import { EmptyState } from "@/components/ui/EmptyState";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { MesSelector } from "@/components/ui/MesSelector";
import { getMesReferencia } from "@/lib/mesReferencia";
import { inputClass, labelClass, sectionTitleClass, cardClass, subtleCardClass } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function CriativosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const mes = await getMesReferencia(params.mes);

  const criativos = await prisma.criativo.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    include: {
      investimentos: { where: { mes } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-control-ink">Criativos</h1>
          <p className="mt-0.5 text-sm text-control-ink/45">
            Cadastre os criativos e lance o investimento mensal de cada um.
          </p>
        </div>
        <MesSelector mes={mes} redirectTo="/criativos" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={`${cardClass} lg:col-span-1`}>
          <p className={`${sectionTitleClass} mb-4`}>Novo criativo</p>
          <form action={createCriativo} className="flex flex-col gap-3">
            <div>
              <label className={labelClass} htmlFor="nome">
                Nome
              </label>
              <input
                id="nome"
                name="nome"
                required
                className={inputClass}
                placeholder="Ex: Depoimento_Joao"
              />
            </div>
            <SubmitButton>
              <Plus className="size-4" />
              Adicionar
            </SubmitButton>
          </form>
        </div>

        <div className={`${cardClass} lg:col-span-2`}>
          <p className={`${sectionTitleClass} mb-4`}>Investimento do mês ({mes})</p>
          <div className="flex flex-col gap-3">
            {criativos.map((c) => {
              const atual = c.investimentos[0];
              return (
                <form
                  key={c.id}
                  action={upsertCriativoMensal}
                  className={`${subtleCardClass} flex flex-wrap items-end gap-3`}
                >
                  <input type="hidden" name="criativoId" value={c.id} />
                  <input type="hidden" name="mes" value={mes} />
                  <div className="min-w-[10rem] flex-1">
                    <span className={labelClass}>Criativo</span>
                    <p className="text-sm font-medium">{c.nome}</p>
                  </div>
                  <div className="w-36">
                    <label className={labelClass}>Investimento (R$)</label>
                    <input
                      type="number"
                      name="investimento"
                      step="0.01"
                      min="0"
                      defaultValue={atual?.investimento ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <label className="flex items-center gap-2 pb-2 text-xs font-medium text-control-ink/70">
                    <input
                      type="checkbox"
                      name="vencedor"
                      defaultChecked={atual?.vencedor ?? false}
                      className="size-4 rounded accent-control-gold-500"
                    />
                    Vencedor?
                  </label>
                  <SubmitButton variant="secondary">Salvar</SubmitButton>
                </form>
              );
            })}
            {criativos.length === 0 && (
              <EmptyState
                icon={Sparkles}
                title="Nenhum criativo cadastrado"
                description="Adicione o primeiro criativo ao lado para começar a lançar investimento."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
