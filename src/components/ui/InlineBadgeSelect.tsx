"use client";

import { useRef, useState, useTransition } from "react";
import { Badge, type Variant } from "@/components/ui/Badge";

type Option = {
  value: string;
  label: string;
  variant: Variant;
};

type InlineBadgeSelectProps = {
  value: string;
  options: Option[];
  action: (value: string) => Promise<void>;
};

// Badge clicável que abre um menu de opções e chama a Server Action ligada
// (via .bind(null, lead.id)) assim que uma opção é escolhida — permite mudar
// o status direto na listagem, sem entrar na tela de edição do lead.
export function InlineBadgeSelect({ value, options, action }: InlineBadgeSelectProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const atual = options.find((o) => o.value === value) ?? options[0];

  function handleSelect(newValue: string) {
    setOpen(false);
    if (newValue === value) return;
    startTransition(() => {
      action(newValue);
    });
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="cursor-pointer disabled:opacity-50"
      >
        <Badge variant={atual.variant}>{isPending ? "Salvando..." : atual.label}</Badge>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-50 mt-1 flex min-w-[9rem] flex-col gap-1 rounded-xl border border-control-line bg-control-surface p-1.5 shadow-xl">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-control-bg"
              >
                <Badge variant={option.variant}>{option.label}</Badge>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
