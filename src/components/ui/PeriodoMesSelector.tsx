"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

/** Filtro de período (data inicial → final) que recorta o painel INTEIRO para um
 * subintervalo dentro do mês selecionado no MesSelector. Diferente do
 * ResumoSelector (que só afeta o card "Resumo"), este estreita os KPIs, os
 * desempenhos por SDR/Closer, os motivos e o ranking de criativos. Os cards
 * mensais (Metas, Financeiro, tendência) continuam no mês cheio. Limpar o
 * período (X) volta ao mês inteiro. */
export function PeriodoMesSelector({
  min,
  max,
  de: deInit,
  ate: ateInit,
}: {
  min: string;
  max: string;
  de: string;
  ate: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [de, setDe] = useState(deInit);
  const [ate, setAte] = useState(ateInit);
  const ativo = Boolean(deInit && ateInit);

  function aplicar(novoDe: string, novoAte: string) {
    if (!novoDe || !novoAte) return;
    const [ini, fim] = novoDe <= novoAte ? [novoDe, novoAte] : [novoAte, novoDe];
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", ini === fim ? ini : `${ini}_${fim}`);
    router.push(`${pathname}?${params.toString()}`);
  }

  function limpar() {
    setDe("");
    setAte("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("periodo");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const inputClass = `rounded-full border px-3 py-1 text-xs font-medium outline-none transition ${
    ativo
      ? "border-control-blue-600 bg-control-blue-50 text-control-blue-700"
      : "border-control-line bg-control-surface text-control-ink/55"
  }`;

  return (
    <div className="flex items-center gap-1">
      <input
        type="date"
        min={min}
        max={ate || max}
        value={de}
        onChange={(e) => {
          setDe(e.target.value);
          aplicar(e.target.value, ate);
        }}
        className={inputClass}
        aria-label="Data inicial do período do painel"
      />
      <span className="text-xs text-control-ink/40">até</span>
      <input
        type="date"
        min={de || min}
        max={max}
        value={ate}
        onChange={(e) => {
          setAte(e.target.value);
          aplicar(de, e.target.value);
        }}
        className={inputClass}
        aria-label="Data final do período do painel"
      />
      {ativo && (
        <button
          type="button"
          onClick={limpar}
          className="rounded-full p-1 text-control-ink/40 transition hover:bg-control-bg hover:text-control-ink"
          aria-label="Limpar período"
          title="Voltar ao mês inteiro"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
