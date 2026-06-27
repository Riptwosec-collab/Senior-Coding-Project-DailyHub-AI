"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import { getDailyBriefTopicDetail } from "@/lib/daily-brief-taxonomy";
import { cn } from "@/lib/utils";
import type { DailyBriefApiResponse, DailyBriefCategory, DailyBriefCategoryKey, DailyBriefItem, DailyBriefSummary } from "@/types/daily-brief";

type SendResult = { status: string; message: string; parts: number };
type Lang = "th" | "en";

const copy = {
  th: {
    badgeHub: "ศูนย์ Daily Brief",
    badgeNews: "ข่าวครบหมวด",
    badgeTelegram: "สรุปไทยไป Telegram",
    title: "Daily Brief / ข่าวประจำวัน",
    subtitle: "ศูนย์กลางข่าวทั้งหมดของ DailyHub แปลไทยก่อนสรุป อ่านข่าวเต็มได้ และส่งข่าวย่อภาษาไทยไป Telegram แบบหนึ่งหัวข้อต่อหนึ่งข้อความ",
    searchPlaceholder: "ค้นหาข่าว เช่น AI, หุ้น, PM2.5, Cisco, คอนเสิร์ต...",
    refresh: "ดึงข่าวล่าสุด",
    refreshing: "กำลังดึง...",
    summarize: "สรุปใหม่",
    sendAll: "ส่งทั้งหมด",
    sending: "กำลังส่ง...",
    sendCategory: "ส่งหมวดนี้",
    schedule: "ตั้งเวลา",
    updated: "อัปเดตล่าสุด",
    found: "ข่าวที่พบ",
    summarized: "สรุปแล้ว",
    telegram: "Telegram",
    topPriority: "สำคัญสูงสุด",
    largestCategory: "หมวดเยอะสุด",
    afterDedupe: "หลังคัดซ้ำ",
    readyThai: "ภาษาไทยพร้อมส่ง",
    readyRetry: "พร้อมลองใหม่",
    noTop: "ยังไม่มี",
    items: "รายการ",
    loadingTitle: "กำลังโหลดข่าว",
    emptyTitle: "ไม่พบข่าวในตัวกรองนี้",
    emptyDesc: "ลองเปลี่ยนหมวด หรือค้นหาด้วยคำที่กว้างขึ้น",
    errorBadge: "ผิดพลาด",
    errorTitle: "โหลด Daily Brief ไม่สำเร็จ",
    retry: "ลองอีกครั้ง",
    multipleSources: (count: number) => `หลายแหล่งข่าว +${count}`,
    sent: "ส่ง Telegram แล้ว",
    failed: "ส่งไม่สำเร็จ",
    saved: "บันทึกแล้ว",
    ready: "พร้อมอ่าน",
    sendingNews: "ส่งอยู่...",
    sendNews: "ส่งข่าวนี้",
    readFull: "อ่านเต็ม",
    save: "บันทึกไว้",
    unsave: "ยกเลิกบันทึก",
    hide: "ซ่อน",
    why: "ทำไมควรรู้",
    keyPoints: "ประเด็นสำคัญ",
    impact: "ผลกระทบ",
    source: "แหล่งข่าวต้นฉบับ",
    copyLink: "คัดลอกลิงก์",
    readerNote: "หน้าอ่านเต็มแสดงสรุปและ paraphrase ของระบบ ไม่คัดลอกบทความเต็มจากต้นฉบับแบบยาว",
    topStories: "ข่าวสำคัญวันนี้",
    telegramStatus: "สถานะการส่ง",
    noSendYet: "ยังไม่ได้ส่งในรอบนี้",
    splitNote: "Telegram จะส่งเป็นภาษาไทยก่อนเสมอ และใช้กติกา 1 หัวข้อ = 1 ข้อความ หากยาวเกินระบบจะย่อข้อความแทนการแตกเป็นหลาย part",
    settings: "ตั้งค่า Daily Brief",
    realNews: "ข่าวจริง",
    on: "เปิด",
    offMock: "ปิด / ใช้ mock",
    provider: "ผู้ให้บริการ",
    countries: "ประเทศ",
    languages: "ภาษา",
    apiKeyNote: "คีย์ API ต้องอยู่ใน server env เท่านั้น เช่น NEWSDATA_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID ห้ามใช้ NEXT_PUBLIC",
    scheduler: "ตารางส่ง Daily Brief",
    autoSend: "ส่งอัตโนมัติ",
    time: "เวลา",
    perCategory: "ข่าวต่อหมวด",
    lastLog: "Log ล่าสุด",
    noLog: "ยังไม่มี log",
    originalTitle: "ชื่อต้นฉบับ",
    categorySubtopics: "หัวข้อย่อย",
    categoryNote: "หมายเหตุ",
    readOriginal: "เปิดแหล่งข่าวต้นฉบับ",
    categorySendEmpty: "ไม่มีข่าวในหมวดนี้ให้ส่ง",
    savedMessage: "อัปเดตสถานะบันทึกแล้ว",
    hiddenMessage: "ซ่อนข่าวนี้แล้ว",
  },
  en: {
    badgeHub: "Daily Brief Hub",
    badgeNews: "Full News Coverage",
    badgeTelegram: "Thai Telegram Summary",
    title: "Daily Brief / News Hub",
    subtitle: "DailyHub's main news center. News is normalized into Thai before summarization, full sources stay readable, and Telegram sends one Thai message per topic.",
    searchPlaceholder: "Search news, e.g. AI, stocks, PM2.5, Cisco, concerts...",
    refresh: "Fetch Latest",
    refreshing: "Fetching...",
    summarize: "Regenerate",
    sendAll: "Send All",
    sending: "Sending...",
    sendCategory: "Send Category",
    schedule: "Schedule",
    updated: "Updated",
    found: "Items Found",
    summarized: "Summarized",
    telegram: "Telegram",
    topPriority: "Top Priority",
    largestCategory: "Largest Category",
    afterDedupe: "after dedupe",
    readyThai: "Thai-ready",
    readyRetry: "retry ready",
    noTop: "None yet",
    items: "items",
    loadingTitle: "Loading news",
    emptyTitle: "No news in this filter",
    emptyDesc: "Try another category or a broader search term.",
    errorBadge: "Error",
    errorTitle: "Daily Brief failed to load",
    retry: "Retry",
    multipleSources: (count: number) => `Multiple sources +${count}`,
    sent: "Sent to Telegram",
    failed: "Send failed",
    saved: "Saved",
    ready: "Ready",
    sendingNews: "Sending...",
    sendNews: "Send Story",
    readFull: "Read Full",
    save: "Save",
    unsave: "Unsave",
    hide: "Hide",
    why: "Why it matters",
    keyPoints: "Key Points",
    impact: "Impact",
    source: "Original Source",
    copyLink: "Copy Link",
    readerNote: "The full reader shows a system summary and paraphrase; it does not copy the full source article verbatim.",
    topStories: "Top Stories Today",
    telegramStatus: "Delivery Status",
    noSendYet: "Nothing sent in this session yet",
    splitNote: "Telegram content is normalized to Thai first. Each topic is sent as exactly one message; long content is shortened instead of split into multiple parts.",
    settings: "Daily Brief Settings",
    realNews: "Real News",
    on: "On",
    offMock: "Off / mock",
    provider: "Provider",
    countries: "Countries",
    languages: "Languages",
    apiKeyNote: "API keys must live in server env only, such as NEWSDATA_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID. Never use NEXT_PUBLIC for secrets.",
    scheduler: "Daily Brief Scheduler",
    autoSend: "Auto send",
    time: "Time",
    perCategory: "Items per category",
    lastLog: "Last log",
    noLog: "No log yet",
    originalTitle: "Original title",
    categorySubtopics: "Subtopics",
    categoryNote: "Note",
    readOriginal: "Open Original Source",
    categorySendEmpty: "No stories in this category to send",
    savedMessage: "Saved state updated",
    hiddenMessage: "Story hidden",
  },
} as const;

function formatTime(value: string | undefined, lang: Lang) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

function categoryLabel(key: DailyBriefCategoryKey, lang: Lang) {
  const detail = getDailyBriefTopicDetail(key);
  return lang === "th" ? detail.labelTh : detail.labelEn;
}

function categoryDescription(key: DailyBriefCategoryKey, lang: Lang) {
  const detail = getDailyBriefTopicDetail(key);
  return lang === "th" ? detail.descriptionTh : detail.descriptionEn;
}

function itemTitle(item: DailyBriefItem, lang: Lang) {
  return lang === "th" ? item.titleTh : item.title || item.titleTh;
}

function itemSummary(item: DailyBriefItem, lang: Lang) {
  return lang === "th" ? item.summaryTh : item.rawDescription || item.extractedText || item.summaryTh;
}

function itemBullets(item: DailyBriefItem, lang: Lang) {
  if (lang === "th") return item.bulletPoints;
  return item.rawDescription ? [item.rawDescription.slice(0, 180), `Source: ${item.sourceName}`, `Category: ${categoryLabel(item.category, "en")}`] : item.bulletPoints;
}

function LoadingState({ lang }: { lang: Lang }) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-slate-400">{copy[lang].loadingTitle}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="h-72 animate-pulse p-5">
            <div className="h-7 w-32 rounded-xl bg-white/10" />
            <div className="mt-5 h-6 w-4/5 rounded-xl bg-white/10" />
            <div className="mt-4 space-y-2">
              <div className="h-3 rounded bg-white/10" />
              <div className="h-3 w-5/6 rounded bg-white/10" />
              <div className="h-3 w-2/3 rounded bg-white/10" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ lang }: { lang: Lang }) {
  const text = copy[lang];
  return (
    <Card className="p-8 text-center">
      <p className="text-4xl">🔎</p>
      <h3 className="mt-3 text-xl font-black text-white">{text.emptyTitle}</h3>
      <p className="mt-2 text-sm text-slate-400">{text.emptyDesc}</p>
    </Card>
  );
}

function ErrorState({ message, onRetry, lang }: { message: string; onRetry: () => void; lang: Lang }) {
  const text = copy[lang];
  return (
    <Card className="border-rose-300/25 bg-rose-400/[0.06] p-6">
      <Badge tone="red">{text.errorBadge}</Badge>
      <h3 className="mt-3 text-xl font-black text-white">{text.errorTitle}</h3>
      <p className="mt-2 text-sm leading-6 text-rose-100/85">{message}</p>
      <Button className="mt-5" variant="secondary" onClick={onRetry}>{text.retry}</Button>
    </Card>
  );
}

function DailyBriefHeader({ search, setSearch, onRefresh, onSummarize, onSendAll, onSendCategory, loading, sending, lang }: {
  search: string;
  setSearch: (value: string) => void;
  onRefresh: () => void;
  onSummarize: () => void;
  onSendAll: () => void;
  onSendCategory: () => void;
  loading: boolean;
  sending: boolean;
  lang: Lang;
}) {
  const text = copy[lang];
  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-slate-950/55 p-5 shadow-2xl shadow-cyan-950/30 sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-12 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">📰 {text.badgeHub}</Badge>
            <Badge tone="purple">{text.badgeNews}</Badge>
            <Badge tone="green">{text.badgeTelegram}</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">{text.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{text.subtitle}</p>
        </div>
        <div className="flex w-full flex-col gap-3 xl:w-[34rem]">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 shadow-inner shadow-black/20">
            <span className="text-slate-400">⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text.searchPlaceholder} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500" />
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            <Button disabled={loading} onClick={onRefresh}>{loading ? text.refreshing : text.refresh}</Button>
            <Button disabled={loading} variant="secondary" onClick={onSummarize}>{text.summarize}</Button>
            <Button disabled={sending} variant="secondary" onClick={onSendCategory}>{sending ? text.sending : text.sendCategory}</Button>
            <Button disabled={sending} variant="secondary" onClick={onSendAll}>{sending ? text.sending : text.sendAll}</Button>
            <a href="#daily-brief-scheduler" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] px-4 py-2.5 text-sm font-bold text-white transition hover:border-cyan-200/30 hover:bg-white/[0.11]">{text.schedule}</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function DailyBriefStats({ data, lang }: { data: DailyBriefApiResponse; lang: Lang }) {
  const text = copy[lang];
  const topPriority = data.summary.topStories[0];
  const largestCategory = useMemo(() => {
    const counts = data.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    const [key, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ["all", 0];
    return { label: categoryLabel(key as DailyBriefCategoryKey, lang), count };
  }, [data, lang]);

  const stats = [
    { label: text.updated, value: formatTime(data.summary.generatedAt, lang), hint: data.summary.mode === "fallback" ? "Fallback mode" : data.summary.mode },
    { label: text.found, value: data.summary.totalItems.toString(), hint: text.afterDedupe },
    { label: text.summarized, value: data.summary.summarizedItems.toString(), hint: text.readyThai },
    { label: text.telegram, value: data.summary.telegramStatus, hint: text.readyRetry },
    { label: text.topPriority, value: topPriority ? `${topPriority.priorityScore}/100` : "-", hint: topPriority ? itemTitle(topPriority, lang) : text.noTop },
    { label: text.largestCategory, value: largestCategory.label, hint: `${largestCategory.count} ${text.items}` },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {stats.map((item) => (
        <Card key={item.label} className="p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
          <p className="mt-2 truncate text-xl font-black text-white">{item.value}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{item.hint}</p>
        </Card>
      ))}
    </div>
  );
}

function NewsCategoryTabs({ categories, active, setActive, lang }: { categories: DailyBriefCategory[]; active: DailyBriefCategoryKey; setActive: (key: DailyBriefCategoryKey) => void; lang: Lang }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => {
        const detail = getDailyBriefTopicDetail(category.key);
        const isActive = active === category.key;
        return (
          <button key={category.key} type="button" onClick={() => setActive(category.key)} className={cn("inline-flex max-w-[18rem] shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-left text-sm font-black transition active:scale-[0.98]", isActive ? "border-cyan-300/40 bg-cyan-300/15 text-white shadow-[0_0_26px_rgba(34,211,238,0.12)]" : "border-white/10 bg-white/[0.045] text-slate-400 hover:border-cyan-300/30 hover:text-white")}>
            <span>{detail.icon}</span>
            <span className="truncate">{lang === "th" ? detail.labelTh : detail.labelEn}</span>
          </button>
        );
      })}
    </div>
  );
}

function CategoryInfoPanel({ active, lang }: { active: DailyBriefCategoryKey; lang: Lang }) {
  const detail = getDailyBriefTopicDetail(active);
  const text = copy[lang];
  const subtopics = lang === "th" ? detail.subtopicsTh : detail.subtopicsEn;
  const note = lang === "th" ? detail.noteTh : detail.noteEn;
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="blue">{detail.icon} {lang === "th" ? detail.labelTh : detail.labelEn}</Badge>
        <span className="text-xs font-bold text-slate-500">{categoryDescription(active, lang)}</span>
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{text.categorySubtopics}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {subtopics.map((topic) => <span key={topic} className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-slate-300">{topic}</span>)}
      </div>
      {note && <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-3 text-xs leading-6 text-amber-100"><span className="font-black">{text.categoryNote}:</span> {note}</p>}
    </Card>
  );
}

function NewsSourceBadge({ item, lang }: { item: DailyBriefItem; lang: Lang }) {
  return <Badge tone={item.relatedSources.length ? "purple" : "gray"}>{item.relatedSources.length ? copy[lang].multipleSources(item.relatedSources.length) : item.sourceName}</Badge>;
}

function NewsStatusBadge({ item, lang }: { item: DailyBriefItem; lang: Lang }) {
  const text = copy[lang];
  if (item.telegramStatus === "sent" || item.telegramStatus === "mock_sent") return <Badge tone="green">{text.sent}</Badge>;
  if (item.telegramStatus === "failed") return <Badge tone="red">{text.failed}</Badge>;
  if (item.isSaved) return <Badge tone="blue">{text.saved}</Badge>;
  return <Badge tone="gray">{text.ready}</Badge>;
}

function SingleNewsTelegramButton({ item, onSent, lang }: { item: DailyBriefItem; onSent: (message: string) => void; lang: Lang }) {
  const [sending, setSending] = useState(false);
  const text = copy[lang];
  async function send() {
    setSending(true);
    try {
      const result = await apiRequest<SendResult>("/api/telegram/send-news", { method: "POST", body: JSON.stringify({ item }) });
      onSent(result.message);
    } catch (error) {
      onSent(toErrorMessage(error));
    } finally {
      setSending(false);
    }
  }
  return <Button size="sm" variant="secondary" disabled={sending} onClick={send}>{sending ? text.sendingNews : text.sendNews}</Button>;
}

function NewsCard({ item, onRead, onSent, onSave, onHide, lang }: {
  item: DailyBriefItem;
  onRead: (item: DailyBriefItem) => void;
  onSent: (message: string) => void;
  onSave: (item: DailyBriefItem) => void;
  onHide: (item: DailyBriefItem) => void;
  lang: Lang;
}) {
  const text = copy[lang];
  return (
    <Card className="group flex min-h-[25rem] flex-col p-5 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.045]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="blue">{categoryLabel(item.category, lang)}</Badge>
        <NewsSourceBadge item={item} lang={lang} />
        <NewsStatusBadge item={item} lang={lang} />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="line-clamp-3 text-xl font-black leading-8 text-white">{itemTitle(item, lang)}</h3>
        <span className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-black text-cyan-100">{item.priorityScore}</span>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">{item.sourceName} · {formatTime(item.publishedAt, lang)}</p>
      <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-300">{itemSummary(item, lang)}</p>
      <div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
        {itemBullets(item, lang).slice(0, 3).map((point) => <p key={point}>• {point}</p>)}
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-xs leading-6 text-slate-400">
        <span className="font-bold text-cyan-200">{text.why}:</span> {lang === "th" ? item.whyItMatters : item.impact || item.whyItMatters}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((tag) => <span key={tag} className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-bold text-slate-300">#{tag}</span>)}
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Button size="sm" onClick={() => onRead(item)}>{text.readFull}</Button>
        <SingleNewsTelegramButton item={item} onSent={onSent} lang={lang} />
        <Button size="sm" variant="outline" onClick={() => onSave(item)}>{item.isSaved ? text.unsave : text.save}</Button>
        <Button size="sm" variant="ghost" onClick={() => onHide(item)}>{text.hide}</Button>
      </div>
    </Card>
  );
}

function DailyTopStories({ summary, lang }: { summary: DailyBriefSummary; lang: Lang }) {
  const text = copy[lang];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Badge tone="purple">🔥 Top 5</Badge>
          <h2 className="mt-3 text-xl font-black text-white">{text.topStories}</h2>
        </div>
        <span className="text-xs font-bold text-slate-500">{summary.totalItems} {text.items}</span>
      </div>
      <div className="mt-4 space-y-3">
        {summary.topStories.map((item, index) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
            <p className="text-xs font-black text-cyan-200">#{index + 1} · Priority {item.priorityScore}</p>
            <p className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-white">{itemTitle(item, lang)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NewsSummaryPanel({ data, message, lang }: { data: DailyBriefApiResponse; message: string; lang: Lang }) {
  const text = copy[lang];
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <DailyTopStories summary={data.summary} lang={lang} />
      <Card className="p-5">
        <Badge tone="green">{text.telegramStatus}</Badge>
        <h2 className="mt-3 text-xl font-black text-white">{text.telegram}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{message || text.noSendYet}</p>
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-xs leading-6 text-slate-400">{text.splitNote}</div>
      </Card>
      <DailyBriefSettings data={data} lang={lang} />
      <ScheduleBriefCard data={data} lang={lang} />
    </aside>
  );
}

function DailyBriefSettings({ data, lang }: { data: DailyBriefApiResponse; lang: Lang }) {
  const text = copy[lang];
  return (
    <Card className="p-5">
      <Badge tone="blue">{text.settings}</Badge>
      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
        <p>{text.realNews}: <span className="font-bold text-white">{data.settings.useRealNews ? text.on : text.offMock}</span></p>
        <p>{text.provider}: <span className="font-bold text-white">NewsData.io</span></p>
        <p>{text.countries}: <span className="font-bold text-white">{data.settings.countries.join(", ")}</span></p>
        <p>{text.languages}: <span className="font-bold text-white">{data.settings.languages.join(", ")}</span></p>
        <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-3 text-xs text-amber-100">{text.apiKeyNote}</p>
      </div>
    </Card>
  );
}

function ScheduleBriefCard({ data, lang }: { data: DailyBriefApiResponse; lang: Lang }) {
  const latest = data.logs[0];
  const text = copy[lang];
  return (
    <Card id="daily-brief-scheduler" className="p-5">
      <Badge tone="green">{text.scheduler}</Badge>
      <div className="mt-4 grid gap-3 text-sm text-slate-300">
        <div className="flex justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3"><span>{text.autoSend}</span><b className="text-white">{data.settings.autoSendTelegram ? "ON" : "OFF"}</b></div>
        <div className="flex justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3"><span>{text.time}</span><b className="text-white">{data.settings.telegramTime}</b></div>
        <div className="flex justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3"><span>{text.perCategory}</span><b className="text-white">{data.settings.maxItemsPerCategory}</b></div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-xs leading-6 text-slate-400">{text.lastLog}: {latest ? `${latest.status} · ${formatTime(latest.runAt, lang)} · ${latest.message}` : text.noLog}</div>
      </div>
    </Card>
  );
}

function ArticleReaderPanel({ item, onSent, onSave, lang }: { item: DailyBriefItem | null; onSent: (message: string) => void; onSave: (item: DailyBriefItem) => void; lang: Lang }) {
  if (!item) return null;
  const text = copy[lang];
  return (
    <Card className="p-5">
      <div className="flex flex-wrap gap-2">
        <Badge tone="blue">{categoryLabel(item.category, lang)}</Badge>
        <NewsSourceBadge item={item} lang={lang} />
      </div>
      <h2 className="mt-4 text-2xl font-black leading-9 text-white">{itemTitle(item, lang)}</h2>
      <p className="mt-2 text-xs font-semibold text-slate-500">{item.sourceName} · {formatTime(item.publishedAt, lang)}</p>
      <p className="mt-2 text-xs text-slate-500">{text.originalTitle}: {item.title}</p>
      <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4 text-sm leading-7 text-cyan-50">{itemSummary(item, lang)}</div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <p className="text-sm font-black text-white">{text.keyPoints}</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">{itemBullets(item, lang).map((point) => <p key={point}>• {point}</p>)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-7 text-slate-300">
          <p><span className="font-black text-white">{text.why}:</span> {item.whyItMatters}</p>
          <p className="mt-2"><span className="font-black text-white">{text.impact}:</span> {item.impact}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/15">{text.readOriginal}</a>
        <SingleNewsTelegramButton item={item} onSent={onSent} lang={lang} />
        <Button variant="outline" size="sm" onClick={() => onSave(item)}>{item.isSaved ? text.unsave : text.save}</Button>
        <Button variant="ghost" size="sm" onClick={() => void navigator.clipboard?.writeText(item.sourceUrl)}>{text.copyLink}</Button>
      </div>
      <p className="mt-4 text-xs leading-6 text-slate-500">{text.readerNote}</p>
    </Card>
  );
}

export function DailyBriefPage() {
  const { lang } = useLanguage();
  const text = copy[lang];
  const [data, setData] = useState<DailyBriefApiResponse | null>(null);
  const [active, setActive] = useState<DailyBriefCategoryKey>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<DailyBriefItem | null>(null);
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);

  const visibleItems = data?.items.filter((item) => !item.isHidden) || [];

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (active !== "all") params.set("category", active);
      if (search.trim()) params.set("search", search.trim());
      const nextData = await apiRequest<DailyBriefApiResponse>(`/api/news/latest${params.toString() ? `?${params.toString()}` : ""}`);
      setData(nextData);
      setSelected((current) => current && nextData.items.some((item) => item.id === current.id) ? current : nextData.items[0] || null);
    } catch (loadError) {
      setError(toErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [active, search]);

  async function summarize() {
    if (!data) return;
    const summary = await apiRequest<DailyBriefSummary>("/api/news/summarize", { method: "POST", body: JSON.stringify({ items: visibleItems }) });
    setData({ ...data, summary });
  }

  async function sendItems(items: DailyBriefItem[]) {
    if (!items.length) {
      setSendMessage(text.categorySendEmpty);
      return;
    }
    setSending(true);
    try {
      const summary = await apiRequest<DailyBriefSummary>("/api/news/summarize", { method: "POST", body: JSON.stringify({ items }) });
      const result = await apiRequest<SendResult>("/api/telegram/send-brief", { method: "POST", body: JSON.stringify({ items, summary }) });
      setSendMessage(result.message);
    } catch (sendError) {
      setSendMessage(toErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  }

  function updateItem(id: string, patch: Partial<DailyBriefItem>) {
    setData((current) => current ? { ...current, items: current.items.map((item) => item.id === id ? { ...item, ...patch } : item) } : current);
    setSelected((current) => current?.id === id ? { ...current, ...patch } : current);
  }

  function saveItem(item: DailyBriefItem) {
    updateItem(item.id, { isSaved: !item.isSaved });
    setSendMessage(text.savedMessage);
  }

  function hideItem(item: DailyBriefItem) {
    updateItem(item.id, { isHidden: true });
    setSendMessage(text.hiddenMessage);
    if (selected?.id === item.id) setSelected(visibleItems.find((candidate) => candidate.id !== item.id) || null);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, search.trim() ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [load, search]);

  return (
    <div className="space-y-6">
      <DailyBriefHeader
        search={search}
        setSearch={setSearch}
        onRefresh={load}
        onSummarize={() => void summarize()}
        onSendAll={() => void sendItems(data?.items.filter((item) => !item.isHidden) || [])}
        onSendCategory={() => void sendItems(visibleItems)}
        loading={loading}
        sending={sending}
        lang={lang}
      />
      {data && <DailyBriefStats data={data} lang={lang} />}
      {data && <NewsCategoryTabs categories={data.categories} active={active} setActive={setActive} lang={lang} />}
      {data && <CategoryInfoPanel active={active} lang={lang} />}
      {error && <ErrorState message={error} onRetry={load} lang={lang} />}
      {loading && <LoadingState lang={lang} />}
      {!loading && !error && data && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <main className="space-y-6">
            <ArticleReaderPanel item={selected} onSent={setSendMessage} onSave={saveItem} lang={lang} />
            {visibleItems.length === 0 ? <EmptyState lang={lang} /> : (
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleItems.map((item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    onRead={setSelected}
                    onSent={setSendMessage}
                    onSave={saveItem}
                    onHide={hideItem}
                    lang={lang}
                  />
                ))}
              </div>
            )}
          </main>
          <NewsSummaryPanel data={data} message={sendMessage} lang={lang} />
        </div>
      )}
    </div>
  );
}
