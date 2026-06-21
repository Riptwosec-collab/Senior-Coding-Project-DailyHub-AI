import { listDueScheduledTasks, listScheduledTasks, updateScheduledTask } from "@/lib/repositories/scheduled-tasks.repository";
import { runTaskNow } from "./task-runner.service";

export type SchedulerTickOptions = {
  /**
   * When true, run every task immediately instead of only tasks whose
   * nextRunAt is due. This is useful for manual GitHub Actions testing.
   */
  force?: boolean;
};

function withTelegramChannel(outputChannels: string[]) {
  return outputChannels.includes("Send Telegram") ? outputChannels : [...outputChannels, "Send Telegram"];
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown scheduler error";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runSchedulerTick(options: SchedulerTickOptions = {}) {
  if (process.env.ENABLE_SCHEDULER === "false") {
    return {
      success: true,
      mode: "disabled",
      checkedAt: new Date().toISOString(),
      force: Boolean(options.force),
      dueTasks: 0,
      results: [],
    };
  }

  const checkedAt = new Date().toISOString();
  const force = Boolean(options.force);
  const dueTasks = force ? await listScheduledTasks() : await listDueScheduledTasks(checkedAt);
  const results = [];

  for (const [index, task] of dueTasks.entries()) {
    try {
      if (force && index > 0) {
        // Avoid Telegram / AI provider burst limits during manual all-task tests.
        await sleep(900);
      }

      const taskForRun = force
        ? await updateScheduledTask(task.id, {
            outputChannels: withTelegramChannel(task.outputChannels),
            // Manual force run is for end-to-end testing. Send every task to Telegram
            // even if AI returns a lower priority score than the normal threshold.
            minPriorityScore: 0,
            isActive: true,
            status: "Active",
          })
        : task;

      const activeTask = taskForRun ?? task;
      const result = await runTaskNow(activeTask.id, { schedulerMode: true });
      results.push({
        taskId: activeTask.id,
        taskName: activeTask.name,
        taskType: activeTask.type,
        status: result?.taskRun.status ?? "not_found",
        runId: result?.taskRun.id ?? null,
        telegramStatus: result?.taskRun.telegramStatus ?? null,
        priorityScore: result?.taskRun.priorityScore ?? null,
        minPriorityScore: activeTask.minPriorityScore,
        outputChannels: activeTask.outputChannels,
        language: result?.taskRun.language ?? null,
        translatedAt: result?.taskRun.translatedAt ?? null,
      });
    } catch (error) {
      results.push({
        taskId: task.id,
        taskName: task.name,
        taskType: task.type,
        status: "failed",
        runId: null,
        telegramStatus: "skipped_scheduler_error",
        priorityScore: null,
        minPriorityScore: force ? 0 : task.minPriorityScore,
        outputChannels: force ? withTelegramChannel(task.outputChannels) : task.outputChannels,
        language: null,
        translatedAt: null,
        error: getErrorMessage(error),
      });
    }
  }

  return {
    success: true,
    mode: process.env.USE_SUPABASE === "true" ? "supabase" : "mock",
    checkedAt,
    force,
    dueTasks: dueTasks.length,
    results,
  };
}
