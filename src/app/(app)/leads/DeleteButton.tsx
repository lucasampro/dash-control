"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteLead } from "./actions";
import { dangerButtonClass } from "@/lib/ui";

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className={dangerButtonClass}
      onClick={() => {
        if (confirm("Excluir este lead? Essa ação não pode ser desfeita.")) {
          startTransition(() => {
            deleteLead(id);
          });
        }
      }}
    >
      <Trash2 className="size-3.5" />
      {isPending ? "Excluindo..." : "Excluir"}
    </button>
  );
}
