export type DailyBriefCategoryKey =
  | "all"
  | "thai"
  | "world"
  | "aiTech"
  | "cybersecurity"
  | "networkCloud"
  | "market"
  | "weatherPm25"
  | "traffic"
  | "todayTasks"
  | "importantEmail"
  | "sports"
  | "events"
  | "deals"
  | "publicAlerts"
  | "travelDeals"
  | "lifestyle";

export type TelegramStatus = "idle" | "queued" | "sent" | "failed" | "mock_sent";

export interface NewsSource {
  name: string;
  url: string;
  publishedAt?: string | null;
}

export interface DailyBriefCategory {
  key: DailyBriefCategoryKey;
  labelTh: string;
  labelEn: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export interface DailyBriefItem {
  id: string;
  title: string;
  titleTh: string;
  summaryTh: string;
  bulletPoints: string[];
  whyItMatters: string;
  impact: string;
  category: DailyBriefCategoryKey;
  tags: string[];
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  language: "th" | "en" | "unknown";
  priorityScore: number;
  relatedSources: NewsSource[];
  rawDescription: string;
  extractedText?: string;
  isSaved: boolean;
  isHidden: boolean;
  telegramStatus: TelegramStatus;
}

export interface DailyBriefSummary {
  date: string;
  topStories: DailyBriefItem[];
  categorySummaries: Record<string, string>;
  watchItems: string[];
  totalItems: number;
  summarizedItems: number;
  telegramStatus: TelegramStatus;
  generatedAt: string;
  mode: "mock" | "real" | "fallback";
}

export interface TelegramBriefPayload {
  date: string;
  items: DailyBriefItem[];
  summary?: DailyBriefSummary;
  categories?: DailyBriefCategoryKey[];
}

export interface DailyBriefSettings {
  useRealNews: boolean;
  newsProvider: "newsdata" | "googleNewsRss" | "hybrid";
  countries: string[];
  languages: string[];
  enabledCategories: DailyBriefCategoryKey[];
  telegramTime: string;
  autoSendTelegram: boolean;
  maxItemsPerCategory: number;
}

export interface DailyBriefRunLog {
  id: string;
  runAt: string;
  status: "success" | "failed" | "skipped";
  fetchedItems: number;
  summarizedItems: number;
  telegramParts: number;
  message: string;
}

export interface DailyBriefApiResponse {
  items: DailyBriefItem[];
  summary: DailyBriefSummary;
  categories: DailyBriefCategory[];
  settings: DailyBriefSettings;
  logs: DailyBriefRunLog[];
}
