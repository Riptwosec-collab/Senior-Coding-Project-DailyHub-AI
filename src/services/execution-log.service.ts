import type { ExecutionLog } from "@/types/execution-log";
import type { TaskRun } from "@/types/task-run";

export function buildExecutionLogFromTaskRun(run: TaskRun, taskName = run.taskId): ExecutionLog {
  const translation = run.translation;

  return {
    id: run.id,
    taskId: run.taskId,
    taskName,
    status: run.status === "success" ? "success" : "failed",
    originalContent: translation?.originalContent ?? run.originalContent ?? JSON.stringify(run.rawInput, null, 2),
    translatedContent: translation?.translatedSummary ?? run.translatedContent ?? run.gptOutput.summary,
    language: translation?.originalLanguage ?? run.language ?? "unknown",
    telegramSent: ["sent", "mock_sent", "mock_sent_missing_config", "mock_sent_fallback"].includes(run.telegramStatus),
    startedAt: run.startedAt,
    finishedAt: run.finishedAt ?? new Date().toISOString(),
    error: run.errorMessage ?? undefined,
  };
}
