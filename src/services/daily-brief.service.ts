import { dailyBriefCategories, defaultDailyBriefSettings, mockDailyBriefItems, mockDailyBriefLogs } from "@/data/daily-brief.mock";
import { dedupeDailyBriefItems } from "@/services/news-dedup.service";
import { summarizeDailyBriefItems, summarizeSingleNews } from "@/services/news-summary.service";
import { fetchNewsDataLatest } from "@/services/newsdata.service";
import type { DailyBriefApiResponse, DailyBriefCategoryKey, DailyBriefItem, DailyBriefRunLog } from "@/types/daily-brief";

function parseCategory(value: string | null): DailyBriefCategoryKey | undefined {
  if (!value || value === "all") return undefined;
  const found = dailyBriefCategories.find((category) => category.key === value);
  return found?.key === "all" ? undefined : found?.key;
}

function filterItems(items: DailyBriefItem[], category?: DailyBriefCategoryKey, search?: string | null) {
  const query = (search || "").trim().toLowerCase();
  return items.filter((item) => {
    const matchesCategory = !category || item.category === category;
    const matchesSearch = !query || [item.title, item.titleTh, item.summaryTh, item.sourceName, item.tags.join(" ")].join(" ").toLowerCase().includes(query);
    return matchesCategory && matchesSearch && !item.isHidden;
  });
}

export async function getLatestDailyBrief(params?: { category?: string | null; search?: string | null }): Promise<DailyBriefApiResponse> {
  const category = parseCategory(params?.category || null);
  let items: DailyBriefItem[] = [];
  let mode: "mock" | "real" | "fallback" = "real";
  let message = "Using real Daily Brief feeds";
  const useRealNews = process.env.USE_REAL_NEWS !== "false";

  if (useRealNews) {
    try {
      const result = await fetchNewsDataLatest(category);
      if (result.items.length > 0) {
        items = result.items;
        mode = "real";
      }
      message = result.message;
    } catch (error) {
      mode = "fallback";
      message = error instanceof Error ? error.message : "News provider fallback activated";
    }
  }

  if (!items.length) {
    items = mockDailyBriefItems;
    mode = useRealNews ? "fallback" : "mock";
    message = useRealNews
      ? `${message}; real feeds returned no usable news, using NimbusDaily fallback data`
      : "USE_REAL_NEWS=false; using mock data";
  }

  const prepared = dedupeDailyBriefItems(filterItems(items, category, params?.search).map(summarizeSingleNews));
  const logs: DailyBriefRunLog[] = [
    { id: `brief_log_${Date.now()}`, runAt: new Date().toISOString(), status: "success", fetchedItems: items.length, summarizedItems: prepared.length, telegramParts: 0, message },
    ...mockDailyBriefLogs,
  ];

  return {
    items: prepared,
    summary: summarizeDailyBriefItems(prepared, mode),
    categories: dailyBriefCategories,
    settings: {
      ...defaultDailyBriefSettings,
      useRealNews,
      newsProvider: process.env.NEWSDATA_API_KEY && useRealNews ? "hybrid" : "googleNewsRss",
      autoSendTelegram: process.env.DAILY_BRIEF_AUTO_SEND === "true",
      telegramTime: process.env.DAILY_BRIEF_TIME || defaultDailyBriefSettings.telegramTime,
    },
    logs,
  };
}

export async function summarizeDailyBriefPayload(items?: DailyBriefItem[]) {
  const data = items?.length ? items.map(summarizeSingleNews) : (await getLatestDailyBrief()).items;
  return summarizeDailyBriefItems(dedupeDailyBriefItems(data), items?.length ? "fallback" : "mock");
}

export function getDailyBriefSchedulerPreview() {
  const time = process.env.DAILY_BRIEF_TIME || "08:00";
  const [hour = "08", minute = "00"] = time.split(":");
  const nextRun = new Date();
  nextRun.setHours(Number(hour), Number(minute), 0, 0);
  if (nextRun.getTime() <= Date.now()) nextRun.setDate(nextRun.getDate() + 1);
  return {
    enabled: process.env.DAILY_BRIEF_AUTO_SEND === "true",
    time,
    timezone: "Asia/Bangkok",
    categories: defaultDailyBriefSettings.enabledCategories,
    maxItemsPerCategory: defaultDailyBriefSettings.maxItemsPerCategory,
    lastSent: mockDailyBriefLogs[0]?.runAt || null,
    nextRun: nextRun.toISOString(),
    status: process.env.DAILY_BRIEF_AUTO_SEND === "true" ? "scheduled" : "disabled",
  };
}
