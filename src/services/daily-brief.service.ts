import { dailyBriefCategories, defaultDailyBriefSettings, mockDailyBriefItems, mockDailyBriefLogs } from "@/data/daily-brief.mock";
import { dedupeDailyBriefItems } from "@/services/news-dedup.service";
import { summarizeDailyBriefItems, summarizeSingleNews } from "@/services/news-summary.service";
import type { DailyBriefApiResponse, DailyBriefItem } from "@/types/daily-brief";

export async function getLatestDailyBrief(): Promise<DailyBriefApiResponse> {
  const items = dedupeDailyBriefItems(mockDailyBriefItems.map(summarizeSingleNews));
  return {
    items,
    summary: summarizeDailyBriefItems(items, "mock"),
    categories: dailyBriefCategories,
    settings: defaultDailyBriefSettings,
    logs: mockDailyBriefLogs,
  };
}

export async function summarizeDailyBriefPayload(items?: DailyBriefItem[]) {
  const data = items?.length ? items.map(summarizeSingleNews) : (await getLatestDailyBrief()).items;
  return summarizeDailyBriefItems(dedupeDailyBriefItems(data), "mock");
}

export function getDailyBriefSchedulerPreview() {
  const nextRun = new Date();
  nextRun.setHours(8, 0, 0, 0);
  if (nextRun.getTime() <= Date.now()) nextRun.setDate(nextRun.getDate() + 1);
  return {
    enabled: false,
    time: "08:00",
    timezone: "Asia/Bangkok",
    categories: defaultDailyBriefSettings.enabledCategories,
    maxItemsPerCategory: defaultDailyBriefSettings.maxItemsPerCategory,
    lastSent: mockDailyBriefLogs[0]?.runAt || null,
    nextRun: nextRun.toISOString(),
    status: "disabled",
  };
}
