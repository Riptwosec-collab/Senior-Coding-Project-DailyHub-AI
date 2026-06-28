"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import type { WebNotification, NotificationCategory } from "@/types/notification";
import type { ScheduledTask } from "@/types/scheduled-task";
import type { TaskRun } from "@/types/task-run";
import { NotificationCard } from "./NotificationCard";

interface NotificationsViewProps {
  initialNotifications: WebNotification[];
  tasks: ScheduledTask[];
  taskRuns: TaskRun[];
}

type ReadFilter = "All" | "Unread" | "Read";
type ImportanceFilter = "All" | "Important" | "Normal";

const categoryOptions: Array<"All" | NotificationCategory> = [
  "All",
  "Daily Brief",
  "Email",
  "Sale",
  "Football",
  "Lifestyle",
  "Concert",
  "Public Alerts",
  "Travel Deals",
  "Custom",
];

const readOptions: ReadFilter[] = ["All", "Unread", "Read"];
const importanceOptions: ImportanceFilter[] = ["All", "Important", "Normal"];

function toCategory(type: string): NotificationCategory {
  if (type === "Daily Brief") return "Daily Brief";
  if (type === "Email Monitor") return "Email";
  if (type === "Sale Monitor") return "Sale";
  if (type === "World Cup Recap") return "Football";
  if (type === "Weekend Long Read") return "Lifestyle";
  if (type === "Concert Alerts") return "Concert";
  if (type === "Public Alerts") return "Public Alerts";
  if (type === "Travel Deals") return "Travel Deals";
  return "Custom";
}

export function NotificationsView({ initialNotifications, tasks, taskRuns }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | NotificationCategory>("All");
  const [selectedRead, setSelectedRead] = useState<ReadFilter>("All");
  const [selectedImportance, setSelectedImportance] = useState<ImportanceFilter>("All");
  const [importantIds, setImportantIds] = useState<string[]>(
    initialNotifications.filter((item) => item.priorityScore >= 80).map((item) => item.id),
  );
  const [message, setMessage] = useState(
    "Phase 6 ใช้ mock state ก่อน กด Mark Read / Important เพื่อทดสอบ notification workflow ได้เลย",
  );

  const filteredNotifications = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const task = tasks.find((item) => item.id === notification.taskId);
      const taskRun = taskRuns.find((item) => item.id === notification.taskRunId);
      const category = toCategory(notification.type);
      const isImportant = importantIds.includes(notification.id);

      const matchesSearch =
        keyword.length === 0 ||
        [
          notification.title,
          notification.summary,
          notification.type,
          category,
          String(notification.priorityScore),
          task?.name ?? "",
          taskRun?.gptOutput.title ?? "",
          taskRun?.gptOutput.summary ?? "",
          taskRun?.telegramStatus ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchesCategory = selectedCategory === "All" || category === selectedCategory;
      const matchesRead =
        selectedRead === "All" ||
        (selectedRead === "Read" && notification.isRead) ||
        (selectedRead === "Unread" && !notification.isRead);
      const matchesImportance =
        selectedImportance === "All" ||
        (selectedImportance === "Important" && isImportant) ||
        (selectedImportance === "Normal" && !isImportant);

      return matchesSearch && matchesCategory && matchesRead && matchesImportance;
    });
  }, [notifications, tasks, taskRuns, importantIds, search, selectedCategory, selectedRead, selectedImportance]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const importantCount = notifications.filter((item) => importantIds.includes(item.id)).length;
  const highPriorityCount = notifications.filter((item) => item.priorityScore >= 80).length;
  const averagePriority = Math.round(
    notifications.reduce((sum, item) => sum + item.priorityScore, 0) / Math.max(notifications.length, 1),
  );

  function handleToggleRead(id: string) {
    setNotifications((current) =>
      current.map((notification) => {
        if (notification.id !== id) return notification;
        const nextRead = !notification.isRead;
        setMessage(`${nextRead ? "Mark read" : "Mark unread"} แบบ mock แล้ว: ${notification.title}`);
        return { ...notification, isRead: nextRead };
      }),
    );
  }

  function handleToggleImportant(id: string) {
    setImportantIds((current) => {
      const exists = current.includes(id);
      const notification = notifications.find((item) => item.id === id);
      setMessage(`${exists ? "Remove important" : "Mark important"} แบบ mock แล้ว: ${notification?.title ?? id}`);
      return exists ? current.filter((item) => item !== id) : [...current, id];
    });
  }

  function handleMarkAllRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    setMessage("Mark all read สำเร็จแบบ mock");
  }

  function handleResetFilters() {
    setSearch("");
    setSelectedCategory("All");
    setSelectedRead("All");
    setSelectedImportance("All");
    setMessage("ล้าง filter แล้ว");
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr] xl:items-stretch">
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-32 left-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative">
            <Badge tone="purple">Phase 6 Notifications</Badge>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Notifications
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Inbox สำหรับผลลัพธ์จาก Scheduled Tasks แยกหมวด Daily Brief, Email, Sale, Football, Lifestyle, Concert, ประกาศรัฐ และโปรเดินทาง พร้อม Read/Unread, Important และ Priority Score
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold text-slate-400">Notification Overview</p>
          <p className="mt-3 text-4xl font-black text-white">{notifications.length}</p>
          <p className="mt-1 text-sm text-slate-500">total notifications</p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3">
              <p className="font-black text-cyan-100">{unreadCount}</p>
              <p className="text-xs text-cyan-100/70">Unread</p>
            </div>
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-3">
              <p className="font-black text-rose-100">{importantCount}</p>
              <p className="text-xs text-rose-100/70">Important</p>
            </div>
            <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-3">
              <p className="font-black text-violet-100">{highPriorityCount}</p>
              <p className="text-xs text-violet-100/70">High Priority</p>
            </div>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3">
              <p className="font-black text-emerald-100">{averagePriority}</p>
              <p className="text-xs text-emerald-100/70">Avg Score</p>
            </div>
          </div>
        </Card>
      </section>

      <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl lg:grid-cols-[1fr_180px_150px_170px_auto]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search notification title, summary, task, GPT output..."
        />

        <select
          className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 text-sm font-semibold text-white shadow-inner shadow-black/20 outline-none transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value as "All" | NotificationCategory)}
        >
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category === "All" ? "All categories" : category}
            </option>
          ))}
        </select>

        <select
          className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 text-sm font-semibold text-white shadow-inner shadow-black/20 outline-none transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
          value={selectedRead}
          onChange={(event) => setSelectedRead(event.target.value as ReadFilter)}
        >
          {readOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 text-sm font-semibold text-white shadow-inner shadow-black/20 outline-none transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
          value={selectedImportance}
          onChange={(event) => setSelectedImportance(event.target.value as ImportanceFilter)}
        >
          {importanceOptions.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "All importance" : option}
            </option>
          ))}
        </select>

        <Button variant="secondary" onClick={handleResetFilters} type="button">
          Reset
        </Button>
      </div>

      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4 text-sm text-slate-300 sm:flex-row sm:items-center">
        <p>{message}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="blue">Showing {filteredNotifications.length}</Badge>
          <Button className="px-4 py-2 text-xs" variant="secondary" onClick={handleMarkAllRead} type="button">
            Mark All Read
          </Button>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <EmptyState
          title="No notifications found"
          description="ลองล้าง filter หรือค้นหาด้วยชื่อ notification / task / GPT output อื่น"
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredNotifications.map((notification) => {
            const task = tasks.find((item) => item.id === notification.taskId) ?? null;
            const taskRun = taskRuns.find((item) => item.id === notification.taskRunId) ?? null;

            return (
              <NotificationCard
                key={notification.id}
                notification={notification}
                task={task}
                taskRun={taskRun}
                isImportant={importantIds.includes(notification.id)}
                onToggleRead={handleToggleRead}
                onToggleImportant={handleToggleImportant}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
