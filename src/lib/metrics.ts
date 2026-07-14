// Todas as métricas do painel são calculadas a partir dos lançamentos
// manuais (Lead, InvestimentoDiario, MetricaMensal, CriativoMensal).
// Nada aqui é digitado à mão pela equipe — é sempre derivado.
import { prisma } from "./db";
import { mesAtual } from "./mesReferencia";

export function mesParaIntervalo(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const inicio = new Date(ano, mesNum - 1, 1);
  const fim = new Date(ano, mesNum, 1);
  return { inicio, fim };
}

export function mesAnterior(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const d = new Date(ano, mesNum - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Variação percentual entre dois períodos. `undefined` quando não há base de comparação. */
export function pctChange(atual: number, anterior: number): number | undefined {
  if (!anterior) return undefined;
  return ((atual - anterior) / anterior) * 100;
}

function pct(numerador: number, denominador: number) {
  if (!denominador) return 0;
  return (numerador / denominador) * 100;
}

export async function getFunilPeriodo(inicio: Date, fim: Date) {
  const leads = await prisma.lead.findMany({
    where: { data: { gte: inicio, lt: fim } },
  });

  const totalLeads = leads.length;
  const qualificados = leads.filter((l) => l.qualificado).length;
  const agendados = leads.filter((l) => l.agendou).length;
  const reunioesFeitas = leads.filter((l) => l.reuniaoStatus === "FEITA").length;
  const noShows = leads.filter((l) => l.reuniaoStatus === "NO_SHOW").length;
  // Proposta é sempre apresentada na reunião feita.
  const propostas = reunioesFeitas;
  const fechamentos = leads.filter((l) => l.resultado === "GANHO").length;
  const receita = leads
    .filter((l) => l.resultado === "GANHO")
    .reduce((acc, l) => acc + (l.receita ?? 0), 0);

  const investimento = await prisma.investimentoDiario.aggregate({
    _sum: { valor: true },
    where: { data: { gte: inicio, lt: fim } },
  });
  const investimentoTotal = investimento._sum.valor ?? 0;

  return {
    totalLeads,
    qualificados,
    agendados,
    reunioesFeitas,
    noShows,
    propostas,
    fechamentos,
    receita,
    investimentoTotal,
    cpl: totalLeads ? investimentoTotal / totalLeads : 0,
    cpa: fechamentos ? investimentoTotal / fechamentos : 0,
    txShow: pct(reunioesFeitas, reunioesFeitas + noShows),
    txNoShow: pct(noShows, reunioesFeitas + noShows),
    txProposta: pct(propostas, reunioesFeitas),
    winRate: pct(fechamentos, propostas),
    ticketMedio: fechamentos ? receita / fechamentos : 0,
  };
}

export interface FunilDiario {
  dia: string; // "YYYY-MM-DD"
  totalLeads: number;
  qualificados: number;
  agendados: number;
  reunioesFeitas: number;
  noShows: number;
  propostas: number;
  fechamentos: number;
  receita: number;
  investimento: number;
  cplPago: number;
  cplQualificado: number;
  pctQualif: number;
  txAgendamento: number;
  txReuniaoFeita: number;
  txNoShow: number;
  txProposta: number;
  convLeadCliente: number;
  winRate: number;
  roas: number;
  cacMidia: number;
}

/** Mesma lógica de `getFunilPeriodo`, mas agrupada por dia de entrada do lead
 * (coorte diária) — para a análise dia a dia do mês. Métricas de fechamento
 * (win rate, ROAS, CAC mídia) refletem o status atual dos leads: coortes
 * recentes ainda podem fechar depois. */
export async function getFunilDiario(mes: string): Promise<FunilDiario[]> {
  const { inicio, fim } = mesParaIntervalo(mes);
  const [ano, mesNum] = mes.split("-").map(Number);
  const ehMesAtual = mes === mesAtual();
  const ultimoDia = ehMesAtual
    ? new Date().getDate()
    : new Date(fim.getTime() - 1).getDate();

  const [leads, investimentos] = await Promise.all([
    prisma.lead.findMany({ where: { data: { gte: inicio, lt: fim } } }),
    prisma.investimentoDiario.findMany({ where: { data: { gte: inicio, lt: fim } } }),
  ]);

  const investimentoPorDia = new Map(
    investimentos.map((i) => [i.data.toISOString().slice(0, 10), i.valor])
  );
  const leadsPorDia = new Map<string, typeof leads>();
  for (const l of leads) {
    const dia = l.data.toISOString().slice(0, 10);
    if (!leadsPorDia.has(dia)) leadsPorDia.set(dia, []);
    leadsPorDia.get(dia)!.push(l);
  }

  const resultado: FunilDiario[] = [];
  for (let d = 1; d <= ultimoDia; d++) {
    const dia = `${ano}-${String(mesNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const diaLeads = leadsPorDia.get(dia) ?? [];

    const totalLeads = diaLeads.length;
    const qualificados = diaLeads.filter((l) => l.qualificado).length;
    const agendados = diaLeads.filter((l) => l.agendou).length;
    const reunioesFeitas = diaLeads.filter((l) => l.reuniaoStatus === "FEITA").length;
    const noShows = diaLeads.filter((l) => l.reuniaoStatus === "NO_SHOW").length;
    const propostas = reunioesFeitas;
    const fechamentos = diaLeads.filter((l) => l.resultado === "GANHO").length;
    const receita = diaLeads
      .filter((l) => l.resultado === "GANHO")
      .reduce((acc, l) => acc + (l.receita ?? 0), 0);
    const investimento = investimentoPorDia.get(dia) ?? 0;

    resultado.push({
      dia,
      totalLeads,
      qualificados,
      agendados,
      reunioesFeitas,
      noShows,
      propostas,
      fechamentos,
      receita,
      investimento,
      cplPago: totalLeads ? investimento / totalLeads : 0,
      cplQualificado: qualificados ? investimento / qualificados : 0,
      pctQualif: pct(qualificados, totalLeads),
      txAgendamento: pct(agendados, totalLeads),
      txReuniaoFeita: pct(reunioesFeitas, reunioesFeitas + noShows),
      txNoShow: pct(noShows, reunioesFeitas + noShows),
      txProposta: pct(propostas, reunioesFeitas),
      convLeadCliente: pct(fechamentos, totalLeads),
      winRate: pct(fechamentos, propostas),
      roas: investimento ? receita / investimento : 0,
      cacMidia: fechamentos ? investimento / fechamentos : 0,
    });
  }
  return resultado;
}

/** Resumo do dia informado (por padrão, hoje) — usado no topo do Dashboard
 * pra dar uma visão rápida de como o dia está indo, independente do mês
 * selecionado no filtro. */
export async function getResumoDia(dia: Date) {
  const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
  const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  const leads = await prisma.lead.findMany({ where: { data: { gte: inicio, lt: fim } } });

  const totalLeads = leads.length;
  const qualificados = leads.filter((l) => l.qualificado === true).length;
  const agendados = leads.filter((l) => l.agendou === true).length;

  return {
    totalLeads,
    qualificados,
    pctQualif: pct(qualificados, totalLeads),
    agendados,
  };
}

export async function getPorSdr(inicio: Date, fim: Date) {
  const sdrs = await prisma.teamMember.findMany({
    where: { role: "SDR" },
    orderBy: { nome: "asc" },
  });

  const results = [];
  for (const sdr of sdrs) {
    const leads = await prisma.lead.findMany({
      where: { sdrId: sdr.id, data: { gte: inicio, lt: fim } },
    });

    const leadsRecebidos = leads.length;
    const leadsQualifRecebidos = leads.filter((l) => l.qualificado).length;
    const leadsNormais = leadsRecebidos - leadsQualifRecebidos;
    const agendNormal = leads.filter((l) => l.agendou && !l.qualificado).length;
    const agendQualif = leads.filter((l) => l.agendou && l.qualificado).length;
    const agendTotais = agendNormal + agendQualif;
    const noShows = leads.filter((l) => l.reuniaoStatus === "NO_SHOW").length;

    results.push({
      id: sdr.id,
      nome: sdr.nome,
      leadsRecebidos,
      leadsQualifRecebidos,
      leadsNormais,
      agendNormal,
      agendQualif,
      agendTotais,
      noShows,
      txAgendNormal: pct(agendNormal, leadsNormais),
      txAgendQualif: pct(agendQualif, leadsQualifRecebidos),
      txAgendGeral: pct(agendTotais, leadsRecebidos),
      txNoShow: pct(noShows, agendTotais),
    });
  }
  return results;
}

export async function getPorCloser(inicio: Date, fim: Date) {
  const closers = await prisma.teamMember.findMany({
    where: { role: "CLOSER" },
    orderBy: { nome: "asc" },
  });

  const results = [];
  for (const closer of closers) {
    const leads = await prisma.lead.findMany({
      where: { closerId: closer.id, data: { gte: inicio, lt: fim } },
    });

    const reunioesAgendadas = leads.length;
    const reunioesFeitas = leads.filter((l) => l.reuniaoStatus === "FEITA").length;
    const noShows = leads.filter((l) => l.reuniaoStatus === "NO_SHOW").length;
    // Proposta é sempre apresentada na reunião feita.
    const propostas = reunioesFeitas;
    const fechamentos = leads.filter((l) => l.resultado === "GANHO").length;
    const receita = leads
      .filter((l) => l.resultado === "GANHO")
      .reduce((acc, l) => acc + (l.receita ?? 0), 0);

    results.push({
      id: closer.id,
      nome: closer.nome,
      reunioesAgendadas,
      reunioesFeitas,
      noShows,
      propostas,
      fechamentos,
      receita,
      txShow: pct(reunioesFeitas, reunioesAgendadas),
      txNoShow: pct(noShows, reunioesAgendadas),
      txProposta: pct(propostas, reunioesFeitas),
      winRate: pct(fechamentos, propostas),
      convReuniaoCliente: pct(fechamentos, reunioesFeitas),
      ticketMedio: fechamentos ? receita / fechamentos : 0,
    });
  }
  return results;
}

export async function getMotivosNaoFechamento(inicio: Date, fim: Date) {
  const motivos = await prisma.motivoNaoFechamento.findMany({
    where: { ativo: true },
  });
  const leadsNaoFechados = await prisma.lead.findMany({
    where: {
      data: { gte: inicio, lt: fim },
      reuniaoStatus: "FEITA",
      resultado: "PERDIDO",
    },
  });
  const total = leadsNaoFechados.length;

  return motivos.map((m) => {
    const quantidade = leadsNaoFechados.filter(
      (l) => l.motivoNaoFechamentoId === m.id
    ).length;
    return {
      id: m.id,
      nome: m.nome,
      quantidade,
      percentual: pct(quantidade, total),
    };
  });
}

export async function getCriativosPerformance(mes: string) {
  const { inicio, fim } = mesParaIntervalo(mes);
  const registros = await prisma.criativoMensal.findMany({
    where: { mes },
    include: { criativo: true },
  });

  const results = [];
  for (const r of registros) {
    const leads = await prisma.lead.findMany({
      where: { criativoId: r.criativoId, data: { gte: inicio, lt: fim } },
    });
    const totalLeads = leads.length;
    const fechamentos = leads.filter((l) => l.resultado === "GANHO").length;

    results.push({
      id: r.id,
      nome: r.criativo.nome,
      investimento: r.investimento,
      leads: totalLeads,
      fechamentos,
      cpl: totalLeads ? r.investimento / totalLeads : 0,
      cpa: fechamentos ? r.investimento / fechamentos : 0,
      vencedor: r.vencedor,
    });
  }
  return results;
}

/**
 * Ranking de leads/fechamentos por Campanha → Conjunto → Anúncio (Criativo),
 * pro período informado. Ao contrário de `getCriativosPerformance`, não
 * depende de haver investimento mensal lançado — conta todo lead do período
 * que tenha um criativo vinculado (mesmo sem investimento cadastrado), então
 * serve tanto pra atribuição manual quanto pro auto-sync de Lead Ads do Meta.
 */
export async function getCriativosRanking(inicio: Date, fim: Date) {
  const leads = await prisma.lead.findMany({
    where: { data: { gte: inicio, lt: fim }, criativoId: { not: null } },
    include: { criativo: true },
  });

  type Grupo = {
    id: string;
    nome: string;
    campanha: string | null;
    conjunto: string | null;
    leads: number;
    qualificados: number;
    desqualificados: number;
    fechamentos: number;
    receita: number;
  };

  const porAnuncio = new Map<string, Grupo>();
  for (const l of leads) {
    if (!l.criativo) continue;
    const key = l.criativo.id;
    const atual = porAnuncio.get(key) ?? {
      id: l.criativo.id,
      nome: l.criativo.nome,
      campanha: l.criativo.campanha,
      conjunto: l.criativo.conjunto,
      leads: 0,
      qualificados: 0,
      desqualificados: 0,
      fechamentos: 0,
      receita: 0,
    };
    atual.leads += 1;
    if (l.qualificado === true) {
      atual.qualificados += 1;
    } else if (l.qualificado === false) {
      atual.desqualificados += 1;
    }
    if (l.resultado === "GANHO") {
      atual.fechamentos += 1;
      atual.receita += l.receita ?? 0;
    }
    porAnuncio.set(key, atual);
  }

  const anuncios = [...porAnuncio.values()]
    .map((g) => ({ ...g, winRate: pct(g.fechamentos, g.leads) }))
    .sort((a, b) => b.leads - a.leads);

  function rollup(campo: "campanha" | "conjunto") {
    const grupos = new Map<
      string,
      { nome: string; leads: number; qualificados: number; desqualificados: number; fechamentos: number; receita: number }
    >();
    for (const a of anuncios) {
      const nome = a[campo] ?? "Sem " + (campo === "campanha" ? "campanha" : "conjunto");
      const atual = grupos.get(nome) ?? { nome, leads: 0, qualificados: 0, desqualificados: 0, fechamentos: 0, receita: 0 };
      atual.leads += a.leads;
      atual.qualificados += a.qualificados;
      atual.desqualificados += a.desqualificados;
      atual.fechamentos += a.fechamentos;
      atual.receita += a.receita;
      grupos.set(nome, atual);
    }
    return [...grupos.values()]
      .map((g) => ({ ...g, winRate: pct(g.fechamentos, g.leads) }))
      .sort((a, b) => b.leads - a.leads);
  }

  return {
    anuncios,
    campanhas: rollup("campanha"),
    conjuntos: rollup("conjunto"),
  };
}

// Fórmulas padrão de mercado, conforme confirmado:
// NPS = %promotores - %detratores
// LTV = ARPA / churn de logo
// Payback CAC = CAC / ARPA (em meses)
// Revenue Churn = MRR perdido / MRR início
// NRR = (MRR início - MRR perdido + MRR expansão) / MRR início
export async function getFinanceiroMensal(mes: string) {
  const m = await prisma.metricaMensal.findUnique({ where: { mes } });
  if (!m) return null;

  const { inicio, fim } = mesParaIntervalo(mes);
  const investimentoMidia = await prisma.investimentoDiario.aggregate({
    _sum: { valor: true },
    where: { data: { gte: inicio, lt: fim } },
  });
  const novosClientes = await prisma.lead.count({
    where: { resultado: "GANHO", data: { gte: inicio, lt: fim } },
  });

  const custoTotalAquisicao = m.custoComercial + (investimentoMidia._sum.valor ?? 0);
  const cac = novosClientes ? custoTotalAquisicao / novosClientes : 0;

  const arpa = m.clientesAtivos ? m.faturamento / m.clientesAtivos : 0;
  const churnLogo = m.logosInicio ? m.logosPerdidos / m.logosInicio : 0;
  const churnReceita = m.mrrInicio ? m.mrrPerdido / m.mrrInicio : 0;
  const nrr = m.mrrInicio
    ? ((m.mrrInicio - m.mrrPerdido + m.mrrExpansao) / m.mrrInicio) * 100
    : 0;
  const ltv = churnLogo ? arpa / churnLogo : 0;
  const paybackMeses = arpa ? cac / arpa : 0;

  const totalNps = m.promotores + m.neutros + m.detratores;
  const nps = totalNps
    ? pct(m.promotores, totalNps) - pct(m.detratores, totalNps)
    : 0;

  return {
    mes,
    cac,
    arpa,
    ltv,
    paybackMeses,
    churnLogo: churnLogo * 100,
    churnReceita: churnReceita * 100,
    nrr,
    nps,
    novosClientes,
    faturamento: m.faturamento,
    clientesAtivos: m.clientesAtivos,
  };
}

export async function getMetaMensal(mes: string) {
  return prisma.metaMensal.findUnique({ where: { mes } });
}
