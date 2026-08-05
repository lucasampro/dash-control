"use client";

import { useTransition } from "react";
import { setUserTeamMember } from "./actions";
import { inputClass } from "@/lib/ui";

type Membro = { id: string; nome: string; role: "SDR" | "CLOSER" };

// Select inline pra vincular um login a um membro da equipe (SDR/Closer). O
// vínculo é o que alimenta a trava de edição de lead — um SDR só edita leads
// sem SDR ou atribuídos a ele mesmo.
export function UserTeamMemberSelect({
  userId,
  teamMemberId,
  membros,
}: {
  userId: string;
  teamMemberId: string | null;
  membros: Membro[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={teamMemberId ?? ""}
      disabled={isPending}
      className={`${inputClass} h-9 w-auto min-w-[9rem] py-1 text-xs disabled:opacity-50`}
      onChange={(e) => {
        const valor = e.target.value;
        startTransition(() => {
          setUserTeamMember(userId, valor).catch((err) => alert(String(err.message ?? err)));
        });
      }}
    >
      <option value="">Sem vínculo</option>
      {membros.map((m) => (
        <option key={m.id} value={m.id}>
          {m.nome} ({m.role})
        </option>
      ))}
    </select>
  );
}
