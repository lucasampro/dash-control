"use client";

import { useMemo, useState } from "react";
import { inputClass, labelClass, sectionTitleClass, cardClass } from "@/lib/ui";
import { KpiCard } from "@/components/KpiCard";
import { Banknote, CircleDollarSign, TrendingUp } from "lucide-react";

interface Premissas {
  investimentoMensal: number;
  cpl: number;
  txQualificacao: number;
  txAgendamento: number;
  txShow: number;
  txProposta: number;
  winRate: number;
  ticketMedio: number;
}

const PADRAO: Premissas = {
  investimentoMensal: 10000,
  cpl: 30,
  txQualificacao: 70,
  txAgendamento: 30,
  txShow: 75,
  txProposta: 65,
  winRate: 35,
  ticketMedio: 3000,
};

function fmtMoeda(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SimuladorForm() {
  const [premissas, setPremissas] = useState<Premissas>(PADRAO);

  function set<K extends keyof Premissas>(key: K, value: number) {
    setPremissas((prev) => ({ ...prev, [key]: value }));
  }

  const resultado = useMemo(() => {
    const leads = premissas.cpl ? premissas.investimentoMensal / premissas.cpl : 0;
    const qualificados = leads * (premissas.txQualificacao / 100);
    const agendados = qualificados * (premissas.txAgendamento / 100);
    const reunioesFeitas = agendados * (premissas.txShow / 100);
    const propostas = reunioesFeitas * (premissas.txProposta / 100);
    const fechamentos = propostas * (premissas.winRate / 100);
    const receita = fechamentos * premissas.ticketMedio;
    const cac = fechamentos ? premissas.investimentoMensal / fechamentos : 0;
    const roas = premissas.investimentoMensal ? receita / premissas.investimentoMensal : 0;

    return {
      leads,
      qualificados,
      agendados,
      reunioesFeitas,
      propostas,
      fechamentos,
      receita,
      cac,
      roas,
    };
  }, [premissas]);

  const campos: { key: keyof Premissas; label: string }[] = [
    { key: "investimentoMensal", label: "Investimento mensal (R$)" },
    { key: "cpl", label: "CPL — custo por lead (R$)" },
    { key: "txQualificacao", label: "Taxa de qualificação (%)" },
    { key: "txAgendamento", label: "Taxa de agendamento (%)" },
    { key: "txShow", label: "Taxa de comparecimento / show (%)" },
    { key: "txProposta", label: "Taxa de proposta na reunião (%)" },
    { key: "winRate", label: "Win rate (%)" },
    { key: "ticketMedio", label: "Ticket médio (R$)" },
  ];

  const funil = [
    { label: "Leads projetados", valor: resultado.leads },
    { label: "Qualificados", valor: resultado.qualificados },
    { label: "Agendados", valor: resultado.agendados },
    { label: "Reuniões feitas", valor: resultado.reunioesFeitas },
    { label: "Propostas", valor: resultado.propostas },
    { label: "Fechamentos", valor: resultado.fechamentos },
  ];
  const maxFunil = Math.max(1, ...funil.map((f) => f.valor));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className={`${cardClass} lg:col-span-1`}>
        <p className={`${sectionTitleClass} mb-4`}>Premissas</p>
        <div className="flex flex-col gap-3">
          {campos.map((c) => (
            <div key={c.key}>
              <label className={labelClass}>{c.label}</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={premissas[c.key]}
                onChange={(e) => set(c.key, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-2">
        <div className={cardClass}>
          <p className={`${sectionTitleClass} mb-4`}>Projeção do funil</p>
          <div className="flex flex-col gap-3">
            {funil.map((f, i) => (
              <div key={f.label}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="text-control-ink/70">{f.label}</span>
                  <span className="font-semibold tabular-nums text-control-ink">
                    {f.valor.toFixed(i >= 5 ? 1 : 0)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-control-bg">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-control-blue-500 to-control-blue-600 transition-all"
                    style={{ width: `${Math.max(2, (f.valor / maxFunil) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label="Receita projetada" value={fmtMoeda(resultado.receita)} accent="gold" icon={Banknote} />
          <KpiCard label="CAC projetado" value={fmtMoeda(resultado.cac)} accent="gold" icon={CircleDollarSign} />
          <KpiCard label="ROAS projetado" value={`${resultado.roas.toFixed(2)}x`} accent="gold" icon={TrendingUp} />
        </div>
      </div>
    </div>
  );
}
