type StatVariant = "default" | "active" | "blocked" | "completed";

const variantConfig: Record<
  StatVariant,
  {
    card: string;
    accentBar: string;
    ghost: string;
    label: string;
    value: string;
    blob: string;
  }
> = {
  default: {
    card: "bg-[#0d0d10] border-white/[0.05] shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
    accentBar: "bg-gradient-to-r from-slate-400 via-slate-300 to-transparent",
    ghost: "text-white/[0.06]",
    label: "text-white/55",
    value: "text-white",
    blob: "bg-[#5b4eff]/[0.12]",
  },
  active: {
    card: "bg-white border-black/[0.05] shadow-[0_4px_24px_rgba(0,0,0,0.06)]",
    accentBar: "bg-gradient-to-r from-amber-400 via-orange-400 to-transparent",
    ghost: "text-amber-200/70",
    label: "text-gray-500",
    value: "text-gray-900",
    blob: "bg-amber-400/[0.08]",
  },
  blocked: {
    card: "bg-white border-black/[0.05] shadow-[0_4px_24px_rgba(0,0,0,0.06)]",
    accentBar: "bg-gradient-to-r from-rose-400 via-rose-400 to-transparent",
    ghost: "text-rose-200/70",
    label: "text-gray-500",
    value: "text-gray-900",
    blob: "bg-rose-400/[0.07]",
  },
  completed: {
    card: "bg-[#052e22] border-white/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
    accentBar: "bg-gradient-to-r from-emerald-400 via-teal-300 to-transparent",
    ghost: "text-white/[0.06]",
    label: "text-teal-200/65",
    value: "text-white",
    blob: "bg-emerald-400/[0.1]",
  },
};

type StatisticsCardProps = {
  label: string;
  value: number;
  variant?: StatVariant;
};
export const StatisticsCard = ({
  label,
  value,
  variant = "default",
}: StatisticsCardProps) => {
  const config = variantConfig[variant];
  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border px-[28px] py-normal",
        "transition-all duration-300 hover:-translate-y-1",
        config.card,
      ].join(" ")}
    >
      <div
        className={`pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full blur-2xl ${config.blob}`}
        aria-hidden="true"
      />
      <span
        className={`pointer-events-none absolute -bottom-5 -right-2 select-none font-black leading-none -rotate-[8deg] ${config.ghost}`}
        style={{ fontSize: "8rem" }}
        aria-hidden="true"
      >
        {value}
      </span>
      <div
        className={`mb-normal h-[3px] w-20 rounded-full ${config.accentBar}`}
      />
      <p
        className={`text-xs-sm font-bold uppercase tracking-[0.16em] ${config.label}`}
      >
        {label}
      </p>
      <p
        className={`mt-small text-[41.6px] font-black leading-none tracking-tight ${config.value}`}
      >
        {value}
      </p>
    </div>
  );
};
