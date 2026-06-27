"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, getFriendlyApiError } from "@/lib/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDateTime } from "@/lib/utils";
import type { ScheduledTask, ScheduledTaskStatus } from "@/types/scheduled-task";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const TYPE_EMOJI: Record<string, string> = {
  "Daily Brief": "📰",
  "Email Monitor": "📧",
  "Sale Monitor": "🛒",
  "World Cup Recap": "⚽",
  "Concert Alerts": "🎤",
  "US Stock News": "📈",
  "Weekend Ideas": "📈",
  "Lifestyle Ideas": "💡",
  Custom: "⚙️",
};

const FILTER_TABS = {
  th: ["All", "Active", "Running", "Paused", "Failed"],
  en: ["All", "Active", "Running", "Paused", "Failed"],
} as const;

const copy = {
  th: {
    title: "งานอัตโนมัติ",
    desc: "จัดการ Daily Brief, Email Digest, US Stock News, Concert Alerts, Football Recap และ Lifestyle Ideas",
    createTask: "สร้างงาน",
    refresh: "รีเฟรช",
    testTelegram: "ทดสอบ Telegram",
    total: "ทั้งหมด",
    active: "ใช้งานอยู่",
    failed: "ล้มเหลว",
    nextTask: "งานถัดไป",
    search: "ค้นหา task ตามชื่อ, ประเภท, สถานะ...",
    empty: "ยังไม่มี Scheduled Tasks",
    runNow: "Run Now",
    running: "กำลังรัน...",
    pause: "Pause",
    resume: "Resume",
    results: "ผลลัพธ์",
    schedule: "ตารางเวลา",
    lastRun: "รันล่าสุด",
    nextRun: "รันถัดไป",
    minPriority: "ความสำคัญขั้นต่ำ",
    output: "ช่องทางผลลัพธ์",
    loadFailed: "โหลดไม่สำเร็จ",
    telegramSent: "Telegram test ส่งสำเร็จ",
    actionFailed: "ไม่สำเร็จ",
    hobbyTitle: "Vercel Hobby Plan",
    hobbyDesc: "Cron บน Hobby plan จำกัดตามเงื่อนไขของ Vercel ถ้าต้องรันถี่ให้ใช้ Vercel Pro หรือ external scheduler",
  },
  en: {
    title: "Scheduled Tasks",
    desc: "Manage Daily Brief, Email Digest, US Stock News, Concert Alerts, Football Recap, and Lifestyle Ideas.",
    createTask: "Create Task",
    refresh: "Refresh",
    testTelegram: "Test Telegram",
    total: "Total",
    active: "Active",
    failed: "Failed",
    nextTask: "Next task",
    search: "Search tasks by name, type, or status...",
    empty: "No Scheduled Tasks yet",
    runNow: "Run Now",
    running: "Running...",
    pause: "Pause",
    resume: "Resume",
    results: "Results",
    schedule: "Schedule",
    lastRun: "Last run",
    nextRun: "Next run",
    minPriority: "Min Priority",
    output: "Outputs",
    loadFailed: "Loading failed",
    telegramSent: "Telegram test sent",
    actionFailed: "Action failed",
    hobbyTitle: "Vercel Hobby Plan",
    hobbyDesc: "Cron behavior on the Hobby plan is limited. Use Vercel Pro or an external scheduler for frequent jobs.",
  },
} as const;

function isLegacyHiddenTask(task: ScheduledTask) {
  const haystack = [task.name, task.type, task.dataSources.join(" ")].join(" ").toLowerCase();
  return haystack.includes("long read") || haystack.includes("อ่านยาว");
}

export function ScheduledTasksProView() {
  const { lang } = useLanguage();
  const text = copy[lang];
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");

  async function loadTasks() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ScheduledTask[]>("/api/scheduled-tasks");
      setTasks(data.filter((task) => !isLegacyHiddenTask(task)));
    } catch (err) {
      setError(getFriendlyApiError(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadTasks(); }, []);

  const filtered = useMemo(() => {
    const kw = search.toLowerCase();
    return tasks.filter((task) => {
      const matchTab = activeTab === "All" || task.status === activeTab;
      const matchSearch = !kw || [task.name, task.type, task.status, task.scheduleType, task.dataSources.join(" ")].join(" ").toLowerCase().includes(kw);
      return matchTab && matchSearch;
    });
  }, [tasks, activeTab, search]);

  const activeCount = tasks.filter((task) => task.status === "Active").length;
  const failedCount = tasks.filter((task) => task.status === "Failed").length;
  const nextTask = [...tasks].filter((task) => task.nextRunAt && task.isActive).sort((a, b) => (a.nextRunAt! < b.nextRunAt! ? -1 : 1))[0];

  function setBusy(id: string, busy: boolean) {
    setBusyIds((current) => {
      const next = new Set(current);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleRunNow(task: ScheduledTask) {
    setBusy(task.id, true);
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: "Running" as ScheduledTaskStatus } : item));
    try {
      const result = await apiFetch<{ task: ScheduledTask }>(`/api/scheduled-tasks/${task.id}/run-now`, { method: "POST" });
      setTasks((current) => current.map((item) => item.id === task.id ? result.task : item).filter((item) => !isLegacyHiddenTask(item)));
      setMessage(`${task.name} completed`);
    } catch (err) {
      setMessage(getFriendlyApiError(err));
      await loadTasks();
    } finally {
      setBusy(task.id, false);
    }
  }

  async function handleToggle(task: ScheduledTask) {
    const resume = task.status === "Paused";
    setBusy(task.id, true);
    try {
      const updated = await apiFetch<ScheduledTask>(`/api/scheduled-tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: resume ? "Active" : "Paused", isActive: resume, is_active: resume }),
      });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item).filter((item) => !isLegacyHiddenTask(item)));
    } catch (err) {
      setMessage(getFriendlyApiError(err));
    } finally {
      setBusy(task.id, false);
    }
  }

  async function handleTelegramTest() {
    try {
      await apiFetch("/api/telegram/test", { method: "POST", body: JSON.stringify({ message: "DailyHub — Telegram test" }) });
      setMessage(text.telegramSent);
    } catch (err) {
      setMessage(getFriendlyApiError(err));
    }
  }

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <Card className="p-8 text-center">
        <Badge tone="red">Error</Badge>
        <h1 className="mt-3 text-2xl font-black text-white">{text.loadFailed}</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
        <Button className="mt-5" variant="secondary" onClick={() => void loadTasks()}>↻ {text.refresh}</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge tone="blue">Scheduler</Badge>
          <h1 className="mt-3 text-3xl font-black text-white">{text.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{text.desc}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void handleTelegramTest()}>✈ {text.testTelegram}</Button>
          <Button variant="secondary" onClick={() => void loadTasks()}>↻ {text.refresh}</Button>
          <Button asChild><Link href="/scheduled-tasks/create">+ {text.createTask}</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label={text.total} value={tasks.length} />
        <SummaryCard label={text.active} value={activeCount} />
        <SummaryCard label={text.failed} value={failedCount} />
        <SummaryCard label={text.nextTask} value={nextTask ? nextTask.name : "-"} />
      </div>

      {nextTask && (
        <Card className="border-cyan-300/20 bg-cyan-300/[0.06] p-4 text-sm text-slate-300">
          {text.nextTask}: <span className="font-bold text-white">{nextTask.name}</span> · <span className="text-cyan-300">{nextTask.nextRunAt ? formatDateTime(nextTask.nextRunAt, lang) : "-"}</span>
        </Card>
      )}

      <div className="space-y-3">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text.search} className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-300/40 focus:outline-none" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_TABS[lang].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} type="button" className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-bold transition ${activeTab === tab ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"}`}>{tab}</button>
          ))}
        </div>
      </div>

      {message && <Card className="p-4 text-sm font-semibold text-cyan-100">{message}</Card>}

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-4xl">📭</p>
          <h2 className="mt-3 text-xl font-black text-white">{text.empty}</h2>
          <Button className="mt-5" asChild><Link href="/scheduled-tasks/create">+ {text.createTask}</Link></Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} isBusy={busyIds.has(task.id)} onRunNow={() => void handleRunNow(task)} onTogglePause={() => void handleToggle(task)} text={text} lang={lang} />
          ))}
        </div>
      )}

      <Card className="border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-200">
        <p className="font-bold">⚠️ {text.hobbyTitle}</p>
        <p className="mt-1 text-amber-200/70">{text.hobbyDesc}</p>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 truncate text-xl font-black text-white">{value}</p>
    </Card>
  );
}

function TaskCard({ task, isBusy, onRunNow, onTogglePause, text, lang }: { task: ScheduledTask; isBusy: boolean; onRunNow: () => void; onTogglePause: () => void; text: (typeof copy)[keyof typeof copy]; lang: "th" | "en" }) {
  const emoji = TYPE_EMOJI[task.type] ?? "⚙️";
  const isPaused = task.status === "Paused";
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="font-black leading-tight text-white">{task.name}</p>
            <p className="text-xs text-slate-500">{task.type}</p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-bold text-slate-300">{task.status}</span>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs text-slate-400">
        <p>{text.schedule}: <span className="text-slate-200">{task.scheduleType}</span></p>
        <p>{text.lastRun}: <span className="text-slate-200">{task.lastRunAt ? formatDateTime(task.lastRunAt, lang) : "-"}</span></p>
        <p>{text.nextRun}: <span className="text-cyan-200">{task.nextRunAt ? formatDateTime(task.nextRunAt, lang) : "-"}</span></p>
        <p>{text.minPriority}: <span className="text-slate-200">{task.minPriorityScore}/100</span></p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {task.outputChannels.map((channel) => <span key={channel} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-slate-400">{channel}</span>)}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2">
        <Button className="col-span-2" disabled={isBusy} onClick={onRunNow}>{isBusy ? text.running : text.runNow}</Button>
        <Button variant="secondary" disabled={isBusy} onClick={onTogglePause}>{isPaused ? text.resume : text.pause}</Button>
        <Button variant="secondary" asChild><Link href={`/task-results?task_id=${task.id}`}>{text.results}</Link></Button>
      </div>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="h-48 animate-pulse bg-white/[0.04]">
          <span className="sr-only">Loading scheduled task card</span>
        </Card>
      ))}
    </div>
  );
}
