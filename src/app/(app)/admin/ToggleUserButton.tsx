"use client";

import { useTransition } from "react";
import { toggleUserAtivo } from "./actions";
import { ghostButtonClass } from "@/lib/ui";

export function ToggleUserButton({ id, ativo }: { id: string; ativo: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className={`${ghostButtonClass} disabled:opacity-50`}
      onClick={() =>
        startTransition(() => {
          toggleUserAtivo(id, !ativo).catch((err) => alert(String(err.message ?? err)));
        })
      }
    >
      {ativo ? "Desativar" : "Ativar"}
    </button>
  );
}
