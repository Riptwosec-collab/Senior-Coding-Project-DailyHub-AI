import { sendSingleDailyBriefNewsToTelegram } from "@/services/daily-brief-telegram.service";
import type { DailyBriefItem } from "@/types/daily-brief";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readBody(request: Request) {
  try {
    return await request.json() as { item?: DailyBriefItem };
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    if (!body.item) {
      return Response.json({ success: false, error: { code: "MISSING_NEWS_ITEM", message: "Missing news item" } }, { status: 400 });
    }

    const result = await sendSingleDailyBriefNewsToTelegram(body.item);
    return Response.json({ success: result.status !== "failed", data: result }, { status: result.status === "failed" ? 502 : 200 });
  } catch (error) {
    return Response.json(
      { success: false, error: { code: "TELEGRAM_NEWS_FAILED", message: error instanceof Error ? error.message : "Failed to send news" } },
      { status: 500 },
    );
  }
}
