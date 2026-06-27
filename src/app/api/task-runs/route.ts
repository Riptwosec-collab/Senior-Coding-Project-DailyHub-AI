import { errorResponse, getMockDb, getSearchParam, normalizeString } from "@/lib/mock-db";
import { getCurrentUser } from "@/lib/auth";
import { listTaskRuns } from "@/lib/repositories/task-runs.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const taskId = normalizeString(getSearchParam(request, "task_id") ?? getSearchParam(request, "taskId"));
    const status = normalizeString(getSearchParam(request, "status"));

    const runs = user ? await listTaskRuns({
      userId: user.id,
      taskId,
      status,
    }) : getMockDb().taskRuns.filter((run) => {
      const matchesTask = !taskId || run.taskId === taskId;
      const matchesStatus = !status || status === "All" || run.status === status;
      return matchesTask && matchesStatus;
    });

    return Response.json({ success: true, data: runs, meta: { total: runs.length } });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to list task runs", 401, "BAD_REQUEST");
  }
}
