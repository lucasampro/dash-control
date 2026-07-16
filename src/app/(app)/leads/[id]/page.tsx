import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { prisma } from "@/lib/db";
import { updateLead } from "../actions";
import { nomeFormulario, emailFormulario, telefoneFormulario } from "@/lib/lead-nome";
import { DeleteButton } from "../DeleteButton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SubmitButton } from "@/components/ui/SubmitButton";
import {
  inputClass,
  labelClass,
  sectionTitleClass,
  cardClass,
  ghostButtonClass,
  subtleCardClass,
} from "@/lib/ui";

export const dynamic = "force-dynamic";

function boolToValue(v: boolean | null) {
  if (v === true) return "true";
  if (v === false) return "false";
  return "";
}

const SIM_NAO_OPTIONS = [
  { value: "", label: "—" },
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
];

export default async function EditarLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [lead, criativos, sdrs, closers, motivos] = await Promise.all([
    prisma.lead.findUnique({ where: { id } }),
    prisma.criativo.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.teamMember.findMany({
      where: { role: "SDR", ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.teamMember.findMany({
      where: { role: "CLOSER", ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.motivoNaoFechamento.findMany({ where: { ativo: true } }),
  ]);

  if (!lead) notFound();

  const updateLeadWithId = updateLead.bind(null, lead.id);

  // Leads vindos do Meta trazem nome/telefone/e-mail dentro de dadosFormulario.
  // Reaproveitamos esses valores como padrão dos campos de contato (quando o SDR
  // ainda não digitou nada manualmente), evitando redigitar o que já veio.
  const nomeInicial = lead.nome ?? nomeFormulario(lead.dadosFormulario) ?? "";
  const telefoneInicial = lead.telefone ?? telefoneFormulario(lead.dadosFormulario) ?? "";
  const emailInicial = lead.email ?? emailFormulario(lead.dadosFormulario) ?? "";

  const steps = [
    { label: "Origem", done: true },
    { label: "Qualificação", done: lead.qualificado !== null },
    { label: "Agendamento", done: lead.agendou !== null },
    { label: "Reunião", done: lead.reuniaoStatus !== "PENDENTE" },
    { label: "Fechamento", done: lead.resultado !== "EM_ANDAMENTO" },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link href="/leads" className={ghostButtonClass}>
          <ArrowLeft className="size-4" />
          Voltar para leads
        </Link>
        <DeleteButton id={lead.id} />
      </div>

      {/* Stepper visual do funil */}
      <div className={cardClass}>
        <div className="flex items-center">
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition ${
                    step.done
                      ? "bg-control-success-600 text-white"
                      : "bg-control-bg text-control-ink/35"
                  }`}
                >
                  {step.done ? <Check className="size-4" /> : i + 1}
                </div>
                <span className="hidden text-center text-[11px] font-medium text-control-ink/55 sm:block">
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 rounded-full transition ${
                    step.done ? "bg-control-success-600" : "bg-control-line"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dados que o lead preencheu no formulário nativo do Meta (só existe pra leads vindos do Meta) */}
      {lead.dadosFormulario &&
        Object.keys(lead.dadosFormulario as Record<string, string>).length > 0 && (
          <div className={cardClass}>
            <p className={`${sectionTitleClass} mb-4`}>Dados do formulário</p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.entries(lead.dadosFormulario as Record<string, string>).map(([campo, valor]) => (
                <div key={campo}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-control-ink/40">
                    {campo}
                  </dt>
                  <dd className="mt-0.5 text-sm text-control-ink">{valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

      <form action={updateLeadWithId} className="flex flex-col gap-4">
        <div className={cardClass}>
          <p className={`${sectionTitleClass} mb-4`}>Origem</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="data">
                Data
              </label>
              <input
                id="data"
                name="data"
                type="date"
                required
                defaultValue={lead.data.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="origem">
                Origem
              </label>
              <select id="origem" name="origem" className={inputClass} defaultValue={lead.origem}>
                <option value="PAGO">Pago</option>
                <option value="ORGANICO">Orgânico</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="criativoId">
                Criativo de origem
              </label>
              <select
                id="criativoId"
                name="criativoId"
                className={inputClass}
                defaultValue={lead.criativoId ?? ""}
              >
                <option value="">—</option>
                {criativos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {[c.campanha, c.conjunto, c.nome].filter(Boolean).join(" › ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="sdrId">
                SDR responsável
              </label>
              <select id="sdrId" name="sdrId" className={inputClass} defaultValue={lead.sdrId ?? ""}>
                <option value="">—</option>
                {sdrs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <p className={`${sectionTitleClass} mb-4`}>Contato</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="nome">
                Nome do lead
              </label>
              <input
                id="nome"
                name="nome"
                className={inputClass}
                defaultValue={nomeInicial}
                placeholder="Ex: Maria Silva"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="telefone">
                Telefone / WhatsApp
              </label>
              <input
                id="telefone"
                name="telefone"
                className={inputClass}
                defaultValue={telefoneInicial}
                placeholder="(11) 90000-0000"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={inputClass}
                defaultValue={emailInicial}
                placeholder="maria@email.com"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="instagram">
                Instagram
              </label>
              <input
                id="instagram"
                name="instagram"
                className={inputClass}
                defaultValue={lead.instagram ?? ""}
                placeholder="@maria.silva"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="observacoes">
                Observações
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                rows={3}
                className={inputClass}
                defaultValue={lead.observacoes ?? ""}
                placeholder="Anotações sobre o lead"
              />
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <p className={`${sectionTitleClass} mb-4`}>Qualificação e agendamento</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Qualificado?</label>
              <SegmentedControl
                name="qualificado"
                options={SIM_NAO_OPTIONS}
                defaultValue={boolToValue(lead.qualificado)}
              />
            </div>
            <div>
              <label className={labelClass}>Agendou reunião?</label>
              <SegmentedControl
                name="agendou"
                options={SIM_NAO_OPTIONS}
                defaultValue={boolToValue(lead.agendou)}
              />
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <p className={`${sectionTitleClass} mb-4`}>Reunião</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Status da reunião</label>
              <SegmentedControl
                name="reuniaoStatus"
                options={[
                  { value: "PENDENTE", label: "Pendente" },
                  { value: "FEITA", label: "Feita" },
                  { value: "NO_SHOW", label: "No-show" },
                ]}
                defaultValue={lead.reuniaoStatus}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="closerId">
                Closer responsável
              </label>
              <select
                id="closerId"
                name="closerId"
                className={inputClass}
                defaultValue={lead.closerId ?? ""}
              >
                <option value="">—</option>
                {closers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <p className={`${sectionTitleClass} mb-4`}>Fechamento</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Resultado</label>
              <SegmentedControl
                name="resultado"
                options={[
                  { value: "EM_ANDAMENTO", label: "Em andamento" },
                  { value: "GANHO", label: "Ganho" },
                  { value: "PERDIDO", label: "Perdido" },
                ]}
                defaultValue={lead.resultado}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="receita">
                Receita (R$, se ganho)
              </label>
              <div className={`${subtleCardClass} flex items-center gap-2 border-control-line bg-control-surface p-0 px-3`}>
                <span className="text-sm text-control-ink/40">R$</span>
                <input
                  id="receita"
                  name="receita"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={lead.receita ?? ""}
                  className="w-full bg-transparent py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="motivoNaoFechamentoId">
                Motivo (se não fechou)
              </label>
              <select
                id="motivoNaoFechamentoId"
                name="motivoNaoFechamentoId"
                className={inputClass}
                defaultValue={lead.motivoNaoFechamentoId ?? ""}
              >
                <option value="">—</option>
                {motivos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <SubmitButton className="self-start">Salvar alterações</SubmitButton>
      </form>
    </div>
  );
}
