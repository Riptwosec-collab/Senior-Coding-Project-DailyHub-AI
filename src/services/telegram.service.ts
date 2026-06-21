import type { ScheduledTask } from "@/types/scheduled-task";
import type { TaskRun } from "@/types/task-run";

const TELEGRAM_BRAND_NAME = "Nimbus Daily";
const TELEGRAM_SAFE_LIMIT = 3600;
const MAX_SOURCE_ITEMS = 5;
const MAX_FIELD_LENGTH = 280;

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

function truncate(value: string, max = MAX_FIELD_LENGTH) {
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

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[_\-]+/g, " ").trim();
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getTopicMetaFromText(...values: string[]): TelegramTopicMeta {
  const text = normalizeKey(values.filter(Boolean).join(" "));

  if (/email|gmail|mail|inbox|อีเมล/.test(text)) {
    return { emoji: "📧", label: "Email Monitor", shortLabel: "Email" };
  }
  if (/sale|deal|discount|price|promo|shop|shopee|lazada|สินค้า|ลดราคา|โปร/.test(text)) {
    return { emoji: "💸", label: "Sale Monitor", shortLabel: "Sale" };
  }
  if (/football|soccer|world cup|match|score|premier|บอล|ฟุตบอล/.test(text)) {
    return { emoji: "⚽", label: "Football Recap", shortLabel: "Football" };
  }
  if (/concert|artist|music|ticket|live|คอนเสิร์ต|ศิลปิน|บัตร/.test(text)) {
    return { emoji: "🎤", label: "Concert Alerts", shortLabel: "Concert" };
  }
  if (/weather|forecast|rain|temperature|อากาศ|ฝน|พยากรณ์/.test(text)) {
    return { emoji: "🌦️", label: "Weather Update", shortLabel: "Weather" };
  }
  if (/weekend idea|weekend ideas|idea|trip|travel|เที่ยว|ไอเดีย/.test(text)) {
    return { emoji: "🧭", label: "Weekend Ideas", shortLabel: "Ideas" };
  }
  if (/weekend long read|long read|article|read|บทความ|อ่านยาว/.test(text)) {
    return { emoji: "📚", label: "Weekend Long Read", shortLabel: "Long Read" };
  }
  if (/daily brief|brief|news|headline|ข่าว|สรุป/.test(text)) {
    return { emoji: "📰", label: "Daily Brief / News", shortLabel: "News" };
  }
  if (/telegram test|test|ทดสอบ/.test(text)) {
    return { emoji: "🧪", label: "Telegram Test", shortLabel: "Test" };
  }

  return DEFAULT_TOPIC_META;
}

function getTaskTopicMeta(task: ScheduledTask): TelegramTopicMeta {
  return getTopicMetaFromText(
    task.type,
    task.name,
    safeArray(task.dataSources).map(String).join(" "),
    safeArray(task.gptActions).map(String).join(" "),
  );
}

function getSourceTopicMeta(sourceName: string): TelegramTopicMeta {
  return getTopicMetaFromText(sourceName);
}

function formatMoney(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "ไม่ระบุ";
  return `${number.toLocaleString("th-TH")} บาท`;
}

function formatPriority(priority: unknown) {
  const text = asString(priority).toLowerCase();
  if (text === "high") return "สูง";
  if (text === "medium") return "ปานกลาง";
  if (text === "low") return "ต่ำ";
  return asString(priority) || "ไม่ระบุ";
}

function getThaiBullets(run: TaskRun) {
  const translation = run.translation;
  if (translation?.translatedBullets?.length) {
    return translation.translatedBullets.map((item) => `- ${item}`).join("\n");
  }
  if (run.gptOutput.recommended_action) {
    return run.gptOutput.recommended_action.split("\n").filter(Boolean).map((item) => `- ${item}`).join("\n");
  }
  return `- ${run.gptOutput.summary}`;
}

function formatSourceItem(item: unknown, index: number) {
  const record = asRecord(item);
  if (!record) return `${index + 1}. ${truncate(String(item ?? "ไม่มีรายละเอียด"))}`;

  const nestedSource = asRecord(record.source);
  const sourceName = asString(nestedSource?.name) || asString(record.source) || asString(record.name);
  const subject = asString(record.subject);
  const from = asString(record.from);
  const title = asString(record.title);
  const description = asString(record.description);
  const content = asString(record.content);
  const url = asString(record.url);
  const priorityHint = record.priorityHint;

  const product = asString(record.product);
  const store = asString(record.store);
  const currentPrice = record.currentPrice;
  const oldPrice = record.oldPrice;
  const discountPercent = record.discountPercent;
  const reason = asString(record.reason);
  const action = asString(record.action);

  if (product) {
    return [
      `${index + 1}. 💸 สินค้า: ${truncate(product, 160)}`,
      store ? `ร้าน/แหล่ง: ${truncate(store, 100)}` : "",
      oldPrice !== undefined || currentPrice !== undefined ? `ราคา: ${formatMoney(oldPrice)} → ${formatMoney(currentPrice)}` : "",
      discountPercent !== undefined ? `ส่วนลด: ${discountPercent}%` : "",
      reason ? `เหตุผล: ${truncate(reason, 180)}` : "",
      action ? `ควรทำ: ${truncate(action, 180)}` : "",
      url ? `ลิงก์: ${url}` : "",
    ].filter(Boolean).join("\n   ");
  }

  const match = asString(record.match);
  const score = asString(record.score);
  const competition = asString(record.competition);
  const highlight = asString(record.highlight);
  const keyMoment = asString(record.keyMoment);
  const thaiNote = asString(record.thaiNote);

  if (match || score || highlight) {
    return [
      `${index + 1}. ⚽ ฟุตบอล: ${match || "แมตช์"}${score ? ` (${score})` : ""}`,
      competition ? `รายการ: ${truncate(competition, 100)}` : "",
      highlight ? `ไฮไลต์: ${truncate(highlight, 180)}` : "",
      keyMoment ? `จังหวะสำคัญ: ${truncate(keyMoment, 220)}` : "",
      thaiNote ? `หมายเหตุ: ${truncate(thaiNote, 200)}` : "",
    ].filter(Boolean).join("\n   ");
  }

  const artist = asString(record.artist);
  const city = asString(record.city);
  const date = asString(record.date);
  const venue = asString(record.venue);
  const genre = asString(record.genre);
  const ticketStatus = asString(record.ticketStatus);

  if (artist || venue) {
    return [
      `${index + 1}. 🎤 คอนเสิร์ต: ${artist || "ศิลปิน/งานดนตรี"}`,
      city ? `เมือง: ${truncate(city, 80)}` : "",
      venue ? `สถานที่: ${truncate(venue, 120)}` : "",
      date ? `วันที่: ${date}` : "",
      genre ? `แนวเพลง: ${truncate(genre, 80)}` : "",
      ticketStatus ? `สถานะบัตร: ${truncate(ticketStatus, 120)}` : "",
      action ? `ควรทำ: ${truncate(action, 180)}` : "",
      url ? `ลิงก์: ${url}` : "",
    ].filter(Boolean).join("\n   ");
  }

  const idea = asString(record.idea);
  const location = asString(record.location);
  const budget = asString(record.budget);
  const mood = asString(record.mood);
  const bestTime = asString(record.bestTime);
  const why = asString(record.why);

  if (idea || budget || bestTime || why) {
    return [
      `${index + 1}. 🧭 ไอเดีย: ${truncate(idea || "Weekend idea", 160)}`,
      location ? `สถานที่: ${truncate(location, 120)}` : "",
      budget ? `งบประมาณ: ${truncate(budget, 80)}` : "",
      mood ? `อารมณ์/สไตล์: ${truncate(mood, 80)}` : "",
      bestTime ? `เวลาที่เหมาะ: ${truncate(bestTime, 80)}` : "",
      why ? `เหตุผล: ${truncate(why, 220)}` : "",
    ].filter(Boolean).join("\n   ");
  }

  if (subject || from) {
    return [
      `${index + 1}. 📧 ${subject ? `อีเมล: ${truncate(subject, 160)}` : "อีเมล"}`,
      from ? `จาก: ${truncate(from, 120)}` : "",
      priorityHint ? `ความสำคัญ: ${formatPriority(priorityHint)}` : "",
    ].filter(Boolean).join(" | ");
  }

  const forecast = asRecord(record.forecast);
  const current = asRecord(forecast?.current);
  const location = asString(record.location);
  if (location || current) {
    return [
      `${index + 1}. 🌦️ สภาพอากาศ${location ? `: ${location}` : ""}`,
      current?.temperature_2m !== undefined ? `อุณหภูมิ: ${current.temperature_2m}°C` : "",
      current?.rain !== undefined ? `ฝน: ${current.rain} mm` : "",
      current?.precipitation !== undefined ? `ปริมาณฝน: ${current.precipitation} mm` : "",
      current?.time ? `เวลา: ${current.time}` : "",
    ].filter(Boolean).join(" | ");
  }

  if (title || description || content) {
    const meta = getSourceTopicMeta(sourceName || title || description || content);
    return [
      `${index + 1}. ${meta.emoji} ${title ? truncate(title, 180) : "ข่าว/ข้อมูล"}`,
      sourceName ? `แหล่ง: ${truncate(sourceName, 90)}` : "",
      description ? `รายละเอียด: ${truncate(description, 220)}` : content ? `เนื้อหา: ${truncate(content, 220)}` : "",
      url ? `ลิงก์: ${url}` : "",
    ].filter(Boolean).join("\n   ");
  }

  return `${index + 1}. ${truncate(JSON.stringify(record), 260)}`;
}

function buildSourceDetails(run: TaskRun) {
  const rawInput = asRecord(run.rawInput);
  const sources = safeArray(rawInput?.sources);
  if (!sources.length) return "";

  const sections = sources.map((sourceEntry) => {
    const sourceRecord = asRecord(sourceEntry);
    if (!sourceRecord) return "";

    const sourceName = asString(sourceRecord.source) || asString(sourceRecord.title) || "แหล่งข้อมูล";
    const sourceMeta = getSourceTopicMeta(sourceName);
    const status = asString(sourceRecord.status);
    const data = sourceRecord.data;
    const dataRecord = asRecord(data);
    const items = Array.isArray(sourceRecord.items)
      ? sourceRecord.items
      : Array.isArray(data)
        ? data
        : Array.isArray(dataRecord?.ideas)
          ? dataRecord.ideas
          : data !== undefined
            ? [data]
            : [];

    const formattedItems = items.slice(0, MAX_SOURCE_ITEMS).map(formatSourceItem);
    const moreCount = Math.max(0, items.length - MAX_SOURCE_ITEMS);

    return [
      `${sourceMeta.emoji} ${sourceMeta.shortLabel} | ${sourceName}${status ? ` (${status})` : ""}`,
      formattedItems.length ? formattedItems.join("\n") : "- ไม่มีรายการข้อมูลจากแหล่งนี้",
      moreCount > 0 ? `…มีอีก ${moreCount} รายการ ดูทั้งหมดใน Dashboard` : "",
    ].filter(Boolean).join("\n");
  }).filter(Boolean);

  if (!sections.length) return "";
  return sections.join("\n\n");
}

function getTranslationMode(run: TaskRun) {
  const mode = run.translation?.mode;
  if (mode === "ai") return "AI/Groq";
  if (mode === "fallback") return "Fallback";
  if (mode === "normalized") return "ปรับรูปแบบไทย";
  return "ไม่ระบุ";
}

function buildMainTelegramMessage(task: ScheduledTask, run: TaskRun) {
  const translation = run.translation;
  const source = translation?.originalSource ?? (safeArray(task.dataSources).map(String).join(", ") || task.type);
  const translatedAt = translation?.translatedAt ?? run.translatedAt ?? new Date().toISOString();
  const topicMeta = getTaskTopicMeta(task);

  return `${topicMeta.emoji} ${TELEGRAM_BRAND_NAME} | ${topicMeta.label}\nหัวข้อ: ${translation?.translatedTitle ?? run.gptOutput.title}\nประเภทงาน: ${topicMeta.emoji} ${topicMeta.shortLabel}\n\nสรุปภาษาไทย:\n${getThaiBullets(run)}\n\nรายละเอียดสำคัญ:\n${translation?.translatedSummary ?? run.gptOutput.summary}\n\nแนะนำให้ทำต่อ:\n${run.gptOutput.recommended_action || "ตรวจสอบรายละเอียดใน Dashboard"}\n\nแหล่งที่มา:\n${source}\n\nภาษาเดิม: ${translation?.originalLanguage ?? run.language ?? "unknown"}\nโหมดแปล: ${getTranslationMode(run)}\nTask: ${task.name} (${task.type})\nPriority: ${run.priorityScore}/100\nStatus: ${run.status}\nเวลาอัปเดต: ${translatedAt}`;
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
  const main = buildMainTelegramMessage(task, run);
  const sourceDetails = buildSourceDetails(run);

  const combined = sourceDetails
    ? `${main}\n\nข้อมูลที่พบจากแหล่งต่าง ๆ:\n${sourceDetails}`
    : main;

  return splitLongText(combined).map((chunk, index, chunks) => {
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

    return { status: "sent", message: `Telegram message sent (${messages.length} part${messages.length > 1 ? "s" : ""})`, response: responses.join("\n") };
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
      recommended_action: "ตรวจสอบว่าได้รับข้อความภาษาไทยแล้ว",
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
