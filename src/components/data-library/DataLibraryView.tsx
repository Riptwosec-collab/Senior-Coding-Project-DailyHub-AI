"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DATA_LIBRARY_SEED_ITEMS, type LibrarySeedItem, type LibraryTopicKey } from "@/lib/data-library-seeds";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import type { ScheduledTask } from "@/types/scheduled-task";
import type { TaskRun } from "@/types/task-run";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useLanguage } from "@/contexts/LanguageContext";

type TopicKey = "all" | LibraryTopicKey | "failed";
type Section = { heading: string; body: string };
type RichRecord = Record<string, unknown>;

type LibraryViewItem = {
  id: string;
  topic: LibraryTopicKey;
  icon: string;
  titleTh: string;
  titleEn: string;
  summaryTh: string;
  summaryEn: string;
  source: string;
  category: string;
  priority: number;
  readTime: string;
  tags: string[];
  details: string[];
  sections: Section[];
  updatedAt: string;
  status?: string;
  telegramStatus?: string | null;
  runId?: string;
  isSeed?: boolean;
};

const TOPICS: Array<{ key: TopicKey; icon: string; th: string; en: string }> = [
  { key: "all", icon: "✨", th: "ทั้งหมด", en: "All" },
  { key: "daily", icon: "📰", th: "ข่าวโลก", en: "Global News" },
  { key: "product", icon: "🌍", th: "สินค้าเทค/นวัตกรรม", en: "Innovation Products" },
  { key: "market", icon: "📈", th: "US Stock News", en: "US Stock News" },
  { key: "email", icon: "📧", th: "อีเมลรายวัน", en: "Daily Email" },
  { key: "concert", icon: "🎤", th: "คอนเสิร์ตในไทย", en: "Thailand Concerts" },
  { key: "football", icon: "⚽", th: "ฟุตบอล", en: "Football" },
  { key: "publicAlerts", icon: "📢", th: "ประกาศรัฐ / BTS-MRT", en: "Public Alerts / BTS-MRT" },
  { key: "travelDeals", icon: "✈️", th: "โปรเดินทาง / โรงแรม", en: "Travel Deals / Hotels" },
  { key: "lifestyle", icon: "💡", th: "ไอเดียวันหยุด / ไลฟ์สไตล์", en: "Lifestyle Ideas" },
  { key: "failed", icon: "❌", th: "มีปัญหา", en: "Failed" },
];

const TOPIC_PATTERNS: Array<{ topic: LibraryTopicKey; pattern: RegExp }> = [
  { topic: "publicAlerts", pattern: /public alert|government|notice|bts|mrt|ประกาศ|แจ้งเตือนรัฐ|หน่วยงานรัฐ|ขัดข้อง/i },
  { topic: "travelDeals", pattern: /travel deal|flight|airfare|airline|hotel|resort|room rate|ตั๋วเครื่องบิน|โปรบิน|โรงแรม|ห้องพัก|รีสอร์ต|โปรเดินทาง|โปรท่องเที่ยว/i },
  { topic: "product", pattern: /product|innovation|radar|gadget|สินค้า|นวัตกรรม|เทค/i },
  { topic: "market", pattern: /stock|market|nasdaq|nyse|nvda|amd|msft|aapl|us stock|ตลาดสหรัฐ|หุ้น/i },
  { topic: "email", pattern: /email|gmail|mail|inbox|อีเมล/i },
  { topic: "concert", pattern: /concert|artist|ticket|venue|คอนเสิร์ต|ศิลปิน|thailand|bangkok/i },
  { topic: "football", pattern: /football|soccer|world cup|premier|laliga|bundesliga|serie|ligue|uefa|บอล|ฟุตบอล/i },
  { topic: "lifestyle", pattern: /lifestyle|weekend|restaurant|cafe|buffet|article|reading|ร้านอาหาร|คาเฟ่|บุฟเฟ่ต์|ไลฟ์สไตล์|วันหยุด|ที่เที่ยว|พักผ่อน/i },
  { topic: "daily", pattern: /daily|brief|news|headline|ข่าว|สรุป/i },
];

const LEGACY_INPUT_KEYS = ["news", "weather", "products", "gmail", "football", "concerts", "articles", "market", "alerts", "travelDeals"];

function asRecord(value: unknown): RichRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RichRecord) : null;
}

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join("\n");
  return "";
}

function compact(text: string, max = 260) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

function topicFromText(text: string): LibraryTopicKey {
  return TOPIC_PATTERNS.find((item) => item.pattern.test(text))?.topic ?? "daily";
}

function articleHref(item: LibraryViewItem) {
  return `/data-library?article=${encodeURIComponent(item.id)}`;
}

function enrichProduct(text: string, index: number): RichRecord {
  const lower = text.toLowerCase();
  if (lower.includes("wearable") || lower.includes("ai")) {
    return {
      product: "AI Wearable Note Taker",
      title: "AI Wearable Note Taker",
      category: "AI Gadget / Productivity",
      source: "Global Innovation Product Radar",
      summary: "อุปกรณ์พกพาที่ช่วยจดโน้ต สรุปประชุม และดึง action items จากเสียงหรือบทสนทนา",
      whyInteresting: "ช่วยลดเวลาจดประชุม เหมาะกับคนที่ต้องสรุปข้อมูลเยอะทุกวัน เช่น นักเรียน คนทำงาน และ creator",
      useCase: "ประชุมออนไลน์, สัมภาษณ์, จด lecture, เก็บไอเดียระหว่างเดินทาง",
      audience: "นักเรียน, คนทำงาน, project manager, sales, creator",
      whatToCheck: ["รองรับภาษาไทย", "คุณภาพสรุป", "แบตเตอรี่", "ค่า subscription", "export ข้อมูลได้ไหม"],
      caution: "ควรตรวจเรื่องความเป็นส่วนตัวและการขออนุญาตก่อนบันทึกเสียง",
      contentIdea: "ทำโพสต์ 9:16: AI gadget ที่เปลี่ยนเสียงประชุมให้เป็น checklist",
      fullArticle: "AI Wearable Note Taker เป็นกลุ่มสินค้าเทคที่น่าสนใจ เพราะแก้ปัญหาข้อมูลจากเสียงจำนวนมาก ผู้ใช้ไม่ต้องจดทุกคำเอง แต่ให้ระบบช่วยถอดความ สรุป และจัด action items เหมาะกับยุคที่คนประชุม เรียน หรือทำคอนเทนต์ผ่านเสียงมากขึ้น จุดที่ควรเช็กคือภาษาไทย ความแม่นยำ แบตเตอรี่ ราคา และการ export ข้อมูลไปใช้ต่อ",
      priorityScore: 94,
    };
  }

  if (lower.includes("e-ink") || lower.includes("dashboard")) {
    return {
      product: "E-Ink Desk Dashboard",
      title: "E-Ink Desk Dashboard",
      category: "Smart Desk / Minimal Tech",
      source: "Global Innovation Product Radar",
      summary: "จอ e-ink สำหรับแสดงตารางงาน สภาพอากาศ habit และ dashboard ส่วนตัวแบบไม่รบกวนสายตา",
      whyInteresting: "เหมาะกับโต๊ะทำงานหรือห้องนอน เพราะอ่านง่าย ประหยัดไฟ และช่วยลดการเปิดมือถือบ่อย",
      useCase: "daily planner, calendar, weather, task list, habit tracker, NimbusDaily mini dashboard",
      audience: "สาย productivity, นักเรียน, คนทำงาน, smart home user",
      whatToCheck: ["รองรับภาษาไทย", "เชื่อม Google Calendar ได้ไหม", "แบตเตอรี่", "API", "refresh rate"],
      caution: "บางรุ่นเป็น niche หรือ pre-order ต้องเช็กรีวิวจริงและความน่าเชื่อถือของผู้ขาย",
      contentIdea: "ทำโพสต์: Dashboard ที่ไม่ต้องเปิดมือถือ—จอ e-ink บนโต๊ะทำงาน",
      fullArticle: "E-Ink Desk Dashboard เป็นสินค้าแนว smart desk ที่น่าสนใจ เพราะเปลี่ยนข้อมูลที่ต้องเปิดมือถือบ่อย ๆ ให้แสดงบนจออ่านง่าย เช่น งานวันนี้ ตารางเรียน ตารางประชุม หรือสภาพอากาศ ข้อดีคือไม่รบกวนสายตาและใช้ไฟน้อย เหมาะกับคนที่อยากลด distraction และทำให้โต๊ะทำงานมีข้อมูลสำคัญแบบ glanceable",
      priorityScore: 86,
    };
  }

  return {
    product: text || `Innovation Product ${index + 1}`,
    title: text || `Innovation Product ${index + 1}`,
    category: "Global Technology / Innovation",
    source: "Global Innovation Product Radar",
    summary: "สินค้าเทคโนโลยีหรือนวัตกรรมที่น่าสนใจจากทั่วโลก ควรเก็บไว้ดูรายละเอียดและตรวจข้อมูลเพิ่ม",
    whyInteresting: "มีแนวโน้มใช้ทำงาน เรียน หรือสร้างคอนเทนต์ได้ และเหมาะกับการติดตามเทรนด์เทคโนโลยี",
    useCase: "productivity, learning, creator workflow, smart workspace",
    audience: "ผู้ใช้ทั่วไป, นักเรียน, คนทำงาน, creator",
    whatToCheck: ["รีวิวจริง", "ราคา", "การรองรับภาษาไทย", "การรับประกัน", "ข้อจำกัดของสินค้า"],
    caution: "ยังควรตรวจแหล่งข้อมูลและรีวิวก่อนตัดสินใจ",
    contentIdea: "ทำโพสต์คัดของเทคใหม่จากทั่วโลก",
    fullArticle: `${text} เป็นสินค้าในกลุ่มเทคโนโลยี/นวัตกรรมที่ควรเก็บไว้ใน watchlist เพื่ออ่านต่อและตรวจรายละเอียด เช่น use case, จุดเด่น, ข้อควรระวัง และกลุ่มผู้ใช้ที่เหมาะสม`,
    priorityScore: 80,
  };
}

function enrichLegacyItem(key: string, item: unknown, index: number): RichRecord {
  const record = asRecord(item);
  if (record) return { category: asText(record.category) || key, source: asText(record.source) || key, ...record };
  const text = asText(item) || String(item ?? "");

  if (key === "products") return enrichProduct(text, index);
  if (key === "market") return { title: text, symbol: text.split(" ")[0] || "US", category: "US Stock News", source: "US Stock News", summary: "ข่าวตลาดสหรัฐที่ควรติดตามแบบให้ข้อมูล ไม่ใช่คำแนะนำลงทุน", whyItMatters: "ช่วยดู sentiment ของกลุ่มเทคและตลาดสหรัฐ", whatToCheck: ["headline", "sector", "market impact", "risk"], fullArticle: `${text} เป็นประเด็นในกลุ่ม US Stock News ที่ควรอ่านรายละเอียดต่อในเชิงข่าวและบริบทตลาด`, priorityScore: 84 };
  if (key === "football") return { title: text, teamNames: text, category: "Football", source: "Football News Hub", summary: "ข่าวฟุตบอลหรือผลการแข่งขันที่ควรจัดหมวดตามลีก/ทีม", whyItMatters: "ช่วยติดตามบอลไทย บอลโลก และลีกใหญ่แบบแยกเรื่อง", whatToWatchNext: "โปรแกรมถัดไป ผลล่าสุด นักเตะสำคัญ และสถานะการแข่งขัน", fullArticle: `${text} ควรถูกขยายเป็นข่าวฟุตบอลพร้อมชื่อทีม ลีก รายการ สถานะ และสิ่งที่ต้องติดตามต่อ`, priorityScore: 72 };
  if (key === "gmail") return { title: text, subject: text, category: "Daily Email", source: "Gmail Daily Digest", summary: "อีเมลในรอบวันที่ควรถูกสรุปเป็นหมวด พร้อม priority และสิ่งที่ต้องทำต่อ", suggestedAction: "จัดหมวดและตัดสินใจว่าอ่านทันที เก็บไว้ หรือ archive", fullArticle: `${text} เป็นอีเมลที่ระบบควรสรุป sender, subject, priority, status และ next action`, priorityScore: 80 };
  if (key === "concerts") return { title: text, eventName: text, category: "Thailand Concert Alerts", source: "Concert API Thailand Only", summary: "คอนเสิร์ตในไทยที่ควรเช็กวัน เวลา สถานที่ และสถานะบัตร", venue: "Thailand / Bangkok watchlist", ticketStatus: "Watchlist", fullArticle: `${text} ควรมีรายละเอียดศิลปิน สถานที่ วันแสดง ช่วงราคา การเดินทาง และ checklist ก่อนซื้อบัตร`, priorityScore: 78 };
  if (key === "alerts") return { title: text, category: "Public Alerts", source: "Public Notices", summary: "ประกาศสำคัญหรือสถานะบริการสาธารณะที่ควรตรวจแหล่งทางการ", recommendedAction: "ตรวจประกาศทางการและเตรียมเส้นทางสำรอง", fullArticle: `${text} ควรถูกสรุปเป็นประกาศสำคัญ พร้อมพื้นที่ที่ได้รับผลกระทบ เวลา และสิ่งที่ต้องทำต่อ`, priorityScore: 86 };
  if (key === "travelDeals") return { title: text, deal: text, category: "Travel Deals", source: "Travel Promotions", summary: "โปรเดินทาง ตั๋วเครื่องบิน โรงแรม หรือแพ็กเกจเที่ยวที่ควรตรวจเงื่อนไขก่อนจอง", whatToCheck: ["วันเดินทาง", "ภาษี/ค่าธรรมเนียม", "เงื่อนไขยกเลิก", "วันหมดโปร"], fullArticle: `${text} เป็นโปรเดินทางที่ควรอ่านรายละเอียด เช่น วันเดินทาง ภาษี ค่าธรรมเนียม น้ำหนักกระเป๋า และเงื่อนไขการจอง`, priorityScore: 78 };
  if (key === "news") return { title: text, category: "Global News", source: "News", summary: "ข่าวโลกที่ควรอ่านต่อพร้อมบริบทและผลกระทบ", whyItMatters: "ช่วยติดตามประเด็นที่น่าสนใจทั่วโลก", fullArticle: `${text} เป็นหัวข้อข่าวที่ควรขยายเป็นสรุปเต็ม พร้อมที่มา ประเด็นสำคัญ และสิ่งที่ต้องติดตามต่อ`, priorityScore: 82 };

  return { title: text, category: key, source: key, summary: text, fullArticle: text, priorityScore: 70 };
}

function sourceItems(rawInput: Record<string, unknown>) {
  const fromSources = (Array.isArray(rawInput.sources) ? rawInput.sources : []).flatMap((source) => {
    const row = asRecord(source);
    if (!row) return [];
    if (Array.isArray(row.items)) return row.items;
    if (Array.isArray(row.data)) return row.data;
    const data = asRecord(row.data);
    if (Array.isArray(data?.items)) return data.items;
    return row.data ? [row.data] : [];
  }).map((item, index) => {
    const row = asRecord(item);
    if (!row) return enrichLegacyItem("items", item, index);
    return row;
  });

  const legacyItems = LEGACY_INPUT_KEYS.flatMap((key) => {
    const value = rawInput[key];
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) return value.map((item, index) => enrichLegacyItem(key, item, index));
    return [enrichLegacyItem(key, value, 0)];
  });

  return [...fromSources, ...legacyItems];
}

function itemTitle(row: RichRecord) {
  return [row.product, row.teamNames, row.eventName, row.symbol, row.company, row.title, row.subject, row.description, row.summary]
    .map(asText)
    .filter(Boolean)
    .slice(0, 2)
    .join(" — ");
}

function itemDetailLines(items: unknown[]) {
  return items.flatMap((item, index) => {
    const row = asRecord(item);
    if (!row) return [`${index + 1}. ${asText(item)}`];
    const title = itemTitle(row) || `รายการที่ ${index + 1}`;
    return [
      `${index + 1}. ${title}`,
      asText(row.summary) ? `สรุป: ${asText(row.summary)}` : "",
      asText(row.whyInteresting || row.whyItMatters) ? `ทำไมน่าสนใจ: ${asText(row.whyInteresting || row.whyItMatters)}` : "",
      asText(row.useCase) ? `ใช้ทำอะไร: ${asText(row.useCase)}` : "",
      asText(row.audience) ? `เหมาะกับ: ${asText(row.audience)}` : "",
      asText(row.whatToCheck || row.dataToCheck) ? `ควรเช็ก: ${asText(row.whatToCheck || row.dataToCheck)}` : "",
      asText(row.contentIdea) ? `มุมทำคอนเทนต์: ${asText(row.contentIdea)}` : "",
      asText(row.caution || row.risk) ? `ข้อควรระวัง: ${asText(row.caution || row.risk)}` : "",
    ].filter(Boolean);
  });
}

function fullArticleText(items: unknown[]) {
  return items.map((item, index) => {
    const row = asRecord(item);
    if (!row) return `${index + 1}. ${asText(item)}`;
    const title = itemTitle(row) || `รายการที่ ${index + 1}`;
    return [
      `${index + 1}. ${title}`,
      asText(row.fullArticle) || asText(row.summary),
      asText(row.whyInteresting || row.whyItMatters) ? `\nทำไมน่าสนใจ: ${asText(row.whyInteresting || row.whyItMatters)}` : "",
      asText(row.useCase) ? `\nใช้ทำอะไร: ${asText(row.useCase)}` : "",
      asText(row.whatToCheck || row.dataToCheck) ? `\nควรเช็ก: ${asText(row.whatToCheck || row.dataToCheck)}` : "",
    ].filter(Boolean).join("\n");
  }).join("\n\n---\n\n");
}

function runToLibraryItem(run: TaskRun, task?: ScheduledTask): LibraryViewItem {
  const rawInput = (asRecord(run.rawInput) ?? {}) as Record<string, unknown>;
  const items = sourceItems(rawInput);
  const text = `${task?.name ?? ""} ${task?.type ?? ""} ${run.gptOutput.title} ${run.gptOutput.summary} ${run.translatedContent ?? ""} ${JSON.stringify(rawInput)}`;
  const topic = topicFromText(text);
  const topicMeta = TOPICS.find((item) => item.key === topic);
  const title = topic === "market" ? "US Stock News" : run.translation?.translatedTitle || run.gptOutput.title || task?.name || "NimbusDaily Result";
  const summary = run.translatedContent || run.translation?.translatedSummary || run.gptOutput.summary || run.originalContent || "ยังไม่มีสรุป";
  const details = itemDetailLines(items).slice(0, 18);
  const fullText = fullArticleText(items);

  return {
    id: run.id,
    topic,
    icon: topicMeta?.icon ?? "✨",
    titleTh: title,
    titleEn: title,
    summaryTh: summary,
    summaryEn: run.gptOutput.summary || summary,
    source: task?.dataSources?.join(", ") || "Task Run",
    category: task?.type || topicMeta?.en || "NimbusDaily",
    priority: run.priorityScore,
    readTime: details.length > 8 ? "5-8 นาที" : "3-5 นาที",
    tags: [topicMeta?.en, task?.type, run.status, run.telegramStatus].filter(Boolean) as string[],
    details,
    sections: [
      { heading: "สรุป", body: summary },
      { heading: "ข้อมูลเต็มที่ระบบขยายให้อ่าน", body: fullText || run.originalContent || "ไม่มีข้อมูลดิบใน run นี้" },
      { heading: "ควรทำต่อ", body: run.gptOutput.recommended_action || "เปิดดูรายละเอียดใน Task Results หรือรัน task ใหม่เพื่อเก็บข้อมูลล่าสุด" },
    ],
    updatedAt: run.startedAt,
    status: run.status,
    telegramStatus: run.telegramStatus,
    runId: run.id,
    isSeed: false,
  };
}

function seedToLibraryItem(item: LibrarySeedItem): LibraryViewItem {
  return { ...item, isSeed: true };
}

function statusTone(status?: string) {
  if (status === "success") return "green" as const;
  if (status === "failed") return "red" as const;
  if (status === "running") return "purple" as const;
  return "gray" as const;
}

function telegramTone(status?: string | null) {
  if (status === "sent" || status?.startsWith("mock_sent")) return "green" as const;
  if (status?.includes("failed")) return "red" as const;
  if (status?.includes("skipped")) return "gray" as const;
  return "purple" as const;
}

function Reader({ item, isTh }: { item: LibraryViewItem; isTh: boolean }) {
  return (
    <Card className="border-cyan-300/25 bg-cyan-300/[0.04] p-5 sm:p-7" id="article-reader">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">{item.icon} {item.category}</Badge>
            <Badge tone={item.isSeed ? "purple" : statusTone(item.status)}>{item.isSeed ? "Readable" : item.status}</Badge>
            {item.telegramStatus ? <Badge tone={telegramTone(item.telegramStatus)}>📨 {item.telegramStatus}</Badge> : null}
          </div>
          <h2 className="mt-4 text-2xl font-black leading-9 text-white sm:text-4xl">{isTh ? item.titleTh : item.titleEn}</h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">{isTh ? item.summaryTh : item.summaryEn}</p>
        </div>
        <Link className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white hover:bg-white/[0.10]" href="/data-library">
          {isTh ? "กลับหน้ารวม" : "Back"}
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-xs text-slate-500">Source</p><p className="mt-1 text-sm font-bold text-white">{item.source}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-xs text-slate-500">Priority</p><p className="mt-1 text-2xl font-black text-cyan-100">{item.priority}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-xs text-slate-500">Read time</p><p className="mt-1 text-sm font-bold text-white">{item.readTime}</p></div>
      </div>

      <div className="mt-6 grid gap-4">
        {item.sections.map((section, index) => (
          <div key={`${section.heading}-${index}`} className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Section {index + 1}</p>
            <h3 className="mt-2 text-lg font-black text-white">{section.heading}</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">{section.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/50 p-5">
        <h3 className="font-black text-white">{isTh ? "รายละเอียดแยกอ่านง่าย" : "Readable details"}</h3>
        <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-300 sm:grid-cols-2">
          {item.details.map((detail) => <p key={detail} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">• {detail}</p>)}
        </div>
      </div>
    </Card>
  );
}

export function DataLibraryView({ initialRunId = "", initialArticleId = "" }: { initialRunId?: string; initialArticleId?: string }) {
  const { lang } = useLanguage();
  const isTh = lang === "th";
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TopicKey>("all");
  const [query, setQuery] = useState("");
  const [runId, setRunId] = useState(initialRunId);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [taskData, runData] = await Promise.all([
        apiRequest<ScheduledTask[]>("/api/scheduled-tasks"),
        apiRequest<TaskRun[]>("/api/task-runs"),
      ]);
      setTasks(taskData);
      setRuns(runData);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => setRunId(initialRunId), [initialRunId]);

  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const libraryItems = useMemo(() => [...runs.map((run) => runToLibraryItem(run, taskMap.get(run.taskId))), ...DATA_LIBRARY_SEED_ITEMS.map(seedToLibraryItem)], [runs, taskMap]);
  const selectedItem = useMemo(() => libraryItems.find((item) => item.id === initialArticleId) ?? null, [initialArticleId, libraryItems]);

  const visibleItems = useMemo(() => libraryItems.filter((item) => {
    if (runId && item.runId !== runId) return false;
    if (filter === "failed" && item.status !== "failed" && !item.telegramStatus?.includes("failed")) return false;
    if (filter !== "all" && filter !== "failed" && item.topic !== filter) return false;
    if (!query) return true;
    const search = `${item.titleTh} ${item.titleEn} ${item.summaryTh} ${item.summaryEn} ${item.source} ${item.category} ${item.tags.join(" ")} ${item.details.join(" ")}`.toLowerCase();
    return search.includes(query.toLowerCase());
  }), [filter, libraryItems, query, runId]);

  const groupedItems = useMemo(() => TOPICS.filter((topic) => topic.key !== "all" && topic.key !== "failed").map((topic) => ({ topic, items: visibleItems.filter((item) => item.topic === topic.key) })).filter((group) => group.items.length > 0), [visibleItems]);
  const runItemCount = libraryItems.filter((item) => !item.isSeed).length;
  const seedItemCount = libraryItems.filter((item) => item.isSeed).length;

  if (loading) return <LoadingState title={isTh ? "กำลังโหลดคลังข้อมูล" : "Loading Data Library"} description={isTh ? "กำลังดึงข้อมูลเต็มจาก API และคลังตัวอย่าง" : "Fetching API runs and readable seed content"} />;
  if (error) return <ErrorState title={isTh ? "โหลด Data Library ไม่สำเร็จ" : "Data Library loading failed"} description={error} onRetry={load} />;

  return (
    <div className="nimbus-depth-space space-y-8">
      <Card className="nimbus-pulse-dot relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <Badge tone="purple">🧊 {isTh ? "คลังข้อมูลเต็ม" : "Full Data Library"}</Badge>
          <h1 className="mt-5 max-w-4xl text-3xl font-black text-white sm:text-5xl">{isTh ? "อ่านข้อมูลเต็มแบบแยกเรื่อง" : "Read full data by topic"}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            {isTh ? "ระบบจะขยายข้อมูลเก่าที่เป็นคำสั้น ๆ ให้เป็นรายละเอียดอ่านเต็มอัตโนมัติ เช่น สรุป ทำไมน่าสนใจ ใช้ทำอะไร ควรเช็กอะไร และควรทำต่อ" : "Legacy short inputs are now expanded into readable full details automatically."}
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-4">
            <Card className="p-4"><p className="text-sm text-slate-400">Runs</p><p className="text-3xl font-black text-white">{runs.length}</p></Card>
            <Card className="p-4"><p className="text-sm text-slate-400">Real Items</p><p className="text-3xl font-black text-white">{runItemCount}</p></Card>
            <Card className="p-4"><p className="text-sm text-slate-400">Readable</p><p className="text-3xl font-black text-white">{seedItemCount}</p></Card>
            <Card className="p-4"><p className="text-sm text-slate-400">Visible</p><p className="text-3xl font-black text-white">{visibleItems.length}</p></Card>
          </div>
        </div>
      </Card>

      {selectedItem ? <Reader item={selectedItem} isTh={isTh} /> : null}

      <Card className="p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input className="min-h-12 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50 focus:bg-slate-950/90" onChange={(event) => setQuery(event.target.value)} placeholder={isTh ? "ค้นหาข่าว ประกาศรัฐ BTS/MRT โปรบิน โรงแรม US Stock News คอนเสิร์ต..." : "Search news, public alerts, BTS/MRT, flight deals, hotels, US Stock News..."} value={query} />
          <div className="flex flex-wrap gap-2">
            {runId && <button className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white" onClick={() => setRunId("")} type="button">{isTh ? "ดูทุกเรื่อง" : "View all"}</button>}
            <button className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white" onClick={load} type="button">🔄 {isTh ? "รีเฟรช" : "Refresh"}</button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {TOPICS.map((item) => <button key={item.key} className={`nimbus-button-3d rounded-full border px-3 py-2 text-xs font-bold transition ${filter === item.key ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"}`} onClick={() => setFilter(item.key)} type="button">{item.icon} {isTh ? item.th : item.en}</button>)}
        </div>
      </Card>

      {groupedItems.map((group) => (
        <section key={group.topic.key} className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-white">{group.topic.icon} {isTh ? group.topic.th : group.topic.en}</h2>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300">{group.items.length} เรื่อง</span>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {group.items.map((item) => (
              <Card key={`${item.isSeed ? "seed" : "run"}-${item.id}`} className="nimbus-orbit p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="blue">{item.icon} {isTh ? group.topic.th : group.topic.en}</Badge>
                      <Badge tone={item.isSeed ? "purple" : statusTone(item.status)}>{item.isSeed ? (isTh ? "อ่านได้ทันที" : "Readable") : item.status}</Badge>
                    </div>
                    <Link className="mt-4 block text-left text-xl font-black leading-7 text-white hover:text-cyan-100" href={articleHref(item)}>{isTh ? item.titleTh : item.titleEn}</Link>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{compact(isTh ? item.summaryTh : item.summaryEn, 340)}</p>
                  </div>
                  <div className="shrink-0 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-right"><p className="text-2xl font-black text-cyan-100">{item.priority}</p><p className="text-[11px] uppercase tracking-wider text-slate-400">priority</p></div>
                </div>
                <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-300">{item.details.slice(0, 6).map((detail) => <p key={detail}>• {detail}</p>)}</div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 hover:bg-cyan-300/20" href={articleHref(item)}>📖 {isTh ? "อ่านเต็ม" : "Read Full"}</Link>
                  {item.runId ? <Link className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white hover:bg-white/[0.10]" href={`/task-results/${item.runId}`}>{isTh ? "ผลลัพธ์เดิม" : "Original result"}</Link> : null}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}

      {visibleItems.length === 0 ? <Card className="p-8 text-center"><p className="text-xl font-black text-white">{isTh ? "ไม่พบข้อมูล" : "No data found"}</p><p className="mt-2 text-sm text-slate-400">{isTh ? "ลองเปลี่ยน filter หรือคำค้นหา" : "Try another filter or search query."}</p></Card> : null}
    </div>
  );
}
