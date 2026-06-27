import { buildTelegramBriefText, splitTelegramText } from "@/services/news-summary.service";
import type { DailyBriefItem, DailyBriefSummary } from "@/types/daily-brief";

export interface DailyBriefTelegramResult {
  status: "sent" | "mock_sent" | "failed";
  message: string;
  parts: number;
}

export async function sendDailyBriefToTelegram(summary: DailyBriefSummary, items: DailyBriefItem[]): Promise<DailyBriefTelegramResult> {
  const text = buildTelegramBriefText(summary, items);
  const messages = splitTelegramText(text);
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

    return { status: "sent", message: `Daily Brief sent to Telegram in ${messages.length} part(s)`, parts: messages.length };
  } catch (error) {
    if (fallback) {
      return { status: "mock_sent", message: error instanceof Error ? error.message : "Telegram fallback mode", parts: messages.length };
    }
    return { status: "failed", message: error instanceof Error ? error.message : "Telegram failed", parts: messages.length };
  }
}

export async function sendSingleDailyBriefNewsToTelegram(item: DailyBriefItem): Promise<DailyBriefTelegramResult> {
  const summary = {
    date: new Intl.DateTimeFormat("th-TH", { dateStyle: "full", timeZone: "Asia/Bangkok" }).format(new Date()),
    topStories: [item],
    categorySummaries: { [item.category]: item.summaryTh },
    watchItems: ["เปิดอ่านข่าวต้นฉบับจากลิงก์", "บันทึกข่าวนี้ถ้าต้องติดตามต่อ"],
    totalItems: 1,
    summarizedItems: 1,
    telegramStatus: "idle" as const,
    generatedAt: new Date().toISOString(),
    mode: "fallback" as const,
  };

  return sendDailyBriefToTelegram(summary, [item]);
}
