"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import type { ScheduledTask } from "@/types/scheduled-task";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/contexts/LanguageContext";

type TaskSeed = { key: string; labelTh: string; labelEn: string; emoji: string; name: string; type: ScheduledTask["type"] };

const DEFAULT_TASKS: TaskSeed[] = [
  { key: "daily-brief", labelTh: "Morning Daily Brief / ข่าวโลกน่าสนใจ", labelEn: "Morning Daily Brief / Global News", emoji: "📰", name: "Morning Daily Brief", type: "Daily Brief" },
  { key: "global-product-radar", labelTh: "สินค้าเทคโนโลยี/นวัตกรรมทั่วโลก", labelEn: "Global Innovation Product Radar", emoji: "🌍", name: "สินค้าใหม่/น่าสนใจทั่วโลก", type: "Sale Monitor" },
  { key: "us-market-news", labelTh: "ข่าวตลาดสหรัฐ", labelEn: "US Market News", emoji: "📈", name: "US Stock News Brief", type: "Weekend Ideas" },
  { key: "email-monitor", labelTh: "สรุปทุกเมลรายวัน", labelEn: "Daily Email Digest", emoji: "📧", name: "Daily Email Digest", type: "Email Monitor" },
  { key: "concert-alerts", labelTh: "คอนเสิร์ตในไทย", labelEn: "Thailand Concert Alerts", emoji: "🎤", name: "Thailand Concert Alerts", type: "Concert Alerts" },
  { key: "football-recap", labelTh: "ข่าวบอลไทย/บอลโลก/ลีกใหญ่", labelEn: "Thai & Global Football News", emoji: "⚽", name: "Football Recap Nightly", type: "World Cup Recap" },
  { key: "weekend-long-read", labelTh: "Weekend Long Read Picker", labelEn: "Weekend Long Read Picker", emoji: "📚", name: "Weekend Long Read Picker", type: "Weekend Long Read" },
];

const FIXED_BATCHES = [
  { id: "one" as const, titleTh: "ปุ่มแรก", titleEn: "First button", subtitleTh: "ข่าวโลก / สินค้านวัตกรรม / ตลาดสหรัฐ / อีเมลรายวัน", subtitleEn: "Global News / Innovation Products / US Market / Daily Email", keys: ["daily-brief", "global-product-radar", "us-market-news", "email-monitor"] },
  { id: "two" as const, titleTh: "ปุ่มสอง", titleEn: "Second button", subtitleTh: "คอนเสิร์ตไทย / ข่าวฟุตบอล / Long Read", subtitleEn: "Thailand Concerts / Football News / Long Read", keys: ["concert-alerts", "football-recap", "weekend-long-read"] },
];

function getBatchSeeds(keys: string[]) { return keys.map((key) => DEFAULT_TASKS.find((task) => task.key === key)).filter(Boolean) as TaskSeed[]; }
function matchesTask(task: ScheduledTask, seed: TaskSeed) { return task.type === seed.type || task.name.toLowerCase() === seed.name.toLowerCase(); }
function taskLines(seeds: TaskSeed[], isTh: boolean) { return seeds.map((seed, index) => `${index + 1}. ${seed.emoji} ${isTh ? seed.labelTh : seed.labelEn}`); }
function runUrl(batch: "one" | "two" | "all") { return `/api/scheduled-tasks/run-batch?batch=${batch}&redirect=/dashboard`; }

function RunButton({ href, label, primary = false }: { href: string; label: string; primary?: boolean }) {
  return <a className={primary ? "inline-flex min-h-12 min-w-[11rem] shrink-0 items-center justify-center whitespace-nowrap rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95 active:scale-[0.98]" : "inline-flex min-h-12 min-w-[9.5rem] shrink-0 items-center justify-center whitespace-nowrap rounded-2xl border border-white/15 bg-white/[0.12] px-6 py-3 text-sm font-black text-white shadow-lg shadow-black/20 transition hover:border-cyan-300/50 hover:bg-cyan-300/20 active:scale-[0.98]"} href={href}>{label}</a>;
}

export function RunBatchControls() {
  const { lang, t } = useLanguage();
  const isTh = lang === "th";
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [message, setMessage] = useState(t("batch_ready"));

  async function loadTasks() {
    const data = await apiRequest<ScheduledTask[]>("/api/scheduled-tasks");
    setTasks(data);
  }

  useEffect(() => { void loadTasks().catch((error) => setMessage(toErrorMessage(error))); }, []);
  useEffect(() => { setMessage(t("batch_ready")); }, [lang, t]);

  const resolvedBatches = useMemo(() => FIXED_BATCHES.map((batch) => {
    const seeds = getBatchSeeds(batch.keys);
    const foundCount = seeds.filter((seed) => tasks.some((task) => matchesTask(task, seed))).length;
    return { ...batch, seeds, foundCount };
  }), [tasks]);

  const readyCount = resolvedBatches.reduce((total, batch) => total + batch.foundCount, 0);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.05] p-5 shadow-2xl shadow-cyan-950/20 sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><Badge tone="green">⚡ {t("batch_badge")}</Badge><h2 className="mt-3 text-2xl font-black text-white">{t("batch_title")}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{t("batch_desc")}</p></div><RunButton href={runUrl("all")} label={`🚀 ${t("batch_run_all")}`} primary /></div>
        <div className="grid gap-3 lg:grid-cols-2">
          {resolvedBatches.map((batch) => {
            const missingCount = batch.seeds.length - batch.foundCount;
            const batchTitle = isTh ? batch.titleTh : batch.titleEn;
            const buttonLabel = `▶ ${isTh ? "รัน" : "Run "}${batchTitle}`;
            return <a key={batch.id} aria-label={buttonLabel} className="block cursor-pointer rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-inherit shadow-2xl shadow-black/20 transition hover:border-cyan-300/45 hover:bg-cyan-300/[0.08]" href={runUrl(batch.id)}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">{batchTitle}</p><h3 className="mt-1 text-lg font-black text-white">{isTh ? batch.subtitleTh : batch.subtitleEn}</h3><p className="mt-1 text-xs text-slate-400">{isTh ? `พร้อม ${batch.foundCount}/${batch.seeds.length} หัวข้อ${missingCount ? ` · ขาด ${missingCount} ระบบจะเติมให้ตอนกดรัน` : ""}` : `Ready ${batch.foundCount}/${batch.seeds.length} topic(s)${missingCount ? ` · missing ${missingCount}, will create before running` : ""}`}</p></div><span className="inline-flex min-h-12 min-w-[9.5rem] shrink-0 items-center justify-center whitespace-nowrap rounded-2xl border border-white/15 bg-white/[0.12] px-6 py-3 text-sm font-black text-white shadow-lg shadow-black/20">{buttonLabel}</span></div><div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">{taskLines(batch.seeds, isTh).map((line) => <p key={line}>{line}</p>)}</div><p className="mt-4 text-xs font-bold text-cyan-200">{isTh ? "กดตรงไหนในการ์ดนี้ก็รันได้" : "Click anywhere on this card to run"}</p></a>;
          })}
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-300">{message} · {isTh ? `มี task ในระบบตอนนี้ ${readyCount}/7` : `Current tasks in system ${readyCount}/7`}</div>
      </div>
    </section>
  );
}
