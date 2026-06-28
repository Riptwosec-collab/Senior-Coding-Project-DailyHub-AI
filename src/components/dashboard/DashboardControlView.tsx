"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import { getDailyBriefTopicDetail } from "@/lib/daily-brief-taxonomy";
import { clampScore, cn, formatDateTime } from "@/lib/utils";
import type { Lang } from "@/lib/translations";
import type { DailyBriefApiResponse, DailyBriefCategoryKey, DailyBriefItem } from "@/types/daily-brief";
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
type FilterKey = "all" | "daily" | "email" | "product" | "concert" | "football" | "publicAlerts" | "travelDeals" | "failed";
type Localized = Record<Lang, string>;
type NewsTelegramResult = { status: DailyBriefItem["telegramStatus"]; message: string; parts: number };

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
    overviewTitle: "สถานะ NimbusDaily วันนี้",
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
    overviewTitle: "NimbusDaily status today",
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

const DAILY_COPY = {
  th: {
    badge: "📰 Daily Brief / ข่าวประจำวัน",
    title: "ศูนย์รวมข่าวและ Daily Brief วันนี้",
    desc: "ข่าวล่าสุดจากระบบ Daily Brief เดิม พร้อมสรุปไทยก่อนส่ง Telegram อ่านเต็มจากลิงก์ต้นฉบับ และบันทึกข่าวสำคัญไว้ดูทีหลังได้จากหน้า Dashboard",
    latest: "ข่าวล่าสุดวันนี้",
    latestDesc: "แสดง 5-8 ข่าวล่าสุด พร้อมหมวด แหล่งข่าว เวลา priority และ action ต่อข่าว",
    subcategories: "หมวดและ subcategory ที่รองรับ",
    subcategoryDesc: "ใช้ taxonomy เดิมของ Daily Brief เพื่อคุมหัวข้อข่าว ไม่สร้างระบบซ้ำ",
    readFull: "อ่านเต็ม",
    sendTelegram: "ส่ง Telegram",
    sendingTelegram: "กำลังส่ง...",
    hide: "ซ่อน",
    save: "บันทึกไว้ดูทีหลัง",
    saved: "บันทึกแล้ว",
    source: "แหล่งข่าว",
    published: "เวลา",
    why: "ทำไมสำคัญ",
    retryNews: "ลองดึงข่าวใหม่",
    emptyTitle: "ยังไม่มีข่าวให้แสดง",
    emptyDesc: "กดดึงข่าวล่าสุด หรือระบบจะใช้ fallback mock data เมื่อ feed จริงไม่มีข่าว",
    totalNews: "ข่าวทั้งหมดวันนี้",
    highPriority: "ข่าว Priority สูง",
    telegramSent: "Telegram ส่งแล้ว",
    failedTasks: "งานล้มเหลว",
    pendingRead: "ข่าวรออ่านเต็ม",
    cyberAlert: "Cyber Alert",
    pmTraffic: "PM2.5 / Traffic",
    openDaily: "เปิดหน้า Daily Brief",
    fetchLatest: "ดึงข่าวล่าสุด",
    sendAll: "ส่ง Telegram ทั้งหมด",
    schedule: "ตั้งเวลา Daily Brief",
    latestResults: "ดูผลลัพธ์ล่าสุด",
    failedJobs: "ดูงานที่ล้มเหลว",
    newsRefreshed: "ดึงข่าวล่าสุดเรียบร้อย",
    newsSaved: "บันทึกข่าวไว้ดูทีหลังแล้ว",
    newsHidden: "ซ่อนข่าวนี้จาก Dashboard แล้ว",
    sendAllDone: "ส่ง Telegram ข่าวบน Dashboard แล้ว {count} ข่าว | sent/mock {sent} | failed {failed}",
    fallbackMode: "Fallback พร้อมใช้งาน",
  },
  en: {
    badge: "📰 Daily Brief / News Hub",
    title: "Today’s Daily Brief news center",
    desc: "Latest stories from the existing Daily Brief system, translated to Thai before Telegram, with original-source links, save, hide, and per-story send actions.",
    latest: "Latest stories today",
    latestDesc: "Shows the latest 5-8 stories with category, source, time, priority, and per-story actions.",
    subcategories: "Supported categories and subcategories",
    subcategoryDesc: "Uses the existing Daily Brief taxonomy, without creating a duplicate news system.",
    readFull: "Read Full",
    sendTelegram: "Send Telegram",
    sendingTelegram: "Sending...",
    hide: "Hide",
    save: "Save for later",
    saved: "Saved",
    source: "Source",
    published: "Time",
    why: "Why it matters",
    retryNews: "Retry news fetch",
    emptyTitle: "No stories to show yet",
    emptyDesc: "Fetch latest news, or NimbusDaily will use fallback mock data when real feeds are empty.",
    totalNews: "News Today",
    highPriority: "High Priority",
    telegramSent: "Telegram Sent",
    failedTasks: "Failed Tasks",
    pendingRead: "Pending Full Read",
    cyberAlert: "Cyber Alert",
    pmTraffic: "PM2.5 / Traffic",
    openDaily: "Open Daily Brief",
    fetchLatest: "Fetch Latest",
    sendAll: "Send All Telegram",
    schedule: "Schedule Daily Brief",
    latestResults: "Latest Results",
    failedJobs: "Failed Jobs",
    newsRefreshed: "Latest news refreshed",
    newsSaved: "Story saved for later",
    newsHidden: "Story hidden from Dashboard",
    sendAllDone: "Sent Dashboard news to Telegram: {count} stories | sent/mock {sent} | failed {failed}",
    fallbackMode: "Fallback ready",
  },
} as const;

const TYPE_LABELS: Record<string, Localized> = {
  "Daily Brief": { th: "สรุปประจำวัน / ข่าว", en: "Daily Brief / News" },
  "Email Monitor": { th: "ตรวจอีเมลสำคัญ", en: "Email Monitor" },
  "Sale Monitor": { th: "สินค้าใหม่/น่าสนใจทั่วโลก", en: "Global Product Radar" },
  "Concert Alerts": { th: "แจ้งเตือนคอนเสิร์ต", en: "Concert Alerts" },
  "World Cup Recap": { th: "สรุปฟุตบอล", en: "Football Recap" },
  "Public Alerts": { th: "ประกาศสำคัญ / แจ้งเตือนรัฐ", en: "Public Alerts" },
  "Travel Deals": { th: "โปรเดินทาง / ตั๋วเครื่องบิน / โรงแรม", en: "Travel Deals" },
  "Weekend Long Read": { th: "อีเวนต์ / ดีล / โปรเดินทาง", en: "Events / Deals / Travel" },
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

function dailyText(lang: Lang, key: keyof typeof DAILY_COPY.th) {
  return DAILY_COPY[lang][key];
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

function formatNewsTime(value: string | undefined, lang: Lang) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function dailyCategoryLabel(key: DailyBriefCategoryKey, lang: Lang) {
  const detail = getDailyBriefTopicDetail(key);
  return lang === "th" ? detail.labelTh : detail.labelEn;
}

function dailyItemTitle(item: DailyBriefItem, lang: Lang) {
  return lang === "th" ? item.titleTh : item.title || item.titleTh;
}

function dailyItemSummary(item: DailyBriefItem, lang: Lang) {
  if (lang === "th") return item.summaryTh;
  return item.rawDescription || item.extractedText || item.summaryTh;
}

function dailyItemBullets(item: DailyBriefItem, lang: Lang) {
  if (lang === "th") return item.bulletPoints;
  return item.rawDescription
    ? [item.rawDescription.slice(0, 180), `Source: ${item.sourceName}`, `Category: ${dailyCategoryLabel(item.category, "en")}`]
    : item.bulletPoints;
}

function isDailyNewsSent(status: DailyBriefItem["telegramStatus"] | undefined) {
  return status === "sent" || status === "mock_sent";
}

function dailyNewsStatusTone(item: DailyBriefItem): BadgeTone {
  if (isDailyNewsSent(item.telegramStatus)) return "green";
  if (item.telegramStatus === "failed") return "red";
  if (item.isSaved) return "blue";
  if (item.telegramStatus === "queued") return "purple";
  return "gray";
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

type NewsSnapshotCard = {
  label: string;
  value: string | number;
  hint: string;
  tone: BadgeTone;
  icon: string;
};

function dashboardNewsImageSrc(item: DailyBriefItem) {
  const params = new URLSearchParams({
    url: item.imageUrl || item.sourceUrl,
    title: dailyItemTitle(item, "en"),
    kind: "news",
    strict: "1",
  });
  return `/api/poster-image?${params.toString()}`;
}

function DashboardNewsVisual({ item, lang, large = false }: { item: DailyBriefItem; lang: Lang; large?: boolean }) {
  const detail = getDailyBriefTopicDetail(item.category);
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70", large ? "min-h-80" : "min-h-36")}>
      {!failed && (
        <>
          <Image
            src={dashboardNewsImageSrc(item)}
            alt={dailyItemTitle(item, "en")}
            className="scale-105 object-cover blur-[2px]"
            fill
            sizes={large ? "(min-width: 1280px) 520px, 100vw" : "(min-width: 768px) 180px, 100vw"}
            unoptimized
            loading="lazy"
            onError={() => setFailed(true)}
          />
          <Image
            src={dashboardNewsImageSrc(item)}
            alt=""
            aria-hidden
            className="object-cover opacity-85"
            fill
            sizes={large ? "(min-width: 1280px) 520px, 100vw" : "(min-width: 768px) 180px, 100vw"}
            unoptimized
            loading="lazy"
            onError={() => setFailed(true)}
          />
        </>
      )}
      {failed && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_16%,rgba(59,130,246,0.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))]">
          <div className="absolute right-4 top-4 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-300">
            Source image unavailable
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.06)_10%,rgba(2,6,23,0.96)_100%)]" />
      <div className="absolute left-5 top-5 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs font-black text-cyan-100">{dailyCategoryLabel(item.category, lang)}</div>
      <div className="relative flex h-full min-h-full flex-col justify-end p-5">
        <span className={cn("drop-shadow-[0_0_26px_rgba(96,165,250,0.75)]", large ? "text-7xl" : "text-4xl")}>{detail.icon}</span>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-lg border border-white/10 bg-white/[0.08] px-2.5 py-1 text-xs font-black text-white">#{item.tags[0] ?? item.category}</span>
          <span className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-black text-emerald-100">{item.priorityScore}</span>
        </div>
      </div>
    </div>
  );
}

function DashboardStoryCard({ item, lang, variant, isSending, onSend, onSave, onHide }: {
  item: DailyBriefItem;
  lang: Lang;
  variant: "featured" | "wide" | "compact";
  isSending: boolean;
  onSend: (item: DailyBriefItem) => void;
  onSave: (item: DailyBriefItem) => void;
  onHide: (item: DailyBriefItem) => void;
}) {
  const detail = getDailyBriefTopicDetail(item.category);
  const statusLabel = item.isSaved ? dailyText(lang, "saved") : item.telegramStatus === "idle" ? (lang === "th" ? "พร้อมส่ง" : "ready") : item.telegramStatus;
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const layoutClass = isFeatured
    ? "grid h-full grid-rows-[minmax(18rem,auto)_1fr]"
    : isCompact
      ? "grid h-full grid-rows-[minmax(9rem,auto)_1fr]"
      : "grid gap-0 sm:grid-cols-[11rem_minmax(0,1fr)]";

  return (
    <Card className={cn("group overflow-hidden p-0 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.045]", isFeatured ? "lg:row-span-2" : "")}>
      <div className={layoutClass}>
        <DashboardNewsVisual item={item} lang={lang} large={isFeatured} />
        <div className="flex min-w-0 flex-col p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={isFeatured ? "red" : detail.key === "cybersecurity" ? "purple" : "blue"}>{isFeatured ? (lang === "th" ? "Priority สูง" : "High Priority") : dailyCategoryLabel(item.category, lang)}</Badge>
            <Badge tone={dailyNewsStatusTone(item)}>{statusLabel}</Badge>
            <span className="ml-auto rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-sm font-black text-emerald-100">{item.priorityScore}</span>
          </div>
          <h3 className={cn("mt-3 font-black text-white", isFeatured ? "text-2xl leading-9" : "line-clamp-2 text-base leading-6")}>{dailyItemTitle(item, lang)}</h3>
          <p className="mt-2 text-xs font-semibold text-slate-500">{item.sourceName} · {formatNewsTime(item.publishedAt, lang)}</p>
          <p className={cn("mt-3 text-sm leading-6 text-slate-300", isFeatured ? "line-clamp-3" : "line-clamp-2")}>{dailyItemSummary(item, lang)}</p>
          {isFeatured && (
            <div className="mt-4 space-y-1 text-sm leading-6 text-slate-300">
              {dailyItemBullets(item, lang).slice(0, 2).map((point) => <p key={point}>• {point}</p>)}
            </div>
          )}
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            <Button asChild size="sm">
              <a href={item.sourceUrl} target="_blank" rel="noreferrer">{dailyText(lang, "readFull")}</a>
            </Button>
            <Button size="sm" variant="secondary" disabled={isSending} onClick={() => onSend(item)}>{isSending ? dailyText(lang, "sendingTelegram") : dailyText(lang, "sendTelegram")}</Button>
            <Button size="sm" variant="outline" onClick={() => onSave(item)}>{item.isSaved ? dailyText(lang, "saved") : dailyText(lang, "save")}</Button>
            {isFeatured && <Button size="sm" variant="ghost" onClick={() => onHide(item)}>{dailyText(lang, "hide")}</Button>}
          </div>
        </div>
      </div>
    </Card>
  );
}

function DailyBriefDashboardSection({
  lang,
  dailyBrief,
  dailyBriefError,
  dailyNewsItems,
  newsSnapshotCards,
  dailyCategoryCounts,
  dashboardSearch,
  newsActionLoading,
  message,
  runs,
  tasks,
  onSearchChange,
  onRefresh,
  onSendAll,
  onSendNews,
  onSaveNews,
  onHideNews,
}: {
  lang: Lang;
  dailyBrief: DailyBriefApiResponse | null;
  dailyBriefError: string | null;
  dailyNewsItems: DailyBriefItem[];
  newsSnapshotCards: NewsSnapshotCard[];
  dailyCategoryCounts: Record<string, number>;
  dashboardSearch: string;
  newsActionLoading: string | null;
  message: string;
  runs: TaskRun[];
  tasks: ScheduledTask[];
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onSendAll: () => void;
  onSendNews: (item: DailyBriefItem) => void;
  onSaveNews: (item: DailyBriefItem) => void;
  onHideNews: (item: DailyBriefItem) => void;
}) {
  const featured = dailyNewsItems[0] ?? null;
  const sideStories = dailyNewsItems.slice(1, 3);
  const lowerStories = dailyNewsItems.slice(3, 9);
  const topStories = (dailyBrief?.summary.topStories.length ? dailyBrief.summary.topStories : dailyNewsItems).slice(0, 5);
  const dateLabel = dailyBrief?.summary.date ?? new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-US", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date());
  const activeDailyTasks = tasks.filter((task) => task.type === "Daily Brief" && task.isActive).length;
  const failedRuns = runs.slice(0, 5).filter((run) => run.status === "failed" || run.telegramStatus === "failed").length;

  return (
    <section className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/55 px-4 shadow-inner shadow-black/20">
              <span className="text-slate-400">⌕</span>
              <input
                value={dashboardSearch}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={lang === "th" ? "ค้นหาข่าว, หมวดหมู่, แหล่งข่าว..." : "Search news, categories, sources..."}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
              />
              <span className="hidden rounded-lg border border-white/10 px-2 py-1 text-xs font-black text-slate-500 sm:inline">⌘K</span>
            </label>
            <div className="flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/55 px-4 text-sm font-black text-slate-200">📅 {dateLabel}</div>
            <div className="grid grid-cols-2 gap-2">
              <Button disabled={newsActionLoading === "refreshNews"} onClick={onRefresh} type="button" variant="secondary">{newsActionLoading === "refreshNews" ? label(lang, "running") : `✦ ${lang === "th" ? "สรุปวันนี้" : "Today"}`}</Button>
              <Button disabled={!dailyNewsItems.length || newsActionLoading === "sendAllNews"} onClick={onSendAll} type="button" variant="secondary">{newsActionLoading === "sendAllNews" ? dailyText(lang, "sendingTelegram") : `📨 ${dailyText(lang, "sendAll")}`}</Button>
            </div>
          </div>

          <Card className="relative overflow-hidden border-violet-300/25 bg-violet-400/[0.055] p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_16%,rgba(99,102,241,0.42),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(34,211,238,0.22),transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.14),rgba(88,28,135,0.20))]" />
            <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-center">
              <div>
                <h1 className="max-w-4xl text-3xl font-black tracking-tight text-white sm:text-5xl">{dailyText(lang, "title")}</h1>
                <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-200 sm:text-base">{dailyText(lang, "desc")}</p>
                <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-200 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">⚡ {lang === "th" ? "อัปเดตสดวันนี้" : "Live daily refresh"}</div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">🛡 {lang === "th" ? "คัดกรองอัจฉริยะ" : "Smart priority filter"}</div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">✈ {lang === "th" ? "ส่งตรง Telegram" : "Telegram ready"}</div>
                </div>
              </div>
              <div className="relative min-h-56 overflow-hidden rounded-3xl border border-cyan-300/20 bg-slate-950/45 p-6 shadow-[0_0_50px_rgba(59,130,246,0.20)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(96,165,250,0.42),transparent_28%),linear-gradient(135deg,rgba(99,102,241,0.22),rgba(2,6,23,0.10))]" />
                <div className="relative grid min-h-44 place-items-center text-center">
                  <div className="rotate-[-10deg] rounded-[2rem] border border-cyan-200/30 bg-cyan-300/10 p-8 text-7xl shadow-[0_0_48px_rgba(34,211,238,0.28)]">✈</div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {newsSnapshotCards.map((card) => (
              <Card key={card.label} className={cn("p-4", card.tone === "red" && "border-orange-300/30 bg-orange-400/[0.075]", card.tone === "purple" && "border-fuchsia-300/25 bg-fuchsia-400/[0.065]", card.tone === "green" && "border-emerald-300/25 bg-emerald-400/[0.055]", card.tone === "blue" && "border-blue-300/25 bg-blue-400/[0.055]")}>
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.08] text-xl">{card.icon}</span>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-bold text-slate-300">{card.label}</p>
                    <p className="mt-1 truncate text-2xl font-black text-white">{card.value}</p>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-400">{card.hint}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-white">⚡ {dailyText(lang, "latest")}</h2>
              <Button asChild size="sm" variant="ghost"><Link href="/daily">{lang === "th" ? "ดูข่าวทั้งหมด" : "View all"} →</Link></Button>
            </div>
            {dailyBriefError && <ErrorState title={lang === "th" ? "โหลดข่าวไม่สำเร็จ" : "News failed to load"} description={dailyBriefError} onRetry={onRefresh} />}
            {!dailyBriefError && !dailyNewsItems.length && <EmptyState title={dailyText(lang, "emptyTitle")} description={dailyText(lang, "emptyDesc")} />}
            {!dailyBriefError && dailyNewsItems.length > 0 && (
              <div className="grid gap-4 xl:grid-cols-[1.1fr_1.45fr]">
                {featured && (
                  <DashboardStoryCard
                    item={featured}
                    lang={lang}
                    variant="featured"
                    isSending={newsActionLoading === `news:${featured.id}`}
                    onSend={onSendNews}
                    onSave={onSaveNews}
                    onHide={onHideNews}
                  />
                )}
                <div className="grid gap-4">
                  {sideStories.map((item) => (
                    <DashboardStoryCard
                      key={item.id}
                      item={item}
                      lang={lang}
                      variant="wide"
                      isSending={newsActionLoading === `news:${item.id}`}
                      onSend={onSendNews}
                      onSave={onSaveNews}
                      onHide={onHideNews}
                    />
                  ))}
                  <div className="grid gap-4 md:grid-cols-3">
                    {lowerStories.map((item) => (
                      <DashboardStoryCard
                        key={item.id}
                        item={item}
                        lang={lang}
                        variant="compact"
                        isSending={newsActionLoading === `news:${item.id}`}
                        onSend={onSendNews}
                        onSave={onSaveNews}
                        onHide={onHideNews}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-white">Top 5 {lang === "th" ? "ข่าวสำคัญวันนี้" : "important stories"}</h2>
              <Button asChild size="sm" variant="ghost"><Link href="/daily">{lang === "th" ? "ดูทั้งหมด" : "All"}</Link></Button>
            </div>
            <div className="mt-4 space-y-2">
              {topStories.map((item, index) => (
                <div key={item.id} className="grid grid-cols-[2rem_minmax(0,1fr)_3.25rem] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-2.5">
                  <span className={cn("grid h-8 w-8 place-items-center rounded-lg text-sm font-black text-white", index === 0 ? "bg-rose-500/80" : index === 1 ? "bg-amber-500/80" : index === 2 ? "bg-cyan-500/75" : "bg-violet-500/75")}>{index + 1}</span>
                  <p className="line-clamp-2 text-sm font-bold leading-5 text-white">{dailyItemTitle(item, lang)}</p>
                  <span className="justify-self-end rounded-xl bg-emerald-300/10 px-2 py-1 text-center text-xs font-black text-emerald-100">{item.priorityScore}<br />{label(lang, "score")}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold text-slate-500">{lang === "th" ? "อัปเดตล่าสุด" : "Updated"} {formatNewsTime(dailyBrief?.summary.generatedAt, lang)}</p>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-black text-white">{lang === "th" ? "สถานะระบบ" : "System status"}</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-200">🛡 {lang === "th" ? "ระบบคัดกรองข่าว" : "News filtering"}</span>
                  <span className="text-sm font-black text-emerald-200">{lang === "th" ? "ทำงานปกติ" : "Healthy"}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-200">📨 Telegram API</span>
                  <span className={cn("text-sm font-black", failedRuns ? "text-amber-200" : "text-emerald-200")}>{failedRuns ? (lang === "th" ? "มีงานต้องตรวจ" : "Review") : (lang === "th" ? "เชื่อมต่อปกติ" : "Connected")}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-200">🗂 {lang === "th" ? "หมวด Daily Brief" : "Daily categories"}</span>
                  <span className="text-sm font-black text-cyan-100">{Object.keys(dailyCategoryCounts).length}</span>
                </div>
              </div>
            </div>
            <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-3 text-xs leading-6 text-cyan-50">{message}</p>
            <p className="mt-3 text-xs text-slate-500">{activeDailyTasks} {lang === "th" ? "Daily Brief task เปิดใช้งานอยู่" : "active Daily Brief task(s)"}</p>
          </Card>
        </aside>
      </div>
    </section>
  );
}

export function DashboardControlView() {
  const { lang, t } = useLanguage();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [notifications, setNotifications] = useState<WebNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyBrief, setDailyBrief] = useState<DailyBriefApiResponse | null>(null);
  const [dailyBriefError, setDailyBriefError] = useState<string | null>(null);
  const [hiddenNewsIds, setHiddenNewsIds] = useState<Set<string>>(() => new Set());
  const [savedNewsIds, setSavedNewsIds] = useState<Set<string>>(() => new Set());
  const [newsStatuses, setNewsStatuses] = useState<Record<string, DailyBriefItem["telegramStatus"]>>({});
  const [newsActionLoading, setNewsActionLoading] = useState<string | null>(null);
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [message, setMessage] = useState(t("dashboard_command_initial_message"));
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [actionLoading, setActionLoading] = useState<"runAll" | "task" | null>(null);

  useEffect(() => setMessage(t("dashboard_command_initial_message")), [lang, t]);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setDailyBriefError(null);
    const [taskResult, runResult, notificationResult, briefResult] = await Promise.allSettled([
      apiRequest<ScheduledTask[]>("/api/scheduled-tasks"),
      apiRequest<TaskRun[]>("/api/task-runs"),
      apiRequest<WebNotification[]>("/api/notifications"),
      apiRequest<DailyBriefApiResponse>("/api/news/latest"),
    ]);

    if (taskResult.status === "fulfilled") setTasks(taskResult.value);
    else setTasks([]);

    if (runResult.status === "fulfilled") setRuns(runResult.value);
    else setRuns([]);

    if (notificationResult.status === "fulfilled") setNotifications(notificationResult.value);
    else setNotifications([]);

    if (briefResult.status === "fulfilled") setDailyBrief(briefResult.value);
    else setDailyBriefError(toErrorMessage(briefResult.reason));

    const coreFailures = [taskResult, runResult, notificationResult].filter((result) => result.status === "rejected");
    if (coreFailures.length === 3 && taskResult.status === "rejected") {
      setError(toErrorMessage(taskResult.reason));
    } else if (coreFailures.length > 0) {
      setMessage(lang === "th" ? "บาง API โหลดไม่สำเร็จ แต่ Dashboard ยังแสดงข้อมูลที่เหลือและ Daily Brief fallback ได้" : "Some APIs failed, but the dashboard is still showing available data and Daily Brief fallback.");
    }

    setIsLoading(false);
  }, [lang]);

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

  const dailyNewsItems = useMemo(() => {
    const query = dashboardSearch.trim().toLowerCase();
    return (dailyBrief?.items ?? [])
      .filter((item) => !hiddenNewsIds.has(item.id) && !item.isHidden)
      .filter((item) => {
        if (!query) return true;
        const haystack = [item.title, item.titleTh, item.summaryTh, item.sourceName, item.category, ...item.tags].join(" ").toLowerCase();
        return haystack.includes(query);
      })
      .map((item) => ({
        ...item,
        isSaved: savedNewsIds.has(item.id) || item.isSaved,
        telegramStatus: newsStatuses[item.id] ?? item.telegramStatus,
      }))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 12);
  }, [dailyBrief, dashboardSearch, hiddenNewsIds, newsStatuses, savedNewsIds]);

  const dailyCategoryCounts = useMemo(() => {
    return (dailyBrief?.items ?? []).reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
  }, [dailyBrief]);

  const topDailyCategory = useMemo(() => {
    const [key, count] = Object.entries(dailyCategoryCounts).sort((a, b) => b[1] - a[1])[0] ?? ["all", 0];
    return { key: key as DailyBriefCategoryKey, count };
  }, [dailyCategoryCounts]);

  const highPriorityNews = (dailyBrief?.items ?? []).filter((item) => item.priorityScore >= 80).length;
  const sentNewsCount = (dailyBrief?.items ?? []).filter((item) => isDailyNewsSent(newsStatuses[item.id] ?? item.telegramStatus)).length;
  const cyberNewsCount = (dailyBrief?.items ?? []).filter((item) => item.category === "cybersecurity").length;
  const pmTrafficCount = (dailyBrief?.items ?? []).filter((item) => item.category === "weatherPm25" || item.category === "traffic").length;
  const newsSnapshotCards = [
    { label: dailyText(lang, "totalNews"), value: dailyBrief?.summary.totalItems ?? dailyNewsItems.length, hint: dailyBrief?.summary.mode ?? dailyText(lang, "fallbackMode"), tone: "blue" as const, icon: "📰" },
    { label: dailyText(lang, "highPriority"), value: highPriorityNews, hint: "Priority ≥ 80", tone: "purple" as const, icon: "⭐" },
    { label: dailyText(lang, "telegramSent"), value: sentNewsCount, hint: "sent / mock_sent", tone: "green" as const, icon: "📨" },
    { label: dailyText(lang, "failedTasks"), value: failedCount, hint: failedCount > 0 ? label(lang, "needsReview") : label(lang, "healthy"), tone: failedCount > 0 ? "red" as const : "green" as const, icon: "⚠️" },
    { label: lang === "th" ? "หมวดเด่นวันนี้" : "Top Category", value: dailyCategoryLabel(topDailyCategory.key, lang), hint: `${topDailyCategory.count} ${t("common_items")}`, tone: "green" as const, icon: "🎯" },
    { label: dailyText(lang, "cyberAlert"), value: cyberNewsCount + pmTrafficCount, hint: `${dailyCategoryLabel("cybersecurity", lang)} / ${dailyCategoryLabel("weatherPm25", lang)}`, tone: cyberNewsCount || pmTrafficCount ? "blue" as const : "gray" as const, icon: "🛡️" },
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

  async function refreshDailyBrief() {
    setNewsActionLoading("refreshNews");
    setDailyBriefError(null);
    try {
      const data = await apiRequest<DailyBriefApiResponse>("/api/news/latest");
      setDailyBrief(data);
      setMessage(dailyText(lang, "newsRefreshed"));
    } catch (err) {
      const nextError = toErrorMessage(err);
      setDailyBriefError(nextError);
      setMessage(nextError);
    } finally {
      setNewsActionLoading(null);
    }
  }

  async function sendNewsToTelegram(item: DailyBriefItem) {
    setNewsActionLoading(`news:${item.id}`);
    try {
      const result = await apiRequest<NewsTelegramResult>("/api/telegram/send-news", {
        method: "POST",
        body: JSON.stringify({ item }),
      });
      setNewsStatuses((prev) => ({ ...prev, [item.id]: result.status }));
      setMessage(result.message);
    } catch (err) {
      setNewsStatuses((prev) => ({ ...prev, [item.id]: "failed" }));
      setMessage(toErrorMessage(err));
    } finally {
      setNewsActionLoading(null);
    }
  }

  async function sendAllNewsToTelegram() {
    setNewsActionLoading("sendAllNews");
    let sent = 0;
    let failed = 0;

    try {
      for (const item of dailyNewsItems) {
        try {
          const result = await apiRequest<NewsTelegramResult>("/api/telegram/send-news", {
            method: "POST",
            body: JSON.stringify({ item }),
          });
          setNewsStatuses((prev) => ({ ...prev, [item.id]: result.status }));
          if (isDailyNewsSent(result.status)) sent += 1;
          if (result.status === "failed") failed += 1;
        } catch {
          failed += 1;
          setNewsStatuses((prev) => ({ ...prev, [item.id]: "failed" }));
        }
      }
      setMessage(fill(dailyText(lang, "sendAllDone"), { count: dailyNewsItems.length, sent, failed }));
    } finally {
      setNewsActionLoading(null);
    }
  }

  function saveNews(item: DailyBriefItem) {
    setSavedNewsIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
    setMessage(dailyText(lang, "newsSaved"));
  }

  function hideNews(item: DailyBriefItem) {
    setHiddenNewsIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
    setMessage(dailyText(lang, "newsHidden"));
  }

  if (isLoading) return <LoadingState title={t("dashboard_loading_title")} description={t("dashboard_loading_desc")} />;
  if (error) return <ErrorState title={t("dashboard_loading_failed")} description={error} onRetry={loadDashboard} />;

  return (
    <div className="space-y-8">
      <DailyBriefDashboardSection
        lang={lang}
        dailyBrief={dailyBrief}
        dailyBriefError={dailyBriefError}
        dailyNewsItems={dailyNewsItems}
        newsSnapshotCards={newsSnapshotCards}
        dailyCategoryCounts={dailyCategoryCounts}
        dashboardSearch={dashboardSearch}
        newsActionLoading={newsActionLoading}
        message={message}
        runs={runs}
        tasks={tasks}
        onSearchChange={setDashboardSearch}
        onRefresh={() => void refreshDailyBrief()}
        onSendAll={() => void sendAllNewsToTelegram()}
        onSendNews={(item) => void sendNewsToTelegram(item)}
        onSaveNews={saveNews}
        onHideNews={hideNews}
      />

      <section className="grid gap-5">
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-32 left-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative">
            <Badge tone="purple">NimbusDaily</Badge>
            <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">{t("dashboard_title")}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{t("dashboard_description")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {TOPICS.map((topic) => <Badge key={topic.key} tone={topic.tone}>{topic.emoji} {topic.label[lang]}</Badge>)}
            </div>
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
              <Button asChild variant="outline"><Link href="/daily">📰 {dailyText(lang, "openDaily")}</Link></Button>
              <Button asChild variant="outline"><Link href="/notifications">🔔 {t("nav_notifications")}</Link></Button>
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
        {filteredRuns.length === 0 ? <EmptyState title={t("dashboard_no_gpt_results")} description={t("dashboard_no_gpt_results_desc")} /> : <div className="grid gap-4 xl:grid-cols-3">{filteredRuns.slice(0, 6).map((run) => { const task = taskById.get(run.taskId); const topic = topicForRun(run, task); const score = clampScore(run.priorityScore); const highlights = runHighlights(run, lang); return <Card key={run.id} className="p-5"><div className="flex items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><Badge tone={topic.tone}>{topic.emoji} {topic.label[lang]}</Badge><Badge tone={statusTone(run.status)}>{localize(STATUS_LABELS, run.status, lang)}</Badge></div><span className="text-xs text-slate-500">{formatDateTime(run.startedAt)}</span></div><h3 className="mt-4 text-lg font-black text-white">{displayRunTitle(run, task, lang)}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{displayRunSummary(run, task, lang)}</p><div className="mt-4 flex flex-wrap gap-2"><Badge tone={telegramTone(run.telegramStatus)}>📨 {run.telegramStatus || "unknown"}</Badge><Badge tone="purple">🧠 {translationMode(run, lang)}</Badge>{sourceNames(run).map((source) => <Badge key={source} tone="gray">🗂 {source}</Badge>)}</div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${score}%` }} /></div><div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label(lang, "highlights")}</p>{highlights.length ? <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-300">{highlights.map((item) => <li key={item} className="line-clamp-2">{item}</li>)}</ul> : <p className="mt-3 text-xs text-slate-400">{label(lang, "noHighlights")}</p>}</div><div className="mt-5 flex flex-wrap items-center gap-3"><Badge tone="blue">{lang === "th" ? "แสดงในหน้า Dashboard" : "Shown in Dashboard"}</Badge>{run.translatedContent && <Badge tone="green">{label(lang, "thai")}</Badge>}{run.originalContent && <Badge tone="gray">{label(lang, "original")}</Badge>}</div></Card>; })}</div>}
      </section>

      <section className="space-y-4">
        <div><p className="text-sm font-semibold text-violet-200">{t("dashboard_notifications_label")}</p><h2 className="mt-1 text-2xl font-black text-white">{t("dashboard_notifications_title")}</h2><p className="mt-2 text-sm text-slate-400">{label(lang, "notificationsSubtitle")}</p></div>
        {notifications.length === 0 ? <EmptyState title={t("dashboard_no_notifications")} description={t("dashboard_no_notifications_desc")} /> : <div className="grid gap-4 lg:grid-cols-2">{notifications.slice(0, 6).map((notification) => { const topic = topicFromText(notification.type, notification.title, notification.summary); return <Card key={notification.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><Badge tone={notification.isRead ? "gray" : "blue"}>{notification.isRead ? t("common_read") : t("common_unread")}</Badge>{notification.priorityScore >= 80 && <Badge tone="red">{t("common_important")}</Badge>}<Badge tone={topic.tone}>{topic.emoji} {topic.label[lang]}</Badge></div><h3 className="mt-4 text-base font-black text-white">{notification.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{notification.summary}</p></div><div className="shrink-0 text-right"><p className="text-2xl font-black text-cyan-100">{notification.priorityScore}</p><p className="text-[11px] uppercase tracking-wider text-slate-500">{label(lang, "score")}</p></div></div></Card>; })}</div>}
      </section>
    </div>
  );
}
