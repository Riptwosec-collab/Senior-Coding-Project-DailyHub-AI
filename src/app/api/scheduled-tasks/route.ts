import {
  errorResponse,
  getSearchParam,
  normalizeBoolean,
  normalizeNumber,
  normalizeString,
  normalizeStringArray,
  readJsonBody,
  successResponse,
  getMockDb,
} from "@/lib/mock-db";
import { getCurrentUser, requireCurrentUser } from "@/lib/auth";
import { createScheduledTask, listScheduledTasks } from "@/lib/repositories/scheduled-tasks.repository";
import type { ScheduledTask } from "@/types/scheduled-task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isLegacyLongReadTask(task: ScheduledTask) {
  const haystack = [task.name, task.type, task.dataSources.join(" ")].join(" ").toLowerCase();
  return haystack.includes("long read") || haystack.includes("อ่านยาว");
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const query = {
      search: normalizeString(getSearchParam(request, "search")),
      type: normalizeString(getSearchParam(request, "type")),
      status: normalizeString(getSearchParam(request, "status")),
      isActive: getSearchParam(request, "is_active") === null ? undefined : normalizeBoolean(getSearchParam(request, "is_active")),
    };

    const tasks = user ? await listScheduledTasks({
      userId: user.id,
      ...query,
    }) : getMockDb().scheduledTasks.filter((task) => {
      const search = query.search.toLowerCase();
      const matchesSearch = !search || [task.name, task.type, task.status, task.dataSources.join(" ")].join(" ").toLowerCase().includes(search);
      const matchesType = !query.type || query.type === "All" || task.type === query.type;
      const matchesStatus = !query.status || query.status === "All" || task.status === query.status;
      const matchesActive = typeof query.isActive !== "boolean" || task.isActive === query.isActive;
      return matchesSearch && matchesType && matchesStatus && matchesActive;
    });

    const normalizedTasks = tasks.filter((task) => !isLegacyLongReadTask(task));
    return Response.json({ success: true, data: normalizedTasks, meta: { total: normalizedTasks.length, user: user ? (user.isMock ? "mock" : "supabase") : "public-demo" } });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to list tasks", 401, "BAD_REQUEST");
  }
}

export async function POST(request: Request) {
  const body = await readJsonBody<Record<string, unknown>>(request);
  if (!body) return errorResponse("Invalid JSON body", 400, "INVALID_JSON");

  try {
    const user = await requireCurrentUser();
    const name = normalizeString(body.name);
    const type = normalizeString(body.type, "Custom") as ScheduledTask["type"];
    const dataSources = normalizeStringArray(body.dataSources ?? body.data_sources, ["News"]);
    const candidateText = [name, type, dataSources.join(" ")].join(" ").toLowerCase();

    if (name.length < 3) return errorResponse("Task name must be at least 3 characters", 422, "VALIDATION_ERROR");
    if (candidateText.includes("long read") || candidateText.includes("อ่านยาว")) return errorResponse("Legacy long-read tasks are archived and cannot be created", 422, "VALIDATION_ERROR");

    const task = await createScheduledTask({
      userId: user.id,
      name,
      type,
      scheduleType: normalizeString(body.scheduleType ?? body.schedule_type, "Daily") as ScheduledTask["scheduleType"],
      cronExpression: normalizeString(body.cronExpression ?? body.cron_expression, "0 8 * * *"),
      time: normalizeString(body.time) || null,
      timezone: normalizeString(body.timezone, "Asia/Bangkok"),
      dataSources,
      gptActions: normalizeStringArray(body.gptActions ?? body.gpt_actions, ["Summarize"]),
      outputChannels: normalizeStringArray(body.outputChannels ?? body.output_channels, ["Save to Web Dashboard"]),
      minPriorityScore: normalizeNumber(body.minPriorityScore ?? body.min_priority_score, 70),
      isActive: normalizeBoolean(body.isActive ?? body.is_active, true),
    });

    return successResponse(task, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof Error ? "Failed to create task" : "Failed to create task", 500, "INTERNAL_ERROR");
  }
}
