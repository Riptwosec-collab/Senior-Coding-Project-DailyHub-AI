import { requireCurrentUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/mock-db";
import { createScheduledTask } from "@/lib/repositories/scheduled-tasks.repository";
import { getTaskTemplateById } from "@/lib/task-templates";
import type { CreateTaskFromTemplateResult } from "@/types/task-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const template = getTaskTemplateById(id);

  if (!template) {
    return errorResponse("Template not found", 404, "NOT_FOUND");
  }

  try {
    const user = await requireCurrentUser();
    const task = await createScheduledTask({
      userId: user.id,
      name: template.name,
      type: template.type,
      scheduleType: template.scheduleType,
      cronExpression: template.cronExpression,
      time: template.time,
      timezone: template.timezone,
      dataSources: template.dataSources,
      gptActions: template.gptActions,
      outputChannels: template.outputChannels,
      minPriorityScore: template.minPriorityScore,
      isActive: true,
    });

    const result: CreateTaskFromTemplateResult = {
      template,
      taskId: task.id,
      taskName: task.name,
    };

    return successResponse(result, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to create task from template", 500, "INTERNAL_ERROR");
  }
}
