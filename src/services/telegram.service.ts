import type { ScheduledTask } from "@/types/scheduled-task";
import type { TaskRun } from "@/types/task-run";

const TELEGRAM_BRAND_NAME = "Nimbus Daily";
const TELEGRAM_SAFE_LIMIT = 3600;
const MAX_TELEGRAM_BULLETS = 4;

type TelegramTopicMeta = {
  emoji: string;
  label: string;
  shortLabel: string;
};

const DEFAULT_TOPIC_META: TelegramTopicMeta = {
  emoji: "🧠",
  label: "General",
  shortLabel: "General",
};

const TOPIC_META = {
  email: { emoji: "📧", label: "Email Monitor", shortLabel: "Email" },
  productRadar: { emoji: "🌍", label: "สินค้าใหม่/น่าสนใจทั่วโลก", shortLabel: "Product Radar" },
  football: { emoji: "⚽", label: "Football Recap", shortLabel: "Football" },
  concert: { emoji: "🎤", label: "Concert Alerts", shortLabel: "Concert" },
  weather: { emoji: "🌦️", label: "Weather Update", shortLabel: "Weather" },
  publicAlerts: { emoji: "📢", label: "ประกาศสำคัญ / แจ้งเตือนรัฐ", shortLabel: "Public Alerts" },
  travelDeals: { emoji: "✈️", label: "โปรเดินทาง / ตั๋วเครื่องบิน / โรงแรม", shortLabel: "Travel Deals" },
  dailyBrief: { emoji: "📰", label: "Daily Brief / News", shortLabel: "News" },
  test: { emoji: "🧪", label: "Telegram Test", shortLabel: "Test" },
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
  const translation = run.translation;
  if (translation?.translatedBullets?.length) {
    return translation.translatedBullets.slice(0, MAX_TELEGRAM_BULLETS).map((item) => `- ${truncate(item, 180)}`).join("\n");
  }

  const actionLines = run.gptOutput.recommended_action
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (actionLines.length) return actionLines.slice(0, MAX_TELEGRAM_BULLETS).map((item) => `- ${truncate(item, 180)}`).join("\n");
  return `- ${truncate(run.gptOutput.summary, 220)}`;
}

function getTranslationMode(run: TaskRun) {
  const mode = run.translation?.mode;
  if (mode === "ai") return "AI/Groq";
  if (mode === "fallback") return "Fallback";
  if (mode === "normalized") return "ปรับรูปแบบไทย";
  return "ไม่ระบุ";
}

function getAppBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "";
}

function getFullDataUrl(run: TaskRun) {
  const baseUrl = getAppBaseUrl();
  if (!baseUrl) return "";
  return `${baseUrl}/data-library?run=${encodeURIComponent(run.id)}`;
}

function buildMainTelegramMessage(task: ScheduledTask, run: TaskRun) {
  const translation = run.translation;
  const topicMeta = getTaskTopicMeta(task);
  const translatedAt = translation?.translatedAt ?? run.translatedAt ?? new Date().toISOString();
  const title = translation?.translatedTitle ?? run.gptOutput.title;
  const summary = translation?.translatedSummary ?? run.translatedContent ?? run.gptOutput.summary;
  const stats = getDataStats(run);
  const fullDataUrl = getFullDataUrl(run);

  return [
    `${topicMeta.emoji} ${TELEGRAM_BRAND_NAME} | ${topicMeta.label}`,
    `หัวข้อ: ${truncate(title, 180)}`,
    `ประเภทงาน: ${topicMeta.emoji} ${topicMeta.shortLabel}`,
    "",
    "สรุปสั้น:",
    truncate(summary, 520),
    "",
    "ประเด็นสำคัญ:",
    getThaiBullets(run),
    "",
    "ข้อมูลเต็ม:",
    `- แหล่งข้อมูล: ${stats.sourceNames.length ? stats.sourceNames.join(", ") : task.dataSources.join(", ") || task.type}`,
    `- จำนวนแหล่งข้อมูล: ${stats.sourceCount}`,
    `- จำนวนรายการที่เก็บไว้บนเว็บ: ${stats.itemCount}`,
    fullDataUrl ? `- อ่านข้อมูลเต็มแยกหมวด: ${fullDataUrl}` : "- อ่านข้อมูลเต็มได้ที่หน้า Data Library บนเว็บ",
    "",
    `โหมดแปล: ${getTranslationMode(run)}`,
    `Priority: ${run.priorityScore}/100`,
    `Status: ${run.status}`,
    `เวลาอัปเดต: ${translatedAt}`,
  ].filter(Boolean).join("\n");
}

function splitLongText(text: string, limit = TELEGRAM_SAFE_LIMIT) {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > limit) {
    const slice = remaining.slice(0, limit);
    const breakIndex = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf("\n"));
    const safeIndex = breakIndex > limit * 0.5 ? breakIndex : limit;
    chunks.push(remaining.slice(0, safeIndex).trim());
    remaining = remaining.slice(safeIndex).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export function buildTelegramMessages(task: ScheduledTask, run: TaskRun) {
  const compactMessage = buildMainTelegramMessage(task, run);
  return splitLongText(compactMessage).map((chunk, index, chunks) => {
    if (chunks.length === 1) return chunk;
    return `${chunk}\n\n(${index + 1}/${chunks.length})`;
  });
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

    return { status: "sent", message: `Telegram summary sent (${messages.length} part${messages.length > 1 ? "s" : ""})`, response: responses.join("\n") };
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
