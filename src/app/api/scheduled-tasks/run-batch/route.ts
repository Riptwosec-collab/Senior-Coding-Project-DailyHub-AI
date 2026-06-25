import { fail, getRequestId, ok } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth";
import { createScheduledTask, listScheduledTasks, updateScheduledTask } from "@/lib/repositories/scheduled-tasks.repository";
import { runTaskNow } from "@/services/task-runner.service";
import type { ScheduledTask } from "@/types/scheduled-task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BatchId = "one" | "two" | "all";
type TaskSeed = { key: string; label: string; name: string; type: ScheduledTask["type"]; scheduleType: ScheduledTask["scheduleType"]; cronExpression: string; time: string | null; dataSources: string[]; gptActions: string[]; minPriorityScore: number };

const DEFAULT_TASKS: TaskSeed[] = [
  { key: "daily-brief", label: "Morning Daily Brief", name: "Morning Daily Brief", type: "Daily Brief", scheduleType: "Daily", cronExpression: "0 8 * * *", time: "08:00", dataSources: ["News", "Weather API"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 70 },
  { key: "global-product-radar", label: "สินค้าเทคโนโลยี/นวัตกรรมทั่วโลก", name: "สินค้าใหม่/น่าสนใจทั่วโลก", type: "Sale Monitor", scheduleType: "Hourly", cronExpression: "0 * * * *", time: null, dataSources: ["Global Innovation Product Radar"], gptActions: ["Analyze Priority", "Generate Caption", "Recommend Action"], minPriorityScore: 70 },
  { key: "us-stock-news", label: "US Stock News", name: "US Stock News", type: "US Stock News", scheduleType: "Daily", cronExpression: "0 7 * * 1-5", time: "07:00", dataSources: ["US Stock News"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 60 },
  { key: "email-digest", label: "Daily Email Digest", name: "Daily Email Digest", type: "Email Monitor", scheduleType: "Daily", cronExpression: "0 18 * * *", time: "18:00", dataSources: ["Gmail Daily Digest"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 50 },
  { key: "concert-alerts", label: "Thailand Concert Alerts", name: "Thailand Concert Alerts", type: "Concert Alerts", scheduleType: "Daily", cronExpression: "0 20 * * *", time: "20:00", dataSources: ["Concert API Thailand Only"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 75 },
  { key: "football-recap", label: "Football News Hub", name: "Football Recap Nightly", type: "World Cup Recap", scheduleType: "Daily", cronExpression: "0 23 * * *", time: "23:00", dataSources: ["Football News Hub"], gptActions: ["Summarize", "Generate Caption", "Recommend Action"], minPriorityScore: 65 },
  { key: "weekend-long-read", label: "Weekend Long Read Picker", name: "Weekend Long Read Picker", type: "Weekend Long Read", scheduleType: "Weekly", cronExpression: "0 10 * * 6", time: "10:00", dataSources: ["News", "Weekend Long Read"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 55 },
];

const BATCH_ONE_KEYS = ["daily-brief", "global-product-radar", "us-stock-news", "email-digest"];
const BATCH_TWO_KEYS = ["concert-alerts", "football-recap", "weekend-long-read"];

function getKeys(batch: BatchId) { if (batch === "one") return BATCH_ONE_KEYS; if (batch === "two") return BATCH_TWO_KEYS; return [...BATCH_ONE_KEYS, ...BATCH_TWO_KEYS]; }
function getSeeds(batch: BatchId) { const keys = new Set(getKeys(batch)); return DEFAULT_TASKS.filter((task) => keys.has(task.key)); }
function isLegacyWeekendTask(task: ScheduledTask) { return task.type === "Weekend Ideas" || task.name === "Weekend Ideas Generator" || task.name === "Weekend Ideas" || task.dataSources.includes("Weekend Ideas"); }
function matchesTask(task: ScheduledTask, seed: TaskSeed) { return task.type === seed.type || task.name.toLowerCase() === seed.name.toLowerCase() || (seed.key === "us-stock-news" && isLegacyWeekendTask(task)); }
function isSent(status?: string | null) { return status === "sent" || Boolean(status?.startsWith("mock_sent")); }
function toBatchId(value: unknown): BatchId { return value === "two" ? "two" : value === "all" ? "all" : "one"; }
function safeRedirectPath(value: unknown) { if (typeof value !== "string" || !value.startsWith("/")) return null; if (value.startsWith("//")) return null; return value; }

async function parsePostBatchRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({})) as { batch?: string; redirect?: string };
    return { batch: toBatchId(body.batch), redirectTo: safeRedirectPath(body.redirect) };
  }
  const formData = await request.formData().catch(() => null);
  if (formData) return { batch: toBatchId(formData.get("batch")), redirectTo: safeRedirectPath(formData.get("redirect")) };
  return { batch: "one" as const, redirectTo: null };
}

function parseGetBatchRequest(request: Request) {
  const url = new URL(request.url);
  return { batch: toBatchId(url.searchParams.get("batch")), redirectTo: safeRedirectPath(url.searchParams.get("redirect")) };
}

async function ensureTask(userId: string, existingTasks: ScheduledTask[], seed: TaskSeed) {
  const existing = existingTasks.find((task) => matchesTask(task, seed));
  if (existing) {
    const patch: Partial<ScheduledTask> = { name: seed.name, type: seed.type, scheduleType: seed.scheduleType, cronExpression: seed.cronExpression, time: seed.time, dataSources: seed.dataSources, gptActions: seed.gptActions, outputChannels: ["Save to Web Dashboard", "Save to Notifications", "Send Telegram"], minPriorityScore: seed.minPriorityScore, isActive: true, status: "Active" };
    const updated = await updateScheduledTask(existing.id, patch, userId);
    return updated ?? existing;
  }

  return createScheduledTask({ userId, name: seed.name, type: seed.type, scheduleType: seed.scheduleType, cronExpression: seed.cronExpression, time: seed.time, timezone: "Asia/Bangkok", dataSources: seed.dataSources, gptActions: seed.gptActions, outputChannels: ["Save to Web Dashboard", "Save to Notifications", "Send Telegram"], minPriorityScore: seed.minPriorityScore, isActive: true });
}

async function runBatchForUser(userId: string, batch: BatchId) {
  const seeds = getSeeds(batch);
  const existingTasks = await listScheduledTasks({ userId });
  const results = [];
  let sentCount = 0;
  let failedCount = 0;
  let createdCount = 0;

  for (const seed of seeds) {
    try {
      const before = existingTasks.length;
      const task = await ensureTask(userId, existingTasks, seed);
      const existingIndex = existingTasks.findIndex((item) => item.id === task.id);
      if (existingIndex >= 0) existingTasks[existingIndex] = task;
      else existingTasks.push(task);
      if (existingTasks.length > before) createdCount += 1;

      const result = await runTaskNow(task.id, { userId, forceTelegram: true });
      const telegramStatus = result?.taskRun.telegramStatus ?? "not_run";
      const status = result?.taskRun.status ?? "not_found";
      if (isSent(telegramStatus)) sentCount += 1;
      if (!result || status === "failed" || telegramStatus.includes("failed")) failedCount += 1;
      results.push({ taskId: task.id, taskName: task.name, taskType: task.type, status, telegramStatus, priorityScore: result?.taskRun.priorityScore ?? null, runId: result?.taskRun.id ?? null });
    } catch (error) {
      failedCount += 1;
      results.push({ taskId: null, taskName: seed.name, taskType: seed.type, status: "failed", telegramStatus: "failed_batch_error", priorityScore: null, runId: null, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { batch, summary: { requestedCount: seeds.length, sentCount, failedCount, createdCount }, results };
}

function redirectAfterRun(request: Request, redirectTo: string, result: Awaited<ReturnType<typeof runBatchForUser>>) {
  const url = new URL(redirectTo, request.url);
  url.searchParams.set("batch", result.batch);
  url.searchParams.set("sent", String(result.summary.sentCount));
  url.searchParams.set("total", String(result.summary.requestedCount));
  url.searchParams.set("failed", String(result.summary.failedCount));
  url.searchParams.set("created", String(result.summary.createdCount));
  url.searchParams.set("ts", String(Date.now()));
  return Response.redirect(url, 303);
}

async function handleBatchRequest(request: Request, batch: BatchId, redirectTo: string | null, requestId: string) {
  try {
    const user = await requireCurrentUser();
    const result = await runBatchForUser(user.id, batch);
    if (redirectTo) return redirectAfterRun(request, redirectTo, result);
    return ok(result, { requestId });
  } catch (error) { return fail(error, requestId); }
}

export async function GET(request: Request) { const requestId = getRequestId(request); const { batch, redirectTo } = parseGetBatchRequest(request); return handleBatchRequest(request, batch, redirectTo, requestId); }
export async function POST(request: Request) { const requestId = getRequestId(request); const { batch, redirectTo } = await parsePostBatchRequest(request); return handleBatchRequest(request, batch, redirectTo, requestId); }
