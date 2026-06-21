import { listDueScheduledTasks, listScheduledTasks } from "@/lib/repositories/scheduled-tasks.repository";
import { runTaskNow } from "./task-runner.service";

export type SchedulerTickOptions = {
  /**
   * When true, run every active task immediately instead of only tasks whose
   * nextRunAt is due. This is useful for manual GitHub Actions testing.
   */
  force?: boolean;
};

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
  const dueTasks = options.force ? await listScheduledTasks({ isActive: true }) : await listDueScheduledTasks(checkedAt);
  const results = [];

  for (const task of dueTasks) {
    const result = await runTaskNow(task.id, { schedulerMode: true });
    results.push({ taskId: task.id, taskName: task.name, status: result?.taskRun.status ?? "not_found", runId: result?.taskRun.id ?? null });
  }

  return {
    success: true,
    mode: process.env.USE_SUPABASE === "true" ? "supabase" : "mock",
    checkedAt,
    force: Boolean(options.force),
    dueTasks: dueTasks.length,
    results,
  };
}
