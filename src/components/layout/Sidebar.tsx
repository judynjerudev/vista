import type { ReactNode } from "react";

export type NavigationItem = {
  label: string;
  icon: ReactNode;
  href: string;
  isActive?: boolean;
};

type SidebarProps = {
  title: string;
  logo: ReactNode;
  items: NavigationItem[];
  onNavigate: (href: string) => void;
};

export const Sidebar = ({ title, logo, items, onNavigate }: SidebarProps) => {
  return (
    <aside className="relative flex w-[15rem] shrink-0 flex-col overflow-hidden bg-[#0d0d10]">
      <div
        className="pointer-events-none absolute -top-10 -left-10 h-44 w-44 rounded-full bg-[#5b4eff] opacity-[0.07] blur-3xl"
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-16 items-center gap-3 border-b border-white/[0.06] px-relaxed">
        <div className="flex h-[2.1rem] w-[2.1rem] shrink-0 items-center justify-center rounded-[10px] bg-white/[0.09] ring-1 ring-white/[0.1]">
          <span className="text-white/70">{logo}</span>
        </div>
        <span className="text-sm font-bold tracking-tight text-white">
          {title}
        </span>
      </div>
      <nav className="relative z-10 flex-1 space-y-0.5 px-3 py-3">
        {items.map((item) => (
          <button
            key={item.href}
            onClick={() => onNavigate(item.href)}
            className={[
              "focusable group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              item.isActive
                ? "bg-gradient-to-r from-white/[0.11] to-white/[0.03] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
                : "text-white/40 hover:bg-white/[0.05] hover:text-white/75",
            ].join(" ")}
          >
            {item.isActive && (
              <span
                className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[#5b4eff] shadow-[0_0_10px_rgba(91,78,255,0.8)]"
                aria-hidden="true"
              />
            )}
            <span className="shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="relative z-10 border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04]">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5b4eff] text-[9px] font-bold text-white shadow-[0_0_0_1.5px_rgba(91,78,255,0.45)]">
            JN
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold leading-tight text-white/55 truncate">
              My Account
            </p>
          </div>
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]"
            aria-label="Online"
          />
        </div>
        <p className="mt-1 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/15">
          v1.0
        </p>
      </div>
    </aside>
  );
};
