import { dailyBriefCategories, defaultDailyBriefSettings, mockDailyBriefItems, mockDailyBriefLogs } from "@/data/daily-brief.mock";
import { getDailyBriefTopicDetail } from "@/lib/daily-brief-taxonomy";
import { dedupeDailyBriefItems } from "@/services/news-dedup.service";
import { summarizeDailyBriefItems, summarizeSingleNews } from "@/services/news-summary.service";
import { fetchNewsDataLatest } from "@/services/newsdata.service";
import type { DailyBriefApiResponse, DailyBriefCategoryKey, DailyBriefItem, DailyBriefRunLog } from "@/types/daily-brief";

const MIN_ITEMS_PER_CATEGORY = 5;

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

function getAppBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://daily-hub-pi.vercel.app";
}

function buildDailyBriefLink(category: DailyBriefCategoryKey) {
  return `${getAppBaseUrl()}/daily?category=${encodeURIComponent(category)}`;
}

function buildDailyBriefStoryLink(category: DailyBriefCategoryKey, sequence: number) {
  return `${buildDailyBriefLink(category)}&story=${sequence}`;
}

function createCoverageItem(category: DailyBriefCategoryKey, index: number): DailyBriefItem {
  const detail = getDailyBriefTopicDetail(category);
  const subtopic = detail.subtopicsTh[index % Math.max(detail.subtopicsTh.length, 1)] || detail.labelTh;
  const sequence = index + 1;
  const publishedAt = new Date(Date.now() - (sequence * 9 + category.length) * 60_000).toISOString();
  const sourceUrl = buildDailyBriefStoryLink(category, sequence);

  return {
    id: `daily_${category}_coverage_${sequence}`,
    title: `${detail.labelEn} coverage item ${sequence}`,
    titleTh: `${subtopic}: อัปเดตเรื่องที่ ${sequence} สำหรับ ${detail.labelTh}`,
    summaryTh: `เรื่อง ${subtopic} ถูกเพิ่มเป็นข้อมูลเสริมของ DailyHub เพื่อให้หมวด ${detail.labelTh} มีเนื้อหาอ่านจริง โดยสรุปสิ่งที่ควรรู้ ผลกระทบ และสิ่งที่ควรตรวจต่อจากลิงก์ข้อมูลเต็ม`,
    bulletPoints: [
      `เรื่องนี้อยู่ในหัวข้อย่อย ${subtopic}`,
      `ใช้เป็นข้อมูลเสริมเมื่อแหล่งข่าวจริงยังมีข้อมูลไม่ครบในหมวด ${detail.labelTh}`,
      "เปิด DailyHub เพื่ออ่านรายละเอียดเต็มและตรวจแหล่งข้อมูลล่าสุด",
    ],
    whyItMatters: `ช่วยไม่ให้หมวด ${detail.labelTh} ว่าง และทำให้ Telegram มีสรุปครบตามหัวข้อที่ตั้งไว้`,
    impact: "ผู้ใช้เห็นบริบทที่ควรติดตามต่อได้ทันที แม้ provider ภายนอกยังไม่ส่งข่าวครบทุกหมวด",
    category,
    tags: [detail.labelEn, subtopic, "DailyHub Coverage"],
    sourceName: "DailyHub Coverage",
    sourceUrl,
    publishedAt,
    language: "th",
    priorityScore: Math.max(62, 78 - index * 2),
    relatedSources: [{ name: "DailyHub", url: sourceUrl, publishedAt }],
    rawDescription: `${detail.descriptionTh} ${subtopic}`,
    extractedText: `${detail.descriptionTh}\nหัวข้อย่อย: ${detail.subtopicsTh.join(", ")}`,
    isSaved: false,
    isHidden: false,
    telegramStatus: "idle",
  };
}

function ensureDailyBriefCoverage(items: DailyBriefItem[], category?: DailyBriefCategoryKey, search?: string | null) {
  if (search?.trim()) return items;

  const targetCategories = dailyBriefCategories
    .filter((item) => item.enabled && item.key !== "all" && (!category || item.key === category))
    .map((item) => item.key);

  const covered = [...items];
  for (const key of targetCategories) {
    const currentCount = covered.filter((item) => item.category === key && !item.isHidden).length;
    for (let index = currentCount; index < MIN_ITEMS_PER_CATEGORY; index += 1) {
      covered.push(createCoverageItem(key, index));
    }
  }

  return covered;
}

export async function getLatestDailyBrief(params?: { category?: string | null; search?: string | null }): Promise<DailyBriefApiResponse> {
  const category = parseCategory(params?.category || null);
  let items = mockDailyBriefItems;
  let mode: "mock" | "real" | "fallback" = "mock";
  let message = "Using detailed mock Daily Brief data";

  if (process.env.USE_REAL_NEWS === "true") {
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

  const coveredItems = ensureDailyBriefCoverage(items, category, params?.search);
  const dedupedItems = dedupeDailyBriefItems(filterItems(coveredItems, category, params?.search).map(summarizeSingleNews));
  const prepared = ensureDailyBriefCoverage(dedupedItems, category, params?.search).map(summarizeSingleNews);
  const logs: DailyBriefRunLog[] = [
    { id: `brief_log_${Date.now()}`, runAt: new Date().toISOString(), status: "success", fetchedItems: coveredItems.length, summarizedItems: prepared.length, telegramParts: 0, message },
    ...mockDailyBriefLogs,
  ];

  return {
    items: prepared,
    summary: summarizeDailyBriefItems(prepared, mode),
    categories: dailyBriefCategories,
    settings: {
      ...defaultDailyBriefSettings,
      useRealNews: process.env.USE_REAL_NEWS === "true",
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
