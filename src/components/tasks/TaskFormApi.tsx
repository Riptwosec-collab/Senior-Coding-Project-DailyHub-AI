"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ScheduledTask, ScheduledTaskType, ScheduleType } from "@/types/scheduled-task";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const taskTypes: ScheduledTaskType[] = ["Daily Brief", "Email Monitor", "Sale Monitor", "World Cup Recap", "Concert Alerts", "US Stock News", "Public Alerts", "Travel Deals", "Custom"];
const scheduleTypes: ScheduleType[] = ["One Time", "Hourly", "Daily", "Weekly", "Monthly", "Custom Cron"];
const dataSources = ["News", "NewsData.io", "Gmail", "Global Innovation Product Radar", "US Stock News", "Football API", "Weather API", "Concert API", "Public Notices", "BTS/MRT Status", "Flight Deals", "Hotel Deals", "Travel Promotions"];
const gptActions = ["Summarize", "Analyze Priority", "Generate Caption", "Generate Image Prompt", "Recommend Action"];
const outputChannels = ["Save to Web Dashboard", "Save to Notifications", "Send Telegram"];

interface FormState {
  name: string;
  type: ScheduledTaskType;
  scheduleType: ScheduleType;
  cronExpression: string;
  time: string;
  timezone: string;
  dataSources: string[];
  gptActions: string[];
  outputChannels: string[];
  minPriorityScore: number;
  isActive: boolean;
}

const initialState: FormState = {
  name: "Morning Daily Brief",
  type: "Daily Brief",
  scheduleType: "Daily",
  cronExpression: "0 8 * * *",
  time: "08:00",
  timezone: "Asia/Bangkok",
  dataSources: ["NewsData.io", "Weather API"],
  gptActions: ["Summarize", "Analyze Priority", "Recommend Action"],
  outputChannels: ["Save to Web Dashboard", "Save to Notifications", "Send Telegram"],
  minPriorityScore: 70,
  isActive: true,
};

const copy = {
  th: {
    badge: "API Create",
    title: "สร้างงานอัตโนมัติ",
    desc: "สร้าง Scheduled Task สำหรับ Daily Brief, Email Digest, US Stock News, Concert Alerts, Football Recap, ประกาศรัฐ และโปรเดินทาง",
    saved: "บันทึกผ่าน API แล้ว",
    taskId: "Task ID",
    back: "กลับไปหน้างาน",
    results: "ดูผลลัพธ์",
    name: "ชื่องาน",
    type: "ประเภทงาน",
    schedule: "รูปแบบเวลา",
    time: "เวลา",
    timezone: "เขตเวลา",
    customCron: "Custom Cron",
    dataSources: "แหล่งข้อมูล",
    gptActions: "คำสั่ง GPT",
    outputChannels: "ช่องทางผลลัพธ์",
    minPriority: "คะแนนขั้นต่ำ",
    activeAfterSave: "เปิดใช้งานหลังบันทึก",
    saving: "กำลังบันทึก...",
    save: "บันทึกงานผ่าน API",
    payload: "ตัวอย่าง Payload",
    cronPreview: "ตัวอย่าง Cron",
    validateName: "ชื่องานต้องมีอย่างน้อย 3 ตัวอักษร",
    validateData: "กรุณาเลือก Data Source อย่างน้อย 1 รายการ",
    validateGpt: "กรุณาเลือก GPT Action อย่างน้อย 1 รายการ",
    validateOutput: "กรุณาเลือก Output Channel อย่างน้อย 1 รายการ",
    validateCron: "Cron expression ต้องมีอย่างน้อย 5 ช่อง",
    oneTimeAt: "รันครั้งเดียวเวลา",
  },
  en: {
    badge: "API Create",
    title: "Create Scheduled Task",
    desc: "Create Scheduled Tasks for Daily Brief, Email Digest, US Stock News, Concert Alerts, Football Recap, public alerts, and travel deals.",
    saved: "Saved via API",
    taskId: "Task ID",
    back: "Back to Tasks",
    results: "View Results",
    name: "Task Name",
    type: "Task Type",
    schedule: "Schedule Type",
    time: "Time",
    timezone: "Timezone",
    customCron: "Custom Cron",
    dataSources: "Data Sources",
    gptActions: "GPT Actions",
    outputChannels: "Output Channels",
    minPriority: "Min Priority Score",
    activeAfterSave: "Active after save",
    saving: "Saving...",
    save: "Save Task via API",
    payload: "Payload Preview",
    cronPreview: "Cron Preview",
    validateName: "Task name must be at least 3 characters",
    validateData: "Please choose at least 1 Data Source",
    validateGpt: "Please choose at least 1 GPT Action",
    validateOutput: "Please choose at least 1 Output Channel",
    validateCron: "Cron expression must have at least 5 fields",
    oneTimeAt: "One time at",
  },
} as const;

export function TaskFormApi() {
  const { lang } = useLanguage();
  const text = copy[lang];
  const [values, setValues] = useState<FormState>(initialState);
  const [savedTask, setSavedTask] = useState<ScheduledTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const cronPreview = useMemo(() => {
    if (values.scheduleType === "Custom Cron") return values.cronExpression;
    if (values.scheduleType === "Hourly") return "0 * * * *";
    const [hour = "0", minute = "0"] = values.time.split(":");
    if (values.scheduleType === "Daily") return `${Number(minute)} ${Number(hour)} * * *`;
    if (values.scheduleType === "Weekly") return `${Number(minute)} ${Number(hour)} * * 6`;
    if (values.scheduleType === "Monthly") return `${Number(minute)} ${Number(hour)} 1 * *`;
    return `${text.oneTimeAt} ${values.time}`;
  }, [text.oneTimeAt, values.scheduleType, values.time, values.cronExpression]);

  function toggleOption(key: "dataSources" | "gptActions" | "outputChannels", option: string) {
    setValues((current) => {
      const exists = current[key].includes(option);
      return { ...current, [key]: exists ? current[key].filter((item) => item !== option) : [...current[key], option] };
    });
  }

  function validate() {
    if (values.name.trim().length < 3) return text.validateName;
    if (values.dataSources.length === 0) return text.validateData;
    if (values.gptActions.length === 0) return text.validateGpt;
    if (values.outputChannels.length === 0) return text.validateOutput;
    if (values.scheduleType === "Custom Cron" && values.cronExpression.trim().split(/\s+/).length < 5) return text.validateCron;
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const task = await apiRequest<ScheduledTask>("/api/scheduled-tasks", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          type: values.type,
          scheduleType: values.scheduleType,
          cronExpression: cronPreview,
          time: values.scheduleType === "Hourly" || values.scheduleType === "Custom Cron" ? null : values.time,
          timezone: values.timezone,
          dataSources: values.dataSources,
          gptActions: values.gptActions,
          outputChannels: values.outputChannels,
          minPriorityScore: values.minPriorityScore,
          isActive: values.isActive,
        }),
      });
      setSavedTask(task);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="relative">
          <Badge tone="purple">{text.badge}</Badge>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">{text.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{text.desc}</p>
        </div>
      </Card>

      {error && <Card className="border-rose-300/20 bg-rose-300/[0.06] p-4 text-sm font-semibold text-rose-100">{error}</Card>}

      {savedTask && (
        <Card className="border-emerald-300/20 bg-emerald-300/[0.06] p-5">
          <Badge tone="green">{text.saved}</Badge>
          <h2 className="mt-3 text-xl font-black text-white">{savedTask.name}</h2>
          <p className="mt-2 text-sm text-slate-300">{text.taskId}: {savedTask.id}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white" href="/scheduled-tasks">{text.back}</Link>
            <Link className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 text-sm font-bold text-white" href={`/task-results?task_id=${savedTask.id}`}>{text.results}</Link>
          </div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="space-y-5 p-5 sm:p-6">
          <div>
            <label className="text-sm font-bold text-slate-300">{text.name}</label>
            <Input className="mt-2" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select label={text.type} value={values.type} options={taskTypes} onChange={(value) => setValues({ ...values, type: value as ScheduledTaskType })} />
            <Select label={text.schedule} value={values.scheduleType} options={scheduleTypes} onChange={(value) => setValues({ ...values, scheduleType: value as ScheduleType })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-slate-300">{text.time}</label>
              <Input className="mt-2" type="time" value={values.time} onChange={(event) => setValues({ ...values, time: event.target.value })} />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-300">{text.timezone}</label>
              <Input className="mt-2" value={values.timezone} onChange={(event) => setValues({ ...values, timezone: event.target.value })} />
            </div>
          </div>

          {values.scheduleType === "Custom Cron" && (
            <div>
              <label className="text-sm font-bold text-slate-300">{text.customCron}</label>
              <Input className="mt-2" value={values.cronExpression} onChange={(event) => setValues({ ...values, cronExpression: event.target.value })} />
            </div>
          )}

          <OptionGroup title={text.dataSources} options={dataSources} selected={values.dataSources} onToggle={(option) => toggleOption("dataSources", option)} />
          <OptionGroup title={text.gptActions} options={gptActions} selected={values.gptActions} onToggle={(option) => toggleOption("gptActions", option)} />
          <OptionGroup title={text.outputChannels} options={outputChannels} selected={values.outputChannels} onToggle={(option) => toggleOption("outputChannels", option)} />

          <div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-bold text-slate-300">{text.minPriority}</label>
              <Badge tone="blue">{values.minPriorityScore}/100</Badge>
            </div>
            <input className="mt-3 w-full accent-cyan-300" max={100} min={0} type="range" value={values.minPriorityScore} onChange={(event) => setValues({ ...values, minPriorityScore: Number(event.target.value) })} />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-white">
            <input checked={values.isActive} type="checkbox" onChange={(event) => setValues({ ...values, isActive: event.target.checked })} />
            {text.activeAfterSave}
          </label>

          <Button disabled={isSaving} type="submit">{isSaving ? text.saving : text.save}</Button>
        </Card>

        <Card className="h-fit p-5 sm:p-6">
          <p className="text-sm font-bold uppercase text-cyan-200">{text.payload}</p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-sm text-slate-400">{text.cronPreview}</p>
            <p className="mt-2 font-mono text-sm font-bold text-cyan-100">{cronPreview}</p>
          </div>
          <pre className="mt-4 max-h-[36rem] overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-xs leading-6 text-slate-300">{JSON.stringify({ ...values, cronExpression: cronPreview }, null, 2)}</pre>
        </Card>
      </div>
    </form>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-300">{label}</label>
      <select className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 text-sm font-semibold text-white" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function OptionGroup({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (option: string) => void }) {
  return (
    <div>
      <p className="text-sm font-bold text-slate-300">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button key={option} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${active ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"}`} onClick={() => onToggle(option)} type="button">
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
