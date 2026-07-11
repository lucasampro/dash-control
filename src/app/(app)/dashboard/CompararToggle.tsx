"use client";

import { useRef, useTransition } from "react";
import { setCompararMesAnterior } from "@/app/(app)/mes-actions";

/** Checkbox sutil para ligar/desligar a comparação com o mês anterior nos KPIs. */
export function CompararToggle({ ativo, mes }: { ativo: boolean; mes: string }) {
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const ativoInputRef = useRef<HTMLInputElement>(null);

  function alternar() {
    if (ativoInputRef.current) ativoInputRef.current.value = ativo ? "0" : "1";
    startTransition(() => {
      formRef.current?.requestSubmit();
    });
  }

  return (
    <form ref={formRef} action={setCompararMesAnterior} className="flex justify-end">
      <input type="hidden" name="mes" value={mes} />
      <input ref={ativoInputRef} type="hidden" name="ativo" defaultValue={ativo ? "1" : "0"} />
      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-control-ink/40 transition hover:text-control-ink/60">
        <input
          type="checkbox"
          checked={ativo}
          onChange={alternar}
          className="size-3.5 rounded border-control-line text-control-blue-600 focus:ring-control-blue-500/20"
        />
        Comparar com mês anterior
      </label>
    </form>
  );
}
