// Tokens de UI reutilizados em toda a aplicação — mantém consistência visual
// entre páginas sem precisar repetir classes Tailwind longas.

export const inputClass =
  "w-full rounded-[10px] border border-control-line bg-control-surface px-3 py-2 text-sm text-control-ink shadow-[0_1px_2px_rgba(15,23,41,0.04)] transition placeholder:text-control-ink/30 focus:border-control-blue-500 focus:outline-none focus:ring-4 focus:ring-control-blue-500/10";

export const selectClass = `${inputClass} cursor-pointer appearance-none`;

export const labelClass =
  "mb-1.5 block text-[13px] font-medium text-control-ink/60";

export const sectionTitleClass =
  "text-[13px] font-semibold uppercase tracking-wide text-control-ink/45";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-control-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(37,84,240,0.25),0_4px_10px_-4px_rgba(37,84,240,0.35)] transition hover:bg-control-blue-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-control-line bg-control-surface px-4 py-2 text-sm font-medium text-control-ink/80 shadow-sm transition hover:bg-control-bg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export const ghostButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-control-ink/55 transition hover:bg-control-ink/5 hover:text-control-ink disabled:pointer-events-none disabled:opacity-50";

export const dangerButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-control-danger-600/20 bg-control-danger-100 px-3 py-1.5 text-xs font-semibold text-control-danger-600 transition hover:bg-control-danger-600 hover:text-white disabled:pointer-events-none disabled:opacity-50";

export const cardClass =
  "rounded-2xl border border-control-line bg-control-surface p-5 shadow-[0_1px_2px_rgba(15,23,41,0.03),0_8px_24px_-16px_rgba(15,23,41,0.08)]";

export const subtleCardClass =
  "rounded-xl border border-control-line bg-control-bg/60 p-3";

export const tableWrapClass = "overflow-x-auto rounded-xl border border-control-line";

export const theadRowClass =
  "border-b border-control-line bg-control-bg/70 text-[11px] font-semibold uppercase tracking-wide text-control-ink/45";

export const thClass = "px-3 py-2.5 text-left";

export const trClass = "border-b border-control-line/70 last:border-0 transition hover:bg-control-blue-50/40";

export const tdClass = "px-3 py-2.5 align-middle";
