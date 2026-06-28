"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";
import { ThemeToggle } from "./ThemeToggle";

type NavItem = { href: string; icon: string; key?: TranslationKey; th?: string; en?: string };

const navItems: NavItem[] = [
  { href: "/", key: "nav_home", icon: "H" },
  { href: "/dashboard", key: "nav_dashboard", icon: "D" },
  { href: "/daily", key: "nav_daily", icon: "DY" },
  { href: "/concerts", key: "nav_concerts", icon: "🎤" },
  { href: "/movies", key: "nav_movies", icon: "🎬" },
  { href: "/events", key: "nav_events", icon: "EV" },
  { href: "/notifications", key: "nav_notifications", icon: "N" },
  { href: "/settings", key: "nav_settings", icon: "S" },
  { href: "/admin", key: "nav_admin", icon: "A" },
];

interface SidebarProps { mobile?: boolean; onNavigate?: () => void; }

export function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { t, lang } = useLanguage();

  return (
    <aside className={cn("daily-sidebar border-r border-white/10 bg-slate-950/80 backdrop-blur-2xl", mobile ? "flex h-full w-full flex-col p-4" : "fixed left-0 top-0 hidden h-screen w-72 flex-col p-5 lg:flex")}>
      <Link href="/dashboard" className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-white/[0.04]" onClick={onNavigate}>
        <div className="daily-logo relative grid h-12 w-12 grid-cols-2 gap-0.5 rounded-xl border border-cyan-200/20 bg-slate-950/40 p-1 shadow-[0_0_28px_rgba(34,211,238,0.22)]">
          <span className="rounded-sm bg-cyan-300" />
          <span className="rounded-sm bg-blue-400" />
          <span className="rounded-sm bg-emerald-300" />
          <span className="rounded-sm bg-violet-500" />
        </div>
        <div><p className="text-2xl font-extrabold text-white">NimbusDaily</p><p className="text-xs text-cyan-100/60">{t("sidebar_build_label")}</p></div>
      </Link>

      <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.065] p-4">
        <p className="text-xs font-bold uppercase text-cyan-200">{t("sidebar_phase")}</p>
        <p className="mt-2 text-sm leading-7 text-slate-300">{t("sidebar_desc")}</p>
      </div>

      <nav className="mt-7 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const label = item.key ? t(item.key) : (lang === "th" ? item.th : item.en);
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={cn("group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all", isActive ? "border border-cyan-300/25 bg-cyan-300/[0.10] text-white shadow-[0_0_26px_rgba(34,211,238,0.10)]" : "text-slate-400 hover:bg-white/[0.06] hover:text-white")}>
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] font-extrabold transition", isActive ? "border-cyan-300/25 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.035] text-slate-400 group-hover:text-white")}>{item.icon}</span>
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-5 border-t border-white/10 pt-5">
        <p className="text-xs font-bold text-white">Design System</p>
        <div className="mt-3 flex gap-2">
          {["bg-cyan-300", "bg-sky-400", "bg-blue-500", "bg-violet-500", "bg-purple-500"].map((color) => (
            <span key={color} className={cn("h-5 w-5 rounded-full shadow-lg", color)} />
          ))}
        </div>
        <p className="mt-4 text-xs font-bold text-slate-400">{lang === "th" ? "ธีม" : "Theme"}</p>
        <div className="mt-2">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
