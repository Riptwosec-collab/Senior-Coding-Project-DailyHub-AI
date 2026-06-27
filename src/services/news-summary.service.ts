import { dailyBriefCategories } from "@/data/daily-brief.mock";
import type { DailyBriefItem, DailyBriefSummary } from "@/types/daily-brief";

function truncate(value: string, max = 260) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function getCategoryLabel(key: string) {
  return dailyBriefCategories.find((category) => category.key === key)?.labelTh ?? key;
}

export function summarizeDailyBriefItems(items: DailyBriefItem[], mode: DailyBriefSummary["mode"] = "fallback"): DailyBriefSummary {
  const visibleItems = items.filter((item) => !item.isHidden);
  const topStories = visibleItems.slice().sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);
  const categorySummaries = visibleItems.reduce<Record<string, string>>((acc, item) => {
    const label = getCategoryLabel(item.category);
    const current = acc[item.category];
    const line = `${label}: ${truncate(item.summaryTh, 180)}`;
    acc[item.category] = current ? current : line;
    return acc;
  }, {});

  const watchItems = [
    "ติดตามข่าว Top Priority ที่คะแนนสูงกว่า 85",
    "ตรวจสถานะ Telegram หลังส่ง Daily Brief",
    "ทบทวนงานล้มเหลวและหมวดที่ข้อมูลน้อยก่อนรันรอบถัดไป",
  ];

  return {
    date: new Intl.DateTimeFormat("th-TH", { dateStyle: "full", timeZone: "Asia/Bangkok" }).format(new Date()),
    topStories,
    categorySummaries,
    watchItems,
    totalItems: visibleItems.length,
    summarizedItems: visibleItems.length,
    telegramStatus: "idle",
    generatedAt: new Date().toISOString(),
    mode,
  };
}

export function summarizeSingleNews(item: DailyBriefItem): DailyBriefItem {
  const summaryTh = item.summaryTh || truncate(item.rawDescription || item.titleTh || item.title, 320);
  const bulletPoints = item.bulletPoints.length ? item.bulletPoints.slice(0, 3) : [
    truncate(summaryTh, 120),
    `หมวด: ${getCategoryLabel(item.category)}`,
    `แหล่งข่าว: ${item.sourceName}`,
  ];

  return {
    ...item,
    titleTh: item.titleTh || item.title,
    summaryTh,
    bulletPoints,
    whyItMatters: item.whyItMatters || "เป็นข่าวที่ควรรู้เพื่อจัดลำดับความสำคัญของวันนี้",
    impact: item.impact || "ควรอ่านต่อจากแหล่งข่าวต้นฉบับเพื่อดูรายละเอียดเพิ่มเติม",
  };
}

export function buildTelegramBriefText(summary: DailyBriefSummary, items: DailyBriefItem[]) {
  const byCategory = dailyBriefCategories
    .filter((category) => category.key !== "all")
    .map((category) => {
      const lines = items
        .filter((item) => item.category === category.key && !item.isHidden)
        .slice(0, 3)
        .map((item) => `• ${truncate(item.titleTh, 110)} — ${truncate(item.summaryTh, 160)}\n  อ่านต่อ: ${item.sourceUrl}`);
      return lines.length ? `${category.icon} ${category.labelTh}\n${lines.join("\n")}` : "";
    })
    .filter(Boolean);

  const topStories = summary.topStories
    .map((item, index) => `${index + 1}. ${truncate(item.titleTh, 120)}\n   สรุป: ${truncate(item.summaryTh, 180)}\n   อ่านต่อ: ${item.sourceUrl}`)
    .join("\n\n");

  return [
    "DailyHub Brief วันนี้",
    `วันที่: ${summary.date}`,
    "",
    "🔥 Top 5 ข่าวสำคัญ",
    topStories || "ยังไม่มีข่าวสำคัญ",
    "",
    ...byCategory,
    "",
    "สิ่งที่ควรติดตามต่อ:",
    ...summary.watchItems.map((item) => `• ${item}`),
    "",
    `โหมดสรุป: ${summary.mode === "fallback" ? "Fallback / Rule-based" : summary.mode}`,
    "ส่งจาก DailyHub",
  ].filter(Boolean).join("\n");
}

export function splitTelegramText(text: string, limit = 3600) {
  if (text.length <= limit) return [text];
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    const slice = remaining.slice(0, limit);
    const breakIndex = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf("\n"));
    const safeIndex = breakIndex > limit * 0.55 ? breakIndex : limit;
    chunks.push(remaining.slice(0, safeIndex).trim());
    remaining = remaining.slice(safeIndex).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks.map((chunk, index) => chunks.length > 1 ? `${chunk}\n\n(${index + 1}/${chunks.length})` : chunk);
}
