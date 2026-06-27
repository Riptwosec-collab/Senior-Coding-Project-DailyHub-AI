"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { DailyBriefApiResponse, DailyBriefCategory, DailyBriefCategoryKey, DailyBriefItem, DailyBriefSummary } from "@/types/daily-brief";

type SendResult = { status: string; message: string; parts: number };

function formatTime(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

function categoryLabel(categories: DailyBriefCategory[], key: DailyBriefCategoryKey) {
  return categories.find((category) => category.key === key)?.labelTh ?? key;
}

export function LoadingState() {
  return (
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
  );
}

export function EmptyState() {
  return (
    <Card className="p-8 text-center">
      <p className="text-4xl">🔎</p>
      <h3 className="mt-3 text-xl font-black text-white">ไม่พบข่าวในตัวกรองนี้</h3>
      <p className="mt-2 text-sm text-slate-400">ลองเปลี่ยนหมวด หรือค้นหาด้วยคำที่กว้างขึ้น</p>
    </Card>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-rose-300/25 bg-rose-400/[0.06] p-6">
      <Badge tone="red">Error</Badge>
      <h3 className="mt-3 text-xl font-black text-white">โหลด Daily Brief ไม่สำเร็จ</h3>
      <p className="mt-2 text-sm leading-6 text-rose-100/85">{message}</p>
      <Button className="mt-5" variant="secondary" onClick={onRetry}>ลองอีกครั้ง</Button>
    </Card>
  );
}

export function DailyBriefHeader({ search, setSearch, onRefresh, onSummarize, onSend, loading, sending }: { search: string; setSearch: (value: string) => void; onRefresh: () => void; onSummarize: () => void; onSend: () => void; loading: boolean; sending: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-slate-950/55 p-5 shadow-2xl shadow-cyan-950/30 sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-12 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">📰 Daily Brief Hub</Badge>
            <Badge tone="purple">NewsData.io Ready</Badge>
            <Badge tone="green">Telegram Thai Summary</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">ประจำวัน / Daily Brief</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">สรุปข่าวและข้อมูลสำคัญที่ควรรู้วันนี้ แยกหมวดชัดเจน อ่านเต็มได้ ส่ง Telegram ได้ และ fallback เป็น mock data เมื่อยังไม่มี API key</p>
        </div>
        <div className="flex w-full flex-col gap-3 xl:w-[32rem]">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 shadow-inner shadow-black/20">
            <span className="text-slate-400">⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาข่าว เช่น AI, หุ้น, PM2.5, Cisco..." className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500" />
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <Button disabled={loading} onClick={onRefresh}>{loading ? "กำลังดึง..." : "ดึงข่าวล่าสุด"}</Button>
            <Button disabled={loading} variant="secondary" onClick={onSummarize}>สรุปใหม่</Button>
            <Button disabled={sending} variant="secondary" onClick={onSend}>{sending ? "กำลังส่ง..." : "ส่ง Telegram"}</Button>
            <a href="#daily-brief-scheduler" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] px-4 py-2.5 text-sm font-bold text-white transition hover:border-cyan-200/30 hover:bg-white/[0.11]">ตั้งเวลา</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DailyBriefStats({ data }: { data: DailyBriefApiResponse }) {
  const topPriority = data.summary.topStories[0];
  const largestCategory = useMemo(() => {
    const counts = data.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    const [key, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
    return { label: key === "-" ? "-" : categoryLabel(data.categories, key as DailyBriefCategoryKey), count };
  }, [data]);

  const stats = [
    { label: "อัปเดตล่าสุด", value: formatTime(data.summary.generatedAt), hint: data.summary.mode === "fallback" ? "Fallback mode" : data.summary.mode },
    { label: "ข่าวที่พบ", value: data.summary.totalItems.toString(), hint: "หลัง dedupe" },
    { label: "สรุปแล้ว", value: data.summary.summarizedItems.toString(), hint: "ภาษาไทยพร้อมส่ง" },
    { label: "Telegram", value: data.summary.telegramStatus, hint: "พร้อม retry" },
    { label: "Top Priority", value: topPriority ? `${topPriority.priorityScore}/100` : "-", hint: topPriority?.titleTh || "ยังไม่มี" },
    { label: "หมวดเยอะสุด", value: largestCategory.label, hint: `${largestCategory.count} รายการ` },
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

export function NewsCategoryTabs({ categories, active, setActive }: { categories: DailyBriefCategory[]; active: DailyBriefCategoryKey; setActive: (key: DailyBriefCategoryKey) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => {
        const isActive = active === category.key;
        return (
          <button key={category.key} type="button" onClick={() => setActive(category.key)} className={cn("inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition active:scale-[0.98]", isActive ? "border-cyan-300/40 bg-cyan-300/15 text-white shadow-[0_0_26px_rgba(34,211,238,0.12)]" : "border-white/10 bg-white/[0.045] text-slate-400 hover:border-cyan-300/30 hover:text-white")}>
            <span>{category.icon}</span>
            <span>{category.labelTh}</span>
          </button>
        );
      })}
    </div>
  );
}

export function NewsSourceBadge({ item }: { item: DailyBriefItem }) {
  return <Badge tone={item.relatedSources.length ? "purple" : "gray"}>{item.relatedSources.length ? `หลายแหล่งข่าว +${item.relatedSources.length}` : item.sourceName}</Badge>;
}

export function NewsStatusBadge({ item }: { item: DailyBriefItem }) {
  if (item.telegramStatus === "sent" || item.telegramStatus === "mock_sent") return <Badge tone="green">ส่ง Telegram แล้ว</Badge>;
  if (item.telegramStatus === "failed") return <Badge tone="red">ส่งไม่สำเร็จ</Badge>;
  if (item.isSaved) return <Badge tone="blue">บันทึกแล้ว</Badge>;
  return <Badge tone="gray">พร้อมอ่าน</Badge>;
}

export function SingleNewsTelegramButton({ item, onSent }: { item: DailyBriefItem; onSent: (message: string) => void }) {
  const [sending, setSending] = useState(false);
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
  return <Button size="sm" variant="secondary" disabled={sending} onClick={send}>{sending ? "ส่งอยู่..." : "ส่งข่าวนี้"}</Button>;
}

export function NewsCard({ item, categories, onRead, onSent }: { item: DailyBriefItem; categories: DailyBriefCategory[]; onRead: (item: DailyBriefItem) => void; onSent: (message: string) => void }) {
  return (
    <Card className="group flex min-h-[25rem] flex-col p-5 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.045]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="blue">{categoryLabel(categories, item.category)}</Badge>
        <NewsSourceBadge item={item} />
        <NewsStatusBadge item={item} />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="line-clamp-3 text-xl font-black leading-8 text-white">{item.titleTh}</h3>
        <span className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-black text-cyan-100">{item.priorityScore}</span>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">{item.sourceName} · {formatTime(item.publishedAt)}</p>
      <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-300">{item.summaryTh}</p>
      <div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
        {item.bulletPoints.slice(0, 3).map((point) => <p key={point}>• {point}</p>)}
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-xs leading-6 text-slate-400">
        <span className="font-bold text-cyan-200">ทำไมควรรู้:</span> {item.whyItMatters}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((tag) => <span key={tag} className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-bold text-slate-300">#{tag}</span>)}
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Button size="sm" onClick={() => onRead(item)}>อ่านเต็ม</Button>
        <SingleNewsTelegramButton item={item} onSent={onSent} />
        <Button size="sm" variant="outline">บันทึกไว้</Button>
        <Button size="sm" variant="ghost">ซ่อน</Button>
      </div>
    </Card>
  );
}

export function DailyTopStories({ summary }: { summary: DailyBriefSummary }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Badge tone="purple">🔥 Top 5</Badge>
          <h2 className="mt-3 text-xl font-black text-white">ข่าวสำคัญวันนี้</h2>
        </div>
        <span className="text-xs font-bold text-slate-500">{summary.totalItems} items</span>
      </div>
      <div className="mt-4 space-y-3">
        {summary.topStories.map((item, index) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
            <p className="text-xs font-black text-cyan-200">#{index + 1} · Priority {item.priorityScore}</p>
            <p className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-white">{item.titleTh}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function NewsSummaryPanel({ data, message }: { data: DailyBriefApiResponse; message: string }) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <DailyTopStories summary={data.summary} />
      <Card className="p-5">
        <Badge tone="green">Telegram Status</Badge>
        <h2 className="mt-3 text-xl font-black text-white">สถานะการส่ง</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{message || "ยังไม่ได้ส่งในรอบนี้"}</p>
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-xs leading-6 text-slate-400">
          ถ้าข้อความยาวเกิน limit ระบบจะแบ่งส่งหลายข้อความอัตโนมัติ และแสดงจำนวน part จาก API
        </div>
      </Card>
      <DailyBriefSettings data={data} />
      <ScheduleBriefCard data={data} />
    </aside>
  );
}

export function DailyBriefSettings({ data }: { data: DailyBriefApiResponse }) {
  return (
    <Card className="p-5">
      <Badge tone="blue">Settings</Badge>
      <h2 className="mt-3 text-xl font-black text-white">Daily Brief Settings</h2>
      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
        <p>ข่าวจริง: <span className="font-bold text-white">{data.settings.useRealNews ? "เปิด" : "ปิด / ใช้ mock"}</span></p>
        <p>Provider: <span className="font-bold text-white">NewsData.io</span></p>
        <p>ประเทศ: <span className="font-bold text-white">{data.settings.countries.join(", ")}</span></p>
        <p>ภาษา: <span className="font-bold text-white">{data.settings.languages.join(", ")}</span></p>
        <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-3 text-xs text-amber-100">API keys ต้องอยู่ใน server env เท่านั้น เช่น NEWSDATA_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID ห้ามใช้ NEXT_PUBLIC</p>
      </div>
    </Card>
  );
}

export function ScheduleBriefCard({ data }: { data: DailyBriefApiResponse }) {
  const latest = data.logs[0];
  return (
    <Card id="daily-brief-scheduler" className="p-5">
      <Badge tone="green">Scheduler</Badge>
      <h2 className="mt-3 text-xl font-black text-white">Daily Brief Scheduler</h2>
      <div className="mt-4 grid gap-3 text-sm text-slate-300">
        <div className="flex justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3"><span>Auto send</span><b className="text-white">{data.settings.autoSendTelegram ? "ON" : "OFF"}</b></div>
        <div className="flex justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3"><span>เวลา</span><b className="text-white">{data.settings.telegramTime}</b></div>
        <div className="flex justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3"><span>ข่าวต่อหมวด</span><b className="text-white">{data.settings.maxItemsPerCategory}</b></div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-xs leading-6 text-slate-400">Last log: {latest ? `${latest.status} · ${formatTime(latest.runAt)} · ${latest.message}` : "ยังไม่มี log"}</div>
      </div>
    </Card>
  );
}

export function ArticleReaderPanel({ item, categories, onSent }: { item: DailyBriefItem | null; categories: DailyBriefCategory[]; onSent: (message: string) => void }) {
  if (!item) return null;
  return (
    <Card className="p-5">
      <div className="flex flex-wrap gap-2">
        <Badge tone="blue">{categoryLabel(categories, item.category)}</Badge>
        <NewsSourceBadge item={item} />
      </div>
      <h2 className="mt-4 text-2xl font-black leading-9 text-white">{item.titleTh}</h2>
      <p className="mt-2 text-xs font-semibold text-slate-500">{item.sourceName} · {formatTime(item.publishedAt)}</p>
      <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4 text-sm leading-7 text-cyan-50">{item.summaryTh}</div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <p className="text-sm font-black text-white">Key points</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">{item.bulletPoints.map((point) => <p key={point}>• {point}</p>)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-7 text-slate-300">
          <p><span className="font-black text-white">Why it matters:</span> {item.whyItMatters}</p>
          <p className="mt-2"><span className="font-black text-white">Impact:</span> {item.impact}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/15">เปิดแหล่งข่าวต้นฉบับ</a>
        <SingleNewsTelegramButton item={item} onSent={onSent} />
        <Button variant="outline" size="sm">บันทึก</Button>
        <Button variant="ghost" size="sm" onClick={() => void navigator.clipboard?.writeText(item.sourceUrl)}>คัดลอกลิงก์</Button>
      </div>
      <p className="mt-4 text-xs leading-6 text-slate-500">หน้าอ่านเต็มแสดงเป็นสรุปและ paraphrase ของระบบ ไม่คัดลอกบทความเต็มจากต้นฉบับแบบยาว</p>
    </Card>
  );
}

export function DailyBriefPage() {
  const [data, setData] = useState<DailyBriefApiResponse | null>(null);
  const [active, setActive] = useState<DailyBriefCategoryKey>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<DailyBriefItem | null>(null);
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
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
  }

  async function summarize() {
    if (!data) return;
    const summary = await apiRequest<DailyBriefSummary>("/api/news/summarize", { method: "POST", body: JSON.stringify({ items: data.items }) });
    setData({ ...data, summary });
  }

  async function sendBrief() {
    if (!data) return;
    setSending(true);
    try {
      const result = await apiRequest<SendResult>("/api/telegram/send-brief", { method: "POST", body: JSON.stringify({ items: data.items, summary: data.summary }) });
      setSendMessage(result.message);
    } catch (sendError) {
      setSendMessage(toErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  }

  useEffect(() => { void load(); }, [active]);

  const visibleItems = data?.items || [];

  return (
    <div className="space-y-6">
      <DailyBriefHeader search={search} setSearch={setSearch} onRefresh={load} onSummarize={() => void summarize()} onSend={() => void sendBrief()} loading={loading} sending={sending} />
      {data && <DailyBriefStats data={data} />}
      {data && <NewsCategoryTabs categories={data.categories} active={active} setActive={setActive} />}
      {error && <ErrorState message={error} onRetry={load} />}
      {loading && <LoadingState />}
      {!loading && !error && data && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <main className="space-y-6">
            <ArticleReaderPanel item={selected} categories={data.categories} onSent={setSendMessage} />
            {visibleItems.length === 0 ? <EmptyState /> : (
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleItems.map((item) => <NewsCard key={item.id} item={item} categories={data.categories} onRead={setSelected} onSent={setSendMessage} />)}
              </div>
            )}
          </main>
          <NewsSummaryPanel data={data} message={sendMessage} />
        </div>
      )}
    </div>
  );
}
