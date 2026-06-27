"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import { clampScore, formatDateTime } from "@/lib/utils";
import type { Lang } from "@/lib/translations";
import type { WebNotification } from "@/types/notification";
import type { ScheduledTask } from "@/types/scheduled-task";
import type { TaskRun } from "@/types/task-run";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useLanguage } from "@/contexts/LanguageContext";

type BadgeTone = "blue" | "green" | "purple" | "red" | "gray";
type FilterKey = "all" | "daily" | "email" | "product" | "concert" | "football" | "publicAlerts" | "travelDeals" | "longread" | "failed";
type Localized = Record<Lang, string>;

type Topic = {
  key: Exclude<FilterKey, "all" | "failed">;
  emoji: string;
  label: Localized;
  tone: BadgeTone;
  pattern: RegExp;
};

const TOPICS: Topic[] = [
  { key: "daily", emoji: "📰", label: { th: "สรุปประจำวัน / ข่าว", en: "Daily Brief / News" }, tone: "blue", pattern: /daily brief|morning|brief|news|headline|ข่าว|สรุปข่าว/i },
  { key: "email", emoji: "📧", label: { th: "ตรวจอีเมลสำคัญ", en: "Email Monitor" }, tone: "blue", pattern: /email|gmail|mail|inbox|อีเมล/i },
  { key: "publicAlerts", emoji: "📢", label: { th: "ประกาศรัฐ / BTS-MRT", en: "Public Alerts / BTS-MRT" }, tone: "red", pattern: /public alert|government|notice|bts|mrt|ประกาศ|แจ้งเตือนรัฐ|หน่วยงานรัฐ|ขัดข้อง/i },
  { key: "travelDeals", emoji: "✈️", label: { th: "โปรเดินทาง / โรงแรม", en: "Travel Deals / Hotels" }, tone: "green", pattern: /travel deal|flight|airfare|airline|hotel|resort|room rate|ตั๋วเครื่องบิน|โปรบิน|โรงแรม|ห้องพัก|รีสอร์ต|โปรเดินทาง|โปรท่องเที่ยว/i },
  { key: "product", emoji: "🌍", label: { th: "สินค้าใหม่/น่าสนใจทั่วโลก", en: "Global Product Radar" }, tone: "green", pattern: /sale|deal|price|shop|shopee|product|radar|gadget|สินค้า|โปร/i },
  { key: "concert", emoji: "🎤", label: { th: "แจ้งเตือนคอนเสิร์ต", en: "Concert Alerts" }, tone: "purple", pattern: /concert|artist|music|ticket|live|คอนเสิร์ต|ศิลปิน/i },
  { key: "football", emoji: "⚽", label: { th: "สรุปฟุตบอล", en: "Football Recap" }, tone: "green", pattern: /football|soccer|world cup|match|score|บอล|ฟุตบอล/i },
  { key: "longread", emoji: "📚", label: { th: "บทความอ่านยาว", en: "Long Read" }, tone: "purple", pattern: /long read|article|reading|บทความ|อ่านยาว/i },
];

const DEFAULT_TOPIC: Topic = {
  key: "daily",
  emoji: "🧠",
  label: { th: "ภาพรวม", en: "General" },
  tone: "gray",
  pattern: /general/i,
};

const FILTERS: Array<{ key: FilterKey; emoji: string; label: Localized; tone: BadgeTone }> = [
  { key: "all", emoji: "✨", label: { th: "ทั้งหมด", en: "All" }, tone: "gray" },
  ...TOPICS,
  { key: "failed", emoji: "❌", label: { th: "มีปัญหา", en: "Failed" }, tone: "red" },
];

const LABELS: Record<Lang, Record<string, string>> = {
  th: {
    overview: "ภาพรวมระบบ",
    overviewTitle: "สถานะ DailyHub วันนี้",
    todayRuns: "รันวันนี้",
    telegramSent: "Telegram ส่งแล้ว",
    failedTasks: "งานมีปัญหา",
    nextRun: "รอบถัดไป",
    aiMode: "โหมด AI",
    dataMode: "โหมดข้อมูล",
    fromApi: "จากข้อมูล API ล่าสุด",
    sentFromRuns: "นับจาก task runs ล่าสุด",
    healthy: "ระบบปกติ",
    needsReview: "ควรตรวจสอบ",
    noNextRun: "ยังไม่มีรอบถัดไป",
    quickActions: "Quick Actions",
    quickTitle: "สั่งงานเร็ว",
    quickDesc: "รันทุกงาน รีเฟรชข้อมูล หรือเปิดหน้าจัดการได้จาก Dashboard",
    runAll: "Run All Now",
    refresh: "Refresh Data",
    scheduler: "View Scheduler",
    logs: "View Logs",
    running: "กำลังรัน...",
    runAllDone: "รันทั้งหมด {count} งานแล้ว | Telegram sent/mock {sent} งาน",
    runTaskDone: "รัน {name} แล้ว | Telegram: {status}",
    activeSubtitle: "งานที่เปิดใช้งานอยู่ พร้อมรอบถัดไปและปุ่มรันทันที",
    resultsSubtitle: "ผลลัพธ์ล่าสุดแยกตามหมวด พร้อมสถานะ Telegram และ AI",
    notificationsSubtitle: "แจ้งเตือนสำคัญและสิ่งที่ควรดูต่อ",
    execution: "Execution Log",
    executionTitle: "ประวัติการรันล่าสุด",
    task: "Task",
    status: "Status",
    telegram: "Telegram",
    ai: "AI",
    priority: "Priority",
    lastRun: "Last Run",
    nextRunCol: "Next Run",
    highlights: "รายละเอียดที่น่าสนใจ",
    noHighlights: "เปิดผลลัพธ์เต็มเพื่อดูรายละเอียด",
    runTask: "Run Task",
    thai: "ภาษาไทย",
    original: "ต้นฉบับ",
    score: "คะแนน",
    productSummary: "คัดสินค้าออกใหม่หรือสินค้าที่น่าสนใจจากทั่วโลก พร้อมเหตุผล จุดเด่น กลุ่มผู้ใช้ และสิ่งที่ควรเช็กต่อ",
  },
  en: {
    overview: "System Overview",
    overviewTitle: "DailyHub status today",
    todayRuns: "Runs Today",
    telegramSent: "Telegram Sent",
    failedTasks: "Failed Tasks",
    nextRun: "Next Run",
    aiMode: "AI Mode",
    dataMode: "Data Mode",
    fromApi: "From latest API data",
    sentFromRuns: "Counted from recent task runs",
    healthy: "Healthy",
    needsReview: "Needs review",
    noNextRun: "No upcoming run",
    quickActions: "Quick Actions",
    quickTitle: "Control Center",
    quickDesc: "Run all tasks, refresh data, or open management pages from the Dashboard.",
    runAll: "Run All Now",
    refresh: "Refresh Data",
    scheduler: "View Scheduler",
    logs: "View Logs",
    running: "Running...",
    runAllDone: "Ran {count} tasks | Telegram sent/mock {sent}",
    runTaskDone: "Ran {name} | Telegram: {status}",
    activeSubtitle: "Active tasks with next run time and manual run button.",
    resultsSubtitle: "Latest results grouped by topic with Telegram and AI status.",
    notificationsSubtitle: "Important alerts and items to review next.",
    execution: "Execution Log",
    executionTitle: "Latest execution history",
    task: "Task",
    status: "Status",
    telegram: "Telegram",
    ai: "AI",
    priority: "Priority",
    lastRun: "Last Run",
    nextRunCol: "Next Run",
    highlights: "Highlights",
    noHighlights: "Open the full result for details.",
    runTask: "Run Task",
    thai: "Thai",
    original: "Original",
    score: "score",
    productSummary: "Curated new or interesting products from around the world with why it matters, key highlights, target users, and next checks.",
  },
};

const TYPE_LABELS: Record<string, Localized> = {
  "Daily Brief": { th: "สรุปประจำวัน / ข่าว", en: "Daily Brief / News" },
  "Email Monitor": { th: "ตรวจอีเมลสำคัญ", en: "Email Monitor" },
  "Sale Monitor": { th: "สินค้าใหม่/น่าสนใจทั่วโลก", en: "Global Product Radar" },
  "Concert Alerts": { th: "แจ้งเตือนคอนเสิร์ต", en: "Concert Alerts" },
  "World Cup Recap": { th: "สรุปฟุตบอล", en: "Football Recap" },
  "Public Alerts": { th: "ประกาศสำคัญ / แจ้งเตือนรัฐ", en: "Public Alerts" },
  "Travel Deals": { th: "โปรเดินทาง / ตั๋วเครื่องบิน / โรงแรม", en: "Travel Deals" },
  "Weekend Long Read": { th: "บทความอ่านยาว", en: "Long Read" },
  Custom: { th: "กำหนดเอง", en: "Custom" },
};

const STATUS_LABELS: Record<string, Localized> = {
  success: { th: "สำเร็จ", en: "success" },
  failed: { th: "ล้มเหลว", en: "failed" },
  running: { th: "กำลังรัน", en: "running" },
  Active: { th: "ใช้งานอยู่", en: "Active" },
  Running: { th: "กำลังรัน", en: "Running" },
  Failed: { th: "ล้มเหลว", en: "Failed" },
  Paused: { th: "หยุดไว้", en: "Paused" },
};

type RunNowResult = { taskRun?: TaskRun };

function label(lang: Lang, key: keyof typeof LABELS.th) {
  return LABELS[lang][key];
}

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function localize(map: Record<string, Localized>, value: string | null | undefined, lang: Lang) {
  if (!value) return "";
  return map[value]?.[lang] ?? value;
}

function topicFromText(...values: string[]) {
  const text = values.filter(Boolean).join(" ");
  return TOPICS.find((topic) => topic.pattern.test(text)) ?? DEFAULT_TOPIC;
}

function topicForTask(task?: ScheduledTask | null) {
  if (!task) return DEFAULT_TOPIC;
  return topicFromText(task.type, task.name, task.dataSources.join(" "), task.gptActions.join(" "));
}

function topicForRun(run: TaskRun, task?: ScheduledTask | null) {
  return topicFromText(task?.type ?? "", task?.name ?? "", run.gptOutput.title, run.gptOutput.summary, JSON.stringify(run.rawInput?.task ?? ""));
}

function isTelegramSent(status: string | null | undefined) {
  return Boolean(status && (status === "sent" || status.startsWith("mock_sent")));
}

function telegramTone(status: string | null | undefined): BadgeTone {
  if (isTelegramSent(status)) return "green";
  if (status?.includes("failed")) return "red";
  if (status?.includes("skipped")) return "gray";
  if (status === "pending") return "purple";
  return "gray";
}

function statusTone(status: string): BadgeTone {
  if (status === "success" || status === "Active") return "green";
  if (status === "failed" || status === "Failed") return "red";
  if (status === "running" || status === "Running") return "purple";
  return "gray";
}

function displayTaskName(task: ScheduledTask, lang: Lang) {
  const topic = topicForTask(task);
  const typeLabel = localize(TYPE_LABELS, task.type, lang);
  if (task.type === "Sale Monitor") return `${topic.emoji} ${typeLabel}`;
  return `${topic.emoji} ${task.name.includes("Shopee") ? typeLabel : task.name}`;
}

function displayRunTitle(run: TaskRun, task: ScheduledTask | undefined, lang: Lang) {
  const topic = topicForRun(run, task);
  if (task?.type === "Sale Monitor" || /sale|shopee/i.test(run.gptOutput.title)) return `${topic.emoji} ${topic.label[lang]}`;
  if (lang === "th" && run.translation?.translatedTitle) return run.translation.translatedTitle;
  return run.gptOutput.title;
}

function displayRunSummary(run: TaskRun, task: ScheduledTask | undefined, lang: Lang) {
  if (task?.type === "Sale Monitor") return label(lang, "productSummary");
  if (lang === "th") return run.translatedContent || run.translation?.translatedSummary || run.gptOutput.summary;
  return run.gptOutput.summary;
}

function sourceEntries(run: TaskRun) {
  const raw = asRecord(run.rawInput);
  return safeArray(raw?.sources).map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item));
}

function sourceNames(run: TaskRun) {
  return sourceEntries(run).map((source) => asString(source.source) || asString(source.title)).filter(Boolean).slice(0, 3);
}

function sourceStatuses(run: TaskRun) {
  return sourceEntries(run).map((source) => asString(source.status)).filter(Boolean);
}

function runItems(run: TaskRun) {
  return sourceEntries(run).flatMap((source) => {
    const data = source.data;
    const dataRecord = asRecord(data);
    return Array.isArray(source.items)
      ? source.items
      : Array.isArray(data)
        ? data
        : Array.isArray(dataRecord?.ideas)
          ? dataRecord.ideas
          : data !== undefined
            ? [data]
            : [];
  });
}

function highlight(item: unknown, lang: Lang) {
  const record = asRecord(item);
  if (!record) return String(item ?? "");

  const product = asString(record.product) || asString(record.title);
  const category = asString(record.category);
  const why = asString(record.whyInteresting) || asString(record.why) || asString(record.reason);
  const target = asString(record.targetUser);
  if (product && (category || why || target)) {
    return lang === "th"
      ? `🌍 ${product}${category ? ` • ${category}` : ""}${why ? ` — ${why}` : ""}${target ? ` | เหมาะกับ: ${target}` : ""}`
      : `🌍 ${product}${category ? ` • ${category}` : ""}${why ? ` — ${why}` : ""}${target ? ` | For: ${target}` : ""}`;
  }

  const match = asString(record.match);
  const score = asString(record.score);
  const matchHighlight = asString(record.highlight);
  if (match || score || matchHighlight) return `⚽ ${match || "Match"}${score ? ` (${score})` : ""}${matchHighlight ? ` — ${matchHighlight}` : ""}`;

  const deal = asString(record.deal);
  const destination = asString(record.destination);
  const origin = asString(record.origin);
  if (deal || destination || origin) return `✈️ ${deal || "Travel deal"}${origin ? ` • ${origin}` : ""}${destination ? ` → ${destination}` : ""}`;

  const alertTitle = asString(record.agency) || asString(record.area);
  const severity = asString(record.severity);
  if (alertTitle || severity) return `📢 ${alertTitle || "Public alert"}${severity ? ` • ${severity}` : ""}`;

  const subject = asString(record.subject);
  const from = asString(record.from);
  if (subject || from) return `📧 ${subject || "Email"}${from ? ` • ${from}` : ""}`;

  const title = asString(record.title);
  const description = asString(record.description) || asString(record.content);
  if (title || description) return `📰 ${title || description}`;

  return "";
}

function runHighlights(run: TaskRun, lang: Lang) {
  return runItems(run).map((item) => highlight(item, lang)).filter(Boolean).slice(0, 3);
}

function translationMode(run: TaskRun, lang: Lang) {
  const mode = run.translation?.mode;
  if (mode === "ai") return "AI/Groq";
  if (mode === "fallback") return "Fallback";
  if (mode === "normalized") return lang === "th" ? "ปรับรูปแบบไทย" : "Normalized";
  return lang === "th" ? "ไม่ระบุ" : "Unknown";
}

function systemAiMode(runs: TaskRun[]) {
  if (runs.some((run) => run.translation?.mode === "ai")) return "Groq / AI";
  if (runs.some((run) => run.translation?.mode === "fallback")) return "Fallback";
  return "Mock / Normal";
}

function dataMode(runs: TaskRun[], lang: Lang) {
  const statuses = runs.flatMap(sourceStatuses);
  if (!statuses.length) return lang === "th" ? "ไม่ระบุ" : "Unknown";
  if (statuses.every((status) => status === "mock")) return "Mock";
  if (statuses.some((status) => status === "mock")) return "Mixed";
  return "Real";
}

function runsToday(runs: TaskRun[]) {
  const start = Date.now() - 24 * 60 * 60 * 1000;
  return runs.filter((run) => new Date(run.startedAt).getTime() >= start).length;
}

function nextTask(tasks: ScheduledTask[]) {
  return tasks.filter((task) => task.nextRunAt).sort((a, b) => new Date(a.nextRunAt ?? 0).getTime() - new Date(b.nextRunAt ?? 0).getTime())[0] ?? null;
}

export function DashboardControlView() {
  const { lang, t } = useLanguage();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [notifications, setNotifications] = useState<WebNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState(t("dashboard_command_initial_message"));
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [actionLoading, setActionLoading] = useState<"runAll" | "task" | null>(null);

  useEffect(() => setMessage(t("dashboard_command_initial_message")), [lang, t]);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [taskData, runData, notificationData] = await Promise.all([
        apiRequest<ScheduledTask[]>("/api/scheduled-tasks"),
        apiRequest<TaskRun[]>("/api/task-runs"),
        apiRequest<WebNotification[]>("/api/notifications"),
      ]);
      setTasks(taskData);
      setRuns(runData);
      setNotifications(notificationData);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const activeTasks = tasks.filter((task) => task.isActive).slice(0, 8);
  const latestRun = runs[0];
  const upcoming = nextTask(tasks);
  const failedCount = tasks.filter((task) => task.status === "Failed" || !task.isActive).length;
  const telegramSent = runs.filter((run) => isTelegramSent(run.telegramStatus)).length;

  const filteredRuns = useMemo(() => runs.filter((run) => {
    const task = taskById.get(run.taskId);
    if (activeFilter === "all") return true;
    if (activeFilter === "failed") return run.status === "failed" || run.telegramStatus?.includes("failed");
    return topicForRun(run, task).key === activeFilter;
  }), [activeFilter, runs, taskById]);

  const summaryCards = [
    { label: label(lang, "todayRuns"), value: runsToday(runs), hint: label(lang, "fromApi"), tone: "blue" as const, icon: "🚀" },
    { label: label(lang, "telegramSent"), value: telegramSent, hint: label(lang, "sentFromRuns"), tone: "green" as const, icon: "📨" },
    { label: label(lang, "failedTasks"), value: failedCount, hint: failedCount > 0 ? label(lang, "needsReview") : label(lang, "healthy"), tone: failedCount > 0 ? "red" as const : "green" as const, icon: "⚠️" },
    { label: label(lang, "nextRun"), value: upcoming ? formatDateTime(upcoming.nextRunAt).split(" ").slice(-1)[0] : "-", hint: upcoming ? displayTaskName(upcoming, lang) : label(lang, "noNextRun"), tone: "purple" as const, icon: "⏭️" },
    { label: label(lang, "aiMode"), value: systemAiMode(runs), hint: latestRun ? translationMode(latestRun, lang) : "-", tone: "purple" as const, icon: "🧠" },
    { label: label(lang, "dataMode"), value: dataMode(runs, lang), hint: sourceNames(latestRun ?? ({} as TaskRun)).join(", ") || label(lang, "fromApi"), tone: "gray" as const, icon: "🗂️" },
  ];

  async function runTask(task: ScheduledTask) {
    setActionLoading("task");
    setMessage(label(lang, "running"));
    try {
      const result = await apiRequest<RunNowResult>(`/api/scheduled-tasks/${task.id}/run-now`, { method: "POST" });
      setMessage(fill(label(lang, "runTaskDone"), { name: displayTaskName(task, lang), status: result.taskRun?.telegramStatus ?? "unknown" }));
      await loadDashboard();
    } catch (err) {
      setMessage(toErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function runAllTasks() {
    setActionLoading("runAll");
    setMessage(label(lang, "running"));
    let sent = 0;
    let count = 0;
    try {
      for (const task of tasks) {
        const result = await apiRequest<RunNowResult>(`/api/scheduled-tasks/${task.id}/run-now`, { method: "POST" });
        count += 1;
        if (isTelegramSent(result.taskRun?.telegramStatus)) sent += 1;
      }
      setMessage(fill(label(lang, "runAllDone"), { count, sent }));
      await loadDashboard();
    } catch (err) {
      setMessage(toErrorMessage(err));
      await loadDashboard();
    } finally {
      setActionLoading(null);
    }
  }

  if (isLoading) return <LoadingState title={t("dashboard_loading_title")} description={t("dashboard_loading_desc")} />;
  if (error) return <ErrorState title={t("dashboard_loading_failed")} description={error} onRetry={loadDashboard} />;

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-32 left-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative">
            <Badge tone="purple">DailyHub</Badge>
            <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">{t("dashboard_title")}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{t("dashboard_description")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {TOPICS.map((topic) => <Badge key={topic.key} tone={topic.tone}>{topic.emoji} {topic.label[lang]}</Badge>)}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-400">{t("dashboard_latest_run_label")}</p>
            {latestRun && <Badge tone={telegramTone(latestRun.telegramStatus)}>Telegram: {latestRun.telegramStatus}</Badge>}
          </div>
          <h2 className="mt-3 text-xl font-black text-white">{latestRun ? displayRunTitle(latestRun, taskById.get(latestRun.taskId), lang) : t("dashboard_no_result")}</h2>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{latestRun ? displayRunSummary(latestRun, taskById.get(latestRun.taskId), lang) : t("dashboard_no_gpt_summary")}</p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{label(lang, "priority")}</span>
              <span className="text-2xl font-black text-cyan-100">{latestRun?.priorityScore ?? 0}/100</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">{label(lang, "lastRun")}: {latestRun ? formatDateTime(latestRun.startedAt) : "-"}</p>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-cyan-200">{label(lang, "overview")}</p>
          <h2 className="mt-1 text-2xl font-black text-white">{label(lang, "overviewTitle")}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {summaryCards.map((card) => <Card key={card.label} className="p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-sm font-medium text-slate-400">{card.label}</p><p className="mt-3 truncate text-2xl font-black text-white">{card.value}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{card.hint}</p></div><Badge tone={card.tone}>{card.icon}</Badge></div></Card>)}
        </div>
      </section>

      <Card className="relative overflow-hidden border-cyan-300/20 bg-cyan-300/[0.06] p-5 sm:p-6">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative grid gap-5 xl:grid-cols-[0.8fr_1.2fr] xl:items-center">
          <div><p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-200">{label(lang, "quickActions")}</p><h2 className="mt-3 text-2xl font-black text-white">{label(lang, "quickTitle")}</h2><p className="mt-3 text-sm leading-6 text-slate-300">{label(lang, "quickDesc")}</p></div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button disabled={actionLoading !== null} onClick={runAllTasks} type="button">{actionLoading === "runAll" ? label(lang, "running") : `🚀 ${label(lang, "runAll")}`}</Button>
              <Button disabled={actionLoading !== null} onClick={loadDashboard} type="button" variant="secondary">🔄 {label(lang, "refresh")}</Button>
              <Button asChild variant="outline"><Link href="/scheduled-tasks">⏱ {label(lang, "scheduler")}</Link></Button>
              <Button asChild variant="outline"><Link href="/task-results">📋 {label(lang, "logs")}</Link></Button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm leading-6 text-slate-300">{message}</div>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-sm font-semibold text-cyan-200">{t("dashboard_active_tasks_label")}</p><h2 className="mt-1 text-2xl font-black text-white">{t("dashboard_active_tasks_title")}</h2><p className="mt-2 text-sm text-slate-400">{label(lang, "activeSubtitle")}</p></div><Button variant="secondary" onClick={loadDashboard} type="button">{t("common_refresh")}</Button></div>
        {activeTasks.length === 0 ? <EmptyState title={t("dashboard_no_active_tasks")} description={t("dashboard_no_active_tasks_desc")} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{activeTasks.map((task) => { const topic = topicForTask(task); return <Card key={task.id} className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Badge tone={statusTone(task.status)}>{localize(STATUS_LABELS, task.status, lang)}</Badge><h3 className="mt-4 line-clamp-2 text-base font-black text-white">{displayTaskName(task, lang)}</h3><p className="mt-2 text-sm text-slate-400">{topic.label[lang]}</p></div><span className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-cyan-100">{task.scheduleType}</span></div><div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-slate-400"><p>{label(lang, "lastRun")}: {formatDateTime(task.lastRunAt)}</p><p>{label(lang, "nextRunCol")}: {formatDateTime(task.nextRunAt)}</p><p>{label(lang, "telegram")}: {task.outputChannels.includes("Send Telegram") ? "enabled" : "dashboard only"}</p></div><Button className="mt-4 w-full" disabled={actionLoading !== null} onClick={() => void runTask(task)} size="sm" type="button" variant="secondary">{actionLoading === "task" ? label(lang, "running") : `▶ ${label(lang, "runTask")}`}</Button></Card>; })}</div>}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><p className="text-sm font-semibold text-cyan-200">{t("dashboard_latest_results_label")}</p><h2 className="mt-1 text-2xl font-black text-white">{t("dashboard_latest_results_title")}</h2><p className="mt-2 text-sm text-slate-400">{label(lang, "resultsSubtitle")}</p></div><div className="flex flex-wrap gap-2">{FILTERS.map((filter) => <button key={filter.key} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${activeFilter === filter.key ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"}`} onClick={() => setActiveFilter(filter.key)} type="button">{filter.emoji} {filter.label[lang]}</button>)}</div></div>
        {filteredRuns.length === 0 ? <EmptyState title={t("dashboard_no_gpt_results")} description={t("dashboard_no_gpt_results_desc")} /> : <div className="grid gap-4 xl:grid-cols-3">{filteredRuns.slice(0, 6).map((run) => { const task = taskById.get(run.taskId); const topic = topicForRun(run, task); const score = clampScore(run.priorityScore); const highlights = runHighlights(run, lang); return <Card key={run.id} className="p-5"><div className="flex items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><Badge tone={topic.tone}>{topic.emoji} {topic.label[lang]}</Badge><Badge tone={statusTone(run.status)}>{localize(STATUS_LABELS, run.status, lang)}</Badge></div><span className="text-xs text-slate-500">{formatDateTime(run.startedAt)}</span></div><h3 className="mt-4 text-lg font-black text-white">{displayRunTitle(run, task, lang)}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{displayRunSummary(run, task, lang)}</p><div className="mt-4 flex flex-wrap gap-2"><Badge tone={telegramTone(run.telegramStatus)}>📨 {run.telegramStatus || "unknown"}</Badge><Badge tone="purple">🧠 {translationMode(run, lang)}</Badge>{sourceNames(run).map((source) => <Badge key={source} tone="gray">🗂 {source}</Badge>)}</div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${score}%` }} /></div><div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label(lang, "highlights")}</p>{highlights.length ? <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-300">{highlights.map((item) => <li key={item} className="line-clamp-2">{item}</li>)}</ul> : <p className="mt-3 text-xs text-slate-400">{label(lang, "noHighlights")}</p>}</div><div className="mt-5 flex flex-wrap items-center gap-3"><Link href={`/task-results/${run.id}`} className="inline-flex text-sm font-bold text-cyan-200 hover:text-cyan-100">{t("common_open_result")} →</Link>{run.translatedContent && <Badge tone="green">{label(lang, "thai")}</Badge>}{run.originalContent && <Badge tone="gray">{label(lang, "original")}</Badge>}</div></Card>; })}</div>}
      </section>

      <section className="space-y-4">
        <div><p className="text-sm font-semibold text-cyan-200">{label(lang, "execution")}</p><h2 className="mt-1 text-2xl font-black text-white">{label(lang, "executionTitle")}</h2></div>
        <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-white/10 text-sm"><thead className="bg-white/[0.03] text-left text-xs uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-5 py-4">{label(lang, "task")}</th><th className="px-5 py-4">{label(lang, "status")}</th><th className="px-5 py-4">{label(lang, "telegram")}</th><th className="px-5 py-4">{label(lang, "ai")}</th><th className="px-5 py-4">{label(lang, "priority")}</th><th className="px-5 py-4">{label(lang, "lastRun")}</th><th className="px-5 py-4">{label(lang, "nextRunCol")}</th></tr></thead><tbody className="divide-y divide-white/10">{runs.slice(0, 10).map((run) => { const task = taskById.get(run.taskId); const topic = topicForRun(run, task); return <tr key={run.id} className="text-slate-300"><td className="min-w-[220px] px-5 py-4"><div className="font-bold text-white">{topic.emoji} {task ? displayTaskName(task, lang).replace(topic.emoji, "") : displayRunTitle(run, task, lang)}</div><div className="mt-1 text-xs text-slate-500">{topic.label[lang]}</div></td><td className="px-5 py-4"><Badge tone={statusTone(run.status)}>{localize(STATUS_LABELS, run.status, lang)}</Badge></td><td className="px-5 py-4"><Badge tone={telegramTone(run.telegramStatus)}>{run.telegramStatus || "unknown"}</Badge></td><td className="px-5 py-4">{translationMode(run, lang)}</td><td className="px-5 py-4 font-black text-cyan-100">{run.priorityScore}/100</td><td className="min-w-[150px] px-5 py-4 text-slate-400">{formatDateTime(run.startedAt)}</td><td className="min-w-[150px] px-5 py-4 text-slate-400">{formatDateTime(task?.nextRunAt)}</td></tr>; })}</tbody></table></div></Card>
      </section>

      <section className="space-y-4">
        <div><p className="text-sm font-semibold text-violet-200">{t("dashboard_notifications_label")}</p><h2 className="mt-1 text-2xl font-black text-white">{t("dashboard_notifications_title")}</h2><p className="mt-2 text-sm text-slate-400">{label(lang, "notificationsSubtitle")}</p></div>
        {notifications.length === 0 ? <EmptyState title={t("dashboard_no_notifications")} description={t("dashboard_no_notifications_desc")} /> : <div className="grid gap-4 lg:grid-cols-2">{notifications.slice(0, 6).map((notification) => { const topic = topicFromText(notification.type, notification.title, notification.summary); return <Card key={notification.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><Badge tone={notification.isRead ? "gray" : "blue"}>{notification.isRead ? t("common_read") : t("common_unread")}</Badge>{notification.priorityScore >= 80 && <Badge tone="red">{t("common_important")}</Badge>}<Badge tone={topic.tone}>{topic.emoji} {topic.label[lang]}</Badge></div><h3 className="mt-4 text-base font-black text-white">{notification.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{notification.summary}</p></div><div className="shrink-0 text-right"><p className="text-2xl font-black text-cyan-100">{notification.priorityScore}</p><p className="text-[11px] uppercase tracking-wider text-slate-500">{label(lang, "score")}</p></div></div></Card>; })}</div>}
      </section>
    </div>
  );
}
