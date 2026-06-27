import { fail, getRequestId, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth";
import { assertRateLimit, getClientIp } from "@/lib/rate-limit";
import { createScheduledTask, listScheduledTasks, updateScheduledTask } from "@/lib/repositories/scheduled-tasks.repository";
import { runTaskNow } from "@/services/task-runner.service";
import { sendTelegramMessage } from "@/services/telegram.service";
import type { ScheduledTask } from "@/types/scheduled-task";
import type { TaskRun } from "@/types/task-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BatchId = "one" | "two" | "three" | "four" | "all";
type TaskSeed = { key: string; label: string; name: string; type: ScheduledTask["type"]; scheduleType: ScheduledTask["scheduleType"]; cronExpression: string; time: string | null; dataSources: string[]; gptActions: string[]; minPriorityScore: number };

const DEFAULT_TASKS: TaskSeed[] = [
  { key: "daily-brief", label: "Daily Brief / ข่าวประจำวัน", name: "Daily Brief / ข่าวประจำวัน", type: "Daily Brief", scheduleType: "Daily", cronExpression: "0 8 * * *", time: "08:00", dataSources: ["NewsData.io", "Weather API", "Gmail Daily Digest"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 70 },
  { key: "thai-news", label: "ข่าวไทยวันนี้", name: "ข่าวไทยวันนี้", type: "Daily Brief", scheduleType: "Daily", cronExpression: "5 8 * * *", time: "08:05", dataSources: ["NewsData.io", "Thailand News"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 65 },
  { key: "public-notices", label: "ประกาศสำคัญ / แจ้งเตือนรัฐ", name: "ประกาศสำคัญ / แจ้งเตือนรัฐ", type: "Daily Brief", scheduleType: "Daily", cronExpression: "7 8 * * *", time: "08:07", dataSources: ["NewsData.io", "Thailand Public Notices", "Government Alerts"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 75 },
  { key: "world-news", label: "ข่าวต่างประเทศ", name: "ข่าวต่างประเทศ", type: "Daily Brief", scheduleType: "Daily", cronExpression: "10 8 * * *", time: "08:10", dataSources: ["World News", "NewsData.io"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 65 },
  { key: "ai-tech", label: "AI / Tech Update", name: "AI / Tech Update", type: "Daily Brief", scheduleType: "Daily", cronExpression: "15 8 * * *", time: "08:15", dataSources: ["NewsData.io", "AI Tech News"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 70 },
  { key: "cybersecurity", label: "Cybersecurity Alert", name: "Cybersecurity Alert", type: "Daily Brief", scheduleType: "Daily", cronExpression: "20 8 * * *", time: "08:20", dataSources: ["NewsData.io", "Cybersecurity News"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 80 },
  { key: "network-cloud", label: "Network / Cloud News", name: "Network / Cloud News", type: "Daily Brief", scheduleType: "Daily", cronExpression: "25 8 * * *", time: "08:25", dataSources: ["NewsData.io", "Network Cloud News"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 70 },
  { key: "market-crypto", label: "หุ้น / ตลาด / Crypto", name: "หุ้น / ตลาด / Crypto", type: "US Stock News", scheduleType: "Daily", cronExpression: "0 7 * * 1-5", time: "07:00", dataSources: ["US Stock News", "NewsData.io"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 60 },
  { key: "weather-pm25", label: "อากาศ / PM2.5", name: "อากาศ / PM2.5", type: "Daily Brief", scheduleType: "Daily", cronExpression: "30 7 * * *", time: "07:30", dataSources: ["Weather API", "PM2.5"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 55 },
  { key: "traffic", label: "เดินทาง / จราจร", name: "เดินทาง / จราจร", type: "Daily Brief", scheduleType: "Daily", cronExpression: "35 7 * * *", time: "07:35", dataSources: ["NewsData.io", "Traffic Alerts"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 55 },
  { key: "bts-mrt-alerts", label: "BTS/MRT ขัดข้อง", name: "BTS/MRT ขัดข้อง", type: "Daily Brief", scheduleType: "Daily", cronExpression: "37 7 * * *", time: "07:37", dataSources: ["NewsData.io", "BTS MRT Alerts", "Transit Status"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 70 },
  { key: "today-tasks", label: "งานวันนี้", name: "งานวันนี้", type: "Daily Brief", scheduleType: "Daily", cronExpression: "40 7 * * *", time: "07:40", dataSources: ["Scheduler", "NewsData.io"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 50 },
  { key: "important-email", label: "อีเมลสำคัญ", name: "อีเมลสำคัญ", type: "Email Monitor", scheduleType: "Hourly", cronExpression: "*/30 * * * *", time: null, dataSources: ["Gmail Daily Digest"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 70 },
  { key: "sports-football", label: "กีฬา / ฟุตบอล", name: "กีฬา / ฟุตบอล", type: "World Cup Recap", scheduleType: "Daily", cronExpression: "0 23 * * *", time: "23:00", dataSources: ["Football News Hub"], gptActions: ["Summarize", "Generate Caption", "Recommend Action"], minPriorityScore: 65 },
  { key: "events-products", label: "อีเวนต์ / คอนเสิร์ต / สินค้าใหม่", name: "อีเวนต์ / คอนเสิร์ต / สินค้าใหม่", type: "Concert Alerts", scheduleType: "Daily", cronExpression: "0 20 * * *", time: "20:00", dataSources: ["Concert API Thailand Only", "Global Innovation Product Radar"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 75 },
  { key: "deals-promos", label: "ดีล / โปรโมชัน", name: "ดีล / โปรโมชัน", type: "Sale Monitor", scheduleType: "Daily", cronExpression: "0 10 * * *", time: "10:00", dataSources: ["Product Prices", "Global Innovation Product Radar"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 55 },
  { key: "public-alerts", label: "ประกาศสำคัญ / แจ้งเตือนรัฐ / BTS-MRT", name: "ประกาศสำคัญ / แจ้งเตือนรัฐ / BTS-MRT", type: "Public Alerts", scheduleType: "Daily", cronExpression: "*/20 6-22 * * *", time: null, dataSources: ["Public Notices", "BTS/MRT Status", "NewsData.io"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 80 },
  { key: "travel-deals", label: "โปรเดินทาง / ตั๋วเครื่องบิน / โรงแรม", name: "โปรเดินทาง / ตั๋วเครื่องบิน / โรงแรม", type: "Travel Deals", scheduleType: "Daily", cronExpression: "0 11 * * *", time: "11:00", dataSources: ["Flight Deals", "Hotel Deals", "Travel Promotions", "NewsData.io"], gptActions: ["Summarize", "Analyze Priority", "Recommend Action"], minPriorityScore: 60 },
];

const BATCH_ONE_KEYS = ["daily-brief", "thai-news", "public-notices", "world-news", "ai-tech"];
const BATCH_TWO_KEYS = ["cybersecurity", "network-cloud", "market-crypto", "weather-pm25"];
const BATCH_THREE_KEYS = ["traffic", "bts-mrt-alerts", "today-tasks", "important-email", "sports-football"];
const BATCH_FOUR_KEYS = ["events-products", "deals-promos", "public-alerts", "travel-deals"];

function getKeys(batch: BatchId) {
  if (batch === "one") return BATCH_ONE_KEYS;
  if (batch === "two") return BATCH_TWO_KEYS;
  if (batch === "three") return BATCH_THREE_KEYS;
  if (batch === "four") return BATCH_FOUR_KEYS;
  return [...BATCH_ONE_KEYS, ...BATCH_TWO_KEYS, ...BATCH_THREE_KEYS, ...BATCH_FOUR_KEYS];
}
function getSeeds(batch: BatchId) { const keys = new Set(getKeys(batch)); return DEFAULT_TASKS.filter((task) => keys.has(task.key)); }
function matchesTask(task: ScheduledTask, seed: TaskSeed) {
  const name = task.name.toLowerCase();
  if (name === seed.name.toLowerCase()) return true;
  if (seed.key === "daily-brief") return /morning daily brief|daily brief \/ ข่าวประจำวัน/i.test(task.name);
  if (seed.key === "market-crypto") return task.type === "US Stock News" || name === "us stock news";
  if (seed.key === "important-email") return task.type === "Email Monitor" && /email|อีเมล/i.test(task.name);
  if (seed.key === "sports-football") return task.type === "World Cup Recap" || /football|ฟุตบอล|กีฬา/i.test(task.name);
  if (seed.key === "events-products") return task.type === "Concert Alerts" || /concert|คอนเสิร์ต|อีเวนต์/i.test(task.name);
  if (seed.key === "deals-promos") return task.type === "Sale Monitor" && /deal|promo|โปร|สินค้า/i.test(task.name);
  if (seed.key === "public-alerts") return task.type === "Public Alerts" || /ประกาศ|แจ้งเตือนรัฐ|bts|mrt|public alert/i.test(task.name);
  if (seed.key === "travel-deals") return task.type === "Travel Deals" || /flight|hotel|travel|ตั๋วเครื่องบิน|โรงแรม|โปรเดินทาง|ท่องเที่ยว/i.test(task.name);
  return false;
}
function isSent(status?: string | null) { return status === "sent" || Boolean(status?.startsWith("mock_sent")); }
function toBatchId(value: unknown): BatchId {
  if (value === "two" || value === "three" || value === "four" || value === "all") return value;
  return "one";
}
function safeRedirectPath(value: unknown) { if (typeof value !== "string" || !value.startsWith("/")) return null; if (value.startsWith("//")) return null; return value; }

async function parsePostBatchRequest(request: Request) {
  const url = new URL(request.url);
  const queryBatch = url.searchParams.get("batch");
  const queryRedirect = url.searchParams.get("redirect");
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({})) as { batch?: string; redirect?: string };
    return { batch: toBatchId(body.batch ?? queryBatch), redirectTo: safeRedirectPath(body.redirect ?? queryRedirect) };
  }
  const formData = await request.formData().catch(() => null);
  if (formData) return { batch: toBatchId(formData.get("batch") ?? queryBatch), redirectTo: safeRedirectPath(formData.get("redirect") ?? queryRedirect) };
  return { batch: toBatchId(queryBatch), redirectTo: safeRedirectPath(queryRedirect) };
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

function buildPublicDemoTask(seed: TaskSeed): ScheduledTask {
  const now = new Date().toISOString();
  return {
    id: `public_${seed.key}`,
    userId: "public-demo",
    name: seed.name,
    type: seed.type,
    scheduleType: seed.scheduleType,
    cronExpression: seed.cronExpression,
    time: seed.time,
    timezone: "Asia/Bangkok",
    dataSources: seed.dataSources,
    gptActions: seed.gptActions,
    outputChannels: ["Save to Web Dashboard", "Save to Notifications", "Send Telegram"],
    minPriorityScore: 0,
    status: "Active",
    isActive: true,
    lastRunAt: now,
    nextRunAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function buildPublicDemoRun(task: ScheduledTask, seed: TaskSeed): TaskRun {
  const now = new Date().toISOString();
  return {
    id: `public_run_${seed.key}_${Date.now()}`,
    taskId: task.id,
    status: "success",
    startedAt: now,
    finishedAt: now,
    rawInput: { source: "DailyHub public demo", topic: seed.label, dataSources: seed.dataSources },
    gptPrompt: `Send DailyHub public demo Telegram batch for ${seed.name}`,
    gptOutput: {
      title: seed.name,
      summary: `${seed.label} is ready from DailyHub. This public demo sends a compact Telegram status without requiring a sign-in session.`,
      priority_score: Math.max(seed.minPriorityScore, 70),
      recommended_action: "Open DailyHub dashboard to review details and run the full workflow.",
      caption: seed.name,
      image_prompt: null,
    },
    priorityScore: Math.max(seed.minPriorityScore, 70),
    telegramStatus: "pending",
    errorMessage: null,
    originalContent: undefined,
    translatedContent: undefined,
    language: "en",
    translatedAt: undefined,
    translation: undefined,
  };
}

async function runPublicDemoBatch(batch: BatchId) {
  const seeds = getSeeds(batch);
  const results = [];
  let sentCount = 0;
  let failedCount = 0;

  for (const seed of seeds) {
    try {
      const task = buildPublicDemoTask(seed);
      const run = buildPublicDemoRun(task, seed);
      const telegramResult = await sendTelegramMessage({ task, run });
      if (isSent(telegramResult.status)) sentCount += 1;
      if (telegramResult.status.includes("failed")) failedCount += 1;
      results.push({ taskId: task.id, taskName: task.name, taskType: task.type, status: "success", telegramStatus: telegramResult.status, priorityScore: run.priorityScore, runId: run.id });
    } catch (error) {
      failedCount += 1;
      results.push({ taskId: null, taskName: seed.name, taskType: seed.type, status: "failed", telegramStatus: "failed_public_demo_error", priorityScore: null, runId: null, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return { batch, summary: { requestedCount: seeds.length, sentCount, failedCount, createdCount: 0 }, results };
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
    const ip = getClientIp(request);
    await assertRateLimit({ key: `run-batch:${ip}:${batch}`, limit: 4, windowMs: 60_000 });

    const user = await getCurrentUser();
    const result = user ? await runBatchForUser(user.id, batch) : await runPublicDemoBatch(batch);
    if (redirectTo) return redirectAfterRun(request, redirectTo, result);
    return ok(result, { requestId });
  } catch (error) { return fail(error, requestId); }
}

export async function GET(request: Request) { const requestId = getRequestId(request); const { batch, redirectTo } = parseGetBatchRequest(request); return handleBatchRequest(request, batch, redirectTo, requestId); }
export async function POST(request: Request) { const requestId = getRequestId(request); const { batch, redirectTo } = await parsePostBatchRequest(request); return handleBatchRequest(request, batch, redirectTo, requestId); }
