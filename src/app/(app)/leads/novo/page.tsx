import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { createLead } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { inputClass, labelClass, cardClass, ghostButtonClass } from "@/lib/ui";

export const dynamic = "force-dynamic";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NovoLeadPage() {
  const [criativos, sdrs] = await Promise.all([
    prisma.criativo.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.teamMember.findMany({
      where: { role: "SDR", ativo: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <Link href="/leads" className={`${ghostButtonClass} w-fit`}>
        <ArrowLeft className="size-4" />
        Voltar para leads
      </Link>

      <div className={cardClass}>
        <h1 className="mb-1 text-lg font-semibold tracking-tight text-control-ink">Novo lead</h1>
        <p className="mb-5 text-sm text-control-ink/45">
          Depois de criado, você poderá acompanhar o lead por todo o funil.
        </p>
        <form action={createLead} className="flex flex-col gap-4">
          <div>
            <label className={labelClass} htmlFor="data">
              Data
            </label>
            <input
              id="data"
              name="data"
              type="date"
              required
              defaultValue={hoje()}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="origem">
              Origem
            </label>
            <select id="origem" name="origem" required className={inputClass} defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              <option value="PAGO">Pago</option>
              <option value="ORGANICO">Orgânico</option>
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="criativoId">
              Criativo de origem (opcional)
            </label>
            <select id="criativoId" name="criativoId" className={inputClass} defaultValue="">
              <option value="">—</option>
              {criativos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="sdrId">
              SDR responsável
            </label>
            <select id="sdrId" name="sdrId" className={inputClass} defaultValue="">
              <option value="">—</option>
              {sdrs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          <SubmitButton>Criar lead</SubmitButton>
        </form>
      </div>
    </div>
  );
}
