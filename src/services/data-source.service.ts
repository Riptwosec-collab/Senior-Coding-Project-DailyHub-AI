import type { ContentLanguage } from "@/types/translation";
import type { ScheduledTask } from "@/types/scheduled-task";
import { fetchConcertUpdates } from "./concert.service";
import { fetchEmailUpdates } from "./email-monitor.service";
import { fetchFootballUpdates } from "./football.service";
import { fetchNewsUpdates } from "./news.service";
import { fetchSaleUpdates } from "./sale-monitor.service";
import { fetchWeatherUpdates } from "./weather.service";
import { fetchWeekendIdeasInput } from "./weekend-ideas.service";
import { fetchWeekendLongReadUpdates } from "./weekend-long-read.service";

export interface StandardDataSourcePayload {
  title: string;
  source: string;
  originalContent: string;
  language?: ContentLanguage;
  items: unknown[];
}

export interface DataSourceResult {
  source: string;
  status: "success" | "mock" | "skipped" | "failed";
  data: unknown;
  title?: string;
  originalContent?: string;
  language?: ContentLanguage;
  items?: unknown[];
  error?: string;
}

export function toStandardDataSourcePayload(result: DataSourceResult): StandardDataSourcePayload {
  const items = result.items ?? (Array.isArray(result.data) ? result.data : result.data ? [result.data] : []);
  return {
    title: result.title || `${result.source} update`,
    source: result.source,
    originalContent: result.originalContent || JSON.stringify(result.data ?? items, null, 2),
    language: result.language,
    items,
  };
}

async function safeSource(source: string, handler: () => Promise<DataSourceResult>): Promise<DataSourceResult> {
  try {
    const result = await handler();
    const standard = toStandardDataSourcePayload(result);
    return { ...result, ...standard };
  } catch (error) {
    return {
      source,
      status: "failed",
      data: null,
      title: `${source} failed`,
      originalContent: error instanceof Error ? error.message : "Unknown data source error",
      language: "unknown",
      items: [],
      error: error instanceof Error ? error.message : "Unknown data source error",
    };
  }
}

function sourceHandler(source: string, task: ScheduledTask) {
  if (source === "News" || source === "World News") return () => fetchNewsUpdates(task);
  if (source === "Gmail" || source === "Gmail Daily Digest") return () => fetchEmailUpdates(task);
  if (["Product Prices", "Global Product Radar", "Global Innovation Product Radar", "Product Trends", "สินค้าออกใหม่/น่าสนใจจากทั่วโลก"].includes(source)) {
    return () => fetchSaleUpdates(task);
  }
  if (source === "Football API" || source === "Football News Hub") return () => fetchFootballUpdates(task);
  if (source === "Weather API") return () => fetchWeatherUpdates(task);
  if (source === "Concert API" || source === "Concert API Thailand Only") return () => fetchConcertUpdates(task);
  if (source === "Weekend Ideas" || source === "US Stock News") return () => fetchWeekendIdeasInput(task);
  if (source === "Weekend Long Read") return () => fetchWeekendLongReadUpdates(task);
  return () => fetchNewsUpdates(task);
}

function getEffectiveSources(task: ScheduledTask) {
  const sources = task.dataSources.length > 0 ? [...task.dataSources] : ["News"];

  if (task.type === "Weekend Ideas" && !sources.includes("US Stock News")) {
    sources.unshift("US Stock News");
  }

  if (task.type === "Weekend Long Read" && !sources.includes("Weekend Long Read")) {
    sources.unshift("Weekend Long Read");
  }

  if (task.type === "World Cup Recap" && !sources.includes("Football News Hub")) {
    sources.unshift("Football News Hub");
  }

  if (task.type === "Sale Monitor" && !sources.includes("Global Innovation Product Radar")) {
    sources.unshift("Global Innovation Product Radar");
  }

  if (task.type === "Email Monitor" && !sources.includes("Gmail Daily Digest")) {
    sources.unshift("Gmail Daily Digest");
  }

  return Array.from(new Set(sources));
}

export async function collectTaskDataSources(task: ScheduledTask) {
  const sources = getEffectiveSources(task);
  const results = await Promise.all(
    sources.map((source) => safeSource(source, sourceHandler(source, task))),
  );

  return {
    task: {
      id: task.id,
      name: task.name,
      type: task.type,
      scheduleType: task.scheduleType,
      timezone: task.timezone,
    },
    collectedAt: new Date().toISOString(),
    sources: results,
  };
}
