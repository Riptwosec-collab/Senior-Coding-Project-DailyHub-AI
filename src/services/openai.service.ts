import type { ScheduledTask } from "@/types/scheduled-task";
import type { GptOutput } from "@/types/task-run";

type AiProvider = "groq" | "openai" | "mock";

type AiConfig = {
  provider: AiProvider;
  enabled: boolean;
  hasApiKey: boolean;
  apiKey?: string;
  baseUrl?: string;
  model: string;
};

function resolveAiConfig(): AiConfig {
  const preferredProvider = process.env.AI_PROVIDER?.toLowerCase();
  const groqKey = process.env.GROQ_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  const useGroq = preferredProvider === "groq" || (!preferredProvider && Boolean(groqKey));

  if (useGroq) {
    return {
      provider: groqKey ? "groq" : "mock",
      enabled: process.env.ENABLE_GROQ === "true" || process.env.ENABLE_AI === "true",
      hasApiKey: Boolean(groqKey),
      apiKey: groqKey,
      baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    };
  }

  return {
    provider: openAiKey ? "openai" : "mock",
    enabled: process.env.ENABLE_OPENAI === "true" || process.env.ENABLE_AI === "true",
    hasApiKey: Boolean(openAiKey),
    apiKey: openAiKey,
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL || "gpt-5.5",
  };
}

function getPromptTaskIdentity(task: ScheduledTask) {
  if (task.type === "Sale Monitor") {
    return {
      name: "สินค้าออกใหม่/น่าสนใจจากทั่วโลก",
      type: "Global Product Radar",
      instruction:
        "This task is NOT a Shopee discount monitor. Focus on newly launched, trending, unusual, or globally interesting products. Do not frame the result as coupons, discounts, or Shopee deals.",
    };
  }

  if (task.type === "World Cup Recap") {
    return {
      name: task.name,
      type: task.type,
      instruction: "Summarize football using real team names from raw input. Never write Team A, Team B, Team C, or placeholder team names.",
    };
  }

  if (task.type === "Public Alerts") {
    return {
      name: task.name,
      type: task.type,
      instruction: "Summarize only public notices, government alerts, public-service changes, and BTS/MRT disruption updates. Emphasize source checking and practical next actions.",
    };
  }

  if (task.type === "Travel Deals") {
    return {
      name: task.name,
      type: task.type,
      instruction: "Summarize flight deals, hotel room-rate deals, resort offers, new routes from Thailand, and Thailand travel promotions. Do not mix this with generic shopping deals. Always mention booking terms to check.",
    };
  }

  return {
    name: task.name,
    type: task.type,
    instruction: "Use the task type and raw input as the main context.",
  };
}

export function getOpenAiModeStatus() {
  const config = resolveAiConfig();

  return {
    mode: config.enabled && config.hasApiKey ? "real" : "mock",
    provider: config.provider,
    enabled: config.enabled,
    hasApiKey: config.hasApiKey,
    model: config.model,
  };
}

export function buildGptPrompt(task: ScheduledTask, rawInput: Record<string, unknown>) {
  const identity = getPromptTaskIdentity(task);

  return `You are Nimbus Daily.
Task Name: ${identity.name}
Task Type: ${identity.type}
Task Instruction: ${identity.instruction}
Data Sources: ${task.dataSources.join(", ")}
GPT Actions: ${task.gptActions.join(", ")}
Minimum Priority Score for alerts: ${task.minPriorityScore}

Analyze the raw input and return JSON only.
Required JSON format:
{
  "title": string,
  "summary": string,
  "priority_score": number,
  "recommended_action": string,
  "caption": string | null,
  "image_prompt": string | null
}

Rules:
- priority_score must be 0-100.
- Do not invent facts not present in raw input.
- Keep summary concise and useful for a dashboard.
- If content creation is requested, include caption and image_prompt.
- For Global Product Radar, write in Thai, organize the result around why each product is interesting, who it is for, what to check before buying, and one content angle.
- For Football / World Cup Recap, include actual team names and scores/status from raw input. Never use placeholder names like Team A or Team B.
- For Public Alerts, write in Thai, focus on official notices, BTS/MRT disruptions, public-service impact, and what to check before traveling.
- For Travel Deals, write in Thai, focus on flights departing Thailand, domestic flights, hotels, room rates, travel packages, and terms/taxes/fees to verify before booking.
- Return valid JSON only. Do not wrap the JSON in markdown.

Raw Input:
${JSON.stringify(rawInput, null, 2)}`;
}

export function buildFailedGptOutput(task: ScheduledTask, errorMessage: string): GptOutput {
  return {
    title: `${task.name} failed`,
    summary: `ไม่สามารถสร้าง AI output ได้: ${errorMessage}`,
    priority_score: 0,
    recommended_action: "ตรวจสอบ AI provider, API key, model, network หรือ raw input แล้วลอง Run Now ใหม่",
    caption: null,
    image_prompt: null,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function rawSourceItems(rawInput?: Record<string, unknown>, sourceName?: string) {
  const sources = Array.isArray(rawInput?.sources) ? rawInput.sources : [];
  const source = sources.map(asRecord).find((item) => text(item?.source).toLowerCase().includes((sourceName ?? "").toLowerCase()));
  if (!source) return [];
  if (Array.isArray(source.items)) return source.items;
  if (Array.isArray(source.data)) return source.data;
  return [];
}

function footballLabels(rawInput?: Record<string, unknown>) {
  const items = rawSourceItems(rawInput, "Football");
  const labels = items.map((item) => {
    const row = asRecord(item);
    if (!row) return text(item);
    const teams = text(row.teamNames) || text(row.match) || (text(row.homeTeam) && text(row.awayTeam) ? `${row.homeTeam} vs ${row.awayTeam}` : "");
    const score = text(row.score);
    const status = text(row.status);
    return [teams, score, status].filter(Boolean).join(" — ");
  }).filter(Boolean);

  return labels.length > 0 ? labels : ["Germany vs Ecuador — Scheduled", "Netherlands vs Tunisia — Scheduled", "Brazil vs Scotland — Brazil 3-0 Scotland"];
}

export function generateMockGptOutput(task: ScheduledTask, rawInput?: Record<string, unknown>): GptOutput {
  const sourceCount = Array.isArray(rawInput?.sources) ? rawInput.sources.length : task.dataSources.length;
  const priority = task.type === "Email Monitor" ? 88 : task.type === "Sale Monitor" ? 90 : task.type === "World Cup Recap" ? 72 : task.type === "Public Alerts" ? 86 : task.type === "Travel Deals" ? 78 : 78;

  if (task.type === "Sale Monitor") {
    return {
      title: "สินค้าออกใหม่/น่าสนใจจากทั่วโลก",
      summary: `คัดสินค้าและแกดเจ็ตที่กำลังน่าสนใจจาก ${sourceCount} แหล่งข้อมูลทั่วโลก พร้อมเหตุผล กลุ่มผู้ใช้ จุดเด่น ข้อควรเช็ก และไอเดียทำคอนเทนต์`,
      priority_score: priority,
      recommended_action: "เลือก 1-2 ชิ้นที่เข้ากับกลุ่มเป้าหมาย แล้วทำโพสต์รีวิว/คัดของน่าสนใจ โดยไม่เน้น Shopee หรือโปรลดราคา",
      caption: "สินค้าใหม่/ของน่าสนใจจากทั่วโลกที่ควรจับตา 🌍✨",
      image_prompt: "9:16 global product radar card, curated gadgets from around the world, clean Thai sections, modern dark glass UI, neon blue purple glow",
    };
  }

  if (task.type === "World Cup Recap") {
    const labels = footballLabels(rawInput);
    return {
      title: `Football Recap: ${labels.slice(0, 2).map((label) => label.split("—")[0].trim()).join(" / ")}`,
      summary: `สรุปฟุตบอลล่าสุดตามชื่อทีมจริง: ${labels.join(" | ")}`,
      priority_score: priority,
      recommended_action: "เปิด Data Library เพื่อดูรายละเอียดแต่ละคู่ เช่น ทีม, สกอร์/สถานะ, กลุ่ม, เวลาแข่ง และประเด็นสำคัญ",
      caption: `⚽ Football Recap: ${labels.slice(0, 3).join(" | ")}`,
      image_prompt: "9:16 football recap dashboard with real team names, scoreboard cards, stadium lights, modern sports UI, dark glassmorphism",
    };
  }

  if (task.type === "Public Alerts") {
    return {
      title: "ประกาศสำคัญ / แจ้งเตือนรัฐ / BTS-MRT",
      summary: `สรุปประกาศสำคัญและสถานะบริการสาธารณะจาก ${sourceCount} แหล่งข้อมูล โดยเน้นประกาศหน่วยงานรัฐและ BTS/MRT ที่อาจกระทบการเดินทาง`,
      priority_score: priority,
      recommended_action: "ตรวจประกาศทางการก่อนออกเดินทาง และเตรียมเส้นทางสำรองหากมี BTS/MRT ขัดข้องหรือปิดพื้นที่",
      caption: "📢 ประกาศสำคัญและสถานะ BTS/MRT ที่ควรรู้ก่อนออกเดินทาง",
      image_prompt: null,
    };
  }

  if (task.type === "Travel Deals") {
    return {
      title: "โปรเดินทาง / ตั๋วเครื่องบิน / โรงแรม",
      summary: `คัดโปรเดินทางจาก ${sourceCount} แหล่งข้อมูล ครอบคลุมตั๋วเครื่องบินในไทย ต่างประเทศที่เริ่มบินจากไทย ราคาห้องพัก โรงแรม รีสอร์ต และแพ็กเกจเที่ยวไทย`,
      priority_score: priority,
      recommended_action: "ตรวจวันเดินทาง ภาษี ค่าธรรมเนียม น้ำหนักกระเป๋า เงื่อนไขยกเลิก และวันหมดโปรจากผู้ให้บริการก่อนจอง",
      caption: "✈️ โปรบินจากไทย โรงแรม และแพ็กเกจเที่ยวไทยที่ควรเช็กก่อนหมดโปร",
      image_prompt: null,
    };
  }

  return {
    title: `${task.name} Summary`,
    summary: `Mock AI วิเคราะห์ ${sourceCount} data source สำหรับ ${task.type} แล้ว สรุปข้อมูลสำคัญและคำแนะนำพร้อมแสดงใน Dashboard`,
    priority_score: priority,
    recommended_action: priority >= task.minPriorityScore ? "ควรส่งแจ้งเตือนและเปิดดูรายละเอียดใน Task Results" : "บันทึกไว้ใน Dashboard แต่ยังไม่จำเป็นต้องแจ้งเตือนทันที",
    caption: task.gptActions.includes("Generate Caption") ? `อัปเดตจาก ${task.name}: สรุปสั้นพร้อมใช้โพสต์` : null,
    image_prompt: task.gptActions.includes("Generate Image Prompt") ? "9:16 modern SaaS dashboard content card, dark glassmorphism, neon blue purple glow" : null,
  };
}

function extractJsonObject(text: string): string {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) return cleaned.slice(firstBrace, lastBrace + 1);
  return cleaned;
}

function parseChatCompletionOutput(json: unknown): string {
  const response = json as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  const text = response.choices?.[0]?.message?.content;
  if (typeof text === "string" && text.trim()) return text;

  throw new Error("AI response did not contain chat completion text");
}

function normalizeGptOutput(value: unknown, task: ScheduledTask): GptOutput {
  const object = value as Partial<GptOutput>;
  const score = Math.min(Math.max(Number(object.priority_score ?? 0), 0), 100);

  return {
    title: typeof object.title === "string" && object.title ? object.title : `${task.name} Summary`,
    summary: typeof object.summary === "string" ? object.summary : "No summary returned",
    priority_score: Number.isFinite(score) ? score : 0,
    recommended_action: typeof object.recommended_action === "string" ? object.recommended_action : "Review the result in Dashboard",
    caption: typeof object.caption === "string" ? object.caption : null,
    image_prompt: typeof object.image_prompt === "string" ? object.image_prompt : null,
  };
}

export async function generateGptOutput(task: ScheduledTask, rawInput: Record<string, unknown>): Promise<GptOutput> {
  const config = resolveAiConfig();
  const fallback = process.env.AI_FALLBACK_TO_MOCK !== "false" && process.env.OPENAI_FALLBACK_TO_MOCK !== "false";

  if (!config.enabled || !config.apiKey || !config.baseUrl) return generateMockGptOutput(task, rawInput);

  const prompt = buildGptPrompt(task, rawInput);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "system",
            content: "You return valid JSON only. Do not use markdown fences.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${config.provider} API failed ${response.status}: ${text.slice(0, 300)}`);
    }

    const json = await response.json();
    const outputText = parseChatCompletionOutput(json);
    return normalizeGptOutput(JSON.parse(extractJsonObject(outputText)), task);
  } catch (error) {
    if (fallback) return generateMockGptOutput(task, rawInput);
    throw error;
  }
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}
