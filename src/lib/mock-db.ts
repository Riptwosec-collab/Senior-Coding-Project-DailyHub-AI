import { scheduledTasks, taskRuns, webNotifications } from "@/lib/mock-data";
import type { WebNotification } from "@/types/notification";
import type { ScheduledTask, ScheduledTaskStatus } from "@/types/scheduled-task";
import type { TaskRun } from "@/types/task-run";

export interface NimbusDailyMockDb {
  scheduledTasks: ScheduledTask[];
  taskRuns: TaskRun[];
  webNotifications: WebNotification[];
}

type ApiErrorCode =
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

declare global {
  // eslint-disable-next-line no-var
  var nimbusDailyMockDb: NimbusDailyMockDb | undefined;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getMockDb(): NimbusDailyMockDb {
  if (!globalThis.nimbusDailyMockDb) {
    globalThis.nimbusDailyMockDb = {
      scheduledTasks: clone(scheduledTasks),
      taskRuns: clone(taskRuns),
      webNotifications: clone(webNotifications),
    };
  }

  return globalThis.nimbusDailyMockDb;
}

export function resetMockDb() {
  globalThis.nimbusDailyMockDb = {
    scheduledTasks: clone(scheduledTasks),
    taskRuns: clone(taskRuns),
    webNotifications: clone(webNotifications),
  };

  return globalThis.nimbusDailyMockDb;
}

export function createId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${random}`;
}

export function successResponse<T>(data: T, init?: ResponseInit) {
  return Response.json(
    {
      success: true,
      data,
    },
    init,
  );
}

export function errorResponse(message: string, status = 400, code: ApiErrorCode = "BAD_REQUEST") {
  return Response.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

export async function readJsonBody<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function getSearchParam(request: Request, key: string) {
  const url = new URL(request.url);
  return url.searchParams.get(key);
}

export function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function normalizeStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return fallback;
}

export function normalizeNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function calculateMockNextRun(scheduleType: ScheduledTask["scheduleType"]) {
  const now = new Date();

  const offsetHours: Record<ScheduledTask["scheduleType"], number> = {
    "One Time": 0,
    Hourly: 1,
    Daily: 24,
    Weekly: 24 * 7,
    Monthly: 24 * 30,
    "Custom Cron": 6,
  };

  const hours = offsetHours[scheduleType] ?? 24;
  if (hours === 0) return null;

  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function statusFromIsActive(isActive: boolean): ScheduledTaskStatus {
  return isActive ? "Active" : "Paused";
}
