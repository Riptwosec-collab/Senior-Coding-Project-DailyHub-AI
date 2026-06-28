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
  lifestyle: "Thailand restaurant cafe buffet weekend activity lifestyle event travel ideas",
};

type FetchableDailyBriefCategory = Exclude<DailyBriefCategoryKey, "all">;

type GoogleNewsRssItem = {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  sourceName: string;
  sourceUrl?: string;
};

const REAL_NEWS_TARGET_COUNT = Math.max(1, Number(process.env.NEWS_ITEMS_PER_CATEGORY || "5"));
const GOOGLE_NEWS_TIMEOUT_MS = Math.max(2500, Number(process.env.GOOGLE_NEWS_TIMEOUT_MS || "8500"));

const GOOGLE_NEWS_CATEGORIES: FetchableDailyBriefCategory[] = [
  "thai",
  "world",
  "aiTech",
  "cybersecurity",
  "networkCloud",
  "market",
  "weatherPm25",
  "traffic",
  "todayTasks",
  "importantEmail",
  "sports",
  "events",
  "deals",
  "publicAlerts",
  "travelDeals",
  "lifestyle",
];

const GOOGLE_NEWS_QUERY: Record<FetchableDailyBriefCategory, string[]> = {
  thai: ["ข่าวไทยวันนี้ OR การเมือง OR เศรษฐกิจไทย OR สังคม OR อุบัติเหตุ"],
  world: ["ข่าวต่างประเทศ OR ข่าวโลก OR เศรษฐกิจโลก OR สงคราม OR ภูมิรัฐศาสตร์"],
  aiTech: ["OpenAI OR Google AI OR Apple AI OR Microsoft AI OR เทคโนโลยี", "AI tools OR developer tools OR startup OR software", "artificial intelligence OR generative AI OR machine learning OR developer platform"],
  cybersecurity: ["ความปลอดภัยไซเบอร์ OR ข้อมูลรั่ว OR มัลแวร์ OR phishing OR CVE", "cybersecurity OR vulnerability OR CVE OR malware OR phishing OR security advisory"],
  networkCloud: ["Cloudflare OR AWS OR Azure OR Google Cloud OR GitHub outage", "Cisco OR Fortinet OR Palo Alto OR network outage OR infrastructure outage"],
  market: ["ตลาดหุ้นสหรัฐ OR Bitcoin OR crypto OR ทอง OR ดอลลาร์ OR semiconductor", "NVDA OR semiconductor stocks OR stock market OR bitcoin OR gold"],
  weatherPm25: ["สภาพอากาศวันนี้ ฝน อุณหภูมิ PM2.5 กรุงเทพ ประเทศไทย"],
  traffic: ["จราจร OR รถติด OR BTS OR MRT OR น้ำท่วม OR เส้นทางสำคัญ", "Bangkok traffic OR BTS disruption OR MRT disruption OR flood"],
  todayTasks: ["GitHub Actions OR Vercel OR cron OR scheduler outage OR automation", "scheduled task OR job failure OR automation outage OR cloud outage", "GitHub OR Vercel OR cloud outage OR DevOps automation"],
  importantEmail: ["อีเมลหลอกลวง OR phishing OR Gmail security alert OR invoice", "Gmail phishing OR invoice scam OR email security warning"],
  sports: ["ผลบอล OR ตารางแข่ง OR ข่าวฟุตบอล OR สรุปหลังเกม"],
  events: ["คอนเสิร์ต OR อีเวนต์ OR สินค้าใหม่ OR เปิดตัวสินค้า OR ศิลปิน", "Thailand event OR concert OR product launch OR new product", "Bangkok event OR music festival OR concert Thailand OR exhibition"],
  deals: ["Shopee OR Lazada OR gadget OR software OR domain hosting OR โปรโมชั่น", "promotion OR discount OR gadget deals OR software deals OR hosting deal"],
  publicAlerts: ["ประกาศสำคัญ OR แจ้งเตือนรัฐ OR BTS ขัดข้อง OR MRT ขัดข้อง OR ปิดถนน", "government notice OR public alert OR BTS disruption OR MRT disruption Thailand"],
  travelDeals: ["โปรตั๋วเครื่องบิน OR โปรโมชั่นโรงแรม OR เที่ยวไทย OR flight deals OR hotel deals", "airline sale OR hotel promotion OR Thailand travel deals"],
  lifestyle: ["ร้านอาหาร OR คาเฟ่ OR บุฟเฟ่ต์ OR กิจกรรมวันหยุด OR ที่เที่ยวใกล้กรุงเทพ", "Bangkok cafe OR restaurant OR weekend activity OR lifestyle event Thailand"],
};

function truncate(value: string, max = 620) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function hasThaiText(value: string) {
  return /[\u0E00-\u0E7F]/.test(value);
}

function decodeXml(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\"",
  };

  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
      if (entity.startsWith("#x")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
      if (entity.startsWith("#")) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
      return named[entity.toLowerCase()] ?? match;
    });
}

function stripHtml(value: string) {
  return decodeXml(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getXmlTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
}

function getXmlTagAttribute(block: string, tag: string, attribute: string) {
  const match = block.match(new RegExp(`<${tag}\\b([^>]*)>`, "i"));
  if (!match) return "";
  const attrMatch = match[1].match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"));
  return attrMatch ? decodeXml(attrMatch[1]).trim() : "";
}

function parseGoogleNewsRss(xml: string): GoogleNewsRssItem[] {
  return Array.from(xml.matchAll(/<item\b[\s\S]*?<\/item>/gi))
    .map((match) => {
      const block = match[0];
      const title = stripHtml(getXmlTag(block, "title"));
      const link = stripHtml(getXmlTag(block, "link"));
      const description = stripHtml(getXmlTag(block, "description"));
      const pubDate = stripHtml(getXmlTag(block, "pubDate"));
      const sourceName = stripHtml(getXmlTag(block, "source")) || "Google News";
      const sourceUrl = getXmlTagAttribute(block, "source", "url");
      return { title, link, description, pubDate, sourceName, sourceUrl };
    })
    .filter((item) => item.title && item.link);
}

function buildGoogleNewsRssUrl(query: string) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", process.env.GOOGLE_NEWS_HL || "th");
  url.searchParams.set("gl", process.env.GOOGLE_NEWS_GL || "TH");
  url.searchParams.set("ceid", process.env.GOOGLE_NEWS_CEID || "TH:th");
  return url.toString();
}

async function fetchGoogleNewsXml(query: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GOOGLE_NEWS_TIMEOUT_MS);

  try {
    const response = await fetch(buildGoogleNewsRssUrl(query), {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "NimbusDaily/1.0 (+https://nimbusdaily.vercel.app)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });
    if (!response.ok) throw new Error(`Google News RSS failed: ${response.status}`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function buildThaiFallbackFromRealSource(item: GoogleNewsRssItem, category: DailyBriefCategoryKey) {
  const detail = CATEGORY_QUERY[category] || category;
  const original = truncate(item.description || item.title, 420);

  if (hasThaiText(original)) return original;

  return truncate(
    `แหล่งข่าว ${item.sourceName} รายงานเรื่อง "${item.title}" ในหัวข้อ ${detail}. เปิดลิงก์ต้นฉบับเพื่ออ่านรายละเอียดทั้งหมดจากแหล่งข่าวจริง`,
    520,
  );
}

function getGoogleNewsId(item: GoogleNewsRssItem, category: DailyBriefCategoryKey, index: number) {
  return `gnews_${category}_${index}_${Buffer.from(item.link).toString("base64url").slice(0, 16)}`;
}

function scoreGoogleNewsItem(category: DailyBriefCategoryKey, item: GoogleNewsRssItem, index: number) {
  const freshnessBoost = Math.max(0, 12 - index * 2);
  const urgentBoost = category === "cybersecurity" || category === "publicAlerts" || category === "traffic" ? 8 : 0;
  const textBoost = Math.min(8, Math.round((item.description || item.title).length / 120));
  return Math.min(98, 66 + freshnessBoost + urgentBoost + textBoost);
}

async function mapGoogleNewsItem(item: GoogleNewsRssItem, category: DailyBriefCategoryKey, index: number): Promise<DailyBriefItem> {
  const rawDescription = item.description || item.title;
  const sourceUrl = item.link;
  const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
  const fallbackSummary = buildThaiFallbackFromRealSource(item, category);
  const translation = await translateToThai({
    title: item.title,
    source: item.sourceName,
    content: rawDescription,
    rawInput: {
      sourceUrl,
      publishedAt,
      category,
      provider: "Google News RSS",
    },
    gptOutput: {
      title: item.title,
      summary: rawDescription,
      recommended_action: "อ่านข่าวเต็มจากแหล่งข่าวต้นฉบับ และใช้สรุปนี้เป็นข่าวย่อสำหรับ Telegram",
    },
  });
  const translatedTitle = hasThaiText(translation.translatedTitle) ? translation.translatedTitle : `ข่าวจาก ${item.sourceName}: ${item.title}`;
  const translatedSummary = hasThaiText(translation.translatedSummary) ? translation.translatedSummary : fallbackSummary;
  const translatedBullets = translation.translatedBullets
    .filter((bullet) => bullet.trim())
    .slice(0, 3)
    .map((bullet) => hasThaiText(bullet) ? bullet : `ประเด็นจากต้นฉบับ: ${bullet}`);

  return {
    id: getGoogleNewsId(item, category, index),
    title: item.title,
    titleTh: truncate(translatedTitle, 180),
    summaryTh: truncate(translatedSummary, 620),
    bulletPoints: translatedBullets.length ? translatedBullets : [
      truncate(fallbackSummary, 160),
      `แหล่งข่าวจริง: ${item.sourceName}`,
      "เปิดลิงก์ต้นฉบับเพื่ออ่านรายละเอียดเต็ม",
    ],
    whyItMatters: `ข่าวนี้มาจากแหล่งข่าวจริงผ่าน Google News RSS และอยู่ในหมวด ${category}`,
    impact: "ใช้เป็นบริบทข่าวประจำวัน ควรเปิดอ่านต้นฉบับเพื่อตรวจรายละเอียด เวลา และเงื่อนไขล่าสุด",
    category,
    tags: [category, item.sourceName, "Google News"].filter(Boolean).slice(0, 5),
    sourceName: item.sourceName,
    sourceUrl,
    publishedAt,
    language: hasThaiText(`${item.title} ${rawDescription}`) ? "th" : "en",
    priorityScore: scoreGoogleNewsItem(category, item, index),
    relatedSources: item.sourceUrl && item.sourceUrl !== sourceUrl ? [{ name: item.sourceName, url: item.sourceUrl, publishedAt }] : [],
    rawDescription,
    extractedText: rawDescription,
    isSaved: false,
    isHidden: false,
    telegramStatus: "idle",
  };
}

function uniqueRssItems(items: GoogleNewsRssItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.link.toLowerCase()}::${item.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchGoogleNewsCategory(category: FetchableDailyBriefCategory) {
  const settled = await Promise.allSettled(GOOGLE_NEWS_QUERY[category].map((query) => fetchGoogleNewsXml(query)));
  const rssItems = uniqueRssItems(settled.flatMap((result) => result.status === "fulfilled" ? parseGoogleNewsRss(result.value) : []))
    .slice(0, REAL_NEWS_TARGET_COUNT);
  return Promise.all(rssItems.map((item, index) => mapGoogleNewsItem(item, category, index)));
}

function mergeDailyBriefItems(items: DailyBriefItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.category}::${item.sourceUrl.toLowerCase()}::${item.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchGoogleNewsLatest(category?: DailyBriefCategoryKey) {
  const categories = category && category !== "all" ? [category as FetchableDailyBriefCategory] : GOOGLE_NEWS_CATEGORIES;
  const settled = await Promise.allSettled(categories.map((key) => fetchGoogleNewsCategory(key)));
  const items = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const failed = settled.filter((result) => result.status === "rejected").length;

  return {
    mode: "real" as const,
    items: mergeDailyBriefItems(items),
    message: `Fetched ${items.length} real item(s) from Google News RSS${failed ? `; ${failed} topic feed(s) failed` : ""}`,
  };
}

function detectCategory(article: NewsDataArticle): DailyBriefCategoryKey {
  const text = [article.title, article.description, article.content, article.category, article.keywords?.join(" ")].flat().filter(Boolean).join(" ").toLowerCase();
  if (/cyber|vulnerability|cve|malware|phishing|breach|ransomware|security/.test(text)) return "cybersecurity";
  if (/openai|google|apple|microsoft|ai|startup|software|developer|เครื่องมือ/.test(text)) return "aiTech";
  if (/cisco|fortinet|palo alto|cloudflare|aws|azure|google cloud|vercel|github|network|outage|cloud/.test(text)) return "networkCloud";
  if (/stock|nasdaq|nyse|bitcoin|crypto|gold|dollar|semiconductor|nvda|amd|tsm|ตลาดหุ้น|หุ้น/.test(text)) return "market";
  if (/football|soccer|match|fixture|ผลบอล|ฟุตบอล|กีฬา/.test(text)) return "sports";
  if (/government|public alert|official notice|announcement|bts|mrt|train disruption|transit disruption|road closure|ประกาศ|แจ้งเตือนรัฐ|หน่วยงานรัฐ|ขัดข้อง|ปิดถนน|บริการสาธารณะ/.test(text)) return "publicAlerts";
  if (/flight deal|airfare|airline|hotel|resort|room rate|travel promotion|travel deal|package tour|ตั๋วเครื่องบิน|โปรบิน|สายการบิน|โรงแรม|ห้องพัก|รีสอร์ต|แพ็กเกจเที่ยว|โปรท่องเที่ยว|เที่ยวไทย/.test(text)) return "travelDeals";
  if (/restaurant|cafe|buffet|weekend activity|lifestyle|nearby event|ร้านอาหาร|คาเฟ่|บุฟเฟ่ต์|กิจกรรมวันหยุด|ไอเดียพักผ่อน|อีเวนต์ใกล้ตัว|ที่เที่ยว/.test(text)) return "lifestyle";
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
    return fetchGoogleNewsLatest(category);
  }

  const googleNewsResult = await fetchGoogleNewsLatest(category);

  try {
    const response = await fetch(url.toString(), { cache: "no-store" });
    const payload = await response.json() as NewsDataResponse;

    if (!response.ok || payload.status === "error") {
      throw new Error(payload.message || `NewsData request failed: ${response.status}`);
    }

    const newsDataItems = await Promise.all((payload.results || []).map(mapNewsDataArticle));
    const items = mergeDailyBriefItems([...newsDataItems, ...googleNewsResult.items]);

    return {
      mode: "real" as const,
      items,
      message: `Fetched ${newsDataItems.length} item(s) from NewsData.io and ${googleNewsResult.items.length} real item(s) from Google News RSS`,
    };
  } catch (error) {
    return {
      ...googleNewsResult,
      message: `${googleNewsResult.message}; NewsData.io skipped: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
}
