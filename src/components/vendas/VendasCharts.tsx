"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ORIGEM_LABEL } from "@/lib/status";

// Ordem/chaves das origens, definidas aqui (não importadas de metrics) porque
// este é um componente client e metrics.ts puxa next/headers.
const ORIGENS_ORDEM = ["PAGO", "ORGANICO", "LINK_BIO", "INDICACAO"] as const;
export type OrigemKey = (typeof ORIGENS_ORDEM)[number];

// Cor por origem — casa com os badges (ORIGEM_VARIANT em lib/status.ts).
const CORES: Record<OrigemKey, string> = {
  PAGO: "var(--color-control-gold-500)",
  ORGANICO: "var(--color-control-blue-500)",
  LINK_BIO: "var(--color-control-success-600)",
  INDICACAO: "var(--color-control-warning-600)",
};

function fmtMoeda(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtMoedaCompacta(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 })}`;
}

function EmptyChart({ texto }: { texto: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-center text-sm text-control-ink/40">
      {texto}
    </div>
  );
}

export interface OrigemChartData {
  origem: OrigemKey;
  leads: number;
  fechamentos: number;
  receita: number;
  pctReceita: number;
}

// ————————————————————————————————————————————————
// Pizza: participação de cada origem no faturamento do mês
// ————————————————————————————————————————————————
function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: OrigemChartData }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-control-line bg-control-surface/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="flex items-center gap-1.5 font-semibold text-control-ink">
        <span className="inline-block size-2 rounded-full" style={{ background: CORES[d.origem] }} />
        {ORIGEM_LABEL[d.origem]}
      </p>
      <p className="mt-1 text-control-ink/70">
        {fmtMoeda(d.receita)} <span className="text-control-ink/40">({d.pctReceita.toFixed(1)}%)</span>
      </p>
    </div>
  );
}

export function ReceitaPorOrigemPie({ data }: { data: OrigemChartData[] }) {
  const comReceita = data.filter((d) => d.receita > 0);
  if (comReceita.length === 0) {
    return <EmptyChart texto="Nenhuma venda com receita lançada neste mês." />;
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={comReceita}
            dataKey="receita"
            nameKey="origem"
            innerRadius={62}
            outerRadius={100}
            paddingAngle={2}
            stroke="var(--color-control-surface)"
            strokeWidth={2}
          >
            {comReceita.map((d) => (
              <Cell key={d.origem} fill={CORES[d.origem]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-control-ink/70">{ORIGEM_LABEL[value as OrigemKey]}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ————————————————————————————————————————————————
// Barras: vendas (fechamentos) e receita por origem
// ————————————————————————————————————————————————
function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-control-line bg-control-surface/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="mb-1.5 font-semibold text-control-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 text-control-ink/70">
          <span className="inline-block size-2 rounded-full" style={{ background: p.color }} />
          {p.name}:{" "}
          <span className="font-semibold text-control-ink">
            {p.dataKey === "receita" ? fmtMoedaCompacta(p.value) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export function VendasPorOrigemBar({ data }: { data: OrigemChartData[] }) {
  if (data.every((d) => d.fechamentos === 0 && d.receita === 0)) {
    return <EmptyChart texto="Sem vendas lançadas neste mês." />;
  }
  const chartData = data.map((d) => ({ ...d, label: ORIGEM_LABEL[d.origem] }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--color-control-ink)", fillOpacity: 0.4 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: "var(--color-control-ink)", fillOpacity: 0.4 }}
            tickLine={false}
            axisLine={false}
            width={28}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: "var(--color-control-ink)", fillOpacity: 0.4 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtMoedaCompacta}
            width={56}
          />
          <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--color-control-bg)" }} />
          <Legend
            iconType="circle"
            formatter={(value) => <span className="text-xs text-control-ink/70">{value}</span>}
          />
          <Bar
            yAxisId="left"
            dataKey="fechamentos"
            name="Vendas"
            fill="var(--color-control-blue-500)"
            radius={[6, 6, 0, 0]}
            barSize={26}
          />
          <Bar
            yAxisId="right"
            dataKey="receita"
            name="Receita"
            fill="var(--color-control-gold-500)"
            radius={[6, 6, 0, 0]}
            barSize={26}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ————————————————————————————————————————————————
// Tendência: faturamento por origem nos últimos meses (barras empilhadas)
// ————————————————————————————————————————————————
export interface TendenciaPonto {
  periodo: string;
  PAGO: number;
  ORGANICO: number;
  LINK_BIO: number;
  INDICACAO: number;
}

function TendenciaTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((acc, p) => acc + p.value, 0);
  return (
    <div className="rounded-xl border border-control-line bg-control-surface/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="mb-1.5 font-semibold text-control-ink">{label}</p>
      {payload
        .filter((p) => p.value > 0)
        .map((p) => (
          <p key={p.dataKey} className="flex items-center gap-1.5 text-control-ink/70">
            <span className="inline-block size-2 rounded-full" style={{ background: p.color }} />
            {p.name}: <span className="font-semibold text-control-ink">{fmtMoedaCompacta(p.value)}</span>
          </p>
        ))}
      <p className="mt-1 border-t border-control-line pt-1 font-semibold text-control-ink">
        Total: {fmtMoedaCompacta(total)}
      </p>
    </div>
  );
}

export function TendenciaOrigemChart({ data }: { data: TendenciaPonto[] }) {
  if (data.every((d) => d.PAGO + d.ORGANICO + d.LINK_BIO + d.INDICACAO === 0)) {
    return <EmptyChart texto="Ainda não há faturamento suficiente para a tendência." />;
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="periodo"
            tick={{ fontSize: 12, fill: "var(--color-control-ink)", fillOpacity: 0.4 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--color-control-ink)", fillOpacity: 0.4 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtMoedaCompacta}
            width={56}
          />
          <Tooltip content={<TendenciaTooltip />} cursor={{ fill: "var(--color-control-bg)" }} />
          <Legend
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-control-ink/70">{ORIGEM_LABEL[value as OrigemKey]}</span>
            )}
          />
          {ORIGENS_ORDEM.map((origem, i) => (
            <Bar
              key={origem}
              dataKey={origem}
              name={origem}
              stackId="receita"
              fill={CORES[origem]}
              radius={i === ORIGENS_ORDEM.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
              barSize={30}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ————————————————————————————————————————————————
// Financeiro: tendência de faturamento e unit economics (CAC × LTV)
// ————————————————————————————————————————————————
export interface FinanceiroPonto {
  periodo: string;
  faturamento: number;
  cac: number;
  ltv: number;
  arpa: number;
  nps: number;
}

function MoedaTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-control-line bg-control-surface/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="mb-1.5 font-semibold text-control-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 text-control-ink/70">
          <span className="inline-block size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-control-ink">{fmtMoeda(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function FaturamentoTendenciaChart({ data }: { data: FinanceiroPonto[] }) {
  if (data.every((d) => d.faturamento === 0)) {
    return <EmptyChart texto="Sem faturamento lançado nos últimos meses." />;
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-control-gold-500)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-control-gold-500)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-control-line)" vertical={false} />
          <XAxis
            dataKey="periodo"
            tick={{ fontSize: 12, fill: "var(--color-control-ink)", fillOpacity: 0.4 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--color-control-ink)", fillOpacity: 0.4 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtMoedaCompacta}
            width={56}
          />
          <Tooltip content={<MoedaTooltip />} cursor={{ stroke: "var(--color-control-line)" }} />
          <Area
            type="monotone"
            dataKey="faturamento"
            name="Faturamento"
            stroke="var(--color-control-gold-600)"
            strokeWidth={2}
            fill="url(#fatGrad)"
            dot={{ r: 3, fill: "var(--color-control-gold-600)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UnitEconomicsChart({ data }: { data: FinanceiroPonto[] }) {
  if (data.every((d) => d.cac === 0 && d.ltv === 0)) {
    return <EmptyChart texto="Sem CAC/LTV lançados nos últimos meses." />;
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-control-line)" vertical={false} />
          <XAxis
            dataKey="periodo"
            tick={{ fontSize: 12, fill: "var(--color-control-ink)", fillOpacity: 0.4 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--color-control-ink)", fillOpacity: 0.4 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtMoedaCompacta}
            width={56}
          />
          <Tooltip content={<MoedaTooltip />} cursor={{ stroke: "var(--color-control-line)" }} />
          <Legend
            iconType="circle"
            formatter={(value) => <span className="text-xs text-control-ink/70">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="ltv"
            name="LTV"
            stroke="var(--color-control-success-600)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="cac"
            name="CAC"
            stroke="var(--color-control-danger-600)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
