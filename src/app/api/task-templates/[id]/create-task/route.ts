import { requireCurrentUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/mock-db";
import { createScheduledTask } from "@/lib/repositories/scheduled-tasks.repository";
import { getTaskTemplateByIdFromRepository } from "@/lib/repositories/task-templates.repository";
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

  try {
    const user = await requireCurrentUser();
    const template = await getTaskTemplateByIdFromRepository(id, user.id);

    if (!template) {
      return errorResponse("Template not found", 404, "NOT_FOUND");
    }

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
    const message = error instanceof Error ? error.message : "Failed to create task from template";
    return errorResponse(message, 500, "INTERNAL_ERROR");
  }
}
