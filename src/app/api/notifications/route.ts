import { errorResponse, getMockDb, getSearchParam, normalizeBoolean, normalizeString } from "@/lib/mock-db";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications } from "@/lib/repositories/notifications.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const isReadParam = getSearchParam(request, "is_read") ?? getSearchParam(request, "isRead");
    const importantParam = getSearchParam(request, "important");
    const isRead = isReadParam === null ? undefined : normalizeBoolean(isReadParam);
    const important = importantParam === null ? undefined : normalizeBoolean(importantParam);
    const type = normalizeString(getSearchParam(request, "type"));

    const notifications = user ? await listNotifications({
      userId: user.id,
      isRead,
      important,
      type,
    }) : getMockDb().webNotifications.filter((notification) => {
      const matchesRead = typeof isRead !== "boolean" || notification.isRead === isRead;
      const matchesImportant = typeof important !== "boolean" || (important ? notification.priorityScore >= 80 : notification.priorityScore < 80);
      const matchesType = !type || type === "All" || notification.type === type;
      return matchesRead && matchesImportant && matchesType;
    });

    return Response.json({ success: true, data: notifications, meta: { total: notifications.length } });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to list notifications", 401, "BAD_REQUEST");
  }
}
