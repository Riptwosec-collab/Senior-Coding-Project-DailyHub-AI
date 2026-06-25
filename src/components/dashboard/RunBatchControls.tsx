"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import type { ScheduledTask } from "@/types/scheduled-task";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const TASK_DELAY_MS = 1500;
const BATCH_DELAY_MS = 3000;

type RunNowResponse = {
  taskRun?: {
    status?: string;
    telegramStatus?: string | null;
  };
};

type TaskSeed = {
  key: string;
  label: string;
  emoji: string;
  name: string;
  type: ScheduledTask["type"];
  scheduleType: ScheduledTask["scheduleType"];
  cronExpression: string;
  time: string | null;
  dataSources: string[];
  gptActions: string[];
  minPriorityScore: number;
};

const DEFAULT_TASKS: TaskSeed[] = [
  {
    key: "daily-brief",
    label: "Morning Daily Brief",
    emoji: "📰",
    name: "Morning Daily Brief",
    type: "Daily Brief",
    scheduleType: "Daily",
    cronExpression: "0 8 * * *",
    time: "08:00",
    dataSources: ["News", "Weather API"],
    gptActions: ["Summarize", "Analyze Priority", "Recommend Action"],
    minPriorityScore: 70,
  },
  {
    key: "global-product-radar",
    label: "สินค้าใหม่/น่าสนใจทั่วโลก",
    emoji: "🌍",
    name: "สินค้าใหม่/น่าสนใจทั่วโลก",
    type: "Sale Monitor",
    scheduleType: "Hourly",
    cronExpression: "0 * * * *",
    time: null,
    dataSources: ["Global Product Radar"],
    gptActions: ["Analyze Priority", "Generate Caption", "Recommend Action"],
    minPriorityScore: 70,
  },
  {
    key: "weekend-ideas",
    label: "Weekend Ideas Generator",
    emoji: "🧭",
    name: "Weekend Ideas Generator",
    type: "Weekend Ideas",
    scheduleType: "Weekly",
    cronExpression: "0 9 * * 6",
    time: "09:00",
    dataSources: ["Weather API", "News", "Weekend Ideas"],
    gptActions: ["Summarize", "Recommend Action", "Generate Image Prompt"],
    minPriorityScore: 60,
  },
  {
    key: "email-monitor",
    label: "Important Email Monitor",
    emoji: "📧",
    name: "Important Email Monitor",
    type: "Email Monitor",
    scheduleType: "Hourly",
    cronExpression: "*/30 * * * *",
    time: null,
    dataSources: ["Gmail"],
    gptActions: ["Summarize", "Analyze Priority", "Recommend Action"],
    minPriorityScore: 80,
  },
  {
    key: "concert-alerts",
    label: "Concert Alerts Near Me",
    emoji: "🎤",
    name: "Concert Alerts Near Me",
    type: "Concert Alerts",
    scheduleType: "Daily",
    cronExpression: "0 20 * * *",
    time: "20:00",
    dataSources: ["Concert API"],
    gptActions: ["Summarize", "Analyze Priority", "Recommend Action"],
    minPriorityScore: 75,
  },
  {
    key: "football-recap",
    label: "Football Recap Nightly",
    emoji: "⚽",
    name: "Football Recap Nightly",
    type: "World Cup Recap",
    scheduleType: "Daily",
    cronExpression: "0 23 * * *",
    time: "23:00",
    dataSources: ["Football API"],
    gptActions: ["Summarize", "Generate Caption", "Recommend Action"],
    minPriorityScore: 65,
  },
  {
    key: "weekend-long-read",
    label: "Weekend Long Read Picker",
    emoji: "📚",
    name: "Weekend Long Read Picker",
    type: "Weekend Long Read",
    scheduleType: "Weekly",
    cronExpression: "0 10 * * 6",
    time: "10:00",
    dataSources: ["News", "Weekend Long Read"],
    gptActions: ["Summarize", "Analyze Priority", "Recommend Action"],
    minPriorityScore: 55,
  },
];

const BATCH_ONE_KEYS = ["daily-brief", "global-product-radar", "weekend-ideas", "email-monitor"];
const BATCH_TWO_KEYS = ["concert-alerts", "football-recap", "weekend-long-read"];

const FIXED_BATCHES = [
  {
    title: "ปุ่มแรก",
    subtitle: "Daily Brief / Product / Weekend Ideas / Email",
    keys: BATCH_ONE_KEYS,
  },
  {
    title: "ปุ่มสอง",
    subtitle: "Concert / Football / Long Read",
    keys: BATCH_TWO_KEYS,
  },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBatchSeeds(keys: string[]) {
  return keys.map((key) => DEFAULT_TASKS.find((task) => task.key === key)).filter(Boolean) as TaskSeed[];
}

function matchesTask(task: ScheduledTask, seed: TaskSeed) {
  return task.type === seed.type || task.name.toLowerCase() === seed.name.toLowerCase();
}

function findTask(tasks: ScheduledTask[], seed: TaskSeed) {
  return tasks.find((task) => matchesTask(task, seed));
}

function sentStatus(status?: string | null) {
  return status === "sent" || Boolean(status?.startsWith("mock_sent"));
}

function taskLines(seeds: TaskSeed[]) {
  return seeds.map((seed, index) => `${index + 1}. ${seed.emoji} ${seed.label}`);
}

export function RunBatchControls() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("พร้อมรันแบบแบ่ง 2 ปุ่ม");

  async function loadTasks() {
    const data = await apiRequest<ScheduledTask[]>("/api/scheduled-tasks");
    setTasks(data);
  }

  useEffect(() => {
    void loadTasks().catch((error) => setMessage(toErrorMessage(error)));
  }, []);

  const resolvedBatches = useMemo(
    () =>
      FIXED_BATCHES.map((batch) => {
        const seeds = getBatchSeeds(batch.keys);
        const found = seeds.map((seed) => ({ seed, task: findTask(tasks, seed) }));
        return { ...batch, seeds, found };
      }),
    [tasks],
  );

  const readyCount = resolvedBatches.flatMap((batch) => batch.found).filter((item) => item.task).length;

  async function createMissingTasks(seeds: TaskSeed[]) {
    const created: ScheduledTask[] = [];

    for (const seed of seeds) {
      const task = await apiRequest<ScheduledTask>("/api/scheduled-tasks", {
        method: "POST",
        body: JSON.stringify({
          name: seed.name,
          type: seed.type,
          scheduleType: seed.scheduleType,
          cronExpression: seed.cronExpression,
          time: seed.time,
          timezone: "Asia/Bangkok",
          dataSources: seed.dataSources,
          gptActions: seed.gptActions,
          outputChannels: ["Save to Web Dashboard", "Save to Notifications", "Send Telegram"],
          minPriorityScore: seed.minPriorityScore,
          isActive: true,
        }),
      });
      created.push(task);
      await delay(350);
    }

    return created;
  }

  async function ensureBatchTasks(seeds: TaskSeed[]) {
    const missing = seeds.filter((seed) => !findTask(tasks, seed));
    if (missing.length) {
      setMessage(`กำลังเติม task ที่ขาด ${missing.length} รายการ...`);
      await createMissingTasks(missing);
      const latest = await apiRequest<ScheduledTask[]>("/api/scheduled-tasks");
      setTasks(latest);
      return seeds.map((seed) => findTask(latest, seed)).filter(Boolean) as ScheduledTask[];
    }

    return seeds.map((seed) => findTask(tasks, seed)).filter(Boolean) as ScheduledTask[];
  }

  async function runBatch(batchIndex: number) {
    const batch = resolvedBatches[batchIndex];
    if (!batch) return;

    setLoading(`batch-${batchIndex}`);
    setMessage(`กำลังรัน ${batch.title}...`);

    try {
      const runnableTasks = await ensureBatchTasks(batch.seeds);
      let sent = 0;
      let failed = 0;

      for (const [index, task] of runnableTasks.entries()) {
        try {
          const result = await apiRequest<RunNowResponse>(`/api/scheduled-tasks/${task.id}/run-now`, { method: "POST" });
          if (sentStatus(result.taskRun?.telegramStatus)) sent += 1;
          if (result.taskRun?.status === "failed" || result.taskRun?.telegramStatus?.includes("failed")) failed += 1;
        } catch {
          failed += 1;
        }

        if (index < runnableTasks.length - 1) await delay(TASK_DELAY_MS);
      }

      setMessage(`${batch.title} เสร็จแล้ว: ส่ง ${sent}/${batch.seeds.length}, ผิดพลาด ${failed}`);
      await loadTasks();
    } catch (error) {
      setMessage(toErrorMessage(error));
    } finally {
      setLoading(null);
    }
  }

  async function runAllBatches() {
    setLoading("all");
    let sent = 0;
    let failed = 0;
    let expected = 0;

    try {
      for (const [index, batch] of resolvedBatches.entries()) {
        setMessage(`กำลังรัน ${batch.title} (${index + 1}/${resolvedBatches.length})...`);
        const runnableTasks = await ensureBatchTasks(batch.seeds);
        expected += batch.seeds.length;

        for (const [taskIndex, task] of runnableTasks.entries()) {
          try {
            const result = await apiRequest<RunNowResponse>(`/api/scheduled-tasks/${task.id}/run-now`, { method: "POST" });
            if (sentStatus(result.taskRun?.telegramStatus)) sent += 1;
            if (result.taskRun?.status === "failed" || result.taskRun?.telegramStatus?.includes("failed")) failed += 1;
          } catch {
            failed += 1;
          }
          if (taskIndex < runnableTasks.length - 1) await delay(TASK_DELAY_MS);
        }

        if (index < resolvedBatches.length - 1) await delay(BATCH_DELAY_MS);
      }

      setMessage(`รันครบ 2 ปุ่มแล้ว: ส่ง ${sent}/${expected}, ผิดพลาด ${failed}`);
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
            <Badge tone="green">⚡ Batch Runner</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">ส่ง Telegram แบบ 2 ปุ่ม</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              ปุ่มแรกส่ง 4 หัวข้อหลัก ส่วนปุ่มสองส่ง 3 หัวข้อที่เหลือ ถ้า task ขาด ระบบจะพยายามสร้าง task ให้ครบก่อนรัน
            </p>
          </div>
          <Button disabled={Boolean(loading)} onClick={() => void runAllBatches()} type="button">
            {loading === "all" ? "กำลังรัน..." : "🚀 Run ทั้ง 2 ปุ่ม"}
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {resolvedBatches.map((batch, index) => {
            const foundCount = batch.found.filter((item) => item.task).length;
            const missingCount = batch.seeds.length - foundCount;
            return (
              <div key={batch.title} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 shadow-2xl shadow-black/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">{batch.title}</p>
                    <h3 className="mt-1 text-lg font-black text-white">{batch.subtitle}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      พร้อม {foundCount}/{batch.seeds.length} หัวข้อ{missingCount ? ` · ขาด ${missingCount} ระบบจะเติมให้ตอนกดรัน` : ""}
                    </p>
                  </div>
                  <Button disabled={Boolean(loading)} onClick={() => void runBatch(index)} type="button" variant="secondary">
                    {loading === `batch-${index}` ? "กำลังรัน..." : `▶ รัน${batch.title}`}
                  </Button>
                </div>

                <div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                  {taskLines(batch.seeds).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-300">
          {message} · มี task ในระบบตอนนี้ {readyCount}/7
        </div>
      </div>
    </Card>
  );
}
