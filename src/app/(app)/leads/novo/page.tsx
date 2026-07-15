import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { createLead } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { inputClass, labelClass, cardClass, ghostButtonClass } from "@/lib/ui";

export const dynamic = "force-dynamic";

function hoje() {
  // Data de hoje no fuso de São Paulo (en-CA formata como YYYY-MM-DD).
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
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

      <div className={`${cardClass} relative`}>
        <h1 className="mb-1 pr-28 text-lg font-semibold tracking-tight text-control-ink">Novo lead</h1>
        <p className="mb-5 pr-4 text-sm text-control-ink/45">
          Depois de criado, você poderá acompanhar o lead por todo o funil.
        </p>
        <form action={createLead} className="flex flex-col gap-4">
          <input type="checkbox" id="utmManual" name="utmManualToggle" className="peer sr-only" />
          <label
            htmlFor="utmManual"
            className="absolute right-5 top-5 flex w-fit cursor-pointer items-center gap-2 rounded-full border border-control-line px-3 py-1.5 text-xs font-medium text-control-ink/60 transition hover:border-control-blue-400 peer-checked:border-control-blue-500 peer-checked:bg-control-blue-50/60 peer-checked:text-control-blue-700"
          >
            <span className="size-1.5 rounded-full bg-control-ink/30 peer-checked:bg-control-blue-600" />
            UTM manual
          </label>

          <div>
            <label className={labelClass} htmlFor="nome">
              Nome do lead
            </label>
            <input id="nome" name="nome" className={inputClass} placeholder="Ex: Maria Silva" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="telefone">
                Telefone / WhatsApp
              </label>
              <input id="telefone" name="telefone" className={inputClass} placeholder="(11) 90000-0000" />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">
                E-mail
              </label>
              <input id="email" name="email" type="email" className={inputClass} placeholder="maria@email.com" />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="instagram">
              Instagram
            </label>
            <input id="instagram" name="instagram" className={inputClass} placeholder="@maria.silva" />
          </div>

          <div>
            <label className={labelClass} htmlFor="observacoes">
              Observações
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={3}
              className={inputClass}
              placeholder="Anotações sobre o lead"
            />
          </div>

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

          <div className="peer-checked:hidden">
            <label className={labelClass} htmlFor="criativoId">
              Criativo de origem (opcional)
            </label>
            <select id="criativoId" name="criativoId" className={inputClass} defaultValue="">
              <option value="">—</option>
              {criativos.map((c) => (
                <option key={c.id} value={c.id}>
                  {[c.campanha, c.conjunto, c.nome].filter(Boolean).join(" › ")}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden flex-col gap-4 rounded-xl border border-dashed border-control-line p-3 peer-checked:flex">
            <p className="text-xs text-control-ink/45">
              Use quando o lead chegou e o Meta não identificou/atribuiu
              automaticamente — preencha com as UTMs que você já conseguiu
              (Anúncio é obrigatório pra criar o criativo, Campanha e Conjunto
              são opcionais).
            </p>
            <div>
              <label className={labelClass} htmlFor="utmCampanha">
                Campanha
              </label>
              <input id="utmCampanha" name="utmCampanha" className={inputClass} placeholder="Ex: 44 - [LEAD] - [NTV]" />
            </div>
            <div>
              <label className={labelClass} htmlFor="utmConjunto">
                Conjunto
              </label>
              <input id="utmConjunto" name="utmConjunto" className={inputClass} placeholder="Ex: Melhores 25-45" />
            </div>
            <div>
              <label className={labelClass} htmlFor="utmAnuncio">
                Anúncio
              </label>
              <input id="utmAnuncio" name="utmAnuncio" className={inputClass} placeholder="Ex: 21 - [VIDEO] - Depoimento" />
            </div>
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
