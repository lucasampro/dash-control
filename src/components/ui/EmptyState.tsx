import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-control-blue-50 text-control-blue-600">
        <Icon className="size-5" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-control-ink/70">{title}</p>
      {description && (
        <p className="max-w-xs text-xs text-control-ink/40">{description}</p>
      )}
    </div>
  );
}
