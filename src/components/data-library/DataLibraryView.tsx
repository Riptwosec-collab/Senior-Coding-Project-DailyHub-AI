"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import type { ScheduledTask } from "@/types/scheduled-task";
import type { TaskRun } from "@/types/task-run";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useLanguage } from "@/contexts/LanguageContext";

type TopicKey = "all" | "daily" | "weather" | "product" | "email" | "concert" | "football" | "ideas" | "longread" | "failed";
type Topic = { key: Exclude<TopicKey, "all" | "failed">; icon: string; th: string; en: string; pattern: RegExp };

type SourceRecord = Record<string, unknown>;

const TOPICS: Topic[] = [
  { key: "daily", icon: "📰", th: "ข่าว / สรุปประจำวัน", en: "News / Daily Brief", pattern: /daily|brief|news|headline|ข่าว|สรุป/i },
  { key: "weather", icon: "🌦️", th: "สภาพอากาศ", en: "Weather", pattern: /weather|forecast|rain|temperature|อากาศ|ฝน/i },
  { key: "product", icon: "🌍", th: "สินค้าใหม่/น่าสนใจทั่วโลก", en: "Global Product Radar", pattern: /sale|product|price|radar|gadget|สินค้า|โปร/i },
  { key: "email", icon: "📧", th: "อีเมลสำคัญ", en: "Email Monitor", pattern: /email|gmail|mail|inbox|อีเมล/i },
  { key: "concert", icon: "🎤", th: "คอนเสิร์ต", en: "Concert Alerts", pattern: /concert|artist|music|ticket|live|คอนเสิร์ต|ศิลปิน/i },
  { key: "football", icon: "⚽", th: "ฟุตบอล", en: "Football", pattern: /football|soccer|world cup|match|score|บอล|ฟุตบอล/i },
  { key: "ideas", icon: "🧭", th: "ไอเดียวันหยุด", en: "Weekend Ideas", pattern: /weekend ideas|weekend idea|trip|travel|idea|เที่ยว|ไอเดีย/i },
  { key: "longread", icon: "📚", th: "บทความอ่านยาว", en: "Long Read", pattern: /weekend long read|long read|article|reading|บทความ|อ่านยาว/i },
];

const FILTERS: Array<{ key: TopicKey; icon: string; th: string; en: string }> = [
  { key: "all", icon: "✨", th: "ทั้งหมด", en: "All" },
  ...TOPICS,
  { key: "failed", icon: "❌", th: "มีปัญหา", en: "Failed" },
];

function asRecord(value: unknown): SourceRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as SourceRecord) : null;
}

function asText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
}

function short(value: string, max = 180) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function sourcesOf(run: TaskRun) {
  const sources = Array.isArray(run.rawInput.sources) ? run.rawInput.sources : [];
  return sources.map(asRecord).filter((source): source is SourceRecord => Boolean(source));
}

function sourceName(source: SourceRecord) {
  return asText(source.source) || asText(source.title) || "Source";
}

function itemsFromSource(source: SourceRecord) {
  const data = source.data;
  const dataRecord = asRecord(data);
  if (Array.isArray(source.items)) return source.items;
  if (Array.isArray(data)) return data;
  if (Array.isArray(dataRecord?.ideas)) return dataRecord.ideas;
  if (Array.isArray(dataRecord?.articles)) return dataRecord.articles;
  if (Array.isArray(dataRecord?.items)) return dataRecord.items;
  return data ? [data] : [];
}

function allItems(run: TaskRun) {
  return sourcesOf(run).flatMap(itemsFromSource);
}

function topicFor(task?: ScheduledTask, run?: TaskRun) {
  const sourceText = run ? sourcesOf(run).map(sourceName).join(" ") : "";
  const text = `${task?.type ?? ""} ${task?.name ?? ""} ${run?.gptOutput.title ?? ""} ${run?.gptOutput.summary ?? ""} ${sourceText}`;
  return TOPICS.find((topic) => topic.pattern.test(text)) ?? TOPICS[0];
}

function itemMainText(item: unknown) {
  const row = asRecord(item);
  if (!row) return String(item ?? "");
  return [row.product, row.title, row.match, row.idea, row.subject, row.artist, row.location, row.description, row.content, row.highlight, row.whyInteresting]
    .map(asText)
    .filter(Boolean)
    .slice(0, 3)
    .join(" — ");
}

function detailRows(item: unknown): Array<[string, string]> {
  const row = asRecord(item);
  if (!row) return [];
  const pairs: Array<[string, unknown]> = [
    ["หมวด / Category", row.category],
    ["แหล่งเทรนด์ / Trend source", row.trendSource || row.country || row.source],
    ["แบรนด์ / Brand", row.brand || row.maker || row.store],
    ["เหตุผลที่น่าสนใจ / Why", row.whyInteresting || row.why || row.reason],
    ["จุดเด่น / Highlight", row.highlight || row.feature || row.keyMoment],
    ["เหมาะกับ / For", row.targetUser || row.audience],
    ["ราคา / Price", row.priceRange || row.currentPrice || row.price],
    ["ควรเช็ก / Check", row.checkBeforeBuy || row.action],
    ["ลิงก์ / Link", row.url || row.link],
  ];
  return pairs.map(([label, value]) => [label, asText(value)]).filter(([, value]) => Boolean(value));
}

function searchText(run: TaskRun, task?: ScheduledTask) {
  return `${task?.name ?? ""} ${task?.type ?? ""} ${run.gptOutput.title} ${run.gptOutput.summary} ${run.translatedContent ?? ""} ${run.originalContent ?? ""} ${JSON.stringify(run.rawInput)}`.toLowerCase();
}

function statusTone(status: string) {
  if (status === "success") return "green" as const;
  if (status === "failed") return "red" as const;
  if (status === "running") return "purple" as const;
  return "gray" as const;
}

function telegramTone(status: string | null | undefined) {
  if (status === "sent" || status?.startsWith("mock_sent")) return "green" as const;
  if (status?.includes("failed")) return "red" as const;
  if (status?.includes("skipped")) return "gray" as const;
  return "purple" as const;
}

export function DataLibraryView({ initialRunId = "" }: { initialRunId?: string }) {
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
  const visibleRuns = useMemo(() => runs.filter((run) => {
    const task = taskMap.get(run.taskId);
    if (runId && run.id !== runId) return false;
    if (filter === "failed" && run.status !== "failed" && !run.telegramStatus?.includes("failed")) return false;
    if (filter !== "all" && filter !== "failed" && topicFor(task, run).key !== filter) return false;
    return !query || searchText(run, task).includes(query.toLowerCase());
  }), [filter, query, runId, runs, taskMap]);

  const totalItems = runs.reduce((total, run) => total + allItems(run).length, 0);
  const selectedItems = visibleRuns.reduce((total, run) => total + allItems(run).length, 0);

  if (loading) return <LoadingState title={isTh ? "กำลังโหลดคลังข้อมูล" : "Loading Data Library"} description={isTh ? "กำลังดึงข้อมูลเต็มจาก API" : "Fetching full data from API"} />;
  if (error) return <ErrorState title={isTh ? "โหลด Data Library ไม่สำเร็จ" : "Data Library loading failed"} description={error} onRetry={load} />;

  return (
    <div className="nimbus-depth-space space-y-8">
      <Card className="nimbus-pulse-dot relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <Badge tone="purple">🧊 Data Library</Badge>
          <h1 className="mt-5 max-w-4xl text-3xl font-black text-white sm:text-5xl">{isTh ? "คลังข้อมูลเต็มของ Nimbus Daily" : "Nimbus Daily full data library"}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            {isTh ? "Telegram ส่งเฉพาะสรุปสั้น ส่วนข้อมูลจำนวนมากทั้งหมดถูกเก็บไว้ที่นี่ แยกหมวด ค้นหา และอ่านเต็มได้แบบ interactive" : "Telegram sends compact summaries. All full collected data is stored here by category with search and interactive reading cards."}
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Card className="p-4"><p className="text-sm text-slate-400">Runs</p><p className="text-3xl font-black text-white">{runs.length}</p></Card>
            <Card className="p-4"><p className="text-sm text-slate-400">Items</p><p className="text-3xl font-black text-white">{totalItems}</p></Card>
            <Card className="p-4"><p className="text-sm text-slate-400">Visible</p><p className="text-3xl font-black text-white">{selectedItems}</p></Card>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input className="min-h-12 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50 focus:bg-slate-950/90" onChange={(event) => setQuery(event.target.value)} placeholder={isTh ? "ค้นหาข้อมูลเต็ม เช่น AI, football, product, concert..." : "Search full data, sources, products, football, concerts..."} value={query} />
          <div className="flex flex-wrap gap-2">
            {runId && <Button onClick={() => setRunId("")} type="button" variant="secondary">{isTh ? "ดูทุก run" : "View all runs"}</Button>}
            <Button onClick={load} type="button" variant="outline">🔄 {isTh ? "รีเฟรช" : "Refresh"}</Button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map((item) => <button key={item.key} className={`nimbus-button-3d rounded-full border px-3 py-2 text-xs font-bold transition ${filter === item.key ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"}`} onClick={() => setFilter(item.key)} type="button">{item.icon} {isTh ? item.th : item.en}</button>)}
        </div>
      </Card>

      {visibleRuns.length === 0 ? <EmptyState title={isTh ? "ยังไม่มีข้อมูลในหมวดนี้" : "No data in this view"} description={isTh ? "ลองเปลี่ยน filter หรือรัน scheduler อีกครั้ง" : "Try another filter or run the scheduler again."} /> : (
        <div className="grid gap-5 xl:grid-cols-2">
          {visibleRuns.map((run) => {
            const task = taskMap.get(run.taskId);
            const topic = topicFor(task, run);
            const sources = sourcesOf(run);
            const items = allItems(run);
            return (
              <Card key={run.id} className="nimbus-orbit p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap gap-2"><Badge tone="blue">{topic.icon} {isTh ? topic.th : topic.en}</Badge><Badge tone={statusTone(run.status)}>{run.status}</Badge><Badge tone={telegramTone(run.telegramStatus)}>📨 {run.telegramStatus || "unknown"}</Badge></div>
                    <h2 className="mt-4 text-xl font-black text-white">{isTh && run.translation?.translatedTitle ? run.translation.translatedTitle : run.gptOutput.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{isTh ? run.translatedContent || run.translation?.translatedSummary || run.gptOutput.summary : run.gptOutput.summary}</p>
                  </div>
                  <div className="shrink-0 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-right"><p className="text-2xl font-black text-cyan-100">{run.priorityScore}</p><p className="text-[11px] uppercase tracking-wider text-slate-400">priority</p></div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3"><p className="text-xs text-slate-500">Sources</p><p className="mt-1 font-black text-white">{sources.length}</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3"><p className="text-xs text-slate-500">Items</p><p className="mt-1 font-black text-white">{items.length}</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3"><p className="text-xs text-slate-500">Updated</p><p className="mt-1 truncate text-xs font-bold text-white">{formatDateTime(run.startedAt)}</p></div></div>

                <div className="mt-5 space-y-4">
                  {sources.map((source, sourceIndex) => {
                    const sourceItems = itemsFromSource(source);
                    return (
                      <div key={`${run.id}-${sourceIndex}`} className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-black text-white">🗂 {sourceName(source)}</h3><Badge tone="gray">{sourceItems.length} items</Badge></div>
                        <div className="mt-4 grid gap-3">
                          {sourceItems.slice(0, 8).map((item, itemIndex) => {
                            const main = itemMainText(item);
                            const rows = detailRows(item);
                            return (
                              <div key={`${run.id}-${sourceIndex}-${itemIndex}`} className="nimbus-console-line rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                                <p className="relative z-10 text-sm font-bold leading-6 text-cyan-50">{main || JSON.stringify(item).slice(0, 180)}</p>
                                {rows.length > 0 && <dl className="relative z-10 mt-3 grid gap-2 text-xs leading-5 text-slate-300 sm:grid-cols-2">{rows.slice(0, 8).map(([rowLabel, value]) => <div key={`${rowLabel}-${value}`}><dt className="text-slate-500">{rowLabel}</dt><dd className="mt-1 break-words text-slate-200">{short(value, 160)}</dd></div>)}</dl>}
                              </div>
                            );
                          })}
                          {sourceItems.length > 8 && <p className="text-xs text-slate-400">…{isTh ? `มีอีก ${sourceItems.length - 8} รายการ` : `${sourceItems.length - 8} more items`}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-wrap gap-3"><Button asChild size="sm" variant="secondary"><Link href={`/task-results/${run.id}`}>{isTh ? "เปิดผลลัพธ์เดิม" : "Open original result"}</Link></Button><Button asChild size="sm" variant="outline"><Link href={`/data-library?run=${run.id}`}>{isTh ? "ลิงก์ run นี้" : "Run link"}</Link></Button></div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
