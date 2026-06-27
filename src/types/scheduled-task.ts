export type ScheduledTaskStatus = "Active" | "Paused" | "Failed" | "Running";

export type ScheduledTaskType =
  | "Daily Brief"
  | "Email Monitor"
  | "Sale Monitor"
  | "World Cup Recap"
  | "Concert Alerts"
  | "US Stock News"
  | "Weekend Ideas"
  | "Lifestyle Ideas"
  | "Custom";

export type ScheduleType = "One Time" | "Hourly" | "Daily" | "Weekly" | "Monthly" | "Custom Cron";

export interface ScheduledTask {
  id: string;
  userId: string;
  name: string;
  type: ScheduledTaskType;
  scheduleType: ScheduleType;
  cronExpression: string | null;
  time: string | null;
  timezone: string;
  dataSources: string[];
  gptActions: string[];
  outputChannels: string[];
  minPriorityScore: number;
  status: ScheduledTaskStatus;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}
