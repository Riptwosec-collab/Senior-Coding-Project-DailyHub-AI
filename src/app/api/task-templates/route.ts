import { getCurrentUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/mock-db";
import { listTaskTemplates } from "@/lib/repositories/task-templates.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const templates = await listTaskTemplates(user?.id ?? null);
    return successResponse(templates);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load task templates";
    return errorResponse(message, 500, "INTERNAL_ERROR");
  }
}
