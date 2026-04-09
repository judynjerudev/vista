export type BadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "info"
  | "danger";

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "bg-gray-100 text-gray-600",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-sky-50 text-sky-700",
  danger: "bg-rose-50 text-rose-600",
};

const dotStyles: Record<BadgeVariant, string> = {
  neutral: "bg-gray-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  danger: "bg-rose-500",
};

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

export const Badge = ({ label, variant = "neutral" }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-[3px] text-[11px] font-semibold tracking-wide ${variantStyles[variant]}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotStyles[variant]}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
};
