"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

const navItems: { href: string; key: TranslationKey; icon: string }[] = [
  { href: "/", key: "nav_home", icon: "⌂" },
  { href: "/dashboard", key: "nav_dashboard", icon: "◈" },
  { href: "/scheduled-tasks", key: "nav_scheduled_tasks", icon: "⏱" },
  { href: "/scheduled-tasks/create", key: "nav_create_task", icon: "+" },
  { href: "/templates", key: "nav_templates", icon: "▣" },
  { href: "/task-results", key: "nav_task_results", icon: "◎" },
  { href: "/notifications", key: "nav_notifications", icon: "●" },
  { href: "/settings", key: "nav_settings", icon: "⚙" },
  { href: "/admin", key: "nav_admin", icon: "◇" },
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
        "border-r border-white/10 bg-slate-950/70 backdrop-blur-2xl",
        mobile ? "h-full w-full p-4" : "fixed left-0 top-0 hidden h-screen w-72 p-5 lg:block",
      )}
    >
      <Link href="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 text-lg font-black text-white shadow-[0_0_40px_rgba(34,211,238,0.35)]">
          AI
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-slate-950 bg-emerald-400" />
        </div>
        <div>
          <p className="text-lg font-black tracking-tight text-white">Nimbus Daily</p>
          <p className="text-xs text-cyan-100/60">{t("sidebar_build_label")}</p>
        </div>
      </Link>

      <div className="mt-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.08] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">{t("sidebar_phase")}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{t("sidebar_desc")}</p>
      </div>

      <nav className="mt-7 space-y-2">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                isActive ? "border border-cyan-300/30 bg-white/[0.10] text-white shadow-[0_0_32px_rgba(34,211,238,0.16)]" : "text-slate-400 hover:bg-white/[0.07] hover:text-white",
              )}
            >
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl border text-xs transition", isActive ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-400 group-hover:text-white")}>{item.icon}</span>
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
