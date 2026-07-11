"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { resetUserPassword } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ghostButtonClass, inputClass } from "@/lib/ui";

export function ResetPasswordForm({ id }: { id: string }) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button type="button" className={ghostButtonClass} onClick={() => setAberto(true)}>
        <KeyRound className="size-3.5" />
        Redefinir senha
      </button>
    );
  }

  return (
    <form
      action={resetUserPassword}
      className="flex items-center gap-2"
      onSubmit={() => setTimeout(() => setAberto(false), 100)}
    >
      <input type="hidden" name="id" value={id} />
      <input
        type="password"
        name="password"
        required
        minLength={6}
        placeholder="Nova senha"
        className={`${inputClass} w-36 py-1.5 text-xs`}
      />
      <SubmitButton className="px-2.5 py-1.5 text-xs" savingLabel="Salvando" savedLabel="Salva">
        Salvar
      </SubmitButton>
      <button
        type="button"
        className={`${ghostButtonClass} px-2 py-1.5`}
        onClick={() => setAberto(false)}
      >
        Cancelar
      </button>
    </form>
  );
}
