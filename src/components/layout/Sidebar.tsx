"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

const navItems: { href: string; key: TranslationKey; icon: string }[] = [
  { href: "/", key: "nav_home", icon: "H" },
  { href: "/dashboard", key: "nav_dashboard", icon: "D" },
  { href: "/daily", key: "nav_daily", icon: "DY" },
  { href: "/data-library", key: "nav_data_library", icon: "DB" },
  { href: "/scheduled-tasks", key: "nav_scheduled_tasks", icon: "T" },
  { href: "/scheduled-tasks/create", key: "nav_create_task", icon: "+" },
  { href: "/templates", key: "nav_templates", icon: "TP" },
  { href: "/task-results", key: "nav_task_results", icon: "R" },
  { href: "/notifications", key: "nav_notifications", icon: "N" },
  { href: "/settings", key: "nav_settings", icon: "S" },
  { href: "/admin", key: "nav_admin", icon: "A" },
];

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside
      className={cn(
        "border-r border-white/10 bg-slate-950/80 backdrop-blur-2xl",
        mobile ? "h-full w-full p-4" : "fixed left-0 top-0 hidden h-screen w-72 p-5 lg:block",
      )}
    >
      <Link href="/dashboard" className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-white/[0.04]" onClick={onNavigate}>
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 text-sm font-black text-white shadow-[0_0_28px_rgba(34,211,238,0.22)]">
          DH
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-slate-950 bg-emerald-400" />
        </div>
        <div>
          <p className="text-lg font-extrabold text-white">DailyHub</p>
          <p className="text-xs text-cyan-100/60">{t("sidebar_build_label")}</p>
        </div>
      </Link>

      <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.065] p-4">
        <p className="text-xs font-bold uppercase text-cyan-200">{t("sidebar_phase")}</p>
        <p className="mt-2 text-sm leading-7 text-slate-300">{t("sidebar_desc")}</p>
      </div>

      <nav className="mt-7 space-y-1.5">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                isActive ? "border border-cyan-300/25 bg-cyan-300/[0.10] text-white shadow-[0_0_26px_rgba(34,211,238,0.10)]" : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] font-extrabold transition", isActive ? "border-cyan-300/25 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.035] text-slate-400 group-hover:text-white")}>{item.icon}</span>
              <span className="truncate">{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
