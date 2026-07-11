"use client";

import { useTransition } from "react";
import { toggleTeamMemberAtivo } from "./actions";
import { ghostButtonClass } from "@/lib/ui";

export function ToggleButton({ id, ativo }: { id: string; ativo: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className={`${ghostButtonClass} disabled:opacity-50`}
      onClick={() =>
        startTransition(() => {
          toggleTeamMemberAtivo(id, !ativo);
        })
      }
    >
      {ativo ? "Desativar" : "Ativar"}
    </button>
  );
}
