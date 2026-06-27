import type { ScheduleType, ScheduledTask, ScheduledTaskType } from "@/types/scheduled-task";

export const taskTypes: ScheduledTaskType[] = [
  "Daily Brief",
  "Email Monitor",
  "Sale Monitor",
  "World Cup Recap",
  "Concert Alerts",
  "US Stock News",
  "Weekend Ideas",
  "Lifestyle Ideas",
  "Custom",
];

export const scheduleTypes: ScheduleType[] = ["One Time", "Hourly", "Daily", "Weekly", "Monthly", "Custom Cron"];

export const timezones = [
  "Asia/Bangkok",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
];

export const dataSourceOptions = [
  "News",
  "NewsData.io",
  "Gmail",
  "Product Prices",
  "Football API",
  "Weather API",
  "Concert API",
  "Global Innovation Product Radar",
  "US Stock News",
  "Lifestyle",
];

export const gptActionOptions = [
  "Summarize",
  "Analyze Priority",
  "Generate Caption",
  "Generate Image Prompt",
  "Recommend Action",
];

export const outputChannelOptions = ["Save to Web Dashboard", "Save to Notifications", "Send Telegram"];

export interface CreateTaskFormValues {
  name: string;
  type: ScheduledTaskType;
  scheduleType: ScheduleType;
  cronExpression: string;
  time: string;
  date: string;
  timezone: string;
  dataSources: string[];
  gptActions: string[];
  outputChannels: string[];
  minPriorityScore: number;
  isActive: boolean;
}

export type CreateTaskFormErrors = Partial<Record<keyof CreateTaskFormValues | "form", string>>;

export const initialCreateTaskFormValues: CreateTaskFormValues = {
  name: "Morning Daily Brief",
  type: "Daily Brief",
  scheduleType: "Daily",
  cronExpression: "0 8 * * *",
  time: "08:00",
  date: new Date().toISOString().slice(0, 10),
  timezone: "Asia/Bangkok",
  dataSources: ["NewsData.io", "Weather API"],
  gptActions: ["Summarize", "Analyze Priority", "Recommend Action"],
  outputChannels: ["Save to Web Dashboard", "Save to Notifications", "Send Telegram"],
  minPriorityScore: 70,
  isActive: true,
};

export function validateCreateTaskForm(values: CreateTaskFormValues): CreateTaskFormErrors {
  const errors: CreateTaskFormErrors = {};

  if (values.name.trim().length < 3) {
    errors.name = "Task name ต้องมีอย่างน้อย 3 ตัวอักษร";
  }

  if (!taskTypes.includes(values.type)) {
    errors.type = "กรุณาเลือก Task Type";
  }

  if (!scheduleTypes.includes(values.scheduleType)) {
    errors.scheduleType = "กรุณาเลือก Schedule Type";
  }

  if (values.scheduleType === "Custom Cron" && values.cronExpression.trim().split(/\s+/).length < 5) {
    errors.cronExpression = "Custom Cron ต้องมีอย่างน้อย 5 ช่อง เช่น 0 8 * * *";
  }

  if (values.scheduleType !== "Hourly" && values.scheduleType !== "Custom Cron" && !values.time) {
    errors.time = "กรุณาเลือกเวลา";
  }

  if (values.scheduleType === "One Time" && !values.date) {
    errors.date = "กรุณาเลือกวันที่สำหรับ One Time task";
  }

  if (!values.timezone) {
    errors.timezone = "กรุณาเลือก Timezone";
  }

  if (values.dataSources.length === 0) {
    errors.dataSources = "กรุณาเลือก Data Source อย่างน้อย 1 รายการ";
  }

  if (values.gptActions.length === 0) {
    errors.gptActions = "กรุณาเลือก GPT Action อย่างน้อย 1 รายการ";
  }

  if (values.outputChannels.length === 0) {
    errors.outputChannels = "กรุณาเลือก Output Channel อย่างน้อย 1 รายการ";
  }

  if (values.minPriorityScore < 0 || values.minPriorityScore > 100) {
    errors.minPriorityScore = "Min Priority Score ต้องอยู่ระหว่าง 0-100";
  }

  return errors;
}

export function buildCronPreview(values: CreateTaskFormValues) {
  if (values.scheduleType === "Custom Cron") return values.cronExpression.trim() || "-";
  if (values.scheduleType === "Hourly") return "0 * * * *";

  const [hour = "0", minute = "0"] = values.time.split(":");
  const cleanHour = String(Number(hour));
  const cleanMinute = String(Number(minute));

  if (values.scheduleType === "Daily") return `${cleanMinute} ${cleanHour} * * *`;
  if (values.scheduleType === "Weekly") return `${cleanMinute} ${cleanHour} * * 6`;
  if (values.scheduleType === "Monthly") return `${cleanMinute} ${cleanHour} 1 * *`;
  if (values.scheduleType === "One Time") return `One time at ${values.date} ${values.time}`;

  return "-";
}

export function calculateMockNextRun(values: CreateTaskFormValues) {
  const now = new Date();

  if (values.scheduleType === "One Time") {
    return new Date(`${values.date}T${values.time || "00:00"}:00`).toISOString();
  }

  const offsetHours: Record<ScheduleType, number> = {
    "One Time": 0,
    Hourly: 1,
    Daily: 24,
    Weekly: 24 * 7,
    Monthly: 24 * 30,
    "Custom Cron": 6,
  };

  return new Date(now.getTime() + offsetHours[values.scheduleType] * 60 * 60 * 1000).toISOString();
}

export function buildMockScheduledTask(values: CreateTaskFormValues): ScheduledTask {
  const now = new Date().toISOString();

  return {
    id: `task_mock_${Date.now()}`,
    userId: "user_001",
    name: values.name.trim(),
    type: values.type,
    scheduleType: values.scheduleType,
    cronExpression: values.scheduleType === "One Time" ? null : buildCronPreview(values),
    time: values.scheduleType === "Hourly" || values.scheduleType === "Custom Cron" ? null : values.time,
    timezone: values.timezone,
    dataSources: values.dataSources,
    gptActions: values.gptActions,
    outputChannels: values.outputChannels,
    minPriorityScore: values.minPriorityScore,
    status: values.isActive ? "Active" : "Paused",
    isActive: values.isActive,
    lastRunAt: null,
    nextRunAt: values.isActive ? calculateMockNextRun(values) : null,
    createdAt: now,
    updatedAt: now,
  };
}

export function hasErrors(errors: CreateTaskFormErrors) {
  return Object.keys(errors).length > 0;
}
