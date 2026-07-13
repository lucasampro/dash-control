export type Variant = "success" | "danger" | "warning" | "neutral" | "blue" | "gold";

const styles: Record<Variant, string> = {
  success: "bg-control-success-100 text-control-success-600",
  danger: "bg-control-danger-100 text-control-danger-600",
  warning: "bg-control-warning-100 text-control-warning-600",
  neutral: "bg-control-neutral-100 text-control-neutral-600",
  blue: "bg-control-blue-100 text-control-blue-700",
  gold: "bg-control-gold-100 text-control-gold-600",
};

export function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
