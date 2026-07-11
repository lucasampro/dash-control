import { redirect } from "next/navigation";
import { UserPlus, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getMesReferencia } from "@/lib/mesReferencia";
import { createUser } from "./actions";
import { upsertMetaMensal } from "../financeiro/actions";
import { ToggleUserButton } from "./ToggleUserButton";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { MesSelector } from "@/components/ui/MesSelector";
import { Badge } from "@/components/ui/Badge";
import { inputClass, labelClass, sectionTitleClass, cardClass } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/dashboard");

  const params = await searchParams;
  const mes = await getMesReferencia(params.mes);

  const [usuarios, meta] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.metaMensal.findUnique({ where: { mes } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-control-ink">Admin</h1>
        <p className="mt-0.5 text-sm text-control-ink/45">
          Controle de acesso à ferramenta e metas mensais.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={`${cardClass} lg:col-span-1`}>
          <p className={`${sectionTitleClass} mb-4`}>Novo usuário</p>
          <form action={createUser} className="flex flex-col gap-3">
            <div>
              <label className={labelClass} htmlFor="username">
                Usuário (login)
              </label>
              <input id="username" name="username" required className={inputClass} placeholder="Ex: joana" />
            </div>
            <div>
              <label className={labelClass} htmlFor="name">
                Nome
              </label>
              <input id="name" name="name" required className={inputClass} placeholder="Ex: Joana Silva" />
            </div>
            <div>
              <label className={labelClass} htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className={inputClass}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-control-ink/70">
              <input type="checkbox" name="isAdmin" className="size-4 rounded border-control-line" />
              Acesso de admin
            </label>
            <SubmitButton>
              <UserPlus className="size-4" />
              Adicionar
            </SubmitButton>
          </form>
        </div>

        <div className={`${cardClass} lg:col-span-2`}>
          <p className={`${sectionTitleClass} mb-4`}>Usuários com acesso</p>
          {usuarios.length === 0 ? (
            <p className="py-2 text-sm text-control-ink/40">Nenhum usuário cadastrado.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {usuarios.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-col gap-2.5 rounded-xl border border-control-line px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-control-blue-50 text-xs font-bold text-control-blue-700">
                      {u.name.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-medium text-control-ink">
                        {u.name}
                        {u.isAdmin && <ShieldCheck className="size-3.5 text-control-gold-600" />}
                      </p>
                      <p className="text-xs text-control-ink/45">@{u.username}</p>
                    </div>
                    <Badge variant={u.ativo ? "success" : "neutral"}>{u.ativo ? "Ativo" : "Inativo"}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <ResetPasswordForm id={u.id} />
                    <ToggleUserButton id={u.id} ativo={u.ativo} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={cardClass}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className={sectionTitleClass}>Metas do mês — {mes}</p>
          <MesSelector mes={mes} redirectTo="/admin" />
        </div>
        <form action={upsertMetaMensal} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input type="hidden" name="mes" value={mes} />

          <div>
            <label className={labelClass}>Meta de leads</label>
            <input type="number" name="metaLeads" defaultValue={meta?.metaLeads ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Meta de fechamentos</label>
            <input
              type="number"
              name="metaFechamentos"
              defaultValue={meta?.metaFechamentos ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Meta de receita (R$)</label>
            <input
              type="number"
              step="0.01"
              name="metaReceita"
              defaultValue={meta?.metaReceita ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Meta CPL qualificado (R$)</label>
            <input
              type="number"
              step="0.01"
              name="metaCplQualificado"
              defaultValue={meta?.metaCplQualificado ?? ""}
              className={inputClass}
            />
          </div>

          <div className="col-span-full mt-2">
            <SubmitButton>Salvar metas</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
