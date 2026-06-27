import type { ScheduledTask } from "@/types/scheduled-task";
import type { DataSourceResult } from "./data-source.service";

type UsStockNewsItem = {
  symbol: string;
  company: string;
  sector: string;
  headline: string;
  summary: string;
  newsType: string;
  marketImpact: string;
  whyItMatters: string;
  keyPoints: string[];
  dataToCheck: string[];
  risk: string;
  priorityScore: number;
  source: string;
  publishedAt: string;
};

function mockStockNews(): UsStockNewsItem[] {
  const publishedAt = new Date().toISOString();
  return [
    {
      symbol: "NVDA",
      company: "NVIDIA",
      sector: "AI Semiconductors",
      headline: "NVIDIA ยังเป็นแกนหลักของกระแส AI infrastructure",
      summary: "ตลาดจับตาความต้องการ GPU, data center และ ecosystem ซอฟต์แวร์ เพราะเป็นตัวชี้วัดสำคัญของการลงทุน AI รอบใหม่",
      newsType: "AI / Earnings watch",
      marketImpact: "ส่งผลต่อกลุ่ม semiconductor, data center, cloud และ AI infrastructure",
      whyItMatters: "ถ้า sentiment ของ NVIDIA แข็งแรง มักทำให้หุ้น AI supply chain ถูกจับตาตาม",
      keyPoints: ["GPU demand", "Data center capex", "Margin และ backlog", "คู่แข่งด้าน custom AI chips"],
      dataToCheck: ["รายได้ Data Center", "Gross margin", "Guidance", "ข่าว order จาก hyperscalers"],
      risk: "Valuation สูงและข่าวลบเรื่อง supply หรือ competition อาจทำให้ผันผวนแรง",
      priorityScore: 94,
      source: "US Stock News Desk",
      publishedAt,
    },
    {
      symbol: "AMD",
      company: "Advanced Micro Devices",
      sector: "AI Chips / CPUs",
      headline: "AMD ถูกจับตาในฐานะคู่แข่ง AI accelerator และ server CPU",
      summary: "นักลงทุนติดตามความคืบหน้าชิป AI และส่วนแบ่งตลาด server เพราะเป็นโอกาสเติบโตระยะยาวของ AMD",
      newsType: "AI chip competition",
      marketImpact: "เกี่ยวข้องกับหุ้น semiconductor และ cloud hardware",
      whyItMatters: "ถ้า AMD เพิ่มส่วนแบ่ง AI accelerator ได้ จะทำให้ตลาดมองการแข่งขันในกลุ่ม AI chip เข้มขึ้น",
      keyPoints: ["AI accelerator roadmap", "EPYC server CPU", "ลูกค้า cloud", "margin"],
      dataToCheck: ["ยอดขาย data center", "ข่าวลูกค้า hyperscaler", "product roadmap", "guidance"],
      risk: "การแข่งขันสูงและต้องพิสูจน์การขาย AI chip ให้ได้จริง",
      priorityScore: 88,
      source: "US Stock News Desk",
      publishedAt,
    },
    {
      symbol: "MSFT",
      company: "Microsoft",
      sector: "Cloud / AI Software",
      headline: "Microsoft เชื่อม AI กับ cloud และ productivity software ต่อเนื่อง",
      summary: "ข่าวที่เกี่ยวข้องกับ Azure, Copilot และ enterprise AI มีผลต่อมุมมองรายได้ recurring และ cloud growth",
      newsType: "Cloud AI / Enterprise software",
      marketImpact: "ส่งผลต่อหุ้น cloud, software, SaaS และ AI application layer",
      whyItMatters: "Microsoft เป็นตัวแทนการ monetization AI ในฝั่งองค์กร ไม่ใช่แค่ hardware",
      keyPoints: ["Azure growth", "Copilot adoption", "AI margin", "enterprise demand"],
      dataToCheck: ["Azure revenue growth", "AI contribution", "commercial bookings", "capex"],
      risk: "ต้นทุน AI infrastructure สูงและการแข่งขัน cloud รุนแรง",
      priorityScore: 86,
      source: "US Stock News Desk",
      publishedAt,
    },
    {
      symbol: "AAPL",
      company: "Apple",
      sector: "Consumer Tech / Devices",
      headline: "Apple ถูกจับตาเรื่อง AI on-device และรอบอัปเกรด iPhone",
      summary: "ตลาดสนใจว่า AI features จะช่วยกระตุ้นการเปลี่ยนเครื่องและ ecosystem services ได้มากแค่ไหน",
      newsType: "Consumer AI / Devices",
      marketImpact: "เกี่ยวข้องกับ supply chain, chip, app ecosystem และ consumer electronics",
      whyItMatters: "Apple มีฐานผู้ใช้ใหญ่ ข่าว AI integration จึงส่งผลต่อ sentiment หุ้น consumer tech",
      keyPoints: ["iPhone cycle", "on-device AI", "services revenue", "China demand"],
      dataToCheck: ["iPhone shipment", "services growth", "gross margin", "China sales"],
      risk: "ยอดขาย hardware ชะลอหรือ AI feature ไม่จูงใจพอ",
      priorityScore: 80,
      source: "US Stock News Desk",
      publishedAt,
    },
    {
      symbol: "PLTR",
      company: "Palantir",
      sector: "AI Software / Data Analytics",
      headline: "Palantir ยังเป็นหุ้น AI software ที่ตลาดติดตามเรื่องการใช้งานจริง",
      summary: "นักลงทุนจับตา commercial growth, government contracts และการขยายแพลตฟอร์ม AI ในองค์กร",
      newsType: "AI software / Contracts",
      marketImpact: "เกี่ยวข้องกับหุ้น software high growth และ AI application",
      whyItMatters: "เป็นตัวอย่างหุ้นที่ตลาดให้ premium จาก story AI และการเติบโตของลูกค้าองค์กร",
      keyPoints: ["commercial revenue", "AIP adoption", "government contracts", "profitability"],
      dataToCheck: ["customer count", "remaining deal value", "US commercial growth", "net retention"],
      risk: "valuation สูงและราคาผันผวนตาม narrative AI",
      priorityScore: 84,
      source: "US Stock News Desk",
      publishedAt,
    },
    {
      symbol: "TSLA",
      company: "Tesla",
      sector: "EV / Autonomy / Robotics",
      headline: "Tesla ถูกจับตาทั้ง EV margin, autonomous driving และ robotics",
      summary: "ข่าว Tesla มักกระทบทั้งกลุ่ม EV และหุ้น growth เพราะมีหลาย narrative ตั้งแต่รถยนต์ พลังงาน ไปจนถึง AI/robotics",
      newsType: "EV / Autonomy",
      marketImpact: "เกี่ยวข้องกับ EV, battery, robotics และ high-beta growth stocks",
      whyItMatters: "เป็นหุ้นที่ข่าว product, delivery และ margin ส่งผลต่อราคาได้เร็ว",
      keyPoints: ["deliveries", "auto gross margin", "FSD/autonomy", "energy storage"],
      dataToCheck: ["delivery numbers", "price cuts", "margin", "regulatory news"],
      risk: "การแข่งขัน EV สูงและ headline risk เยอะ",
      priorityScore: 82,
      source: "US Stock News Desk",
      publishedAt,
    },
  ];
}

export async function fetchUsStockNewsInput(_task: ScheduledTask): Promise<DataSourceResult> {
  void _task;

  const items = mockStockNews();

  return {
    source: "US Stock News",
    status: "mock",
    title: "ข่าวหุ้นสหรัฐที่น่าติดตาม",
    originalContent: items
      .map((item) => `${item.symbol} ${item.company} | ${item.headline} | ${item.summary} | Impact: ${item.marketImpact} | Check: ${item.dataToCheck.join(", ")} | Risk: ${item.risk}`)
      .join("\n\n"),
    language: "th",
    items,
    data: {
      market: "US Stocks",
      scope: "US stock news only / summary for information, not financial advice",
      tickers: items.map((item) => item.symbol),
      items,
    },
  };
}
