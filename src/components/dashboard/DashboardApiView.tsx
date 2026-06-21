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
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { useLanguage } from "@/contexts/LanguageContext";

type LocalizedText = Record<Lang, string>;

const TASK_TYPE_LABELS: Record<string, LocalizedText> = {
  "Daily Brief": { th: "สรุปประจำวัน / ข่าว", en: "Daily Brief / News" },
  "Email Monitor": { th: "ตรวจอีเมลสำคัญ", en: "Email Monitor" },
  "Sale Monitor": { th: "สินค้าใหม่/น่าสนใจทั่วโลก", en: "Global Product Radar" },
  "Global Product Radar": { th: "สินค้าใหม่/น่าสนใจทั่วโลก", en: "Global Product Radar" },
  "Concert Alerts": { th: "แจ้งเตือนคอนเสิร์ต", en: "Concert Alerts" },
  "World Cup Recap": { th: "สรุปฟุตบอล", en: "Football Recap" },
  "Football Recap": { th: "สรุปฟุตบอล", en: "Football Recap" },
  "Weekend Ideas": { th: "ไอเดียวันหยุด", en: "Weekend Ideas" },
  "Weekend Long Read": { th: "บทความอ่านยาววันหยุด", en: "Weekend Long Read" },
  Custom: { th: "กำหนดเอง", en: "Custom" },
};

const STATUS_LABELS: Record<string, LocalizedText> = {
  success: { th: "สำเร็จ", en: "success" },
  failed: { th: "ล้มเหลว", en: "failed" },
  running: { th: "กำลังรัน", en: "running" },
  Active: { th: "ใช้งานอยู่", en: "Active" },
  Running: { th: "กำลังรัน", en: "Running" },
  Failed: { th: "ล้มเหลว", en: "Failed" },
  Paused: { th: "หยุดไว้", en: "Paused" },
};

const SCHEDULE_LABELS: Record<string, LocalizedText> = {
  Daily: { th: "รายวัน", en: "Daily" },
  Hourly: { th: "รายชั่วโมง", en: "Hourly" },
  Weekly: { th: "รายสัปดาห์", en: "Weekly" },
  Monthly: { th: "รายเดือน", en: "Monthly" },
  "One Time": { th: "ครั้งเดียว", en: "One Time" },
  "Custom Cron": { th: "Cron กำหนดเอง", en: "Custom Cron" },
};

const CONTENT_LABELS: Record<string, LocalizedText> = {
  "Morning Daily Brief": { th: "สรุปข่าวเช้า", en: "Morning Daily Brief" },
  "Morning Daily Brief Summary": { th: "สรุปข่าวเช้า", en: "Morning Daily Brief Summary" },
  "Shopee Sale Monitor": { th: "สินค้าใหม่/น่าสนใจทั่วโลก", en: "Global Product Radar" },
  "Sale Monitor Running": { th: "เรดาร์สินค้าใหม่กำลังทำงาน", en: "Global Product Radar Running" },
  "Important Email Monitor": { th: "ตรวจอีเมลสำคัญ", en: "Important Email Monitor" },
  "Email Monitor Alert": { th: "แจ้งเตือนอีเมลสำคัญ", en: "Email Monitor Alert" },
  "Concert Alerts Near Me": { th: "แจ้งเตือนคอนเสิร์ตใกล้ฉัน", en: "Concert Alerts Near Me" },
  "Concert Alerts": { th: "แจ้งเตือนคอนเสิร์ต", en: "Concert Alerts" },
  "Football Recap Nightly": { th: "สรุปฟุตบอลประจำคืน", en: "Football Recap Nightly" },
  "Football Recap Failed": { th: "สรุปฟุตบอลมีปัญหา", en: "Football Recap Failed" },
  "Football Recap มีปัญหา": { th: "สรุปฟุตบอลมีปัญหา", en: "Football Recap has an issue" },
  "Weekend Ideas Generator": { th: "สร้างไอเดียวันหยุด", en: "Weekend Ideas Generator" },
  "Weekend Ideas": { th: "ไอเดียวันหยุด", en: "Weekend Ideas" },
  "Weekend Ideas พร้อมใช้": { th: "ไอเดียวันหยุดพร้อมใช้", en: "Weekend Ideas ready" },
  "Weekend Long Read Picker": { th: "คัดบทความอ่านยาววันหยุด", en: "Weekend Long Read Picker" },
  "Weekend Long Read Picks": { th: "บทความอ่านยาวที่น่าอ่าน", en: "Weekend Long Read Picks" },
  "Weekend Long Read คัดแล้ว": { th: "คัดบทความอ่านยาวแล้ว", en: "Weekend Long Read picked" },
  "Morning Daily Brief พร้อมแล้ว": { th: "สรุปข่าวเช้าพร้อมแล้ว", en: "Morning Daily Brief is ready" },
  "มีอีเมลสำคัญต้องดู": { th: "มีอีเมลสำคัญต้องดู", en: "Important emails need review" },
  "พบคอนเสิร์ตน่าสนใจ": { th: "พบคอนเสิร์ตน่าสนใจ", en: "Interesting concerts found" },
  "Sale Monitor กำลังรัน": { th: "เรดาร์สินค้าใหม่กำลังรัน", en: "Global Product Radar is running" },
  "วันนี้มีข่าว AI และสภาพอากาศที่ควรรู้ เหมาะสำหรับจัดลำดับงานช่วงเช้า": {
    th: "วันนี้มีข่าว AI และสภาพอากาศที่ควรรู้ เหมาะสำหรับจัดลำดับงานช่วงเช้า",
    en: "Today has AI news and weather updates worth reviewing before planning the morning.",
  },
  "กำลังตรวจสอบราคาสินค้าและความคุ้มค่าของโปรล่าสุด": {
    th: "กำลังคัดสินค้าใหม่และสินค้าที่น่าสนใจจากทั่วโลก",
    en: "Checking new and interesting products from around the world.",
  },
  "พบอีเมลที่ควรตรวจวันนี้ 2 รายการ ได้แก่ Security alert และ invoice reminder": {
    th: "พบอีเมลที่ควรตรวจวันนี้ 2 รายการ ได้แก่ Security alert และ invoice reminder",
    en: "Found 2 emails worth checking today: a security alert and an invoice reminder.",
  },
  "GPT พบ Security alert และ invoice reminder ที่ควรตรวจวันนี้ Priority 88/100": {
    th: "GPT พบ Security alert และ invoice reminder ที่ควรตรวจวันนี้ Priority 88/100",
    en: "GPT found a security alert and invoice reminder worth checking today. Priority 88/100.",
  },
  "GPT สรุปข่าว AI และสภาพอากาศให้แล้ว Priority 82/100": {
    th: "GPT สรุปข่าว AI และสภาพอากาศให้แล้ว Priority 82/100",
    en: "GPT summarized AI news and weather updates. Priority 82/100.",
  },
  "แนะนำคาเฟ่ช่วงเช้าและกิจกรรม outdoor พร้อม prompt ภาพ 9:16": {
    th: "แนะนำคาเฟ่ช่วงเช้าและกิจกรรม outdoor พร้อม prompt ภาพ 9:16",
    en: "Recommended a morning cafe and outdoor activity with a 9:16 image prompt.",
  },
  "Task ดึงข้อมูล Football API mock ไม่สำเร็จ ต้องตรวจสอบก่อนรันใหม่": {
    th: "Task ดึงข้อมูล Football API mock ไม่สำเร็จ ต้องตรวจสอบก่อนรันใหม่",
    en: "The task could not fetch the Football API mock. Review it before running again.",
  },
  "ระบบกำลังตรวจสอบราคา power bank, USB-C cable และ wireless earbuds": {
    th: "ระบบกำลังคัดสินค้าใหม่/น่าสนใจ เช่น gadget, AI device และอุปกรณ์ทำงาน",
    en: "The system is checking new or interesting products such as gadgets, AI devices, and work gear.",
  },
  "มีรายการคอนเสิร์ตใกล้กรุงเทพที่ควรบันทึกไว้ดูต่อ Priority 78/100": {
    th: "มีรายการคอนเสิร์ตใกล้กรุงเทพที่ควรบันทึกไว้ดูต่อ Priority 78/100",
    en: "Concerts near Bangkok were found and are worth saving. Priority 78/100.",
  },
  "คัดบทความอ่านยาวเกี่ยวกับ AI agents และ productivity systems สำหรับวันหยุด": {
    th: "คัดบทความอ่านยาวเกี่ยวกับ AI agents และ productivity systems สำหรับวันหยุด",
    en: "Picked long reads about AI agents and productivity systems for the weekend.",
  },
};

function localizeFromMap(value: string | null | undefined, lang: Lang, map: Record<string, LocalizedText>) {
  if (!value) return "";
  return map[value]?.[lang] ?? value;
}

function localizeTaskType(type: string, lang: Lang) {
  return localizeFromMap(type, lang, TASK_TYPE_LABELS) || type;
}

function localizeStatus(status: string, lang: Lang) {
  return localizeFromMap(status, lang, STATUS_LABELS) || status;
}

function localizeScheduleType(scheduleType: string, lang: Lang) {
  return localizeFromMap(scheduleType, lang, SCHEDULE_LABELS) || scheduleType;
}

function localizeContent(value: string | null | undefined, lang: Lang) {
  if (!value) return "";
  return localizeFromMap(value, lang, CONTENT_LABELS) || value;
}

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);
}

function getRunTitle(run: TaskRun, lang: Lang) {
  const translatedTitle = run.translation?.translatedTitle;
  if (lang === "th" && translatedTitle) return translatedTitle;
  return localizeContent(run.gptOutput.title, lang);
}

function getRunSummary(run: TaskRun, lang: Lang) {
  if (lang === "th") {
    return run.translatedContent || run.translation?.translatedSummary || localizeContent(run.gptOutput.summary, lang);
  }
  return localizeContent(run.gptOutput.summary, lang);
}

export function DashboardApiView() {
  const { lang, t } = useLanguage();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [notifications, setNotifications] = useState<WebNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [command, setCommand] = useState(t("dashboard_command_default"));
  const [message, setMessage] = useState(t("dashboard_command_initial_message"));
  const [isCommandRunning, setIsCommandRunning] = useState(false);

  useEffect(() => {
    setCommand(t("dashboard_command_default"));
    setMessage(t("dashboard_command_initial_message"));
  }, [lang, t]);

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

  const latestRun = runs[0] ?? null;
  const activeTasks = tasks.filter((task) => task.isActive).slice(0, 4);
  const activeCount = tasks.filter((task) => task.status === "Active").length;
  const runningCount = tasks.filter((task) => task.status === "Running").length;
  const failedCount = tasks.filter((task) => task.status === "Failed").length;
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const latestPriority = Math.max(...runs.map((run) => run.priorityScore), 0);

  const summaryCards = [
    {
      label: t("dashboard_card_active_tasks"),
      value: activeCount,
      hint: fill(t("dashboard_card_running_now"), { count: runningCount }),
      tone: "green" as const,
      icon: "⏱",
    },
    {
      label: t("dashboard_card_latest_priority"),
      value: `${latestPriority}/100`,
      hint: t("dashboard_card_from_latest_runs"),
      tone: "purple" as const,
      icon: "◎",
    },
    {
      label: t("dashboard_card_unread_alerts"),
      value: unreadCount,
      hint: t("dashboard_card_notifications_from_api"),
      tone: "blue" as const,
      icon: "●",
    },
    {
      label: t("dashboard_card_failed_tasks"),
      value: failedCount,
      hint: failedCount > 0 ? t("dashboard_card_needs_review") : t("dashboard_card_healthy"),
      tone: failedCount > 0 ? ("red" as const) : ("green" as const),
      icon: "!",
    },
  ];

  const latestNotifications = useMemo(() => notifications.slice(0, 4), [notifications]);
  const latestRuns = useMemo(() => runs.slice(0, 3), [runs]);

  async function handleCommand() {
    const text = command.trim();

    if (!text) {
      setMessage(t("dashboard_command_empty"));
      return;
    }

    const dailyBrief = tasks.find((task) => task.type === "Daily Brief" || task.name.toLowerCase().includes("daily"));

    if (!dailyBrief) {
      setMessage(t("dashboard_command_no_daily_brief"));
      return;
    }

    setIsCommandRunning(true);
    setMessage(fill(t("dashboard_command_sending"), { text }));

    try {
      await apiRequest(`/api/scheduled-tasks/${dailyBrief.id}/run-now`, { method: "POST" });
      setMessage(fill(t("dashboard_command_success"), { name: localizeContent(dailyBrief.name, lang) }));
      await loadDashboard();
    } catch (err) {
      setMessage(toErrorMessage(err));
    } finally {
      setIsCommandRunning(false);
    }
  }

  if (isLoading) {
    return <LoadingState title={t("dashboard_loading_title")} description={t("dashboard_loading_desc")} />;
  }

  if (error) {
    return <ErrorState title={t("dashboard_loading_failed")} description={error} onRetry={loadDashboard} />;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1.5fr_0.7fr] xl:items-stretch">
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-32 left-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative">
            <Badge tone="purple">{t("dashboard_badge_api_connected")}</Badge>
            <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
              {t("dashboard_title")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {t("dashboard_description")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge tone="blue">{t("dashboard_badge_api_fetch")}</Badge>
              <Badge tone="green">{t("dashboard_badge_supabase_ready")}</Badge>
              <Badge tone="purple">{t("dashboard_badge_ai_ready")}</Badge>
              <Badge tone="gray">{t("dashboard_badge_telegram_ready")}</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold text-slate-400">{t("dashboard_latest_run_label")}</p>
          <h2 className="mt-3 text-xl font-black text-white">{latestRun ? getRunTitle(latestRun, lang) : t("dashboard_no_result")}</h2>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
            {latestRun ? getRunSummary(latestRun, lang) : t("dashboard_no_gpt_summary")}
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{t("common_priority")}</span>
              <span className="text-2xl font-black text-cyan-100">{latestRun?.priorityScore ?? 0}/100</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">{t("common_last_run")}: {latestRun ? formatDateTime(latestRun.startedAt) : "-"}</p>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400">{card.label}</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{card.value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">{card.hint}</p>
              </div>
              <Badge tone={card.tone}>{card.icon}</Badge>
            </div>
          </Card>
        ))}
      </section>

      <Card className="relative overflow-hidden border-cyan-300/20 bg-cyan-300/[0.06] p-5 sm:p-6">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative grid gap-5 xl:grid-cols-[0.8fr_1.2fr] xl:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-200">{t("dashboard_command_label")}</p>
            <h2 className="mt-3 text-2xl font-black text-white">{t("dashboard_command_title")}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{t("dashboard_command_description")}</p>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <Input value={command} onChange={(event) => setCommand(event.target.value)} />
              <Button disabled={isCommandRunning} onClick={handleCommand} type="button">
                {isCommandRunning ? t("dashboard_command_running") : t("dashboard_command_send")}
              </Button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm leading-6 text-slate-300">{message}</div>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cyan-200">{t("dashboard_active_tasks_label")}</p>
            <h2 className="mt-1 text-2xl font-black text-white">{t("dashboard_active_tasks_title")}</h2>
          </div>
          <Button variant="secondary" onClick={loadDashboard} type="button">
            {t("common_refresh")}
          </Button>
        </div>
        {activeTasks.length === 0 ? (
          <EmptyState title={t("dashboard_no_active_tasks")} description={t("dashboard_no_active_tasks_desc")} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {activeTasks.map((task) => (
              <Card key={task.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge tone={task.status === "Running" ? "purple" : task.status === "Failed" ? "red" : "green"}>{localizeStatus(task.status, lang)}</Badge>
                    <h3 className="mt-4 line-clamp-2 text-base font-black text-white">{localizeContent(task.name, lang)}</h3>
                    <p className="mt-2 text-sm text-slate-400">{localizeTaskType(task.type, lang)}</p>
                  </div>
                  <span className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-cyan-100">
                    {localizeScheduleType(task.scheduleType, lang)}
                  </span>
                </div>
                <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-slate-400">
                  <p>{t("common_last_run")}: {formatDateTime(task.lastRunAt)}</p>
                  <p>{t("common_next_run")}: {formatDateTime(task.nextRunAt)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-cyan-200">{t("dashboard_latest_results_label")}</p>
          <h2 className="mt-1 text-2xl font-black text-white">{t("dashboard_latest_results_title")}</h2>
        </div>
        {latestRuns.length === 0 ? (
          <EmptyState title={t("dashboard_no_gpt_results")} description={t("dashboard_no_gpt_results_desc")} />
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {latestRuns.map((run) => {
              const score = clampScore(run.priorityScore);
              return (
                <Card key={run.id} className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Badge tone={run.status === "success" ? "green" : run.status === "failed" ? "red" : "purple"}>{localizeStatus(run.status, lang)}</Badge>
                    <span className="text-xs text-slate-500">{formatDateTime(run.startedAt)}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-black text-white">{getRunTitle(run, lang)}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{getRunSummary(run, lang)}</p>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${score}%` }} />
                  </div>
                  <Link href={`/task-results/${run.id}`} className="mt-5 inline-flex text-sm font-bold text-cyan-200 hover:text-cyan-100">
                    {t("common_open_result")}
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-violet-200">{t("dashboard_notifications_label")}</p>
          <h2 className="mt-1 text-2xl font-black text-white">{t("dashboard_notifications_title")}</h2>
        </div>
        {latestNotifications.length === 0 ? (
          <EmptyState title={t("dashboard_no_notifications")} description={t("dashboard_no_notifications_desc")} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {latestNotifications.map((notification) => (
              <Card key={notification.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={notification.isRead ? "gray" : "blue"}>{notification.isRead ? t("common_read") : t("common_unread")}</Badge>
                      {notification.priorityScore >= 80 && <Badge tone="red">{t("common_important")}</Badge>}
                      <Badge tone="purple">{localizeTaskType(notification.type, lang)}</Badge>
                    </div>
                    <h3 className="mt-4 text-base font-black text-white">{localizeContent(notification.title, lang)}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{localizeContent(notification.summary, lang)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-black text-cyan-100">{notification.priorityScore}</p>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">{t("common_score")}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
