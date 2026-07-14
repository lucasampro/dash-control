"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPCOES: { valor: string; label: string }[] = [
  { valor: "hoje", label: "Hoje" },
  { valor: "ontem", label: "Ontem" },
  { valor: "7d", label: "7 dias" },
  { valor: "semana", label: "Esta semana" },
];

/** Seletor de período do card "Resumo" no Dashboard — hoje, ontem, últimos 7
 * dias, semana atual, ou uma data específica escolhida no calendário.
 * Independente do MesSelector (mês do restante do painel). */
export function ResumoSelector({ resumo, hoje }: { resumo: string; hoje: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ehDataEspecifica = /^\d{4}-\d{2}-\d{2}$/.test(resumo);

  function navegar(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor === "hoje") {
      params.delete("resumo");
    } else {
      params.set("resumo", valor);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {OPCOES.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => navegar(o.valor)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            resumo === o.valor
              ? "bg-control-blue-600 text-white"
              : "bg-control-bg text-control-ink/55 hover:bg-control-blue-50 hover:text-control-blue-700"
          }`}
        >
          {o.label}
        </button>
      ))}
      <input
        type="date"
        max={hoje}
        value={ehDataEspecifica ? resumo : ""}
        onChange={(e) => e.target.value && navegar(e.target.value)}
        className={`rounded-full border px-3 py-1 text-xs font-medium outline-none transition ${
          ehDataEspecifica
            ? "border-control-blue-600 bg-control-blue-50 text-control-blue-700"
            : "border-control-line bg-control-surface text-control-ink/55"
        }`}
      />
    </div>
  );
}
