import type { ScheduledTask } from "@/types/scheduled-task";
import type { DataSourceResult } from "./data-source.service";
import { mockDailyBriefItems } from "@/data/daily-brief.mock";
import { getDailyBriefTopicDetail } from "@/lib/daily-brief-taxonomy";

type NewsArticle = {
  source?: { id?: string | null; name?: string | null } | string | null;
  author?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  urlToImage?: string | null;
  publishedAt?: string | null;
  content?: string | null;
};

type ThaiNewsArticle = {
  source: string;
  title: string;
  description: string;
  url?: string | null;
  publishedAt?: string | null;
  originalTitle?: string | null;
  fullArticle?: string;
  keyPoints?: string[];
  whyItMatters?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  contentAngle?: string;
  action?: string;
};

const DEFAULT_NEWS_QUERIES = [
  "artificial intelligence OR AI tools",
  "cybersecurity OR data breach",
  "cloud computing OR data center",
  "consumer technology OR gadgets",
  "startup funding OR product launch",
];

function getSourceName(article: NewsArticle): string {
  if (typeof article.source === "string") return article.source;
  return article.source?.name || "News";
}

function compactArticle(article: NewsArticle, index: number) {
  return {
    index: index + 1,
    source: getSourceName(article),
    title: article.title || "",
    description: article.description || article.content || "",
    url: article.url || null,
    publishedAt: article.publishedAt || null,
  };
}

function uniqueByTitleOrUrl(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const result: NewsArticle[] = [];

  for (const article of articles) {
    const key = (article.url || article.title || "").toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(article);
  }

  return result;
}

function fallbackThaiArticles(articles: NewsArticle[]): ThaiNewsArticle[] {
  return articles.map((article) => ({
    source: getSourceName(article),
    title: article.title?.match(/[\u0E00-\u0E7F]/) ? article.title : `ข่าวต่างประเทศ: ${article.title || "ไม่มีหัวข้อ"}`,
    description: article.description?.match(/[\u0E00-\u0E7F]/)
      ? article.description
      : `ต้นฉบับภาษาอังกฤษ: ${article.description || article.content || "ไม่มีรายละเอียด"}`,
    url: article.url || null,
    publishedAt: article.publishedAt || null,
    originalTitle: article.title || null,
    fullArticle: [article.description, article.content].filter(Boolean).join("\n\n"),
    keyPoints: [article.description || article.content || ""].filter(Boolean),
    whyItMatters: "เก็บไว้ใน Data Library เพื่ออ่านรายละเอียดและใช้ต่อยอดเป็นสรุปภาษาไทย",
    readTime: "2-3 นาที",
    category: "News",
    tags: ["news", "ai", "technology"],
    contentAngle: "ทำเป็นโพสต์สรุปข่าวสั้น พร้อมลิงก์อ่านต่อ",
    action: "เปิดอ่านรายละเอียดเต็มใน Data Library แล้วเลือกข่าวที่ควรติดตามต่อ",
  }));
}

function extractJsonArray(text: string): string {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const first = cleaned.indexOf("[");
  const last = cleaned.lastIndexOf("]");
  return first >= 0 && last > first ? cleaned.slice(first, last + 1) : cleaned;
}

async function translateArticlesToThai(articles: NewsArticle[]): Promise<ThaiNewsArticle[]> {
  const groqKey = process.env.GROQ_API_KEY;
  const enabled = process.env.AI_TRANSLATION_ENABLED === "true" || process.env.ENABLE_GROQ === "true" || process.env.ENABLE_AI === "true";
  if (!enabled || !groqKey) return fallbackThaiArticles(articles);

  try {
    const baseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
    const model = process.env.GROQ_TRANSLATION_MODEL || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    const briefArticles = articles.slice(0, 14).map(compactArticle);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "คุณคือระบบแปลและจัดหมวดข่าวของ Nimbus Daily ตอบกลับเป็น JSON array เท่านั้น ห้ามใช้ markdown และห้ามแต่งข้อเท็จจริงเพิ่ม",
          },
          {
            role: "user",
            content: `แปลและจัดข้อมูลข่าวต่อไปนี้เป็นภาษาไทยแบบอ่านง่าย คง source/url/publishedAt ไว้\n\nReturn JSON array only. Each item must have keys: source, title, description, url, publishedAt, originalTitle, fullArticle, keyPoints, whyItMatters, readTime, category, tags, contentAngle, action.\n\nArticles:\n${JSON.stringify(briefArticles, null, 2)}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Groq news translation failed ${response.status}: ${text.slice(0, 300)}`);
    }

    const json = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq news translation returned empty content");

    const parsed = JSON.parse(extractJsonArray(content)) as Partial<ThaiNewsArticle>[];
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Groq news translation did not return an array");

    const fallback = fallbackThaiArticles(articles);
    return parsed.slice(0, articles.length).map((item, index) => ({
      source: item.source || getSourceName(articles[index]),
      title: item.title || fallback[index].title,
      description: item.description || fallback[index].description,
      url: item.url ?? articles[index].url ?? null,
      publishedAt: item.publishedAt ?? articles[index].publishedAt ?? null,
      originalTitle: item.originalTitle ?? articles[index].title ?? null,
      fullArticle: item.fullArticle || fallback[index].fullArticle,
      keyPoints: Array.isArray(item.keyPoints) ? item.keyPoints : fallback[index].keyPoints,
      whyItMatters: item.whyItMatters || fallback[index].whyItMatters,
      readTime: item.readTime || fallback[index].readTime,
      category: item.category || fallback[index].category || "News",
      tags: Array.isArray(item.tags) ? item.tags : fallback[index].tags,
      contentAngle: item.contentAngle || fallback[index].contentAngle,
      action: item.action || fallback[index].action,
    }));
  } catch (error) {
    console.error("[Nimbus Daily News] Thai news translation fallback", error instanceof Error ? error.message : String(error));
    return fallbackThaiArticles(articles);
  }
}

function buildMockNewsItems(): ThaiNewsArticle[] {
  const publishedAt = new Date().toISOString();

  return [
    {
      source: "Nimbus Research Desk",
      title: "AI automation ถูกนำไปใช้กับงานประจำวันมากขึ้น",
      description: "องค์กรเริ่มใช้ AI ช่วยสรุปข้อมูล ตรวจอีเมล จัดลำดับความสำคัญ และสร้าง workflow อัตโนมัติ",
      fullArticle: "กระแส AI automation กำลังขยับจากการทดลองใช้งานไปสู่การใช้งานจริงในงานประจำวันมากขึ้น โดยเฉพาะงานที่ต้องรวบรวมข้อมูลจากหลายแหล่ง เช่น ข่าว อีเมล สภาพอากาศ และข้อมูลสินค้า ระบบแบบ Nimbus Daily จึงควรเก็บข้อมูลเต็มไว้บนเว็บ แล้วส่ง Telegram เพียงสรุปสั้น เพื่อให้ผู้ใช้ไม่ถูกท่วมด้วยข้อความยาวเกินไป แต่ยังสามารถกลับมาอ่านรายละเอียดเต็มได้ทุกเมื่อ",
      keyPoints: ["AI ถูกใช้เพื่อสรุปข้อมูลหลายแหล่ง", "Telegram ควรส่งสรุปสั้น", "ข้อมูลเต็มควรอยู่ใน Data Library"],
      whyItMatters: "ทำให้ Nimbus Daily เป็นทั้งระบบแจ้งเตือนและคลังข้อมูลสำหรับอ่านต่อ",
      readTime: "3 นาที",
      category: "AI / Automation",
      tags: ["AI", "Automation", "Workflow"],
      contentAngle: "ทำโพสต์อธิบายว่า AI ช่วยลดงานซ้ำได้อย่างไร",
      action: "เพิ่มตัวอย่าง workflow จริงใน Data Library",
      publishedAt,
      originalTitle: "AI automation tools continue gaining adoption",
    },
    {
      source: "Nimbus Research Desk",
      title: "แดชบอร์ดยุคใหม่ต้องมีหน้าข้อมูลเต็ม ไม่ใช่แค่การ์ดสรุป",
      description: "ผู้ใช้ต้องการเห็นทั้งสรุปสั้นและรายละเอียดเต็ม เช่น รายการข่าว แหล่งข้อมูล ลิงก์ และข้อมูลดิบที่ AI ใช้วิเคราะห์",
      fullArticle: "แดชบอร์ดที่ดีควรแยกระหว่างหน้าควบคุมและหน้าข้อมูลเต็มอย่างชัดเจน หน้า Dashboard เหมาะกับการดูสถานะและกดรันงาน ส่วน Data Library ควรเป็นพื้นที่อ่านข้อมูลจริงทั้งหมดที่ระบบค้นมา เช่น ข่าวเต็ม สรุปฟุตบอลเป็นรายทีม รายการสินค้าใหม่ และบทความอ่านยาว การจัดหมวดแบบนี้ทำให้ผู้ใช้เข้าใจง่ายขึ้น และช่วยลดปัญหา Telegram ส่งข้อความยาวเกินจำเป็น",
      keyPoints: ["Dashboard ใช้ควบคุมงาน", "Data Library ใช้อ่านข้อมูลเต็ม", "Telegram ควรแนบลิงก์กลับมาอ่านต่อ"],
      whyItMatters: "แก้ปัญหาหน้าอ่านข่าวว่าง และทำให้ข้อมูลไม่หายหลังส่งแจ้งเตือน",
      readTime: "2 นาที",
      category: "Product / Dashboard",
      tags: ["Dashboard", "UX", "Data Library"],
      contentAngle: "ทำคอนเทนต์เปรียบเทียบ Dashboard vs Data Library",
      action: "เพิ่มปุ่มไป Data Library ในทุกข้อความ Telegram",
      publishedAt,
      originalTitle: "Modern dashboards need full data libraries",
    },
    {
      source: "Nimbus Research Desk",
      title: "Cybersecurity monitoring ควรถูกย่อยเป็นภาษาคนอ่านง่าย",
      description: "ข้อมูลความปลอดภัยมักเป็น log ยาว ๆ แต่ผู้ใช้ต้องการรู้ว่าเกิดอะไร สำคัญแค่ไหน และต้องทำอะไรต่อ",
      fullArticle: "ระบบแจ้งเตือนด้านความปลอดภัยที่ดีไม่ควรส่ง raw log ทั้งหมดไปยัง Telegram เพราะจะอ่านยากและทำให้ผู้ใช้พลาดประเด็นสำคัญ Nimbus Daily ควรย่อยข้อมูลเป็น 4 ส่วน คือ เหตุการณ์, ความเสี่ยง, ผลกระทบ และสิ่งที่ต้องทำต่อ ส่วน log เต็มให้เก็บไว้ใน Data Library เพื่อค้นหาและตรวจย้อนหลังได้",
      keyPoints: ["แยก severity ให้ชัด", "อธิบาย impact เป็นภาษาคน", "เก็บ log เต็มไว้บนเว็บ"],
      whyItMatters: "ช่วยให้การแจ้งเตือนอีเมลและ security alert ใช้งานจริงมากขึ้น",
      readTime: "3 นาที",
      category: "Security",
      tags: ["Security", "Monitoring", "Incident"],
      contentAngle: "ทำโพสต์สอนอ่าน security alert แบบง่าย",
      action: "เพิ่ม template สำหรับ Security Email Monitor",
      publishedAt,
      originalTitle: "Security monitoring should be summarized for humans",
    },
    {
      source: "Nimbus Research Desk",
      title: "Cloud cost monitoring เริ่มสำคัญกับทีมเล็กมากขึ้น",
      description: "เมื่อใช้ API, AI, cron และ hosting หลายเจ้า ทีมเล็กต้องรู้ว่าอะไรใช้เยอะและควรลดตรงไหน",
      fullArticle: "โปรเจกต์ที่ใช้ Vercel, GitHub Actions, AI API, Telegram Bot และ external APIs อาจมีค่าใช้จ่ายแฝงหลายจุด ถึงแม้เริ่มจาก free tier ก็ตาม ระบบ dashboard ควรมีหน้า cost overview ที่แสดงจำนวน run, จำนวน API call, error rate และ task ที่ใช้เวลานาน เพื่อช่วยลดการ deploy หรือ run ที่ไม่จำเป็น",
      keyPoints: ["ติดตามจำนวน run ต่อวัน", "ดู task ที่ใช้ API เยอะ", "แยก free tier และ paid usage"],
      whyItMatters: "ช่วยลดปัญหา deploy เกิน quota และควบคุมค่าใช้จ่ายได้ดีขึ้น",
      readTime: "4 นาที",
      category: "Cloud / Cost",
      tags: ["Cloud", "Cost", "Vercel"],
      contentAngle: "ทำโพสต์วิธีคุมค่าใช้จ่ายโปรเจกต์ AI automation",
      action: "เพิ่มหน้า Usage / Cost ใน Admin",
      publishedAt,
      originalTitle: "Cloud cost monitoring matters for small teams",
    },
    {
      source: "Nimbus Research Desk",
      title: "สินค้า AI gadget ยังเป็นหมวดที่คนสนใจสำหรับคอนเทนต์สั้น",
      description: "สินค้าแนว wearable, e-ink dashboard, smart recorder และ AI accessory เหมาะกับการทำโพสต์คัดของน่าสนใจ",
      fullArticle: "คอนเทนต์แนวคัดสินค้าใหม่จากทั่วโลกควรเน้นเหตุผลว่าทำไมสินค้านั้นน่าสนใจ ไม่ใช่แค่ราคา ระบบควรเก็บชื่อสินค้า หมวดหมู่ จุดเด่น กลุ่มผู้ใช้ ข้อควรเช็ก และไอเดียทำภาพ 9:16 ไว้ใน Data Library เพื่อให้ผู้ใช้หยิบไปทำโพสต์ต่อได้ง่าย โดยไม่จำเป็นต้องผูกกับ Shopee หรือร้านใดร้านหนึ่ง",
      keyPoints: ["เน้นสินค้าใหม่/แปลก/มีประโยชน์", "ไม่ผูกกับ Shopee", "เก็บ content angle และ prompt ภาพ"],
      whyItMatters: "ทำให้ Sale Monitor กลายเป็น Global Product Radar ที่ใช้ทำคอนเทนต์ได้จริง",
      readTime: "3 นาที",
      category: "Product Radar",
      tags: ["Gadget", "Product", "Content"],
      contentAngle: "ทำโพสต์ 5 ของใหม่จากทั่วโลกที่ควรรู้จัก",
      action: "เพิ่ม fields สำหรับ product card ใน Data Library",
      publishedAt,
      originalTitle: "AI gadgets remain interesting for short-form content",
    },
    {
      source: "Nimbus Research Desk",
      title: "Data Center และ AI Infrastructure กลายเป็นหัวข้อข่าวที่ควรติดตาม",
      description: "การเติบโตของ AI ทำให้ข่าวเรื่อง GPU, power, cooling, network และ cloud region น่าสนใจมากขึ้น",
      fullArticle: "AI infrastructure ไม่ได้มีแค่โมเดล AI แต่รวมถึง data center, GPU cluster, network fabric, storage, cooling และ power capacity ข่าวกลุ่มนี้เหมาะกับผู้เรียนสาย Network/System เพราะช่วยเชื่อมโยงความรู้พื้นฐานกับงานจริง เช่น spine-leaf, high bandwidth, latency, observability และ capacity planning",
      keyPoints: ["AI ต้องใช้ infrastructure ขนาดใหญ่", "Network และ power เป็นข้อจำกัดสำคัญ", "เหมาะกับสาย Network Engineer"],
      whyItMatters: "ช่วยให้ Nimbus Daily เป็นแหล่งอ่านข่าวที่ต่อยอดกับเส้นทาง Network Engineer ได้",
      readTime: "4 นาที",
      category: "AI Infrastructure",
      tags: ["AI Infra", "Data Center", "Network"],
      contentAngle: "ทำสรุปว่า AI data center ต้องมีระบบอะไรบ้าง",
      action: "เพิ่มหมวด AI Infrastructure ในข่าวและ Long Read",
      publishedAt,
      originalTitle: "AI infrastructure is a key news topic",
    },
    {
      source: "Nimbus Research Desk",
      title: "Open source tools ช่วยลดต้นทุนโปรเจกต์ automation",
      description: "โปรเจกต์ที่ใช้ scheduler, notification และ data library สามารถใช้ open source stack เพื่อลด dependency และค่าใช้จ่ายได้",
      fullArticle: "สำหรับระบบอย่าง Nimbus Daily การเลือกใช้ open source tools เช่น queue, cron runner, database dashboard, log viewer และ observability จะช่วยลดต้นทุนและทำให้ย้าย hosting ได้ง่ายขึ้น แนวทางที่ดีคือแยก core logic ออกจาก hosting provider เพื่อให้สามารถย้ายจาก Vercel ไป Cloudflare, Render หรือ GitHub Actions ได้โดยไม่ต้องเขียนใหม่ทั้งหมด",
      keyPoints: ["แยก core service ออกจาก provider", "ลด lock-in", "ทำให้ย้าย deploy ง่ายขึ้น"],
      whyItMatters: "ช่วยแก้ปัญหา free quota และทำให้ระบบโตต่อได้",
      readTime: "3 นาที",
      category: "Open Source / Architecture",
      tags: ["Open Source", "Architecture", "Deploy"],
      contentAngle: "ทำโพสต์ checklist ก่อนย้าย hosting",
      action: "เพิ่มหน้า Deployment Strategy ใน Admin",
      publishedAt,
      originalTitle: "Open source tools reduce automation project cost",
    },
    {
      source: "Nimbus Research Desk",
      title: "บทความอ่านยาวควรสรุปเป็น 3 ระดับ: สั้น กลาง เต็ม",
      description: "คนอ่านแต่ละคนมีเวลาต่างกัน Data Library ควรมีสรุปสั้น ประเด็นสำคัญ และเนื้อหาเต็มในหน้าเดียว",
      fullArticle: "การออกแบบ Long Read ควรคิดเหมือนระบบอ่านบทความอัจฉริยะ ไม่ใช่แค่เก็บลิงก์ ควรมีระดับการอ่าน 3 แบบ ได้แก่ 1) สรุป 3 บรรทัดสำหรับ Telegram 2) Key points สำหรับอ่านเร็วบน Dashboard และ 3) Full note สำหรับ Data Library วิธีนี้ทำให้คนอ่านเลือกได้ตามเวลาที่มี และยังทำให้ข้อมูลเหมาะกับการทำโพสต์หรือ presentation ต่อ",
      keyPoints: ["Telegram = สั้น", "Dashboard = สรุปกลาง", "Data Library = เต็ม"],
      whyItMatters: "ทำให้ข้อมูลเยอะขึ้นแต่ไม่รก Telegram",
      readTime: "3 นาที",
      category: "Long Read",
      tags: ["Reading", "UX", "Knowledge"],
      contentAngle: "ทำภาพเปรียบเทียบ 3 ระดับการอ่าน",
      action: "เพิ่ม tabs Summary / Key points / Full ใน Data Library",
      publishedAt,
      originalTitle: "Long reads need layered summaries",
    },
    {
      source: "Nimbus Research Desk",
      title: "การแปลข่าวควรเก็บต้นฉบับไว้ด้วยเสมอ",
      description: "การแปลไทยช่วยให้อ่านง่าย แต่ต้นฉบับจำเป็นสำหรับตรวจความถูกต้องและใช้เป็นแหล่งอ้างอิง",
      fullArticle: "เมื่อระบบ AI แปลข่าวจากภาษาอังกฤษเป็นภาษาไทย ควรเก็บ originalTitle, source, url, publishedAt และคำอธิบายต้นฉบับไว้เสมอ เพื่อให้ผู้ใช้ตรวจย้อนกลับได้ หาก AI แปลคลาดเคลื่อน ผู้ใช้ยังสามารถกลับไปอ่านแหล่งข่าวเดิมได้ วิธีนี้ช่วยเพิ่มความน่าเชื่อถือของระบบ และทำให้ Data Library เป็นฐานข้อมูลที่ตรวจสอบได้",
      keyPoints: ["เก็บต้นฉบับ", "เก็บลิงก์", "แปลไทยแบบไม่แต่งข้อมูลเพิ่ม"],
      whyItMatters: "เพิ่มความน่าเชื่อถือของข่าวและลดความเสี่ยงจาก AI hallucination",
      readTime: "2 นาที",
      category: "Translation / Trust",
      tags: ["Translation", "Trust", "Source"],
      contentAngle: "ทำโพสต์เรื่องทำไม AI dashboard ต้องเก็บ source",
      action: "แสดง originalTitle และ source ชัดขึ้นใน Data Library",
      publishedAt,
      originalTitle: "Translated news should keep original source data",
    },
    {
      source: "Nimbus Research Desk",
      title: "ระบบแจ้งเตือนที่ดีควรมี Priority Score และเหตุผลประกอบ",
      description: "แค่บอกว่ามีข่าวใหม่ยังไม่พอ ควรบอกว่าทำไมข่าวนี้สำคัญและควรทำอะไรต่อ",
      fullArticle: "Priority Score ช่วยให้ผู้ใช้จัดลำดับสิ่งที่ต้องอ่านหรือทำต่อได้ดีขึ้น แต่คะแนนอย่างเดียวไม่พอ ควรมีเหตุผลประกอบ เช่น ผลกระทบ ความเร่งด่วน ความเกี่ยวข้องกับความสนใจ และ action ที่แนะนำ ระบบอย่าง Nimbus Daily ควรแสดง score พร้อม whyItMatters และ action ในทั้ง Telegram และ Data Library",
      keyPoints: ["มี score", "มีเหตุผล", "มี action ต่อ"],
      whyItMatters: "ช่วยให้ระบบไม่ใช่แค่ feed ข่าว แต่เป็นผู้ช่วยตัดสินใจ",
      readTime: "3 นาที",
      category: "AI Prioritization",
      tags: ["Priority", "AI", "Decision"],
      contentAngle: "ทำโพสต์สอนออกแบบ Priority Score",
      action: "เพิ่มเหตุผลประกอบ score ใน Telegram summary",
      publishedAt,
      originalTitle: "Good alerts need priority scores and explanations",
    },
    {
      source: "Nimbus Research Desk",
      title: "ข่าวฟุตบอลควรส่งเป็นชื่อทีมและสถานะ ไม่ใช่ข้อความทั่วไป",
      description: "ผู้ใช้ต้องการเห็นชื่อทีม สกอร์ สถานะ กลุ่ม และเวลาแข่งแบบอ่านเร็ว",
      fullArticle: "Football Recap ที่ดีควรแสดงข้อมูลแบบโครงสร้าง เช่น Germany vs Ecuador, status, kickoff, group และ key moment ไม่ควรใช้ชื่อ placeholder อย่าง Team A หรือ Team B เพราะทำให้ข้อมูลใช้ไม่ได้จริง เมื่อเก็บเป็น object ใน Data Library จะสามารถแสดงเป็นการ์ดทีมและค้นหาชื่อทีมได้ง่ายขึ้น",
      keyPoints: ["ใช้ชื่อทีมจริง", "แสดงสกอร์/สถานะ", "ค้นหาทีมใน Data Library ได้"],
      whyItMatters: "ทำให้ Football Recap ใช้งานได้จริงและพร้อมทำคอนเทนต์ต่อ",
      readTime: "2 นาที",
      category: "Football / Sports Data",
      tags: ["Football", "World Cup", "Data"],
      contentAngle: "ทำสรุปผลบอลแบบชื่อทีมชัดเจน",
      action: "ใช้ teamNames ใน Telegram และ Data Library",
      publishedAt,
      originalTitle: "Football recaps need real team names",
    },
    {
      source: "Nimbus Research Desk",
      title: "ระบบข่าวควรดึงหลาย query ไม่ใช่ query เดียว",
      description: "ถ้าดึงข่าวด้วย query เดียว ข้อมูลจะน้อยและซ้ำ ควรแยก AI, Security, Cloud, Gadget และ Startup",
      fullArticle: "การดึงข่าวจาก query เดียวทำให้ผลลัพธ์แคบเกินไป โดยเฉพาะถ้าผู้ใช้ต้องการหน้า Data Library ที่มีข้อมูลเยอะ ระบบควรแยก query เป็นหลายหมวด เช่น AI, cybersecurity, cloud computing, consumer technology และ startup/product launch แล้วนำมารวมกันพร้อม dedupe จาก URL หรือ title จากนั้นให้ AI แปลและจัดหมวดเป็นภาษาไทย",
      keyPoints: ["ดึงหลาย query", "dedupe ข่าวซ้ำ", "จัดหมวดก่อนแสดง"],
      whyItMatters: "ทำให้ข้อมูลใน Data Library เยอะขึ้นและหลากหลายขึ้น",
      readTime: "3 นาที",
      category: "News Pipeline",
      tags: ["News", "Pipeline", "Search"],
      contentAngle: "ทำภาพ workflow ข่าว: query → dedupe → translate → library",
      action: "เปิด NEWS_EXTRA_QUERIES เพื่อเพิ่มหมวดข่าวจริง",
      publishedAt,
      originalTitle: "News systems should use multiple queries",
    },
  ];
}

function buildDailyBriefNewsItems(): ThaiNewsArticle[] {
  return mockDailyBriefItems.map((item) => {
    const detail = getDailyBriefTopicDetail(item.category);
    return {
      source: item.sourceName,
      title: item.titleTh,
      description: item.summaryTh,
      url: item.sourceUrl,
      publishedAt: item.publishedAt,
      originalTitle: item.title,
      fullArticle: item.extractedText || item.rawDescription || item.summaryTh,
      keyPoints: item.bulletPoints,
      whyItMatters: item.whyItMatters,
      readTime: "2-4 นาที",
      category: detail.labelTh,
      tags: Array.from(new Set([detail.labelTh, ...item.tags])),
      contentAngle: `${detail.labelTh}: ${detail.subtopicsTh.slice(0, 4).join(" / ")}`,
      action: detail.noteTh ? `${detail.noteTh} อ่านข่าวเต็มจากแหล่งต้นฉบับ` : "อ่านข่าวเต็มจากแหล่งต้นฉบับ และส่งข่าวย่อภาษาไทยไป Telegram ได้",
    };
  });
}

function getNewsQueries(): string[] {
  const mainQuery = process.env.NEWS_QUERY || DEFAULT_NEWS_QUERIES[0];
  const extraQueries = (process.env.NEWS_EXTRA_QUERIES || DEFAULT_NEWS_QUERIES.slice(1).join("|")).split("|");
  return [mainQuery, ...extraQueries].map((query) => query.trim()).filter(Boolean);
}

async function fetchNewsApiArticles(apiKey: string): Promise<NewsArticle[]> {
  const pageSize = Math.min(Math.max(Number(process.env.NEWS_PAGE_SIZE || 12), 5), 20);
  const queries = getNewsQueries();
  const allArticles: NewsArticle[] = [];

  for (const query of queries) {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", query);
    url.searchParams.set("language", process.env.NEWS_LANGUAGE || "en");
    url.searchParams.set("pageSize", String(pageSize));
    url.searchParams.set("sortBy", process.env.NEWS_SORT_BY || "publishedAt");

    const response = await fetch(url, {
      headers: { "X-Api-Key": apiKey },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Nimbus Daily News] News API failed ${response.status}: ${text.slice(0, 220)}`);
      continue;
    }

    const json = await response.json() as { articles?: NewsArticle[] };
    allArticles.push(...(json.articles ?? []));
  }

  return uniqueByTitleOrUrl(allArticles).slice(0, Number(process.env.NEWS_MAX_ITEMS || 18));
}

async function fetchHackerNewsArticles(): Promise<NewsArticle[]> {
  const enabled = process.env.ENABLE_HN_SOURCE === "true";
  if (!enabled) return [];

  try {
    const query = process.env.HN_QUERY || "AI OR cybersecurity OR cloud";
    const url = new URL("https://hn.algolia.com/api/v1/search_by_date");
    url.searchParams.set("query", query);
    url.searchParams.set("tags", "story");
    url.searchParams.set("hitsPerPage", String(Math.min(Math.max(Number(process.env.HN_PAGE_SIZE || 6), 3), 12)));

    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) return [];

    const json = await response.json() as { hits?: Array<{ title?: string; story_title?: string; url?: string; created_at?: string; author?: string; objectID?: string }> };
    return (json.hits ?? []).map((hit) => ({
      source: "Hacker News",
      title: hit.title || hit.story_title || "Hacker News story",
      description: `Discussion by ${hit.author || "HN user"}`,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      publishedAt: hit.created_at,
      content: `Hacker News discussion: ${hit.title || hit.story_title || "Untitled"}`,
    }));
  } catch (error) {
    console.error("[Nimbus Daily News] HN source failed", error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function fetchNewsUpdates(_task: ScheduledTask): Promise<DataSourceResult> {
  const enabled = process.env.ENABLE_REAL_DATA_SOURCES === "true" && process.env.ENABLE_NEWS_SOURCE === "true";
  const apiKey = process.env.NEWS_API_KEY;

  if (!enabled || !apiKey) {
    const items = buildDailyBriefNewsItems();

    return {
      source: "News",
      status: "mock",
      title: "Daily Brief / ข่าวประจำวัน",
      language: "th",
      items,
      data: items,
      originalContent: items.map((item) => `${item.title}\n${item.fullArticle}\nประเด็นสำคัญ: ${(item.keyPoints ?? []).join(" | ")}`).join("\n\n---\n\n"),
    };
  }

  const [newsApiArticles, hackerNewsArticles] = await Promise.all([
    fetchNewsApiArticles(apiKey),
    fetchHackerNewsArticles(),
  ]);

  const articles = uniqueByTitleOrUrl([...newsApiArticles, ...hackerNewsArticles]);
  const selectedArticles = articles.length > 0 ? articles : buildMockNewsItems().map((item) => ({
    source: item.source,
    title: item.originalTitle || item.title,
    description: item.description,
    content: item.fullArticle,
    publishedAt: item.publishedAt,
  }));
  const thaiItems = await translateArticlesToThai(selectedArticles);

  return {
    source: "News",
    status: articles.length > 0 ? "success" : "mock",
    title: "Expanded news update",
    language: "mixed",
    originalContent: JSON.stringify(selectedArticles, null, 2),
    items: thaiItems,
    data: thaiItems,
  };
}
