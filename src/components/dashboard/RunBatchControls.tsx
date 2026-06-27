"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import type { ScheduledTask } from "@/types/scheduled-task";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/contexts/LanguageContext";

type TaskSeed = { key: string; labelTh: string; labelEn: string; emoji: string; name: string; type: ScheduledTask["type"] };

const DEFAULT_TASKS: TaskSeed[] = [
  { key: "daily-brief", labelTh: "Daily Brief / ข่าวประจำวัน", labelEn: "Daily Brief / News Hub", emoji: "📰", name: "Daily Brief / ข่าวประจำวัน", type: "Daily Brief" },
  { key: "thai-news", labelTh: "ข่าวไทยวันนี้", labelEn: "Thailand News Today", emoji: "📰", name: "ข่าวไทยวันนี้", type: "Daily Brief" },
  { key: "public-notices", labelTh: "ประกาศสำคัญ / แจ้งเตือนรัฐ", labelEn: "Public Notices / Official Alerts", emoji: "📢", name: "ประกาศสำคัญ / แจ้งเตือนรัฐ", type: "Daily Brief" },
  { key: "world-news", labelTh: "ข่าวต่างประเทศ", labelEn: "World News", emoji: "🌍", name: "ข่าวต่างประเทศ", type: "Daily Brief" },
  { key: "ai-tech", labelTh: "AI / Tech Update", labelEn: "AI / Tech Update", emoji: "🤖", name: "AI / Tech Update", type: "Daily Brief" },
  { key: "cybersecurity", labelTh: "Cybersecurity Alert", labelEn: "Cybersecurity Alert", emoji: "🛡️", name: "Cybersecurity Alert", type: "Daily Brief" },
  { key: "network-cloud", labelTh: "Network / Cloud News", labelEn: "Network / Cloud News", emoji: "🌐", name: "Network / Cloud News", type: "Daily Brief" },
  { key: "market-crypto", labelTh: "หุ้น / ตลาด / Crypto", labelEn: "Stocks / Markets / Crypto", emoji: "📈", name: "หุ้น / ตลาด / Crypto", type: "US Stock News" },
  { key: "weather-pm25", labelTh: "อากาศ / PM2.5", labelEn: "Weather / PM2.5", emoji: "🌦️", name: "อากาศ / PM2.5", type: "Daily Brief" },
  { key: "traffic", labelTh: "เดินทาง / จราจร", labelEn: "Commute / Traffic", emoji: "🚗", name: "เดินทาง / จราจร", type: "Daily Brief" },
  { key: "bts-mrt-alerts", labelTh: "BTS/MRT ขัดข้อง", labelEn: "BTS/MRT Service Alerts", emoji: "🚆", name: "BTS/MRT ขัดข้อง", type: "Daily Brief" },
  { key: "today-tasks", labelTh: "งานวันนี้", labelEn: "Today Tasks", emoji: "📅", name: "งานวันนี้", type: "Daily Brief" },
  { key: "important-email", labelTh: "อีเมลสำคัญ", labelEn: "Important Email", emoji: "📧", name: "อีเมลสำคัญ", type: "Email Monitor" },
  { key: "sports-football", labelTh: "กีฬา / ฟุตบอล", labelEn: "Sports / Football", emoji: "⚽", name: "กีฬา / ฟุตบอล", type: "World Cup Recap" },
  { key: "events-products", labelTh: "อีเวนต์ / คอนเสิร์ต / สินค้าใหม่", labelEn: "Events / Concerts / New Products", emoji: "🎤", name: "อีเวนต์ / คอนเสิร์ต / สินค้าใหม่", type: "Concert Alerts" },
  { key: "deals-promos", labelTh: "ดีล / โปรโมชัน", labelEn: "Deals / Promotions", emoji: "🛒", name: "ดีล / โปรโมชัน", type: "Sale Monitor" },
  { key: "public-alerts", labelTh: "ประกาศสำคัญ / แจ้งเตือนรัฐ / BTS-MRT", labelEn: "Public Alerts / Government / BTS-MRT", emoji: "📢", name: "ประกาศสำคัญ / แจ้งเตือนรัฐ / BTS-MRT", type: "Public Alerts" },
  { key: "travel-deals", labelTh: "โปรเดินทาง / ตั๋วเครื่องบิน / โรงแรม", labelEn: "Travel Deals / Flights / Hotels", emoji: "✈️", name: "โปรเดินทาง / ตั๋วเครื่องบิน / โรงแรม", type: "Travel Deals" },
];

const FIXED_BATCHES = [
  { id: "one" as const, titleTh: "ปุ่มแรก", titleEn: "First button", subtitleTh: "Daily Brief / ข่าวไทย / ประกาศสำคัญ / ข่าวต่างประเทศ / AI Tech", subtitleEn: "Daily Brief / Thailand / Public Notices / World / AI Tech", keys: ["daily-brief", "thai-news", "public-notices", "world-news", "ai-tech"] },
  { id: "two" as const, titleTh: "ปุ่มสอง", titleEn: "Second button", subtitleTh: "Cybersecurity / Network Cloud / หุ้น Crypto / อากาศ PM2.5", subtitleEn: "Cybersecurity / Network Cloud / Markets Crypto / Weather PM2.5", keys: ["cybersecurity", "network-cloud", "market-crypto", "weather-pm25"] },
  { id: "three" as const, titleTh: "ปุ่มสาม", titleEn: "Third button", subtitleTh: "จราจร / BTS MRT / งานวันนี้ / อีเมลสำคัญ / กีฬา", subtitleEn: "Traffic / BTS MRT / Today Tasks / Important Email / Sports", keys: ["traffic", "bts-mrt-alerts", "today-tasks", "important-email", "sports-football"] },
  { id: "four" as const, titleTh: "ปุ่มสี่", titleEn: "Fourth button", subtitleTh: "อีเวนต์ คอนเสิร์ต สินค้าใหม่ / ดีล / ประกาศรัฐ / โปรเดินทาง", subtitleEn: "Events Concerts Products / Deals / Public Alerts / Travel Deals", keys: ["events-products", "deals-promos", "public-alerts", "travel-deals"] },
];

function getBatchSeeds(keys: string[]) { return keys.map((key) => DEFAULT_TASKS.find((task) => task.key === key)).filter(Boolean) as TaskSeed[]; }
function matchesTask(task: ScheduledTask, seed: TaskSeed) {
  const name = task.name.toLowerCase();
  if (name === seed.name.toLowerCase()) return true;
  if (seed.key === "daily-brief") return /morning daily brief|daily brief \/ ข่าวประจำวัน/i.test(task.name);
  if (seed.key === "market-crypto") return task.type === "US Stock News" || name === "us stock news";
  if (seed.key === "important-email") return task.type === "Email Monitor" && /email|อีเมล/i.test(task.name);
  if (seed.key === "sports-football") return task.type === "World Cup Recap" || /football|ฟุตบอล|กีฬา/i.test(task.name);
  if (seed.key === "events-products") return task.type === "Concert Alerts" || /concert|คอนเสิร์ต|อีเวนต์/i.test(task.name);
  if (seed.key === "deals-promos") return task.type === "Sale Monitor" && /deal|promo|โปร|สินค้า/i.test(task.name);
  if (seed.key === "public-alerts") return task.type === "Public Alerts" || /ประกาศ|แจ้งเตือนรัฐ|bts|mrt|public alert/i.test(task.name);
  if (seed.key === "travel-deals") return task.type === "Travel Deals" || /flight|hotel|travel|ตั๋วเครื่องบิน|โรงแรม|โปรเดินทาง|ท่องเที่ยว/i.test(task.name);
  return false;
}
function displayLine(seed: TaskSeed, index: number, isTh: boolean) { return `${index + 1}. ${seed.emoji} ${isTh ? seed.labelTh : seed.labelEn}`; }
function runUrl(batch: "one" | "two" | "three" | "four" | "all") { return `/api/scheduled-tasks/run-batch?batch=${batch}&redirect=/dashboard`; }

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
  const topicCount = resolvedBatches.reduce((total, batch) => total + batch.seeds.length, 0);

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
            return <a key={batch.id} aria-label={buttonLabel} className="block cursor-pointer rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-inherit shadow-2xl shadow-black/20 transition hover:border-cyan-300/45 hover:bg-cyan-300/[0.08]" href={runUrl(batch.id)}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">{batchTitle}</p><h3 className="mt-1 text-lg font-black text-white">{isTh ? batch.subtitleTh : batch.subtitleEn}</h3><p className="mt-1 text-xs text-slate-400">{isTh ? `พร้อม ${batch.foundCount}/${batch.seeds.length} หัวข้อ${missingCount ? ` · ขาด ${missingCount} ระบบจะเติมให้ตอนกดรัน` : ""}` : `Ready ${batch.foundCount}/${batch.seeds.length} topic(s)${missingCount ? ` · missing ${missingCount}, will create before running` : ""}`}</p></div><span className="inline-flex min-h-12 min-w-[9.5rem] shrink-0 items-center justify-center whitespace-nowrap rounded-2xl border border-white/15 bg-white/[0.12] px-6 py-3 text-sm font-black text-white shadow-lg shadow-black/20">{buttonLabel}</span></div><div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">{batch.seeds.map((seed, index) => <p key={seed.key}>{displayLine(seed, index, isTh)}</p>)}</div><p className="mt-4 text-xs font-bold text-cyan-200">{isTh ? "กดตรงไหนในการ์ดนี้ก็รันได้" : "Click anywhere on this card to run"}</p></a>;
          })}
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-300">{message} · {isTh ? `มี task ในระบบตอนนี้ ${readyCount}/${topicCount}` : `Current tasks in system ${readyCount}/${topicCount}`}</div>
      </div>
    </section>
  );
}
