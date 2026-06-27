import type { ContentLanguage } from "@/types/translation";
import type { ScheduledTask } from "@/types/scheduled-task";
import { fetchConcertUpdates } from "./concert.service";
import { fetchEmailUpdates } from "./email-monitor.service";
import { fetchFootballUpdates } from "./football.service";
import { fetchNewsUpdates } from "./news.service";
import { fetchPublicAlertsInput } from "./public-alerts.service";
import { fetchSaleUpdates } from "./sale-monitor.service";
import { fetchTravelDealsInput } from "./travel-deals.service";
import { fetchUsStockNewsInput } from "./us-stock-news.service";
import { fetchWeatherUpdates } from "./weather.service";

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
  if (source === "News" || source === "World News" || source === "NewsData.io") return () => fetchNewsUpdates(task);
  if (source === "Gmail" || source === "Gmail Daily Digest") return () => fetchEmailUpdates(task);
  if (["Product Prices", "Global Product Radar", "Global Innovation Product Radar", "Product Trends", "สินค้าออกใหม่/น่าสนใจจากทั่วโลก"].includes(source)) return () => fetchSaleUpdates(task);
  if (source === "Football API" || source === "Football News Hub") return () => fetchFootballUpdates(task);
  if (source === "Weather API" || source === "Weather") return () => fetchWeatherUpdates(task);
  if (source === "Concert API" || source === "Concert API Thailand Only") return () => fetchConcertUpdates(task);
  if (["Public Notices", "BTS/MRT Status", "Government Alerts", "Public Alerts"].includes(source)) return () => fetchPublicAlertsInput(task);
  if (["Flight Deals", "Hotel Deals", "Travel Promotions", "Travel Deals"].includes(source)) return () => fetchTravelDealsInput(task);
  if (source === "US Stock News") return () => fetchUsStockNewsInput(task);
  return () => fetchNewsUpdates(task);
}

function isUsStockTask(task: ScheduledTask) {
  return task.type === "US Stock News" || /us stock news/i.test(task.name);
}

function getEffectiveSources(task: ScheduledTask) {
  const sources = task.dataSources.length > 0 ? [...task.dataSources] : ["News"];

  if (isUsStockTask(task) && !sources.includes("US Stock News")) sources.unshift("US Stock News");
  if (task.type === "Public Alerts" && !sources.includes("Public Notices")) sources.unshift("Public Notices");
  if (task.type === "Travel Deals" && !sources.includes("Travel Promotions")) sources.unshift("Travel Promotions");
  if (task.type === "World Cup Recap" && !sources.includes("Football News Hub")) sources.unshift("Football News Hub");
  if (task.type === "Sale Monitor" && !sources.includes("Global Innovation Product Radar")) sources.unshift("Global Innovation Product Radar");
  if (task.type === "Email Monitor" && !sources.includes("Gmail Daily Digest")) sources.unshift("Gmail Daily Digest");

  return Array.from(new Set(sources));
}

export async function collectTaskDataSources(task: ScheduledTask) {
  const sources = getEffectiveSources(task);
  const results = await Promise.all(sources.map((source) => safeSource(source, sourceHandler(source, task))));

  return {
    task: {
      id: task.id,
      name: isUsStockTask(task) ? "US Stock News" : task.name,
      type: isUsStockTask(task) ? "US Stock News" : task.type,
      scheduleType: task.scheduleType,
      timezone: task.timezone,
    },
    collectedAt: new Date().toISOString(),
    sources: results,
  };
}
