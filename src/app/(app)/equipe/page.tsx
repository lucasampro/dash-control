import { UserPlus } from "lucide-react";
import { prisma } from "@/lib/db";
import { createTeamMember } from "./actions";
import { ToggleButton } from "./ToggleButton";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { inputClass, labelClass, sectionTitleClass, cardClass } from "@/lib/ui";

export const dynamic = "force-dynamic";

function Avatar({ nome }: { nome: string }) {
  const inicial = nome.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-control-blue-50 text-xs font-bold text-control-blue-700">
      {inicial}
    </span>
  );
}

function MemberList({ membros }: { membros: { id: string; nome: string; ativo: boolean }[] }) {
  if (membros.length === 0) {
    return <p className="py-2 text-sm text-control-ink/40">Nenhum membro cadastrado.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {membros.map((m) => (
        <li
          key={m.id}
          className="flex items-center justify-between rounded-xl border border-control-line px-3 py-2"
        >
          <div className="flex items-center gap-2.5">
            <Avatar nome={m.nome} />
            <span className={m.ativo ? "text-sm font-medium text-control-ink" : "text-sm text-control-ink/35 line-through"}>
              {m.nome}
            </span>
          </div>
          <ToggleButton id={m.id} ativo={m.ativo} />
        </li>
      ))}
    </ul>
  );
}

export default async function EquipePage() {
  const membros = await prisma.teamMember.findMany({
    orderBy: [{ role: "asc" }, { nome: "asc" }],
  });

  const sdrs = membros.filter((m) => m.role === "SDR");
  const closers = membros.filter((m) => m.role === "CLOSER");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-control-ink">Equipe</h1>
        <p className="mt-0.5 text-sm text-control-ink/45">
          Cadastre SDRs e Closers para atribuir aos leads.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={`${cardClass} lg:col-span-1`}>
          <p className={`${sectionTitleClass} mb-4`}>Novo membro</p>
          <form action={createTeamMember} className="flex flex-col gap-3">
            <div>
              <label className={labelClass} htmlFor="nome">
                Nome
              </label>
              <input id="nome" name="nome" required className={inputClass} placeholder="Ex: Ana" />
            </div>
            <div>
              <label className={labelClass} htmlFor="role">
                Função
              </label>
              <select id="role" name="role" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                <option value="SDR">SDR</option>
                <option value="CLOSER">Closer</option>
              </select>
            </div>
            <SubmitButton>
              <UserPlus className="size-4" />
              Adicionar
            </SubmitButton>
          </form>
        </div>

        <div className={`${cardClass} flex flex-col gap-6 lg:col-span-2`}>
          <div>
            <p className={`${sectionTitleClass} mb-3`}>SDRs</p>
            <MemberList membros={sdrs} />
          </div>
          <div>
            <p className={`${sectionTitleClass} mb-3`}>Closers</p>
            <MemberList membros={closers} />
          </div>
        </div>
      </div>
    </div>
  );
}
