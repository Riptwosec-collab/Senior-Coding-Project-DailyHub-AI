"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import type { ScheduledTask } from "@/types/scheduled-task";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/contexts/LanguageContext";

type BatchId = "one" | "two" | "all";

type BatchResult = {
  batch: BatchId;
  summary: {
    requestedCount: number;
    sentCount: number;
    failedCount: number;
    createdCount: number;
  };
  results: Array<{
    taskName: string;
    taskType: string;
    status: string;
    telegramStatus: string;
    error?: string;
  }>;
};

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

function getBatchSeeds(keys: string[]) {
  return keys.map((key) => DEFAULT_TASKS.find((task) => task.key === key)).filter(Boolean) as TaskSeed[];
}

function matchesTask(task: ScheduledTask, seed: TaskSeed) {
  return task.type === seed.type || task.name.toLowerCase() === seed.name.toLowerCase();
}

function taskLines(seeds: TaskSeed[], isTh: boolean) {
  return seeds.map((seed, index) => `${index + 1}. ${seed.emoji} ${isTh ? seed.labelTh : seed.labelEn}`);
}

export function RunBatchControls() {
  const { lang, t } = useLanguage();
  const isTh = lang === "th";
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState<BatchId | null>(null);
  const [message, setMessage] = useState(t("batch_ready"));
  const [lastResults, setLastResults] = useState<BatchResult["results"]>([]);

  async function loadTasks() {
    const data = await apiRequest<ScheduledTask[]>("/api/scheduled-tasks");
    setTasks(data);
  }

  useEffect(() => {
    void loadTasks().catch((error) => setMessage(toErrorMessage(error)));
  }, []);

  useEffect(() => {
    if (!loading) setMessage(t("batch_ready"));
  }, [lang, loading, t]);

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

  async function runBatch(batchId: BatchId) {
    setLoading(batchId);
    setLastResults([]);
    const batchName = batchId === "all" ? (isTh ? "ทั้ง 2 ปุ่ม" : "both buttons") : isTh ? (batchId === "one" ? "ปุ่มแรก" : "ปุ่มสอง") : (batchId === "one" ? "first button" : "second button");
    setMessage(isTh ? `กำลังรัน ${batchName}...` : `Running ${batchName}...`);

    try {
      const result = await apiRequest<BatchResult>("/api/scheduled-tasks/run-batch", {
        method: "POST",
        body: JSON.stringify({ batch: batchId }),
      });

      setLastResults(result.results ?? []);
      setMessage(
        isTh
          ? `${batchName} เสร็จแล้ว: ส่ง ${result.summary.sentCount}/${result.summary.requestedCount}, ผิดพลาด ${result.summary.failedCount}, สร้างใหม่ ${result.summary.createdCount}`
          : `${batchName} complete: sent ${result.summary.sentCount}/${result.summary.requestedCount}, failed ${result.summary.failedCount}, created ${result.summary.createdCount}`,
      );
      await loadTasks();
    } catch (error) {
      setMessage(toErrorMessage(error));
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="relative overflow-hidden border-emerald-300/20 bg-emerald-300/[0.05] p-5 sm:p-6">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="green">⚡ {t("batch_badge")}</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">{t("batch_title")}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{t("batch_desc")}</p>
          </div>
          <Button disabled={Boolean(loading)} onClick={() => void runBatch("all")} type="button">
            {loading === "all" ? t("batch_running") : `🚀 ${t("batch_run_all")}`}
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {resolvedBatches.map((batch) => {
            const missingCount = batch.seeds.length - batch.foundCount;
            const batchTitle = isTh ? batch.titleTh : batch.titleEn;
            return (
              <div key={batch.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 shadow-2xl shadow-black/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">{batchTitle}</p>
                    <h3 className="mt-1 text-lg font-black text-white">{isTh ? batch.subtitleTh : batch.subtitleEn}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {isTh
                        ? `พร้อม ${batch.foundCount}/${batch.seeds.length} หัวข้อ${missingCount ? ` · ขาด ${missingCount} ระบบจะเติมให้ตอนกดรัน` : ""}`
                        : `Ready ${batch.foundCount}/${batch.seeds.length} topic(s)${missingCount ? ` · missing ${missingCount}, will create before running` : ""}`}
                    </p>
                  </div>
                  <Button disabled={Boolean(loading)} onClick={() => void runBatch(batch.id)} type="button" variant="secondary">
                    {loading === batch.id ? t("batch_running") : `▶ ${isTh ? "รัน" : "Run "}${batchTitle}`}
                  </Button>
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

        <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-300">
          <p>{message} · {isTh ? `มี task ในระบบตอนนี้ ${readyCount}/7` : `Current tasks in system ${readyCount}/7`}</p>
          {lastResults.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {lastResults.map((item) => (
                <div key={`${item.taskName}-${item.telegramStatus}`} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-5">
                  <span className="font-bold text-white">{item.taskName}</span>
                  <span className="text-slate-400"> · {item.status} · Telegram: {item.telegramStatus}</span>
                  {item.error ? <p className="text-rose-200">{item.error}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
