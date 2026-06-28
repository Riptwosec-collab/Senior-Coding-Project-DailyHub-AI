"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

const navItems = [
  { href: "/", key: "nav_home" },
  { href: "/dashboard", key: "nav_dashboard" },
  { href: "/daily", key: "nav_daily" },
  { href: "/concerts", key: "nav_concerts" },
  { href: "/scheduled-tasks", key: "nav_scheduled_tasks" },
] satisfies Array<{ href: string; key: TranslationKey }>;

const shortLabels = {
  th: {
    nav_home: "หน้าแรก",
    nav_dashboard: "แดช",
    nav_daily: "ข่าว",
    nav_concerts: "คอน",
    nav_scheduled_tasks: "งาน",
  },
  en: {
    nav_home: "Home",
    nav_dashboard: "Dash",
    nav_daily: "Daily",
    nav_concerts: "Live",
    nav_scheduled_tasks: "Tasks",
  },
} as const;

export function MobileNav() {
  const { lang, t } = useLanguage();
  return (
    <nav className="fixed bottom-3 left-3 right-3 z-30 grid grid-cols-5 rounded-xl border border-white/10 bg-slate-950/90 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl lg:hidden">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} className="rounded-lg px-2 py-2 text-center text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white">
          {shortLabels[lang][item.key] ?? t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
