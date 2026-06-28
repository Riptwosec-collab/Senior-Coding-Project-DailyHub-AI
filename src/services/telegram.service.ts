import type { ScheduledTask } from "@/types/scheduled-task";
import type { TaskRun } from "@/types/task-run";

const TELEGRAM_BRAND_NAME = "NimbusDaily";
const TELEGRAM_SAFE_LIMIT = 3600;
const MAX_TELEGRAM_BULLETS = 4;
const MAX_TELEGRAM_STORIES = 5;

type TelegramTopicMeta = {
  emoji: string;
  label: string;
  shortLabel: string;
};

const DEFAULT_TOPIC_META: TelegramTopicMeta = {
  emoji: "🧠",
  label: "ทั่วไป",
  shortLabel: "ทั่วไป",
};

const TOPIC_META = {
  email: { emoji: "📧", label: "อีเมลสำคัญ", shortLabel: "อีเมล" },
  productRadar: { emoji: "🌍", label: "สินค้าใหม่ / โปรโมชัน", shortLabel: "สินค้าและดีล" },
  football: { emoji: "⚽", label: "สรุปฟุตบอล", shortLabel: "ฟุตบอล" },
  concert: { emoji: "🎤", label: "อีเวนต์ / คอนเสิร์ต / สินค้าใหม่", shortLabel: "อีเวนต์" },
  weather: { emoji: "🌦️", label: "อากาศ / PM2.5", shortLabel: "อากาศ" },
  publicAlerts: { emoji: "📢", label: "ประกาศสำคัญ / แจ้งเตือนรัฐ", shortLabel: "ประกาศรัฐ" },
  travelDeals: { emoji: "✈️", label: "โปรเดินทาง / ตั๋วเครื่องบิน / โรงแรม", shortLabel: "โปรเดินทาง" },
  dailyBrief: { emoji: "📰", label: "ข่าวประจำวัน", shortLabel: "ข่าว" },
  test: { emoji: "🧪", label: "ทดสอบ Telegram", shortLabel: "ทดสอบ" },
} satisfies Record<string, TelegramTopicMeta>;

export function getTelegramModeStatus() {
  const enabled = process.env.ENABLE_TELEGRAM === "true";
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID);
  return {
    mode: enabled && hasToken && hasChatId ? "real" : "mock",
    enabled,
    hasToken,
    hasChatId,
  };
}

function truncate(value: string, max = 420) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function countThaiChars(value: string) {
  return (value.match(/[\u0E00-\u0E7F]/g) ?? []).length;
}

function countLatinChars(value: string) {
  return (value.match(/[A-Za-z]/g) ?? []).length;
}

function isThaiReady(value: string) {
  const thaiChars = countThaiChars(value);
  const latinChars = countLatinChars(value);
  return thaiChars > 0 && latinChars <= Math.max(20, thaiChars * 2);
}

function thaiTelegramText(value: string | null | undefined, fallback: string, max = 420) {
  const text = truncate(value ?? "", max);
  return isThaiReady(text) ? text : fallback;
}

function telegramStoryText(value: string | null | undefined, fallback: string, max = 260) {
  const text = truncate(value ?? "", max);
  if (isThaiReady(text)) return text;
  if (!text) return fallback;
  return truncate(`${fallback}: ${text}`, max);
}

function formatStatusThai(status: string) {
  if (status === "success") return "สำเร็จ";
  if (status === "failed") return "ล้มเหลว";
  if (status === "running") return "กำลังรัน";
  return status || "ไม่ระบุ";
}

function formatSourceList(stats: ReturnType<typeof getDataStats>, task: ScheduledTask) {
  const sources = stats.sourceNames.length ? stats.sourceNames : task.dataSources;
  if (!sources.length) return "ยังไม่มีแหล่งข้อมูลจาก API ให้แสดง";
  const visible = sources.slice(0, 5).map((source) => truncate(source, 80));
  const hiddenCount = sources.length - visible.length;
  return `${visible.join(", ")}${hiddenCount > 0 ? ` และอีก ${hiddenCount} แหล่ง` : ""}`;
}

function getAppBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://nimbusdaily.vercel.app";
}

function getTaskFullDataUrl(run: TaskRun) {
  return `${getAppBaseUrl()}/data-library?run=${encodeURIComponent(run.id)}`;
}

function clampSingleTopicMessage(text: string) {
  if (text.length <= TELEGRAM_SAFE_LIMIT) return text;
  const footer = "\n\nข้อความถูกย่อให้เหลือ 1 ข้อความต่อหัวข้อ เปิด NimbusDaily เพื่ออ่านรายละเอียดเต็ม";
  return `${text.slice(0, TELEGRAM_SAFE_LIMIT - footer.length - 1).trim()}…${footer}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function asString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[_\-]+/g, " ").trim();
}

function getTopicMetaFromText(...values: string[]): TelegramTopicMeta {
  const text = normalizeKey(values.filter(Boolean).join(" "));

  if (/daily brief|morning daily|brief|news|headline|ข่าว|สรุป/.test(text)) return TOPIC_META.dailyBrief;
  if (/public alert|government alert|government notice|public notice|bts|mrt|transit disruption|ประกาศ|แจ้งเตือนรัฐ|หน่วยงานรัฐ|ขัดข้อง/.test(text)) return TOPIC_META.publicAlerts;
  if (/travel deal|flight deal|airfare|airline|hotel|room rate|resort|travel promotion|ตั๋วเครื่องบิน|โปรบิน|โรงแรม|ห้องพัก|รีสอร์ต|โปรเดินทาง|โปรท่องเที่ยว/.test(text)) return TOPIC_META.travelDeals;
  if (/product radar|global product|product trend|new product|interesting product|gadget|สินค้าใหม่|สินค้าน่าสนใจ|สินค้าออกใหม่|ทั่วโลก/.test(text)) return TOPIC_META.productRadar;
  if (/sale|deal|discount|price|promo|shop|shopee|lazada|สินค้า|ลดราคา|โปร/.test(text)) return TOPIC_META.productRadar;
  if (/email|gmail|mail|inbox|อีเมล/.test(text)) return TOPIC_META.email;
  if (/football|soccer|world cup|match|score|premier|บอล|ฟุตบอล/.test(text)) return TOPIC_META.football;
  if (/concert|artist|music|ticket|live|คอนเสิร์ต|ศิลปิน|บัตร/.test(text)) return TOPIC_META.concert;
  if (/weather|forecast|rain|temperature|อากาศ|ฝน|พยากรณ์/.test(text)) return TOPIC_META.weather;
  if (/telegram test|test|ทดสอบ/.test(text)) return TOPIC_META.test;

  return DEFAULT_TOPIC_META;
}

function getTaskTopicMeta(task: ScheduledTask): TelegramTopicMeta {
  return getTopicMetaFromText(task.type, task.name);
}

function getSourceRecords(run: TaskRun) {
  const rawInput = asRecord(run.rawInput);
  return safeArray(rawInput?.sources).map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item));
}

function getSourceItems(sourceRecord: Record<string, unknown>) {
  const data = sourceRecord.data;
  const dataRecord = asRecord(data);

  if (Array.isArray(sourceRecord.items)) return sourceRecord.items;
  if (Array.isArray(data)) return data;
  if (Array.isArray(dataRecord?.ideas)) return dataRecord.ideas;
  if (Array.isArray(dataRecord?.articles)) return dataRecord.articles;
  if (Array.isArray(dataRecord?.items)) return dataRecord.items;
  if (data !== undefined && data !== null) return [data];
  return [];
}

function describeSourceItem(item: unknown, fallback: string) {
  const record = asRecord(item);
  if (!record) return telegramStoryText(String(item ?? ""), fallback, 260);

  const title = asString(record.title) || asString(record.titleTh) || asString(record.deal) || asString(record.headline) || asString(record.subject) || asString(record.name);
  const summary = asString(record.summaryTh) || asString(record.summary) || asString(record.description) || asString(record.recommendedAction) || asString(record.whyItMatters);
  const whatToCheck = Array.isArray(record.whatToCheck)
    ? record.whatToCheck.slice(0, 3).map(asString).filter(Boolean).join(", ")
    : "";
  const text = [title, summary, whatToCheck ? `ควรเช็ก: ${whatToCheck}` : ""].filter(Boolean).join(" - ");

  return telegramStoryText(text, fallback, 260);
}

function buildTaskFallbackStories(task: ScheduledTask, run: TaskRun) {
  const topicMeta = getTaskTopicMeta(task);
  const stats = getDataStats(run);
  const title = telegramStoryText(run.translation?.translatedTitle ?? run.gptOutput.title, `${topicMeta.label} - ${task.name}`, 180);
  const summary = telegramStoryText(
    run.translatedContent ?? run.gptOutput.summary,
    `${topicMeta.label} ของ "${task.name}" มีข้อมูลใหม่พร้อมอ่านต่อใน NimbusDaily`,
    260,
  );
  const action = telegramStoryText(
    run.gptOutput.recommended_action,
    `ควรตรวจรายละเอียดล่าสุดของ${topicMeta.shortLabel} และดูแหล่งข้อมูลเต็มก่อนตัดสินใจ`,
    220,
  );
  const sourceNames = stats.sourceNames.length ? stats.sourceNames : task.dataSources;
  const sourceLine = sourceNames.length
    ? `แหล่งข้อมูลที่ใช้: ${sourceNames.slice(0, 3).join(", ")}`
    : "แหล่งข้อมูล: บันทึกจากงานอัตโนมัติของ NimbusDaily";
  const countLine = stats.itemCount > 0
    ? `ระบบพบข้อมูล ${stats.itemCount} รายการจาก ${Math.max(stats.sourceCount, sourceNames.length, 1)} แหล่ง`
    : `หัวข้อนี้เชื่อมกับ ${task.dataSources.length || 1} แหล่งข้อมูล และรอบรันล่าสุดพร้อมตรวจในเว็บ`;

  return [title, summary, action, countLine, sourceLine];
}

function getDataStats(run: TaskRun) {
  const sources = getSourceRecords(run);
  const sourceNames = sources.map((source) => asString(source.source) || asString(source.title)).filter(Boolean);
  const itemCount = sources.reduce((total, source) => total + getSourceItems(source).length, 0);
  return {
    sourceCount: sources.length,
    itemCount,
    sourceNames,
  };
}

function getThaiBullets(run: TaskRun) {
  const fallbackBullets = [
    "เปิด NimbusDaily เพื่ออ่านรายละเอียดเต็มจากแหล่งข้อมูลต้นฉบับ",
    "ระบบแปลและสรุปเป็นภาษาไทยก่อนส่ง Telegram",
  ];

  const translation = run.translation;
  if (translation?.translatedBullets?.length) {
    const bullets = translation.translatedBullets
      .slice(0, MAX_TELEGRAM_BULLETS)
      .map((item, index) => telegramStoryText(item, fallbackBullets[index] ?? fallbackBullets[0], 180));
    return bullets.map((item) => `- ${item}`).join("\n");
  }

  const actionLines = run.gptOutput.recommended_action
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (actionLines.length) {
    return actionLines
      .slice(0, MAX_TELEGRAM_BULLETS)
      .map((item, index) => `- ${telegramStoryText(item, fallbackBullets[index] ?? fallbackBullets[0], 180)}`)
      .join("\n");
  }

  return `- ${telegramStoryText(run.gptOutput.summary, fallbackBullets[0], 220)}`;
}

function getTelegramStories(task: ScheduledTask, run: TaskRun) {
  const sources = getSourceRecords(run);
  const sourceStories = sources.flatMap((source) => {
    const sourceName = asString(source.source) || asString(source.title) || task.name;
    return getSourceItems(source).map((item) => describeSourceItem(item, `ข้อมูลจาก ${sourceName}`));
  });
  const translatedStories = run.translation?.translatedBullets?.map((item) => telegramStoryText(item, `ประเด็นจาก ${task.name}`, 220)) ?? [];
  const summaryStory = telegramStoryText(run.translatedContent ?? run.gptOutput.summary, `${task.name} พร้อมอ่านรายละเอียดเต็มใน NimbusDaily`, 240);
  const fallbackStories = buildTaskFallbackStories(task, run);

  const stories = [...sourceStories, ...translatedStories, summaryStory, ...fallbackStories]
    .map((item) => item.trim())
    .filter(Boolean);
  const uniqueStories = Array.from(new Set(stories)).slice(0, MAX_TELEGRAM_STORIES);

  if (!uniqueStories.length) {
    uniqueStories.push(`${getTaskTopicMeta(task).label}: ${task.name} มีข้อมูลพร้อมอ่านต่อใน NimbusDaily`);
  }

  return uniqueStories.map((item, index) => `เรื่องที่ ${index + 1}: ${truncate(item, 260)}`).join("\n");
}

function getTranslationMode(run: TaskRun) {
  const mode = run.translation?.mode;
  if (mode === "ai") return "แปลไทยด้วย AI";
  if (mode === "fallback") return "สรุปไทยด้วยระบบสำรอง";
  if (mode === "normalized") return "ปรับรูปแบบไทยแล้ว";
  return "แปลไทยก่อนส่ง";
}

function buildMainTelegramMessage(task: ScheduledTask, run: TaskRun) {
  const translation = run.translation;
  const topicMeta = getTaskTopicMeta(task);
  const translatedAt = translation?.translatedAt ?? run.translatedAt ?? new Date().toISOString();
  const title = thaiTelegramText(translation?.translatedTitle ?? run.gptOutput.title, `${topicMeta.label} จาก NimbusDaily`, 180);
  const stats = getDataStats(run);
  const sources = formatSourceList(stats, task);
  const fullDataUrl = getTaskFullDataUrl(run);

  return [
    `${topicMeta.emoji} ${TELEGRAM_BRAND_NAME} | ${topicMeta.label}`,
    `หัวข้อ: ${truncate(title, 180)}`,
    `ประเภทงาน: ${topicMeta.emoji} ${topicMeta.shortLabel}`,
    "",
    "📋 สรุปสั้น",
    getTelegramStories(task, run),
    "",
    "⭐ ประเด็นสำคัญ",
    getThaiBullets(run),
    "",
    "🔗 แหล่งข้อมูล",
    sources,
    "",
    "🌐 ข้อมูลเต็ม",
    fullDataUrl,
    "",
    `โหมดแปล: ${getTranslationMode(run)}`,
    `ความสำคัญ: ${run.priorityScore}/100`,
    `สถานะ: ${formatStatusThai(run.status)}`,
    `เวลาอัปเดต: ${translatedAt}`,
  ].filter(Boolean).join("\n");
}

export function buildTelegramMessages(task: ScheduledTask, run: TaskRun) {
  const compactMessage = buildMainTelegramMessage(task, run);
  return [clampSingleTopicMessage(compactMessage)];
}

export function buildTelegramMessage(task: ScheduledTask, run: TaskRun) {
  return buildTelegramMessages(task, run).join("\n\n---\n\n");
}

export async function sendTelegramMessage({ task, run }: { task: ScheduledTask; run: TaskRun }) {
  if (!task.outputChannels.includes("Send Telegram")) return { status: "not_enabled", message: "Task does not enable Telegram" };
  if (run.priorityScore < task.minPriorityScore) return { status: "skipped_priority", message: `Priority ${run.priorityScore} is below threshold ${task.minPriorityScore}` };

  const enabled = process.env.ENABLE_TELEGRAM === "true";
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const fallback = process.env.TELEGRAM_FALLBACK_TO_MOCK !== "false";

  if (!enabled) return { status: "mock_sent", message: "Telegram disabled, mock sent" };
  if (!token || !chatId) return { status: fallback ? "mock_sent_missing_config" : "failed_missing_config", message: "Missing Telegram token or chat id" };

  try {
    const baseUrl = process.env.TELEGRAM_BASE_URL || "https://api.telegram.org";
    const methodName = "send" + "Message";
    const messages = buildTelegramMessages(task, run);
    const responses: string[] = [];

    for (const text of messages) {
      const response = await fetch(`${baseUrl}/bot${token}/${methodName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      });

      const responseText = await response.text();
      if (!response.ok) throw new Error(`Telegram API failed: ${response.status} ${responseText}`);
      responses.push(responseText);
    }

    return { status: "sent", message: `Telegram sent as ${messages.length} topic message`, response: responses.join("\n") };
  } catch (error) {
    if (fallback) return { status: "mock_sent_fallback", message: error instanceof Error ? error.message : "Telegram fallback" };
    return { status: "failed", message: error instanceof Error ? error.message : "Telegram failed" };
  }
}

export async function sendTelegramTestMessage(message = `${TELEGRAM_BRAND_NAME} Telegram test`) {
  const now = new Date().toISOString();
  const fakeTask = {
    id: "test",
    userId: "user_001",
    name: "Telegram Test",
    type: "Custom",
    scheduleType: "One Time",
    cronExpression: null,
    time: null,
    timezone: "Asia/Bangkok",
    dataSources: [],
    gptActions: [],
    outputChannels: ["Send Telegram"],
    minPriorityScore: 0,
    status: "Active",
    isActive: true,
    lastRunAt: null,
    nextRunAt: null,
    createdAt: now,
    updatedAt: now,
  } as ScheduledTask;

  const fakeRun = {
    id: "test_run",
    taskId: "test",
    status: "success",
    startedAt: now,
    finishedAt: now,
    rawInput: {},
    gptPrompt: "",
    gptOutput: {
      title: "ทดสอบ Telegram",
      summary: message,
      priority_score: 100,
      recommended_action: "ตรวจสอบว่าได้รับข้อความสรุปแล้ว และข้อมูลเต็มจะอยู่บนเว็บ",
      caption: null,
      image_prompt: null,
    },
    priorityScore: 100,
    telegramStatus: "pending",
    errorMessage: null,
    language: "th",
    translatedAt: now,
    originalContent: message,
    translatedContent: message,
  } as TaskRun;

  return await sendTelegramMessage({ task: fakeTask, run: fakeRun });
}
