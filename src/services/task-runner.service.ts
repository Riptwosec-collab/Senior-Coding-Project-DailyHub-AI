import { calculateMockNextRun, createId } from "@/lib/mock-db";
import { getScheduledTaskById, updateScheduledTask } from "@/lib/repositories/scheduled-tasks.repository";
import { createTaskRun, getTaskRunById, updateTaskRun } from "@/lib/repositories/task-runs.repository";
import type { WebNotification } from "@/types/notification";
import type { ScheduledTask } from "@/types/scheduled-task";
import type { TaskRun } from "@/types/task-run";
import { collectTaskDataSources } from "./data-source.service";
import { createNotificationFromTaskRun } from "./notification.service";
import { buildFailedGptOutput, buildGptPrompt, generateGptOutput, getErrorMessage } from "./openai.service";
import { sendTelegramMessage } from "./telegram.service";
import { buildTranslationInputFromTask, normalizeBilingualContent, toTranslatedGptOutput } from "./translation.service";

export interface RunTaskNowResult {
  task: ScheduledTask;
  taskRun: TaskRun;
  notification: WebNotification | null;
}

type RunTaskNowOptions = {
  userId?: string;
  schedulerMode?: boolean;
  /**
   * Manual dashboard/testing mode: send Telegram even when the task is normally
   * dashboard-only or its priority is below the alert threshold.
   */
  forceTelegram?: boolean;
};

function withTelegramChannel(outputChannels: string[]) {
  return outputChannels.includes("Send Telegram") ? outputChannels : [...outputChannels, "Send Telegram"];
}

function buildTelegramTask(task: ScheduledTask, forceTelegram?: boolean): ScheduledTask {
  if (!forceTelegram) return task;

  return {
    ...task,
    isActive: true,
    status: "Active",
    outputChannels: withTelegramChannel(task.outputChannels),
    minPriorityScore: 0,
  };
}

async function buildTranslatedRunPayload(task: ScheduledTask, rawInput: Record<string, unknown>, gptOutput: TaskRun["gptOutput"]) {
  const translation = await normalizeBilingualContent(buildTranslationInputFromTask(task, rawInput, gptOutput));
  const translatedGptOutput = toTranslatedGptOutput(gptOutput, translation);

  return {
    translation,
    translatedGptOutput,
    translatedRawInput: {
      ...rawInput,
      translation,
      originalContent: translation.originalContent,
      translatedContent: translation.translatedSummary,
      translatedBullets: translation.translatedBullets,
    },
  };
}

export async function runTaskNow(taskId: string, options: RunTaskNowOptions = {}): Promise<RunTaskNowResult | null> {
  const task = await getScheduledTaskById(taskId, options.schedulerMode ? undefined : options.userId);
  if (!task) return null;

  const startedAt = new Date().toISOString();
  await updateScheduledTask(task.id, { status: "Running", isActive: true, updatedAt: startedAt }, options.schedulerMode ? undefined : options.userId);

  // Dashboard/manual Run Now should be an end-to-end test and send Telegram for every task.
  // Scheduler mode keeps the normal production rules: output channel + priority threshold.
  const shouldForceTelegram = options.forceTelegram === true || options.schedulerMode !== true;
  const effectiveTask = buildTelegramTask(task, shouldForceTelegram);
  const rawInput = await collectTaskDataSources(effectiveTask);
  const gptPrompt = buildGptPrompt(effectiveTask, rawInput);

  let gptOutput;
  let status: TaskRun["status"] = "success";
  let errorMessage: string | null = null;

  try {
    gptOutput = await generateGptOutput(effectiveTask, rawInput);
  } catch (error) {
    status = "failed";
    errorMessage = getErrorMessage(error);
    gptOutput = buildFailedGptOutput(effectiveTask, errorMessage);
  }

  const { translation, translatedGptOutput, translatedRawInput } = await buildTranslatedRunPayload(effectiveTask, rawInput, gptOutput);
  const finishedAt = new Date().toISOString();
  const initialRun: TaskRun = {
    id: createId("run"),
    taskId: task.id,
    status,
    startedAt,
    finishedAt,
    rawInput: translatedRawInput,
    gptPrompt,
    gptOutput: translatedGptOutput,
    priorityScore: translatedGptOutput.priority_score,
    telegramStatus: status === "success" ? "pending" : "skipped_failed",
    errorMessage,
    originalContent: translation.originalContent,
    translatedContent: translation.translatedSummary,
    language: translation.originalLanguage,
    translatedAt: translation.translatedAt,
    translation,
  };

  const telegramResult = status === "success" ? await sendTelegramMessage({ task: effectiveTask, run: initialRun }) : { status: "skipped_failed" };

  const taskRun = await createTaskRun({ ...initialRun, telegramStatus: telegramResult.status });
  const notification = await createNotificationFromTaskRun(effectiveTask, taskRun);

  const updatedTask = await updateScheduledTask(
    task.id,
    {
      status: status === "success" ? "Active" : "Failed",
      isActive: true,
      lastRunAt: finishedAt,
      nextRunAt: calculateMockNextRun(task.scheduleType),
      updatedAt: finishedAt,
    },
    options.schedulerMode ? undefined : options.userId,
  );

  return { task: updatedTask ?? effectiveTask, taskRun, notification };
}

export async function regenerateTaskRun(runId: string, userId?: string) {
  const currentRun = await getTaskRunById(runId, userId);
  if (!currentRun) return null;

  const task = await getScheduledTaskById(currentRun.taskId, userId);
  if (!task) return null;

  const rawInput = await collectTaskDataSources(task);
  const gptPrompt = buildGptPrompt(task, rawInput);
  const now = new Date().toISOString();

  try {
    const gptOutput = await generateGptOutput(task, rawInput);
    const { translation, translatedGptOutput, translatedRawInput } = await buildTranslatedRunPayload(task, rawInput, gptOutput);

    return await updateTaskRun(runId, {
      status: "success",
      finishedAt: now,
      rawInput: translatedRawInput,
      gptPrompt,
      gptOutput: translatedGptOutput,
      priorityScore: translatedGptOutput.priority_score,
      telegramStatus: "regenerated",
      errorMessage: null,
      originalContent: translation.originalContent,
      translatedContent: translation.translatedSummary,
      language: translation.originalLanguage,
      translatedAt: translation.translatedAt,
      translation,
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const gptOutput = buildFailedGptOutput(task, errorMessage);
    const { translation, translatedGptOutput, translatedRawInput } = await buildTranslatedRunPayload(task, rawInput, gptOutput);

    return await updateTaskRun(runId, {
      status: "failed",
      finishedAt: now,
      rawInput: translatedRawInput,
      gptPrompt,
      gptOutput: translatedGptOutput,
      priorityScore: 0,
      telegramStatus: "skipped_failed",
      errorMessage,
      originalContent: translation.originalContent,
      translatedContent: translation.translatedSummary,
      language: translation.originalLanguage,
      translatedAt: translation.translatedAt,
      translation,
    });
  }
}
