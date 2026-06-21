import type { ScheduledTask } from "@/types/scheduled-task";
import type { TaskRun } from "@/types/task-run";

export function getTelegramModeStatus() {
  const enabled = process.env.ENABLE_TELEGRAM === "true";
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID);
  return {
    mode: enabled && hasToken && hasChatId ? "real" : "mock",
    enabled,
    hasToken,
    hasChatId,
  };
}

function getThaiBullets(run: TaskRun) {
  const translation = run.translation;
  if (translation?.translatedBullets?.length) return translation.translatedBullets.map((item) => `- ${item}`).join("\n");
  if (run.gptOutput.recommended_action) return run.gptOutput.recommended_action.split("\n").filter(Boolean).map((item) => `- ${item}`).join("\n");
  return `- ${run.gptOutput.summary}`;
}

export function buildTelegramMessage(task: ScheduledTask, run: TaskRun) {
  const translation = run.translation;
  const source = translation?.originalSource ?? (task.dataSources.join(", ") || task.type);

  return `🧠 DailyHub AI\nหัวข้อ: ${translation?.translatedTitle ?? run.gptOutput.title}\n\nสรุปภาษาไทย:\n${getThaiBullets(run)}\n\nรายละเอียดสำคัญ:\n${translation?.translatedSummary ?? run.gptOutput.summary}\n\nแหล่งที่มา:\n${source}\n\nภาษาเดิม: ${translation?.originalLanguage ?? run.language ?? "unknown"}\nTask: ${task.name} (${task.type})\nPriority: ${run.priorityScore}/100\nStatus: ${run.status}\nเวลาอัปเดต: ${translation?.translatedAt ?? run.translatedAt ?? new Date().toISOString()}`;
}

export async function sendTelegramMessage({ task, run }: { task: ScheduledTask; run: TaskRun }) {
  if (!task.outputChannels.includes("Send Telegram")) return { status: "not_enabled", message: "Task does not enable Telegram" };
  if (run.priorityScore < task.minPriorityScore) return { status: "skipped_priority", message: `Priority ${run.priorityScore} is below threshold ${task.minPriorityScore}` };

  const enabled = process.env.ENABLE_TELEGRAM === "true";
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const fallback = process.env.TELEGRAM_FALLBACK_TO_MOCK !== "false";

  if (!enabled) return { status: "mock_sent", message: "Telegram disabled, mock sent" };
  if (!token || !chatId) return { status: fallback ? "mock_sent_missing_config" : "failed_missing_config", message: "Missing Telegram token or chat id" };

  try {
    const baseUrl = process.env.TELEGRAM_BASE_URL || "https://api.telegram.org";
    const methodName = "send" + "Message";
    const response = await fetch(`${baseUrl}/bot${token}/${methodName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: buildTelegramMessage(task, run) }),
    });

    const responseText = await response.text();
    if (!response.ok) throw new Error(`Telegram API failed: ${response.status} ${responseText}`);

    return { status: "sent", message: "Telegram message sent", response: responseText };
  } catch (error) {
    if (fallback) return { status: "mock_sent_fallback", message: error instanceof Error ? error.message : "Telegram fallback" };
    return { status: "failed", message: error instanceof Error ? error.message : "Telegram failed" };
  }
}

export async function sendTelegramTestMessage(message = "DailyHub AI Telegram test") {
  const now = new Date().toISOString();
  const fakeTask = {
    id: "test",
    userId: "user_001",
    name: "Telegram Test",
    type: "Custom",
    scheduleType: "One Time",
    cronExpression: null,
    time: null,
    timezone: "Asia/Bangkok",
    dataSources: [],
    gptActions: [],
    outputChannels: ["Send Telegram"],
    minPriorityScore: 0,
    status: "Active",
    isActive: true,
    lastRunAt: null,
    nextRunAt: null,
    createdAt: now,
    updatedAt: now,
  } as ScheduledTask;

  const fakeRun = {
    id: "test_run",
    taskId: "test",
    status: "success",
    startedAt: now,
    finishedAt: now,
    rawInput: {},
    gptPrompt: "",
    gptOutput: {
      title: "ทดสอบ Telegram",
      summary: message,
      priority_score: 100,
      recommended_action: "ตรวจสอบว่าได้รับข้อความภาษาไทยแล้ว",
      caption: null,
      image_prompt: null,
    },
    priorityScore: 100,
    telegramStatus: "pending",
    errorMessage: null,
    language: "th",
    translatedAt: now,
    originalContent: message,
    translatedContent: message,
  } as TaskRun;

  return await sendTelegramMessage({ task: fakeTask, run: fakeRun });
}
