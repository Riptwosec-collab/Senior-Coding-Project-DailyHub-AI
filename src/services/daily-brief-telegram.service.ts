import { getDailyBriefTopicDetail } from "@/lib/daily-brief-taxonomy";
import { buildTelegramBriefTopicMessages } from "@/services/news-summary.service";
import type { DailyBriefItem, DailyBriefSummary } from "@/types/daily-brief";

export interface DailyBriefTelegramResult {
  status: "sent" | "mock_sent" | "failed";
  message: string;
  parts: number;
}

function truncate(value: string, max = 900) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function formatBangkokTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

async function sendTelegramMessages(messages: string[], successMessage: string): Promise<DailyBriefTelegramResult> {
  const enabled = process.env.ENABLE_TELEGRAM === "true";
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const fallback = process.env.TELEGRAM_FALLBACK_TO_MOCK !== "false";

  if (!enabled || !token || !chatId) {
    return { status: "mock_sent", message: "Telegram is not fully configured, mock sent", parts: messages.length };
  }

  try {
    const baseUrl = process.env.TELEGRAM_BASE_URL || "https://api.telegram.org";
    for (const message of messages) {
      const response = await fetch(`${baseUrl}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: true }),
      });
      const responseText = await response.text();
      if (!response.ok) throw new Error(`Telegram API failed: ${response.status} ${responseText}`);
    }

    return { status: "sent", message: successMessage, parts: messages.length };
  } catch (error) {
    if (fallback) {
      return { status: "mock_sent", message: error instanceof Error ? error.message : "Telegram fallback mode", parts: messages.length };
    }
    return { status: "failed", message: error instanceof Error ? error.message : "Telegram failed", parts: messages.length };
  }
}

export async function sendDailyBriefToTelegram(summary: DailyBriefSummary, items: DailyBriefItem[]): Promise<DailyBriefTelegramResult> {
  const messages = buildTelegramBriefTopicMessages(summary, items);
  return sendTelegramMessages(messages, `Daily Brief sent to Telegram as ${messages.length} topic message(s)`);
}

function buildSingleNewsTelegramMessage(item: DailyBriefItem) {
  const detail = getDailyBriefTopicDetail(item.category);
  const title = item.titleTh || item.title;
  const summary = item.summaryTh || item.rawDescription || item.titleTh || item.title;
  const why = item.whyItMatters || item.impact || "เป็นข่าวที่ควรรู้เพื่อจัดลำดับความสำคัญของวันนี้";
  const link = item.sourceUrl || item.relatedSources[0]?.url || "https://nimbusdaily.vercel.app/daily";

  return [
    `📰 NimbusDaily | ${detail.labelTh}`,
    "",
    `หัวข้อ: ${truncate(title, 180)}`,
    `หมวด: ${detail.labelTh}`,
    `สรุปสั้น: ${truncate(summary, 520)}`,
    `ทำไมสำคัญ: ${truncate(why, 320)}`,
    `แหล่งข่าว: ${item.sourceName || "NimbusDaily"}`,
    `เวลา: ${formatBangkokTime(item.publishedAt)}`,
    `อ่านต่อ: ${link}`,
    "",
    `ภาษา: ไทย | Priority: ${item.priorityScore}/100 | Status: success`,
    "ส่งจาก NimbusDaily",
  ].join("\n");
}

export async function sendSingleDailyBriefNewsToTelegram(item: DailyBriefItem): Promise<DailyBriefTelegramResult> {
  return sendTelegramMessages([buildSingleNewsTelegramMessage(item)], "Daily Brief news item sent to Telegram as 1 Thai message");
}
