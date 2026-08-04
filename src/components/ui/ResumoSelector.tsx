"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPCOES: { valor: string; label: string }[] = [
  { valor: "hoje", label: "Hoje" },
  { valor: "ontem", label: "Ontem" },
  { valor: "7d", label: "7 dias" },
  { valor: "semana", label: "Esta semana" },
];

const RANGE_RE = /^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/;

/** Seletor de período do card "Resumo" no Dashboard — hoje, ontem, últimos 7
 * dias, semana atual, ou um período (data inicial e final) escolhido no
 * calendário. Independente do MesSelector (mês do restante do painel). */
export function ResumoSelector({ resumo, hoje }: { resumo: string; hoje: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Aceita tanto um período (de_até) quanto uma data única (retrocompatível).
  const range = resumo.match(RANGE_RE);
  const dataUnica = /^\d{4}-\d{2}-\d{2}$/.test(resumo) ? resumo : "";
  const [de, setDe] = useState(range ? range[1] : dataUnica);
  const [ate, setAte] = useState(range ? range[2] : dataUnica);
  const periodoAtivo = Boolean(range) || Boolean(dataUnica);

  function navegar(valor: string) {
    setDe("");
    setAte("");
    const params = new URLSearchParams(searchParams.toString());
    if (valor === "hoje") {
      params.delete("resumo");
    } else {
      params.set("resumo", valor);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  // Aplica o período assim que as duas datas estiverem preenchidas. Se o usuário
  // inverter (início depois do fim), a gente ordena antes de navegar.
  function aplicarPeriodo(novoDe: string, novoAte: string) {
    if (!novoDe || !novoAte) return;
    const [ini, fim] = novoDe <= novoAte ? [novoDe, novoAte] : [novoAte, novoDe];
    const params = new URLSearchParams(searchParams.toString());
    params.set("resumo", ini === fim ? ini : `${ini}_${fim}`);
    router.push(`${pathname}?${params.toString()}`);
  }

  const dateInputClass = (ativo: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium outline-none transition ${
      ativo
        ? "border-control-blue-600 bg-control-blue-50 text-control-blue-700"
        : "border-control-line bg-control-surface text-control-ink/55"
    }`;

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
      <div className="flex items-center gap-1">
        <input
          type="date"
          max={ate || hoje}
          value={de}
          onChange={(e) => {
            setDe(e.target.value);
            aplicarPeriodo(e.target.value, ate);
          }}
          className={dateInputClass(periodoAtivo)}
          aria-label="Data inicial do período"
        />
        <span className="text-xs text-control-ink/40">até</span>
        <input
          type="date"
          min={de || undefined}
          max={hoje}
          value={ate}
          onChange={(e) => {
            setAte(e.target.value);
            aplicarPeriodo(de, e.target.value);
          }}
          className={dateInputClass(periodoAtivo)}
          aria-label="Data final do período"
        />
      </div>
    </div>
  );
}
