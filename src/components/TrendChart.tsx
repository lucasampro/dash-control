"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrendPoint {
  periodo: string;
  leadsTotais: number;
  receitaNova: number;
}

function fmtMoedaCompacta(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 })}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-control-line bg-control-surface/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="mb-1.5 font-semibold text-control-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-control-ink/70">
          <span className="inline-block size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-control-ink">
            {p.name.includes("Receita") ? fmtMoedaCompacta(p.value) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-control-ink/40">
        Ainda não há dados mensais suficientes para exibir a tendência.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="receitaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-control-gold-500)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-control-gold-500)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-control-line)" vertical={false} />
          <XAxis
            dataKey="periodo"
            tick={{ fontSize: 12, fill: "var(--color-control-ink)", fillOpacity: 0.4 }}
            stroke="var(--color-control-line)"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: "var(--color-control-ink)", fillOpacity: 0.4 }}
            stroke="var(--color-control-line)"
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: "var(--color-control-ink)", fillOpacity: 0.4 }}
            stroke="var(--color-control-line)"
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtMoedaCompacta}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            yAxisId="left"
            dataKey="leadsTotais"
            name="Leads totais"
            fill="var(--color-control-blue-500)"
            radius={[6, 6, 0, 0]}
            barSize={22}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="receitaNova"
            name="Receita nova"
            stroke="var(--color-control-gold-500)"
            strokeWidth={2.5}
            fill="url(#receitaGradient)"
            dot={{ r: 3, fill: "var(--color-control-gold-500)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
