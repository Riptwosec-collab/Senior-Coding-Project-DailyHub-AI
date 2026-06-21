import { errorResponse, successResponse } from "@/lib/mock-db";
import { getTelegramModeStatus, sendTelegramTestMessage } from "@/services/telegram.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getConfiguredSecret() {
  return process.env.CRON_SECRET || process.env.SCHEDULER_SECRET || process.env.ADMIN_SECRET;
}

function isAuthorized(request: Request) {
  const configuredSecret = getConfiguredSecret();
  if (!configuredSecret) return false;

  const authHeader = request.headers.get("authorization");
  const schedulerHeader = request.headers.get("x-scheduler-secret");
  const adminHeader = request.headers.get("x-admin-secret");

  return authHeader === `Bearer ${configuredSecret}` || schedulerHeader === configuredSecret || adminHeader === configuredSecret;
}

function getMessage(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("message") || "🧠 DailyHub AI ทดสอบ Telegram สำเร็จแล้ว";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return errorResponse("Unauthorized Telegram test request", 401, "BAD_REQUEST");

  const telegramMode = getTelegramModeStatus();
  const telegramResult = await sendTelegramTestMessage(getMessage(request));

  const ok = telegramResult.status === "sent";
  if (!ok) {
    return errorResponse(
      `Telegram test did not send a real message: ${telegramResult.status} - ${telegramResult.message}`,
      500,
      "INTERNAL_ERROR",
      { telegramMode, telegramResult },
    );
  }

  return successResponse({
    success: true,
    telegramMode,
    telegramResult,
    checkedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  return GET(request);
}
