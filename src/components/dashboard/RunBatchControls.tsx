"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import type { ScheduledTask } from "@/types/scheduled-task";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/contexts/LanguageContext";

type TaskSeed = {
  key: string;
  labelTh: string;
  labelEn: string;
  emoji: string;
  name: string;
  type: ScheduledTask["type"];
};

const DEFAULT_TASKS: TaskSeed[] = [
  { key: "daily-brief", labelTh: "Morning Daily Brief", labelEn: "Morning Daily Brief", emoji: "📰", name: "Morning Daily Brief", type: "Daily Brief" },
  { key: "global-product-radar", labelTh: "สินค้าใหม่/น่าสนใจทั่วโลก", labelEn: "Global Product Radar", emoji: "🌍", name: "สินค้าใหม่/น่าสนใจทั่วโลก", type: "Sale Monitor" },
  { key: "weekend-ideas", labelTh: "Weekend Ideas Generator", labelEn: "Weekend Ideas Generator", emoji: "🧭", name: "Weekend Ideas Generator", type: "Weekend Ideas" },
  { key: "email-monitor", labelTh: "Important Email Monitor", labelEn: "Important Email Monitor", emoji: "📧", name: "Important Email Monitor", type: "Email Monitor" },
  { key: "concert-alerts", labelTh: "Concert Alerts Near Me", labelEn: "Concert Alerts Near Me", emoji: "🎤", name: "Concert Alerts Near Me", type: "Concert Alerts" },
  { key: "football-recap", labelTh: "Football Recap Nightly", labelEn: "Football Recap Nightly", emoji: "⚽", name: "Football Recap Nightly", type: "World Cup Recap" },
  { key: "weekend-long-read", labelTh: "Weekend Long Read Picker", labelEn: "Weekend Long Read Picker", emoji: "📚", name: "Weekend Long Read Picker", type: "Weekend Long Read" },
];

const FIXED_BATCHES = [
  {
    id: "one" as const,
    titleTh: "ปุ่มแรก",
    titleEn: "First button",
    subtitleTh: "Daily Brief / Product / Weekend Ideas / Email",
    subtitleEn: "Daily Brief / Product / Weekend Ideas / Email",
    keys: ["daily-brief", "global-product-radar", "weekend-ideas", "email-monitor"],
  },
  {
    id: "two" as const,
    titleTh: "ปุ่มสอง",
    titleEn: "Second button",
    subtitleTh: "Concert / Football / Long Read",
    subtitleEn: "Concert / Football / Long Read",
    keys: ["concert-alerts", "football-recap", "weekend-long-read"],
  },
];

const nativeButtonClass = "relative z-50 inline-flex min-h-12 min-w-[9.5rem] shrink-0 items-center justify-center whitespace-nowrap rounded-2xl border border-white/15 bg-white/[0.08] px-6 py-3 text-sm font-black text-white shadow-lg shadow-black/20 transition hover:border-cyan-300/40 hover:bg-cyan-300/15 active:scale-[0.98]";
const nativePrimaryButtonClass = "relative z-50 inline-flex min-h-12 min-w-[11rem] shrink-0 items-center justify-center whitespace-nowrap rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95 active:scale-[0.98]";

function getBatchSeeds(keys: string[]) {
  return keys.map((key) => DEFAULT_TASKS.find((task) => task.key === key)).filter(Boolean) as TaskSeed[];
}

function matchesTask(task: ScheduledTask, seed: TaskSeed) {
  return task.type === seed.type || task.name.toLowerCase() === seed.name.toLowerCase();
}

function taskLines(seeds: TaskSeed[], isTh: boolean) {
  return seeds.map((seed, index) => `${index + 1}. ${seed.emoji} ${isTh ? seed.labelTh : seed.labelEn}`);
}

function BatchForm({ batch, label, primary = false }: { batch: "one" | "two" | "all"; label: string; primary?: boolean }) {
  return (
    <form action="/api/scheduled-tasks/run-batch" className="relative z-50 shrink-0" method="post">
      <input name="batch" type="hidden" value={batch} />
      <input name="redirect" type="hidden" value="/dashboard" />
      <button className={primary ? nativePrimaryButtonClass : nativeButtonClass} type="submit">
        {label}
      </button>
    </form>
  );
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

  useEffect(() => {
    void loadTasks().catch((error) => setMessage(toErrorMessage(error)));
  }, []);

  useEffect(() => {
    setMessage(t("batch_ready"));
  }, [lang, t]);

  const resolvedBatches = useMemo(
    () =>
      FIXED_BATCHES.map((batch) => {
        const seeds = getBatchSeeds(batch.keys);
        const foundCount = seeds.filter((seed) => tasks.some((task) => matchesTask(task, seed))).length;
        return { ...batch, seeds, foundCount };
      }),
    [tasks],
  );

  const readyCount = resolvedBatches.reduce((total, batch) => total + batch.foundCount, 0);

  return (
    <Card className="relative overflow-hidden border-emerald-300/20 bg-emerald-300/[0.05] p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative z-10 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="green">⚡ {t("batch_badge")}</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">{t("batch_title")}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{t("batch_desc")}</p>
          </div>
          <BatchForm batch="all" label={`🚀 ${t("batch_run_all")}`} primary />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {resolvedBatches.map((batch) => {
            const missingCount = batch.seeds.length - batch.foundCount;
            const batchTitle = isTh ? batch.titleTh : batch.titleEn;
            const buttonLabel = `▶ ${isTh ? "รัน" : "Run "}${batchTitle}`;
            return (
              <div key={batch.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 shadow-2xl shadow-black/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">{batchTitle}</p>
                    <h3 className="mt-1 text-lg font-black text-white">{isTh ? batch.subtitleTh : batch.subtitleEn}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {isTh
                        ? `พร้อม ${batch.foundCount}/${batch.seeds.length} หัวข้อ${missingCount ? ` · ขาด ${missingCount} ระบบจะเติมให้ตอนกดรัน` : ""}`
                        : `Ready ${batch.foundCount}/${batch.seeds.length} topic(s)${missingCount ? ` · missing ${missingCount}, will create before running` : ""}`}
                    </p>
                  </div>
                  <BatchForm batch={batch.id} label={buttonLabel} />
                </div>

                <div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                  {taskLines(batch.seeds, isTh).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-300">
          {message} · {isTh ? `มี task ในระบบตอนนี้ ${readyCount}/7` : `Current tasks in system ${readyCount}/7`}
        </div>
      </div>
    </Card>
  );
}
