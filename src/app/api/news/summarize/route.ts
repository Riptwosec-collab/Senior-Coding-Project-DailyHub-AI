import { summarizeDailyBriefPayload } from "@/services/daily-brief.service";
import type { DailyBriefItem } from "@/types/daily-brief";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readBody(request: Request) {
  try {
    return await request.json() as { items?: DailyBriefItem[] };
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const summary = await summarizeDailyBriefPayload(body.items);
    return Response.json({ success: true, data: summary });
  } catch (error) {
    return Response.json(
      { success: false, error: { code: "NEWS_SUMMARIZE_FAILED", message: error instanceof Error ? error.message : "Failed to summarize news" } },
      { status: 500 },
    );
  }
}
