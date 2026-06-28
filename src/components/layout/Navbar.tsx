"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

const navItems = [
  { href: "/", key: "nav_home" },
  { href: "/dashboard", key: "nav_dashboard" },
  { href: "/daily", key: "nav_daily" },
  { href: "/concerts", key: "nav_concerts" },
  { href: "/movies", key: "nav_movies" },
  { href: "/scheduled-tasks", key: "nav_scheduled_tasks" },
  { href: "/task-results", key: "nav_task_results" },
  { href: "/notifications", key: "nav_notifications" },
] satisfies Array<{ href: string; key: TranslationKey }>;

export function Navbar() {
  const { lang, t } = useLanguage();
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-600 text-sm font-black text-white shadow-lg shadow-cyan-500/20">
            AI
          </div>
          <div>
            <p className="font-black leading-tight text-white">NimbusDaily</p>
            <p className="text-xs text-slate-400">{lang === "th" ? "ระบบข่าวและงานอัตโนมัติ" : "News and automation OS"}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <Link href="/dashboard">
          <Button>{lang === "th" ? "เปิดแดชบอร์ด" : "Open Dashboard"}</Button>
        </Link>
      </div>
    </header>
  );
}
