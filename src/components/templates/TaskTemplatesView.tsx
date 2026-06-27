"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { showToast } from "@/components/ui/ToastProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import type { CreateTaskFromTemplateResult, TaskTemplate } from "@/types/task-template";

const categories = ["All", "Daily Brief", "Email Monitor", "Sale Monitor", "World Cup Recap", "Concert Alerts", "Public Alerts", "Travel Deals", "Custom"];

const copy = {
  th: {
    badge: "เฟส 27",
    title: "เทมเพลตงาน",
    desc: "เลือก workflow สำเร็จรูปแล้วสร้าง Scheduled Task ได้ทันที เหมาะสำหรับ Daily Brief, Email Monitor, Sale Monitor, ประกาศรัฐ และโปรเดินทาง",
    custom: "สร้างงานเอง",
    createdTitle: "สร้าง Task สำเร็จแล้ว",
    createdDesc: "เปิดหน้า Scheduled Tasks เพื่อกด Run Now หรือแก้ไขเวลารันได้",
    viewTasks: "ดูงานอัตโนมัติ",
    search: "ค้นหาเทมเพลต แท็ก หรือ use case...",
    all: "ทั้งหมด",
    emptyTitle: "ไม่พบเทมเพลต",
    emptyDesc: "ลองเปลี่ยนคำค้นหาหรือเลือกประเภทเป็นทั้งหมด",
    schedule: "ตารางรัน",
    time: "เวลา",
    priority: "ความสำคัญ",
    recommendedFor: "เหมาะสำหรับ",
    sources: "แหล่งข้อมูล",
    creating: "กำลังสร้าง...",
    useTemplate: "ใช้เทมเพลต",
    manual: "รันเอง",
    loadingTitle: "กำลังโหลดเทมเพลต",
    loadingDesc: "กำลังโหลด Task Templates",
    errorTitle: "โหลดเทมเพลตไม่สำเร็จ",
    toastCreated: "สร้างงานแล้ว",
    toastCreatedDesc: (name: string) => `${name} ถูกสร้างจากเทมเพลตแล้ว`,
    toastFailed: "สร้างงานไม่สำเร็จ",
  },
  en: {
    badge: "Phase 27",
    title: "Task Templates",
    desc: "Pick a ready-made workflow and create a Scheduled Task instantly for Daily Brief, Email Monitor, Sale Monitor, public alerts, and travel deals.",
    custom: "Create Custom Task",
    createdTitle: "Task created",
    createdDesc: "Open Scheduled Tasks to run now or edit the schedule.",
    viewTasks: "View Scheduled Tasks",
    search: "Search templates, tags, use cases...",
    all: "All",
    emptyTitle: "No templates found",
    emptyDesc: "Try changing the search text or category filter.",
    schedule: "Schedule",
    time: "Time",
    priority: "Priority",
    recommendedFor: "Recommended for",
    sources: "Sources",
    creating: "Creating...",
    useTemplate: "Use Template",
    manual: "Manual",
    loadingTitle: "Loading templates",
    loadingDesc: "Loading Task Templates",
    errorTitle: "Task templates loading failed",
    toastCreated: "Task created",
    toastCreatedDesc: (name: string) => `${name} was created from a template.`,
    toastFailed: "Create task failed",
  },
} as const;

export function TaskTemplatesView() {
  const { lang } = useLanguage();
  const text = copy[lang];
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  async function loadTemplates() {
    setIsLoading(true);
    setError(null);
    try {
      setTemplates(await apiRequest<TaskTemplate[]>("/api/task-templates"));
    } catch (loadError) {
      setError(toErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesCategory = category === "All" || template.type === category;
      const searchableText = [template.name, template.description, template.type, template.tags.join(" "), template.recommendedFor].join(" ").toLowerCase();
      return matchesCategory && (!keyword || searchableText.includes(keyword));
    });
  }, [category, search, templates]);

  async function createTask(template: TaskTemplate) {
    setCreatingId(template.id);
    try {
      const result = await apiRequest<CreateTaskFromTemplateResult>(`/api/task-templates/${template.id}/create-task`, { method: "POST" });
      setCreatedTaskId(result.taskId);
      showToast({ title: text.toastCreated, description: text.toastCreatedDesc(result.taskName), tone: "success" });
    } catch (createError) {
      showToast({ title: text.toastFailed, description: toErrorMessage(createError), tone: "error" });
    } finally {
      setCreatingId(null);
    }
  }

  if (isLoading) return <LoadingState title={text.loadingTitle} description={text.loadingDesc} />;
  if (error) return <ErrorState title={text.errorTitle} description={error} onRetry={loadTemplates} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="green">{text.badge}</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{text.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{text.desc}</p>
        </div>
        <Button asChild variant="secondary"><Link href="/scheduled-tasks/create">{text.custom}</Link></Button>
      </div>

      {createdTaskId && (
        <Card className="flex flex-col gap-3 border-emerald-300/25 bg-emerald-300/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-100">{text.createdTitle}</p>
            <p className="mt-1 text-xs text-emerald-100/70">{text.createdDesc}</p>
          </div>
          <Button asChild size="sm" variant="outline"><Link href="/scheduled-tasks">{text.viewTasks}</Link></Button>
        </Card>
      )}

      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <Input placeholder={text.search} value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className="h-12 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm font-bold text-white outline-none" value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item} value={item}>{item === "All" ? text.all : item}</option>)}
          </select>
        </div>
      </Card>

      {filteredTemplates.length === 0 ? (
        <EmptyState title={text.emptyTitle} description={text.emptyDesc} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-2xl">{template.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-white">{template.name}</h2>
                    <Badge tone="blue">{template.type}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{template.description}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Info label={text.schedule} value={template.scheduleType} />
                <Info label={text.time} value={template.time ?? template.cronExpression ?? text.manual} />
                <Info label={text.priority} value={`${template.minPriorityScore}+`} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {template.tags.map((tag) => <Badge key={tag} tone="gray">{tag}</Badge>)}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">{text.recommendedFor}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{template.recommendedFor}</p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-500">
                  {text.sources}: <span className="font-semibold text-slate-300">{template.dataSources.join(", ")}</span>
                </div>
                <Button disabled={creatingId === template.id} onClick={() => createTask(template)}>
                  {creatingId === template.id ? text.creating : text.useTemplate}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
