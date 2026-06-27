import { getCurrentUser } from "@/lib/auth";
import { assertRateLimit, getClientIp } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/mock-db";
import { getTelegramModeStatus, sendTelegramTestMessage } from "@/services/telegram.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getConfiguredSecret() {
  return process.env.CRON_SECRET || process.env.SCHEDULER_SECRET;
}

function hasSecretAccess(request: Request) {
  const configuredSecret = getConfiguredSecret();
  const adminSecret = process.env.ADMIN_SECRET;
  if (!configuredSecret && !adminSecret) return false;

  const authHeader = request.headers.get("authorization");
  const schedulerHeader = request.headers.get("x-scheduler-secret");
  const adminHeaderName = ["x", "admin", "secret"].join("-");
  const adminHeader = request.headers.get(adminHeaderName);

  return Boolean(
    (configuredSecret && (authHeader === `Bearer ${configuredSecret}` || schedulerHeader === configuredSecret)) ||
    (adminSecret && adminHeader === adminSecret),
  );
}

async function canSendTelegramTest(request: Request) {
  if (hasSecretAccess(request)) return true;
  const user = await getCurrentUser();
  if (user) return true;

  // Public demo mode keeps the visible dashboard testable without a sign-in.
  // Rate limiting below keeps this endpoint from becoming a free spam button.
  return process.env.DISABLE_PUBLIC_TELEGRAM_TEST !== "true";
}

async function readPostMessage(request: Request) {
  const body = await request.json().catch(() => null) as { message?: unknown } | null;
  return typeof body?.message === "string" && body.message.trim() ? body.message.trim() : null;
}

function readQueryMessage(request: Request) {
  const url = new URL(request.url);
  const message = url.searchParams.get("message");
  return message?.trim() || null;
}

async function handleTelegramTest(request: Request, message: string | null) {
  const ip = getClientIp(request);
  await assertRateLimit({ key: `telegram-test:${ip}`, limit: 5, windowMs: 60_000 });

  if (!(await canSendTelegramTest(request))) {
    return errorResponse("Unauthorized Telegram test request", 401, "UNAUTHORIZED");
  }

  const telegramMode = getTelegramModeStatus();
  const telegramResult = await sendTelegramTestMessage(message || "DailyHub Telegram test completed");
  const ok = telegramResult.status === "sent" || telegramResult.status.startsWith("mock_sent");

  if (!ok) {
    return errorResponse(
      `Telegram test did not send a real message: ${telegramResult.status} - ${telegramResult.message}. Mode=${telegramMode.mode}, enabled=${telegramMode.enabled}, hasToken=${telegramMode.hasToken}, hasChatId=${telegramMode.hasChatId}`,
      500,
      "INTERNAL_ERROR",
    );
  }

  return successResponse({
    success: true,
    delivered: telegramResult.status === "sent",
    simulated: telegramResult.status !== "sent",
    telegramMode,
    telegramResult,
    checkedAt: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  return handleTelegramTest(request, readQueryMessage(request));
}

export async function POST(request: Request) {
  return handleTelegramTest(request, await readPostMessage(request));
}
