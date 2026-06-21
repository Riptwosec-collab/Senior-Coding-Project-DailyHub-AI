import { errorResponse, successResponse } from "@/lib/mock-db";
import { runSchedulerTick } from "@/services/scheduler.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const configuredSecret = process.env.CRON_SECRET || process.env.SCHEDULER_SECRET;
  if (!configuredSecret) return true;

  const authHeader = request.headers.get("authorization");
  const schedulerHeader = request.headers.get("x-scheduler-secret");

  return authHeader === `Bearer ${configuredSecret}` || schedulerHeader === configuredSecret;
}

function shouldForceRun(request: Request) {
  const url = new URL(request.url);
  const force = url.searchParams.get("force") ?? url.searchParams.get("runAll");
  return force === "true" || force === "1" || force === "yes";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return errorResponse("Unauthorized scheduler request", 401, "BAD_REQUEST");
  const result = await runSchedulerTick({ force: shouldForceRun(request) });
  return successResponse(result);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return errorResponse("Unauthorized scheduler request", 401, "BAD_REQUEST");
  const result = await runSchedulerTick({ force: shouldForceRun(request) });
  return successResponse(result);
}
