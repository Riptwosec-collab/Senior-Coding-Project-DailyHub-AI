import { dailyBriefCategories } from "@/data/daily-brief.mock";
import { getDailyBriefTopicDetail } from "@/lib/daily-brief-taxonomy";
import type { DailyBriefItem, DailyBriefSummary } from "@/types/daily-brief";

const TELEGRAM_TOPIC_LIMIT = 3200;

function truncate(value: string, max = 260) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function hasThaiText(value: string) {
  return /[\u0E00-\u0E7F]/.test(value);
}

function thaiOnly(value: string | null | undefined, fallback: string, max = 260) {
  const text = truncate(value ?? "", max);
  return hasThaiText(text) ? text : fallback;
}

function clampTelegramTopicMessage(text: string) {
  if (text.length <= TELEGRAM_TOPIC_LIMIT) return text;
  const footer = "\n\nข้อความถูกย่อให้เหลือ 1 ข้อความต่อหัวข้อ เปิด DailyHub เพื่ออ่านรายละเอียดเต็ม";
  return `${text.slice(0, TELEGRAM_TOPIC_LIMIT - footer.length - 1).trim()}…${footer}`;
}

function getCategoryLabel(key: string) {
  const found = dailyBriefCategories.find((category) => category.key === key);
  return found ? getDailyBriefTopicDetail(found.key).labelTh : key;
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
  return buildTelegramBriefTopicMessages(summary, items).join("\n\n---\n\n");
}

function getThaiBulletPoints(item: DailyBriefItem) {
  const fallback = [
    "อ่านรายละเอียดเต็มจากแหล่งข่าวต้นฉบับ",
    `หมวดข่าว: ${getCategoryLabel(item.category)}`,
    "ระบบส่งสรุปภาษาไทยแบบย่อไป Telegram เท่านั้น",
  ];

  const bullets = item.bulletPoints
    .filter((point) => hasThaiText(point))
    .slice(0, 3);

  return bullets.length ? bullets : fallback;
}

function buildTelegramBriefTopicMessage(summary: DailyBriefSummary, categoryKey: DailyBriefItem["category"], categoryItems: DailyBriefItem[]) {
  const detail = getDailyBriefTopicDetail(categoryKey);
  const topicSummary = thaiOnly(
    summary.categorySummaries[categoryKey] || categoryItems[0]?.summaryTh,
    `${detail.labelTh}: มีข่าวในหัวข้อนี้ที่พร้อมอ่านบน DailyHub`,
    420,
  );
  const visibleItems = categoryItems
    .filter((item) => !item.isHidden)
    .slice()
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const itemLines = visibleItems.slice(0, 3).map((item, index) => {
    const title = thaiOnly(item.titleTh, `${detail.labelTh} รายการที่ ${index + 1}`, 130);
    const itemSummary = thaiOnly(item.summaryTh, "สรุปภาษาไทยพร้อมอ่านบน DailyHub", 220);
    const bullets = getThaiBulletPoints(item).map((point) => `   - ${truncate(point, 120)}`).join("\n");
    const source = item.sourceName ? `   แหล่งข้อมูล: ${truncate(item.sourceName, 80)}` : "   แหล่งข้อมูล: เปิดดูใน DailyHub";
    return `${index + 1}. ${title}\n   สรุป: ${itemSummary}\n${bullets}\n${source}`;
  });

  const remainingCount = visibleItems.length - itemLines.length;

  return clampTelegramTopicMessage([
    `${detail.icon} DailyHub Brief`,
    `หัวข้อ: ${detail.labelTh}`,
    `วันที่: ${summary.date}`,
    `จำนวนข่าวในหัวข้อนี้: ${visibleItems.length}`,
    "",
    "สรุปไทยก่อนส่ง:",
    topicSummary,
    "",
    "ข่าวสำคัญ:",
    itemLines.join("\n\n") || "ยังไม่มีข่าวในหัวข้อนี้",
    remainingCount > 0 ? `\nและอีก ${remainingCount} รายการ เปิดอ่านเต็มได้ใน DailyHub` : "",
    "",
    "อ่านเต็ม:",
    "เปิดหน้า DailyHub เพื่ออ่านข่าวเต็มและแหล่งข่าวต้นฉบับ",
    "",
    "ส่งจาก DailyHub",
  ].filter(Boolean).join("\n"));
}

export function buildTelegramBriefTopicMessages(summary: DailyBriefSummary, items: DailyBriefItem[]) {
  const visibleItems = items.filter((item) => !item.isHidden);
  const messages = dailyBriefCategories
    .filter((category) => category.key !== "all")
    .flatMap((category) => {
      const categoryItems = visibleItems.filter((item) => item.category === category.key);
      return categoryItems.length ? [buildTelegramBriefTopicMessage(summary, category.key, categoryItems)] : [];
    });

  if (messages.length) return messages;

  return [clampTelegramTopicMessage([
    "DailyHub Brief",
    `วันที่: ${summary.date}`,
    "หัวข้อ: ข่าวประจำวัน",
    "",
    "ยังไม่มีข่าวที่พร้อมส่ง Telegram ในรอบนี้",
    "เปิด DailyHub เพื่อตรวจสถานะการดึงข่าวและรันใหม่",
  ].join("\n"))];
}
