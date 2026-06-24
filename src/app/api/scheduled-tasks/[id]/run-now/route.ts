import { fail, getRequestId, notFound, ok } from "@/lib/api/response";
import { assertRateLimit, getClientIp } from "@/lib/rate-limit";
import { assertDailyUsageLimit, recordUsageEvent } from "@/lib/usage-limits";
import { audit } from "@/services/audit-log.service";
import { runTaskNow } from "@/services/task-runner.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isForceTelegramRequest(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("forceTelegram") === "true" || url.searchParams.get("force") === "telegram";
}

export async function POST(request: Request, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;
  const forceTelegram = isForceTelegramRequest(request);

  try {
    const ip = getClientIp(request);
    assertRateLimit({ key: `run-now:${ip}:${id}`, limit: 5, windowMs: 60_000 });
    assertDailyUsageLimit({
      type: "run_now",
      label: "Run Now",
      limitEnvName: "DAILY_RUN_NOW_LIMIT",
      fallbackLimit: 30,
    });

    await audit({
      action: "scheduled_task.run_now.requested",
      entityType: "scheduled_task",
      entityId: id,
      message: `Run Now requested for task ${id}${forceTelegram ? " with forced Telegram" : ""}`,
      requestId,
    });

    const result = await runTaskNow(id, { forceTelegram });
    if (!result) throw notFound(`Scheduled task ${id} was not found`);

    recordUsageEvent({
      type: "run_now",
      metadata: {
        taskId: id,
        taskRunId: result.taskRun.id,
        priorityScore: result.taskRun.priorityScore,
        forceTelegram,
      },
    });

    if (result.taskRun.status === "success") {
      recordUsageEvent({ type: "openai_call", metadata: { taskId: id, taskRunId: result.taskRun.id } });
    }

    if (result.taskRun.telegramStatus === "sent" || result.taskRun.telegramStatus.startsWith("mock_sent")) {
      recordUsageEvent({ type: "telegram_send", metadata: { taskId: id, taskRunId: result.taskRun.id, forceTelegram } });
    }

    await audit({
      action: "scheduled_task.run_now.completed",
      entityType: "scheduled_task",
      entityId: id,
      message: `Run Now completed for task ${id}`,
      requestId,
      metadata: {
        taskRunId: result.taskRun.id,
        priorityScore: result.taskRun.priorityScore,
        telegramStatus: result.taskRun.telegramStatus,
        forceTelegram,
      },
    });

    return ok(
      {
        task: result.task,
        taskRun: result.taskRun,
        notification: result.notification,
        forceTelegram,
        message: forceTelegram ? "Run Now completed and Telegram was forced." : "Run Now completed.",
      },
      { requestId },
    );
  } catch (error) {
    await audit({
      action: "scheduled_task.run_now.failed",
      entityType: "scheduled_task",
      entityId: id,
      level: "error",
      message: `Run Now failed for task ${id}`,
      requestId,
      metadata: { error: error instanceof Error ? error.message : String(error), forceTelegram },
    });

    return fail(error, requestId);
  }
}
