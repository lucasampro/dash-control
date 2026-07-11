"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { setMesReferencia } from "@/app/(app)/mes-actions";
import { cardClass } from "@/lib/ui";

const MESES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const MESES_EXTENSO = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/**
 * Seletor de mês de referência compartilhado entre as páginas do painel.
 * Ao selecionar um mês no calendário, salva em cookie (via Server Action) e
 * navega automaticamente — propaga para Dashboard, Leads, Criativos,
 * Investimento e Financeiro sem precisar de um botão de confirmação.
 */
export function MesSelector({ mes, redirectTo }: { mes: string; redirectTo: string }) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const [aberto, setAberto] = useState(false);
  const [alinharDireita, setAlinharDireita] = useState(false);
  const [anoVisivel, setAnoVisivel] = useState(ano);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const mesInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const PANEL_WIDTH = 256;

  function alternarAberto() {
    if (!aberto && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setAlinharDireita(rect.left + PANEL_WIDTH > window.innerWidth - 16);
    }
    setAberto((v) => !v);
  }

  useEffect(() => {
    if (!aberto) return;
    setAnoVisivel(ano);
    function onClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", onClickFora);
    return () => document.removeEventListener("mousedown", onClickFora);
  }, [aberto, ano]);

  function selecionarMes(indiceMes: number) {
    const novoMes = `${anoVisivel}-${String(indiceMes + 1).padStart(2, "0")}`;
    if (mesInputRef.current) mesInputRef.current.value = novoMes;
    setAberto(false);
    startTransition(() => {
      formRef.current?.requestSubmit();
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      <form ref={formRef} action={setMesReferencia}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <input ref={mesInputRef} type="hidden" name="mes" defaultValue={mes} />
      </form>

      <button
        type="button"
        onClick={alternarAberto}
        className="flex items-center gap-2 rounded-[10px] border border-control-line bg-control-surface px-3.5 py-2 text-sm font-medium text-control-ink shadow-[0_1px_2px_rgba(15,23,41,0.04)] transition hover:border-control-blue-500/40 focus:outline-none focus:ring-4 focus:ring-control-blue-500/10"
      >
        <CalendarDays className="size-4 text-control-blue-600" />
        {MESES_EXTENSO[mesNum - 1]} de {ano}
      </button>

      {aberto && (
        <div
          className={`${cardClass} absolute top-[calc(100%+8px)] z-20 w-64 p-4 ${
            alinharDireita ? "right-0" : "left-0"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setAnoVisivel((a) => a - 1)}
              className="flex size-7 items-center justify-center rounded-full text-control-ink/50 transition hover:bg-control-bg hover:text-control-ink"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold text-control-ink">{anoVisivel}</span>
            <button
              type="button"
              onClick={() => setAnoVisivel((a) => a + 1)}
              className="flex size-7 items-center justify-center rounded-full text-control-ink/50 transition hover:bg-control-bg hover:text-control-ink"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MESES_LABEL.map((label, i) => {
              const selecionado = anoVisivel === ano && i === mesNum - 1;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => selecionarMes(i)}
                  className={`rounded-lg py-2 text-sm font-medium transition ${
                    selecionado
                      ? "bg-control-blue-600 text-white shadow-[0_1px_2px_rgba(37,84,240,0.25)]"
                      : "text-control-ink/70 hover:bg-control-blue-50/60 hover:text-control-blue-700"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
