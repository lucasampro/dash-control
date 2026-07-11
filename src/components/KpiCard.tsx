import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { HoverTooltip } from "./ui/HoverTooltip";

interface KpiCardProps {
  label: string;
  value: string;
  accent?: "blue" | "gold";
  icon?: LucideIcon;
  /** Variação percentual vs. período anterior. Omitir quando não houver base de comparação. */
  delta?: number;
  /** Quando true, uma queda no delta é positiva (ex: CPL, CAC, no-show). */
  invertDelta?: boolean;
  /** Texto explicando como a métrica foi calculada. Aparece num tooltip que acompanha o cursor sobre o card. */
  tooltip?: string;
}

export function KpiCard({
  label,
  value,
  accent = "blue",
  icon: Icon,
  delta,
  invertDelta = false,
  tooltip,
}: KpiCardProps) {
  const iconColor = accent === "gold" ? "text-control-gold-600 bg-control-gold-100" : "text-control-blue-600 bg-control-blue-50";

  const deltaGood = delta === undefined ? null : invertDelta ? delta < 0 : delta > 0;
  const deltaColor =
    delta === undefined || delta === 0
      ? "text-control-ink/40"
      : deltaGood
        ? "text-control-success-600"
        : "text-control-danger-600";
  const DeltaIcon = delta === undefined || delta === 0 ? Minus : delta > 0 ? ArrowUp : ArrowDown;

  return (
    <HoverTooltip
      tooltip={tooltip}
      className="relative rounded-2xl border border-control-line bg-control-surface p-4 shadow-[0_1px_2px_rgba(15,23,41,0.03)] transition hover:shadow-[0_4px_16px_-8px_rgba(15,23,41,0.15)]"
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`text-[11px] font-medium uppercase tracking-wide text-control-ink/45 ${
            tooltip ? "w-fit border-b border-dotted border-control-ink/25 pb-px" : ""
          }`}
        >
          {label}
        </p>
        {Icon && (
          <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
            <Icon className="size-3.5" strokeWidth={2} />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-control-ink tabular-nums">
        {value}
      </p>
      {delta !== undefined && (
        <p className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${deltaColor}`}>
          <DeltaIcon className="size-3" strokeWidth={2.5} />
          {Math.abs(delta).toFixed(1)}% vs. mês anterior
        </p>
      )}
    </HoverTooltip>
  );
}
