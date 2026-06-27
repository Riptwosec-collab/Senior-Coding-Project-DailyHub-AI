import type { DailyBriefCategoryKey, DailyBriefItem } from "@/types/daily-brief";
import { translateToThai } from "@/services/translation.service";

interface NewsDataArticle {
  article_id?: string;
  title?: string;
  link?: string;
  description?: string;
  content?: string;
  pubDate?: string;
  pubDateTZ?: string;
  source_id?: string;
  source_name?: string;
  language?: string;
  country?: string[] | string;
  category?: string[] | string;
  keywords?: string[] | null;
}

interface NewsDataResponse {
  status?: string;
  totalResults?: number;
  results?: NewsDataArticle[];
  nextPage?: string;
  message?: string;
}

const CATEGORY_QUERY: Partial<Record<DailyBriefCategoryKey, string>> = {
  thai: "Thailand politics economy society",
  world: "world geopolitics economy",
  aiTech: "OpenAI Google Apple Microsoft AI startup developer tools",
  cybersecurity: "cybersecurity vulnerability data breach malware phishing security advisory",
  networkCloud: "Cisco Fortinet Palo Alto Cloudflare AWS Azure Google Cloud Vercel GitHub outage infrastructure",
  market: "US stock market bitcoin crypto gold dollar semiconductor AI space stocks",
  sports: "football soccer match fixture result",
  events: "concert event product launch Thailand",
  deals: "Shopee Lazada gadget software domain hosting promotion",
  publicAlerts: "Thailand government announcement public alert BTS MRT disruption public service",
  travelDeals: "Thailand flight deals airfare hotel room rate travel promotion resort package",
};

function detectCategory(article: NewsDataArticle): DailyBriefCategoryKey {
  const text = [article.title, article.description, article.content, article.category, article.keywords?.join(" ")].flat().filter(Boolean).join(" ").toLowerCase();
  if (/cyber|vulnerability|cve|malware|phishing|breach|ransomware|security/.test(text)) return "cybersecurity";
  if (/openai|google|apple|microsoft|ai|startup|software|developer|เครื่องมือ/.test(text)) return "aiTech";
  if (/cisco|fortinet|palo alto|cloudflare|aws|azure|google cloud|vercel|github|network|outage|cloud/.test(text)) return "networkCloud";
  if (/stock|nasdaq|nyse|bitcoin|crypto|gold|dollar|semiconductor|nvda|amd|tsm|ตลาดหุ้น|หุ้น/.test(text)) return "market";
  if (/football|soccer|match|fixture|ผลบอล|ฟุตบอล|กีฬา/.test(text)) return "sports";
  if (/government|public alert|official notice|announcement|bts|mrt|train disruption|transit disruption|road closure|ประกาศ|แจ้งเตือนรัฐ|หน่วยงานรัฐ|ขัดข้อง|ปิดถนน|บริการสาธารณะ/.test(text)) return "publicAlerts";
  if (/flight deal|airfare|airline|hotel|resort|room rate|travel promotion|travel deal|package tour|ตั๋วเครื่องบิน|โปรบิน|สายการบิน|โรงแรม|ห้องพัก|รีสอร์ต|แพ็กเกจเที่ยว|โปรท่องเที่ยว|เที่ยวไทย/.test(text)) return "travelDeals";
  if (/concert|ticket|artist|event|product launch|คอนเสิร์ต|อีเวนต์|สินค้าใหม่/.test(text)) return "events";
  if (/deal|discount|promotion|shopee|lazada|hosting|domain|โปร|ลดราคา/.test(text)) return "deals";
  if (/thailand|thai|bangkok|รัฐบาล|เศรษฐกิจไทย|กรุงเทพ/.test(text)) return "thai";
  return "world";
}

function getTags(article: NewsDataArticle, category: DailyBriefCategoryKey) {
  const raw = Array.isArray(article.keywords) ? article.keywords : [];
  const categoryTag = category.replace(/([A-Z])/g, " $1").replace(/^./, (item) => item.toUpperCase());
  return Array.from(new Set([categoryTag, ...raw.filter(Boolean).slice(0, 4)])).slice(0, 5);
}

function getSourceName(article: NewsDataArticle) {
  return article.source_name || article.source_id || "NewsData.io";
}

function asLanguage(value?: string): DailyBriefItem["language"] {
  if (value === "th" || value === "en") return value;
  return "unknown";
}

export async function mapNewsDataArticle(article: NewsDataArticle, index: number): Promise<DailyBriefItem> {
  const category = detectCategory(article);
  const title = article.title || "Untitled news";
  const description = article.description || article.content || title;
  const sourceUrl = article.link || "https://newsdata.io/";
  const sourceName = getSourceName(article);
  const language = asLanguage(article.language);
  const publishedAt = article.pubDate ? new Date(article.pubDate).toISOString() : new Date().toISOString();
  const translation = await translateToThai({
    title,
    source: sourceName,
    content: description,
    rawInput: {
      sourceUrl,
      publishedAt,
      category,
      keywords: article.keywords ?? [],
      originalLanguage: article.language,
    },
    gptOutput: {
      title,
      summary: description,
      recommended_action: "อ่านข่าวเต็มจากแหล่งข่าวต้นฉบับ และใช้สรุปนี้เป็นข่าวย่อสำหรับ Telegram",
    },
  });

  return {
    id: article.article_id || `newsdata_${index}_${Buffer.from(sourceUrl).toString("base64url").slice(0, 16)}`,
    title,
    titleTh: translation.translatedTitle,
    summaryTh: translation.translatedSummary.slice(0, 620),
    bulletPoints: translation.translatedBullets.length ? translation.translatedBullets.slice(0, 3) : [
      translation.translatedSummary.slice(0, 150),
      `แหล่งข่าว: ${sourceName}`,
      `หมวด: ${category}`,
    ],
    whyItMatters: "เป็นข่าวล่าสุดที่ระบบดึงจาก NewsData.io และควรอ่านต่อจากแหล่งข่าวต้นฉบับ",
    impact: "ใช้เป็นข้อมูลประกอบ Daily Brief และการส่ง Telegram ไม่ใช่บทความเต็มแบบคัดลอก",
    category,
    tags: getTags(article, category),
    sourceName,
    sourceUrl,
    publishedAt,
    language,
    priorityScore: 68 + Math.min(24, Math.max(0, Math.round(description.length / 90))) + (category === "cybersecurity" || category === "aiTech" ? 4 : 0),
    relatedSources: [],
    rawDescription: description,
    extractedText: article.content || translation.originalContent || undefined,
    isSaved: false,
    isHidden: false,
    telegramStatus: "idle",
  };
}

function buildNewsDataUrl(category?: DailyBriefCategoryKey) {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://newsdata.io/api/1/latest");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("language", process.env.NEWS_LANGUAGES || "th,en");
  url.searchParams.set("country", process.env.NEWS_COUNTRIES || "th,us,gb");
  if (category && category !== "all" && CATEGORY_QUERY[category]) url.searchParams.set("q", CATEGORY_QUERY[category]);
  return url;
}

export async function fetchNewsDataLatest(category?: DailyBriefCategoryKey) {
  const url = buildNewsDataUrl(category);
  if (!url) {
    return { mode: "mock" as const, items: [] as DailyBriefItem[], message: "Missing NEWSDATA_API_KEY" };
  }

  const response = await fetch(url.toString(), { cache: "no-store" });
  const payload = await response.json() as NewsDataResponse;

  if (!response.ok || payload.status === "error") {
    throw new Error(payload.message || `NewsData request failed: ${response.status}`);
  }

  return {
    mode: "real" as const,
    items: await Promise.all((payload.results || []).map(mapNewsDataArticle)),
    message: `Fetched ${payload.results?.length || 0} item(s) from NewsData.io`,
  };
}
