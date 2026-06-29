"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type StockItem = {
  ticker: string;
  name: string;
  thesis: string;
  strength: string;
  risk: string;
  tags: string[];
  accent: string;
  spark: number[];
};

type Category = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  image: "ai" | "chip" | "cloud" | "fintech" | "space" | "health" | "etf" | "assets" | "portfolio" | "growth";
  overviewTitle: string;
  overview: string;
  tags: string[];
  why: string[];
  watchlist: string[];
  stocks: StockItem[];
};

const riskTone: Record<string, string> = {
  "ต่ำ": "bg-emerald-400",
  "ต่ำ-กลาง": "bg-lime-300",
  "กลาง": "bg-amber-300",
  "กลาง-สูง": "bg-orange-400",
  "สูง": "bg-rose-400",
  "สูงมาก": "bg-fuchsia-400",
};

const categories: Category[] = [
  {
    id: "ai-mega-cap",
    title: "AI / Mega Cap",
    subtitle: "หุ้นผู้นำเทคโนโลยีและ AI ขนาดใหญ่ของสหรัฐฯ",
    icon: "AI",
    image: "ai",
    overviewTitle: "ภาพรวมหมวดหมู่ AI / Mega Cap",
    overview:
      "กลุ่มผู้นำ AI, Cloud, Advertising, Enterprise Software และ Data Center Infrastructure ที่เป็นแกนหลักของระบบนิเวศดิจิทัลโลก เหมาะสำหรับติดตามธีมการเติบโตระยะยาว แต่ยังต้องระวังมูลค่าหุ้นและความคาดหวังของตลาด",
    tags: ["Core AI", "Mega Cap", "Cloud", "Data Center", "Ads", "Infrastructure"],
    why: [
      "เป็นผู้นำของโลกเทคโนโลยีที่กำลังขับเคลื่อนเศรษฐกิจดิจิทัลและ AI",
      "รายได้และกำไรเติบโตต่อเนื่อง พร้อมกระแสเงินสดแข็งแรง",
      "ลงทุนหนักใน AI, Cloud และ Data Center สร้างความได้เปรียบระยะยาว",
      "มีอำนาจด้านแพลตฟอร์มและเครือข่ายผู้ใช้งานจำนวนมาก",
      "เป็นแกนหลักของดัชนีตลาดสหรัฐฯ ที่มีสภาพคล่องสูง",
    ],
    watchlist: ["NVDA", "MSFT", "GOOGL", "AMZN", "META", "AVGO"],
    stocks: [
      stock("NVDA", "NVIDIA", "ผู้นำ GPU / AI Data Center", "ecosystem แข็งแกร่ง", "การแข่งขันและซัพพลาย", ["Core AI", "Data Center"], "#76ff7a", [12, 18, 22, 31, 27, 39, 44]),
      stock("MSFT", "Microsoft", "Cloud + AI + Enterprise", "ฐานลูกค้าองค์กรขนาดใหญ่", "การแข่งขัน Cloud", ["Cloud", "Enterprise"], "#41a5ff", [18, 21, 24, 26, 31, 35, 38]),
      stock("GOOGL", "Alphabet", "Search, YouTube, Cloud, AI", "โฆษณาและ AI เติมกำลัง", "กฎระเบียบ/คดีความ", ["Ads", "Cloud", "Core AI"], "#fbbc04", [15, 17, 20, 19, 25, 29, 34]),
      stock("AMZN", "Amazon", "AWS + E-commerce + AI", "AWS และค้าปลีกแข็งแรง", "การแข่งขัน E-commerce", ["Cloud", "Core AI"], "#ff9900", [11, 14, 18, 21, 24, 30, 35]),
      stock("META", "Meta Platforms", "Ads + AI + cash flow", "รายได้โฆษณาแข็งแรง", "ความเป็นส่วนตัว", ["Ads", "Core AI"], "#66a7ff", [13, 19, 17, 24, 29, 34, 37]),
      stock("AVGO", "Broadcom", "ชิป AI / Network / VMware", "ดีล VMware เพิ่มศักยภาพ", "วัฏจักรอุตสาหกรรม", ["Core AI", "Infrastructure"], "#e31b54", [16, 22, 21, 29, 33, 39, 45]),
    ],
  },
  {
    id: "semiconductor",
    title: "Semiconductor",
    subtitle: "หุ้นและธุรกิจโครงสร้างพื้นฐานชิปที่ได้อานิสงส์จาก AI",
    icon: "SC",
    image: "chip",
    overviewTitle: "ภาพรวมหมวดหมู่ Semiconductor",
    overview:
      "ครอบคลุมผู้ออกแบบชิป โรงงานผลิตชิป อุปกรณ์ผลิต และหน่วยความจำ ซึ่งเป็นโครงสร้างสำคัญของ AI, Cloud และอุปกรณ์ on-device AI รุ่นใหม่",
    tags: ["Semiconductor Core", "GPU", "Foundry", "Equipment", "Memory", "Mobile AI"],
    why: [
      "ความต้องการชิปสำหรับ AI, Data Center และ Cloud ยังแข็งแรง",
      "การลงทุนโรงงานผลิตและแพ็กเกจจิ้งเพิ่มขึ้นทั่วโลก",
      "เทคโนโลยี 3nm, HBM, EUV ช่วยขยายมูลค่าระยะยาว",
      "AI on-device และมือถือรุ่นใหม่ช่วยหนุนดีมานด์ต่อเนื่อง",
    ],
    watchlist: ["AMD", "TSM", "ASML", "MU", "QCOM"],
    stocks: [
      stock("AMD", "Advanced Micro Devices", "ทางเลือก GPU/CPU AI", "CPU + GPU product cycle", "แข่งขันด้าน GPU", ["GPU", "Core"], "#ed1c24", [10, 14, 19, 16, 22, 26, 33]),
      stock("TSM", "TSMC", "โรงงานผลิตชิประดับโลก", "foundry ระดับโลก", "ภูมิรัฐศาสตร์", ["Foundry", "Core"], "#f15a24", [18, 20, 24, 28, 31, 33, 40]),
      stock("ASML", "ASML Holding", "เครื่องจักรผลิตชิปสำคัญ", "moat สูงจาก EUV", "คำสั่งซื้อผันผวน", ["Equipment", "Core"], "#2446a8", [14, 16, 18, 23, 27, 32, 36]),
      stock("MU", "Micron", "Memory / DRAM", "AI server demand", "วัฏจักรราคา memory", ["Memory"], "#94a3b8", [8, 11, 13, 17, 21, 25, 28]),
      stock("QCOM", "Qualcomm", "มือถือ / AI on-device", "mobile ecosystem", "แข่งขันมือถือ", ["Mobile AI"], "#2c7df0", [12, 14, 17, 16, 21, 22, 27]),
    ],
  },
  {
    id: "cloud-cybersecurity",
    title: "Cloud / Cybersecurity",
    subtitle: "หุ้นคลาวด์ ซอฟต์แวร์องค์กร และความปลอดภัยไซเบอร์",
    icon: "CY",
    image: "cloud",
    overviewTitle: "ภาพรวมหมวดหมู่ Cloud / Cybersecurity",
    overview:
      "ธีมนี้ได้แรงหนุนจากการย้ายระบบขึ้นคลาวด์ การป้องกันข้อมูล Observability และ data platform สำหรับองค์กรที่ต้องใช้ AI อย่างปลอดภัย",
    tags: ["Cloud", "Security", "Edge", "Observability", "Data Cloud", "Enterprise"],
    why: [
      "องค์กรเพิ่มงบความปลอดภัยไซเบอร์และการปกป้องข้อมูล",
      "การย้ายระบบขึ้นคลาวด์และสถาปัตยกรรมแบบกระจายยังเร่งตัว",
      "ต้องการ Observability เพื่อลด downtime และความเสี่ยง",
      "ข้อมูลที่เชื่อถือได้เป็นฐานของ AI ในองค์กร",
    ],
    watchlist: ["CRWD", "PANW", "NET", "DDOG", "SNOW"],
    stocks: [
      stock("CRWD", "CrowdStrike", "Cybersecurity ระดับองค์กร", "endpoint platform แข็งแรง", "valuation สูง", ["Security", "Enterprise"], "#e11d48", [15, 20, 18, 25, 31, 36, 42]),
      stock("PANW", "Palo Alto Networks", "Firewall + Cloud Security", "platform ครบวงจร", "รวมระบบซับซ้อน", ["Security"], "#f97316", [12, 15, 17, 22, 29, 31, 34]),
      stock("NET", "Cloudflare", "Edge, Security, Developer", "edge network แข็งแรง", "แข่งขันด้านราคา", ["Edge", "Security"], "#f59e0b", [10, 14, 19, 21, 26, 32, 36]),
      stock("DDOG", "Datadog", "Monitoring / Observability", "observability stack", "พึ่งพาลูกค้าใหญ่", ["Observability"], "#a855f7", [9, 13, 16, 22, 20, 28, 33]),
      stock("SNOW", "Snowflake", "Data Cloud / AI Data", "รองรับ AI workflows", "ต้นทุน compute", ["Data Cloud"], "#38bdf8", [8, 10, 12, 16, 19, 23, 29]),
    ],
  },
  {
    id: "fintech-platform",
    title: "Fintech / Platform",
    subtitle: "หุ้นแพลตฟอร์มชำระเงิน การเงินดิจิทัล และโบรกเกอร์รุ่นใหม่",
    icon: "FP",
    image: "fintech",
    overviewTitle: "ภาพรวมหมวดหมู่ Fintech / Platform",
    overview:
      "รวมบริษัทเครือข่ายการชำระเงิน แพลตฟอร์มการเงินดิจิทัล และธุรกิจที่ได้ประโยชน์จากการใช้จ่ายไร้เงินสด การเข้าถึงบริการการเงิน และกิจกรรมลงทุนรายย่อย",
    tags: ["Payments", "Fintech", "Trading", "Digital Bank", "Platform"],
    why: [
      "ธุรกรรมดิจิทัลและการชำระเงินไร้เงินสดยังเติบโตทั่วโลก",
      "ต้นทุนให้บริการลดลงเมื่อสเกลแพลตฟอร์มใหญ่ขึ้น",
      "กิจกรรมเทรดและลงทุนของรายย่อยยังเป็นธีมระยะยาว",
    ],
    watchlist: ["V", "MA", "HOOD", "SOFI"],
    stocks: [
      stock("V", "Visa", "Payment network", "เครือข่ายระดับโลก", "กฎระเบียบค่าธรรมเนียม", ["Payments", "Platform"], "#1a56db", [20, 22, 24, 27, 30, 33, 36]),
      stock("MA", "Mastercard", "Payment network", "cashless trend", "เศรษฐกิจชะลอ", ["Payments", "Platform"], "#f97316", [19, 21, 25, 28, 31, 35, 37]),
      stock("HOOD", "Robinhood", "Trading platform", "retail engagement สูง", "ความผันผวนสูง", ["Trading", "Platform"], "#00c805", [9, 13, 18, 22, 19, 28, 35]),
      stock("SOFI", "SoFi", "Digital banking", "cross-sell ecosystem", "credit risk", ["Digital Bank", "Fintech"], "#0ea5e9", [8, 11, 15, 17, 21, 26, 31]),
    ],
  },
  {
    id: "space-defense-infra",
    title: "Space / Defense / Infra",
    subtitle: "หุ้นธีมอวกาศ กลาโหม พลังงาน และโครงสร้างพื้นฐานสำหรับยุค AI",
    icon: "SP",
    image: "space",
    overviewTitle: "ภาพรวมหมวดหมู่ Space / Defense / Infra",
    overview:
      "ครอบคลุมผู้พัฒนานวัตกรรมอวกาศ ผู้ประกอบการกลาโหม บริษัทพลังงาน และโครงสร้างพื้นฐานที่เชื่อมโยงกับดาวเทียม การสื่อสาร และศูนย์ข้อมูลสำหรับยุค AI",
    tags: ["Space", "Defense", "Power", "Infra", "Nuclear", "Communications"],
    why: [
      "อุตสาหกรรมอวกาศเติบโตจากดาวเทียมและการสื่อสาร",
      "ผู้เล่นกลาโหมรายใหญ่มี backlog สูงและรายได้มั่นคง",
      "ความต้องการพลังงานและโครงสร้างพื้นฐานเพิ่มขึ้นจาก AI",
    ],
    watchlist: ["RKLB", "LMT", "GEV", "CEG", "ASTS", "SPCX"],
    stocks: [
      stock("RKLB", "Rocket Lab", "Space / launch / satellite", "launch systems growth", "สูง", ["Space"], "#111827", [5, 7, 9, 15, 18, 21, 29]),
      stock("LMT", "Lockheed Martin", "Defense ใหญ่", "backlog มั่นคง", "ปานกลาง", ["Defense"], "#0f172a", [16, 17, 18, 20, 22, 24, 26]),
      stock("GEV", "GE Vernova", "Power infrastructure", "AI data center theme", "ปานกลาง", ["Power", "Infra"], "#2563eb", [9, 12, 15, 22, 27, 31, 37]),
      stock("CEG", "Constellation Energy", "Nuclear / power", "data center demand", "ปานกลาง", ["Nuclear", "Power"], "#fbbf24", [12, 17, 19, 24, 28, 35, 39]),
      stock("ASTS", "AST SpaceMobile", "satellite broadband", "direct-to-cell upside", "สูง", ["Communications", "Space"], "#020617", [4, 9, 8, 14, 17, 25, 33]),
      stock("SPCX", "SpaceX Proxy", "ETF แนวอวกาศ", "กระจายธีมอวกาศ", "ปานกลาง", ["ETF", "Space"], "#ffffff", [10, 11, 14, 18, 21, 23, 27]),
    ],
  },
  {
    id: "healthcare-consumer-quality",
    title: "Healthcare / Consumer / Quality",
    subtitle: "หุ้นคุณภาพสูง แนวรับเศรษฐกิจ และธุรกิจแบรนด์แข็งแรง",
    icon: "HQ",
    image: "health",
    overviewTitle: "ภาพรวมหมวดหมู่ Healthcare / Consumer / Quality",
    overview:
      "กลุ่มคุณภาพสูงที่รายได้ค่อนข้างยืดหยุ่นต่อเศรษฐกิจ มีแบรนด์แข็งแรงหรือโครงสร้างธุรกิจที่กระจายความเสี่ยง เหมาะสำหรับติดตามเพื่อสมดุลพอร์ต",
    tags: ["Healthcare", "Consumer", "Defensive", "Quality", "Long Term", "Brand"],
    why: [
      "ช่วยลดความผันผวนของพอร์ตในช่วงเศรษฐกิจไม่แน่นอน",
      "บริษัทคุณภาพสูงมักมีกระแสเงินสดและ pricing power",
      "เหมาะสำหรับถือยาวเพื่อสมดุลระหว่างเติบโตและป้องกันความเสี่ยง",
    ],
    watchlist: ["LLY", "UNH", "COST", "WMT", "MCD", "BRK.B"],
    stocks: [
      stock("LLY", "Eli Lilly", "ยา obesity / diabetes", "product pipeline", "ราคา/นโยบายยา", ["Healthcare", "Quality"], "#ef4444", [18, 24, 28, 32, 36, 41, 47]),
      stock("UNH", "UnitedHealth", "Healthcare ใหญ่", "scale ecosystem", "กฎระเบียบ", ["Healthcare", "Long Term"], "#2563eb", [12, 15, 18, 21, 24, 26, 29]),
      stock("COST", "Costco", "ค้าปลีกคุณภาพสูง", "membership model", "valuation", ["Consumer", "Quality"], "#e11d48", [20, 22, 25, 29, 31, 34, 38]),
      stock("WMT", "Walmart", "Defensive retail", "scale demand", "margin", ["Consumer", "Defensive"], "#fbbf24", [18, 19, 22, 24, 26, 29, 33]),
      stock("MCD", "McDonald's", "Global brand", "cash flow", "ต้นทุนวัตถุดิบ", ["Consumer", "Brand"], "#facc15", [14, 16, 18, 20, 22, 25, 28]),
      stock("BRK.B", "Berkshire Hathaway", "Diversified holdings", "ถือยาวคุณภาพ", "ขนาดใหญ่โตช้า", ["Long Term", "Quality"], "#1d4ed8", [16, 18, 21, 22, 25, 28, 31]),
    ],
  },
  {
    id: "etf",
    title: "ETF",
    subtitle: "กองทุนดัชนีและธีมยอดนิยมสำหรับกระจายพอร์ต",
    icon: "EF",
    image: "etf",
    overviewTitle: "ภาพรวม ETF",
    overview:
      "ETF ช่วยให้กระจายการลงทุนได้อย่างมีประสิทธิภาพ ครอบคลุมตลาดกว้าง เทคโนโลยี หุ้นปันผล หุ้นต่างประเทศ พันธบัตร และธีมเฉพาะในกองทุนเดียว",
    tags: ["Broad Market", "Tech", "Dividend", "International", "Bond", "Semiconductor", "Cybersecurity"],
    why: ["กระจายความเสี่ยงในสินทรัพย์และภูมิภาค", "เริ่มต้นได้ง่ายและค่าธรรมเนียมมักต่ำ", "เหมาะสำหรับลงทุนระยะยาวและ DCA"],
    watchlist: ["VOO", "VTI", "QQQ", "SCHD", "VXUS", "VT", "BND", "SMH", "XLK", "CIBR"],
    stocks: [
      stock("VOO/SPY", "S&P 500 ETF", "ตาม S&P 500 หุ้นใหญ่", "ตลาดกว้าง", "กลาง", ["Broad Market"], "#65a30d", [14, 16, 18, 22, 24, 28, 30]),
      stock("VTI", "Total US Market", "หุ้นสหรัฐทั้งตลาด", "กระจายดี", "กลาง", ["Broad Market"], "#ef4444", [12, 15, 17, 20, 24, 27, 29]),
      stock("QQQ", "Nasdaq 100", "เน้น Tech/AI", "เติบโตสูง", "กลาง-สูง", ["Tech"], "#2563eb", [11, 17, 20, 23, 29, 34, 39]),
      stock("SCHD", "Dividend ETF", "หุ้นปันผลคุณภาพ", "รายได้ปันผล", "กลาง", ["Dividend"], "#38bdf8", [13, 14, 17, 19, 21, 22, 24]),
      stock("BND", "US Bonds", "พันธบัตรสหรัฐ", "ลดผันผวน", "ต่ำ-กลาง", ["Bond"], "#991b1b", [10, 11, 12, 11, 13, 14, 15]),
      stock("CIBR/HACK", "Cybersecurity ETF", "ธีม cybersecurity", "ธีมชัด", "สูง", ["Cybersecurity"], "#64748b", [8, 12, 16, 21, 20, 25, 31]),
    ],
  },
  {
    id: "alternative-assets",
    title: "Alternative Assets",
    subtitle: "ทองคำและคริปโตสำหรับกระจายความเสี่ยงหรือเพิ่มโอกาสเติบโต",
    icon: "AA",
    image: "assets",
    overviewTitle: "ภาพรวมทองคำและคริปโตในที่เดียว",
    overview:
      "รวมตัวเลือกสินทรัพย์ทางเลือกเพื่อช่วยดูภาพรวมพอร์ต ทั้งทองคำในฐานะสินทรัพย์ป้องกันความเสี่ยง และคริปโตในฐานะสินทรัพย์ดิจิทัลที่ผันผวนสูง",
    tags: ["Diversification", "Inflation Hedge", "Store of Value", "Growth Potential", "Global Access"],
    why: ["ทองคำช่วยป้องกันความเสี่ยงจากเงินเฟ้อ", "คริปโตมี upside สูงแต่ความผันผวนมาก", "ใช้เพื่อกระจายความเสี่ยง ไม่ควรทุ่มน้ำหนักเกินเหมาะสม"],
    watchlist: ["GLD", "IAU", "BTC", "ETH", "SOL", "USDC", "LINK", "GDX"],
    stocks: [
      stock("GLD", "SPDR Gold Shares", "ETF ทองใหญ่", "สภาพคล่องสูง", "กลาง", ["Gold ETF"], "#fbbf24", [12, 13, 14, 17, 16, 19, 22]),
      stock("BTC", "Bitcoin", "Digital gold", "สินทรัพย์ดิจิทัลหลัก", "สูง", ["Crypto"], "#f97316", [7, 15, 12, 24, 20, 31, 39]),
      stock("ETH", "Ethereum", "Smart contract", "DeFi / L2 ecosystem", "สูง", ["Crypto"], "#94a3b8", [9, 14, 18, 16, 24, 27, 33]),
      stock("LINK", "Chainlink", "Oracle infrastructure", "โครงสร้างข้อมูล", "สูง", ["Crypto"], "#2563eb", [6, 10, 15, 19, 22, 25, 29]),
    ],
  },
  {
    id: "portfolio-strategies",
    title: "Portfolio Strategies",
    subtitle: "ตัวอย่างพอร์ตสำหรับสายปลอดภัย สายเติบโต และสายเสี่ยงสูง",
    icon: "PF",
    image: "portfolio",
    overviewTitle: "แนวคิดพอร์ตตัวอย่าง ไม่ใช่คำแนะนำการลงทุน",
    overview:
      "พอร์ตเหล่านี้เป็นเพียงตัวอย่างไอเดียการจัดสรรสินทรัพย์ เพื่อช่วยให้เห็นภาพความเสี่ยง การเติบโต และความผันผวนที่แตกต่างกัน ควรปรับตามเป้าหมายและระดับความเสี่ยงที่รับได้",
    tags: ["Conservative", "Growth", "Aggressive", "Rebalance", "Risk Control"],
    why: ["ประเมินความเสี่ยงที่รับได้ก่อนเลือกพอร์ต", "พิจารณาระยะเวลาลงทุนและโอกาสรับผลตอบแทน", "กระจายสินทรัพย์เพื่อลดความเสี่ยงรวม"],
    watchlist: ["VOO", "VTI", "QQQ", "BND", "GLD", "BTC"],
    stocks: [],
  },
  {
    id: "future-growth-picks",
    title: "Future Growth Picks",
    subtitle: "หุ้นเติบโตที่น่าสนใจเพิ่มเติม นอกเหนือจากกลุ่มแกนหลัก",
    icon: "FG",
    image: "growth",
    overviewTitle: "ภาพรวม Future Growth Picks",
    overview:
      "คัดเลือกบริษัทที่มีธีมเติบโตจากโครงสร้างระยะยาว เช่น AI chips, networking, power infrastructure, advertising, e-commerce, social platforms และ robotics",
    tags: ["AI Chip", "Networking", "Power", "Ads", "Social", "E-commerce", "Robotics"],
    why: ["มีโอกาสเติบโตสูงกว่าตลาดในบางช่วง", "หลายบริษัทเป็นผู้เล่นนวัตกรรมและตลาดใหม่", "เหมาะสำหรับติดตามเชิงธีม ไม่ควรละเลยความเสี่ยง"],
    watchlist: ["ARM", "MRVL", "ANET", "VRT", "ALAB", "APP", "RDDT", "MELI", "SE", "ISRG"],
    stocks: [
      stock("ARM", "Arm Holdings", "AI chip architecture", "ได้ประโยชน์จาก AI", "กลาง-สูง", ["AI Chip"], "#38bdf8", [10, 13, 19, 23, 28, 32, 38]),
      stock("MRVL", "Marvell", "Custom chip / networking", "AI data center", "สูง", ["AI Chip"], "#111827", [8, 12, 15, 20, 25, 31, 36]),
      stock("ANET", "Arista Networks", "AI networking", "data center growth", "กลาง-สูง", ["Networking"], "#2563eb", [15, 19, 24, 29, 34, 39, 44]),
      stock("VRT", "Vertiv", "Power / cooling", "AI infrastructure", "กลาง-สูง", ["Power"], "#475569", [11, 18, 24, 31, 37, 43, 50]),
      stock("APP", "AppLovin", "Ads platform", "free cash flow", "สูง", ["Ads"], "#0ea5e9", [7, 12, 20, 28, 25, 39, 48]),
      stock("RDDT", "Reddit", "Social platform", "รายได้โฆษณา", "สูง", ["Social"], "#ff4500", [6, 9, 14, 18, 24, 30, 37]),
      stock("MELI", "MercadoLibre", "E-commerce + Fintech", "ละตินอเมริกา", "กลาง-สูง", ["E-commerce"], "#facc15", [18, 21, 26, 32, 36, 40, 47]),
      stock("ISRG", "Intuitive Surgical", "Robotics surgery", "procedure growth", "กลาง", ["Robotics"], "#e5e7eb", [16, 18, 22, 24, 28, 31, 35]),
    ],
  },
];

const marketRows = [
  { label: "NASDAQ", status: "เชิงบวก", spark: [12, 15, 14, 20, 24, 26, 31] },
  { label: "S&P 500", status: "เชิงบวก", spark: [10, 13, 16, 18, 20, 25, 27] },
  { label: "VIX", status: "ทรงตัว", spark: [26, 23, 21, 19, 18, 16, 14], violet: true },
];

const strategies = [
  { title: "1 สายปลอดภัยกว่า", desc: "เน้นเสถียรภาพและกระจายความเสี่ยง", risk: "กลาง-ต่ำ", tone: "emerald", allocation: [["VOO / VTI", 60], ["BND", 20], ["GLD / IAU", 10], ["QQQ", 10]] },
  { title: "2 สายเติบโต", desc: "เน้นระยะยาวพร้อมรับความผันผวนมากขึ้น", risk: "กลาง-สูง", tone: "blue", allocation: [["VOO / VTI", 50], ["QQQ", 25], ["SMH / SOXX", 10], ["GLD", 10], ["BTC / ETH", 5]] },
  { title: "3 สายเสี่ยงสูง", desc: "เน้นโอกาสเติบโตสูง แต่ผันผวนมาก", risk: "สูงมาก", tone: "fuchsia", allocation: [["VOO / VTI", 40], ["QQQ / SMH", 25], ["AI / Tech", 20], ["BTC / ETH", 10], ["RKLB / SOFI", 5]] },
];

function stock(ticker: string, name: string, thesis: string, strength: string, risk: string, tags: string[], accent: string, spark: number[]): StockItem {
  return { ticker, name, thesis, strength, risk, tags, accent, spark };
}

export function StocksHubView() {
  const [activeId, setActiveId] = useState(categories[0].id);
  const [query, setQuery] = useState("");

  const active = categories.find((item) => item.id === activeId) ?? categories[0];
  const filteredStocks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return active.stocks;
    return active.stocks.filter((item) => [item.ticker, item.name, item.thesis, ...item.tags].join(" ").toLowerCase().includes(needle));
  }, [active, query]);

  return (
    <section className="mx-auto w-full max-w-[1600px] text-slate-100">
      <div className="grid gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]">
        <StockSidebar activeId={activeId} onSelect={setActiveId} />

        <div className="min-w-0 space-y-5">
          <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-cyan-200/80">NimbusDaily Research</p>
              <h1 className="mt-2 text-4xl font-extrabold leading-tight text-white md:text-5xl">{active.title}</h1>
              <p className="mt-2 max-w-3xl text-lg font-medium text-slate-300">{active.subtitle}</p>
            </div>
            <MarketBadge />
          </header>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative block flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/55 pl-10 pr-4 text-sm font-semibold text-white shadow-inner shadow-black/20 transition focus:border-cyan-300/45 focus:bg-slate-950/75"
                placeholder="ค้นหาหุ้น, Ticker, ธีม หรือบทวิเคราะห์..."
              />
            </label>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {categories.slice(0, 7).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveId(category.id)}
                  className={cn(
                    "shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold transition",
                    active.id === category.id
                      ? "border-blue-300/55 bg-blue-500/25 text-white shadow-[0_0_22px_rgba(59,130,246,0.24)]"
                      : "border-white/10 bg-slate-950/45 text-slate-300 hover:border-cyan-300/30 hover:text-white",
                  )}
                >
                  {category.title}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <main className="min-w-0 space-y-5">
              <OverviewPanel category={active} />
              {active.id === "portfolio-strategies" ? (
                <PortfolioStrategies />
              ) : active.id === "alternative-assets" ? (
                <AlternativeAssets category={active} />
              ) : active.id === "etf" ? (
                <EtfLayout category={active} stocks={filteredStocks} />
              ) : (
                <StocksTable category={active} stocks={filteredStocks} />
              )}
            </main>

            <aside className="space-y-5">
              <WhyWatch items={active.why} />
              <Watchlist tickers={active.watchlist} />
              <MarketSummary />
            </aside>
          </div>

          <footer className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-4 text-center text-sm font-medium text-slate-400">
            ข้อมูลเพื่อการศึกษาและการจัดหมวดหมู่เท่านั้น ไม่ใช่คำแนะนำการลงทุนหรือคำแนะนำซื้อขายหลักทรัพย์
          </footer>
        </div>
      </div>
    </section>
  );
}

function StockSidebar({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return (
    <aside className="nimbus-card-3d sticky top-24 hidden h-[calc(100vh-7rem)] rounded-2xl border border-white/10 bg-slate-950/65 p-4 xl:block">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-xl font-black">N</div>
        <div>
          <p className="text-lg font-extrabold leading-none text-white">Stocks Hub</p>
          <p className="text-xs font-semibold uppercase text-slate-500">NimbusDaily</p>
        </div>
      </div>
      <nav className="space-y-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-bold transition",
              activeId === category.id ? "border-blue-300/35 bg-blue-500/20 text-white" : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
            )}
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-[11px] text-cyan-100">{category.icon}</span>
            <span>{category.title}</span>
          </button>
        ))}
      </nav>
      <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
        <p className="text-lg font-extrabold text-amber-200">Pro Watch</p>
        <p className="mt-1 text-sm font-medium text-slate-300">เก็บธีมที่น่าสนใจและติดตามความเสี่ยงแบบมีวินัย</p>
      </div>
    </aside>
  );
}

function MarketBadge() {
  return (
    <div className="nimbus-card-3d rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-400">ตลาดสหรัฐฯ</p>
          <p className="mt-1 text-sm font-bold text-slate-300">NASDAQ · S&P 500</p>
        </div>
        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-extrabold text-emerald-200">เปิดทำการ</span>
      </div>
      <div className="mt-2 h-10">
        <Sparkline values={[12, 15, 14, 20, 24, 26, 31]} />
      </div>
    </div>
  );
}

function OverviewPanel({ category }: { category: Category }) {
  return (
    <article className="nimbus-card-3d overflow-hidden rounded-2xl border border-blue-300/20 bg-slate-950/55">
      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-sm font-black text-cyan-100">{category.icon}</span>
            <h2 className="text-2xl font-extrabold text-white">{category.overviewTitle}</h2>
          </div>
          <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-slate-300">{category.overview}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {category.tags.map((tag, index) => (
              <span key={tag} className={cn("rounded-lg border px-3 py-1.5 text-sm font-bold", tagTone(index))}>{tag}</span>
            ))}
          </div>
        </div>
        <StockIllustration type={category.image} title={category.title} />
      </div>
    </article>
  );
}

function StocksTable({ category, stocks }: { category: Category; stocks: StockItem[] }) {
  return (
    <article className="nimbus-card-3d overflow-hidden rounded-2xl border border-white/10 bg-slate-950/58">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="text-xl font-extrabold text-white">หุ้นในหมวดหมู่ ({stocks.length})</h2>
        <span className="text-sm font-bold text-slate-400">{category.title}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Ticker</th>
              <th className="px-5 py-3">Thesis</th>
              <th className="px-5 py-3">Strength</th>
              <th className="px-5 py-3">Trend</th>
              <th className="px-5 py-3">Risk</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((item) => (
              <tr key={item.ticker} className="border-t border-white/8 transition hover:bg-white/[0.035]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <LogoBadge item={item} />
                    <div>
                      <p className="text-lg font-extrabold text-blue-300">{item.ticker}</p>
                      <p className="text-xs font-semibold text-slate-500">{item.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {item.tags.map((tag) => <span key={tag} className="rounded-md bg-blue-500/12 px-2 py-0.5 text-[11px] font-bold text-blue-200">{tag}</span>)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-300">{item.thesis}</td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-300">{item.strength}</td>
                <td className="px-5 py-4"><div className="h-11 w-28"><Sparkline values={item.spark} /></div></td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <span className={cn("h-2.5 w-2.5 rounded-full", riskTone[item.risk] ?? "bg-amber-300")} />
                    {item.risk}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function EtfLayout({ category, stocks }: { category: Category; stocks: StockItem[] }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Allocation", ["Equity US 45%", "International 20%", "Technology 15%", "Dividend 10%", "Bonds 5%", "Cash 5%"]],
          ["Index Universe", ["S&P 500", "Total US", "Nasdaq 100", "MSCI ACWI", "Bonds", "Thematic"]],
          ["Portfolio", ["Core", "Bond", "Dividend", "Tech", "Cyber", "Global"]],
        ].map(([title, items]) => (
          <div key={title as string} className="nimbus-card-3d rounded-2xl border border-white/10 bg-slate-950/55 p-5">
            <h3 className="text-lg font-extrabold text-white">{title}</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(items as string[]).map((item) => <span key={item} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-bold text-slate-300">{item}</span>)}
            </div>
          </div>
        ))}
      </div>
      <StocksTable category={category} stocks={stocks} />
    </div>
  );
}

function AlternativeAssets({ category }: { category: Category }) {
  const gold = category.stocks.filter((item) => item.tags.includes("Gold ETF"));
  const crypto = category.stocks.filter((item) => item.tags.includes("Crypto"));
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <AssetList title="Gold / ทองคำ" tone="amber" items={gold} />
      <AssetList title="Crypto / คริปโต" tone="violet" items={crypto} />
    </div>
  );
}

function AssetList({ title, tone, items }: { title: string; tone: "amber" | "violet"; items: StockItem[] }) {
  return (
    <article className={cn("nimbus-card-3d overflow-hidden rounded-2xl border bg-slate-950/58", tone === "amber" ? "border-amber-300/30" : "border-violet-300/30")}>
      <h2 className={cn("border-b px-5 py-4 text-xl font-extrabold", tone === "amber" ? "border-amber-300/20 text-amber-200" : "border-violet-300/20 text-violet-200")}>{title}</h2>
      <div className="divide-y divide-white/8">
        {items.map((item) => (
          <div key={item.ticker} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 p-4">
            <LogoBadge item={item} />
            <div>
              <p className="font-extrabold text-white">{item.ticker}</p>
              <p className="text-sm font-semibold text-slate-400">{item.thesis}</p>
            </div>
            <div className="text-right text-sm font-bold text-slate-300">
              <p>{item.risk}</p>
              <span className={cn("mt-1 inline-block h-2.5 w-2.5 rounded-full", riskTone[item.risk] ?? "bg-amber-300")} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function PortfolioStrategies() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {strategies.map((strategy) => (
        <article key={strategy.title} className={cn("nimbus-card-3d rounded-2xl border bg-slate-950/58 p-5", strategy.tone === "emerald" && "border-emerald-300/25", strategy.tone === "blue" && "border-blue-300/25", strategy.tone === "fuchsia" && "border-fuchsia-300/25")}>
          <h2 className="text-2xl font-extrabold text-white">{strategy.title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">{strategy.desc}</p>
          <div className="mt-6 grid place-items-center">
            <div className="grid h-40 w-40 place-items-center rounded-full" style={{ background: donutGradient(strategy.allocation) }}>
              <div className="grid h-24 w-24 place-items-center rounded-full bg-slate-950 text-2xl font-extrabold text-white">100%</div>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {strategy.allocation.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between text-sm font-bold text-slate-300">
                <span>{label}</span>
                <span>{value}%</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Risk Level</p>
            <p className="mt-1 text-lg font-extrabold text-white">{strategy.risk}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function WhyWatch({ items }: { items: string[] }) {
  return (
    <article className="nimbus-card-3d rounded-2xl border border-white/10 bg-slate-950/58 p-5">
      <h2 className="text-xl font-extrabold text-white">Why Watch</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm font-semibold leading-7 text-slate-300">
            <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-xs font-black text-emerald-200">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Watchlist({ tickers }: { tickers: string[] }) {
  return (
    <article className="nimbus-card-3d rounded-2xl border border-white/10 bg-slate-950/58 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-white">Watchlist ({tickers.length})</h2>
        <span className="text-amber-200">☆</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {tickers.map((ticker) => (
          <span key={ticker} className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 text-sm font-extrabold text-slate-200">{ticker}</span>
        ))}
      </div>
      <button type="button" className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-cyan-300/25 hover:text-white">
        ดู Watchlist ทั้งหมด
      </button>
    </article>
  );
}

function MarketSummary() {
  return (
    <article className="nimbus-card-3d rounded-2xl border border-white/10 bg-slate-950/58 p-5">
      <h2 className="text-xl font-extrabold text-white">สรุปภาพรวมตลาด (ย่อ)</h2>
      <div className="mt-4 space-y-4">
        {marketRows.map((row) => (
          <div key={row.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)_4rem] items-center gap-3">
            <div>
              <p className="font-extrabold text-white">{row.label}</p>
              <p className="text-xs font-semibold text-slate-500">แนวโน้มระยะสั้น</p>
            </div>
            <div className="h-8"><Sparkline values={row.spark} violet={row.violet} /></div>
            <p className={cn("text-right text-sm font-extrabold", row.violet ? "text-violet-300" : "text-emerald-300")}>{row.status}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function StockIllustration({ type, title }: { type: Category["image"]; title: string }) {
  const label = {
    ai: "AI",
    chip: "CHIP",
    cloud: "CLOUD",
    fintech: "PAY",
    space: "ORBIT",
    health: "CARE",
    etf: "ETF",
    assets: "GOLD",
    portfolio: "ALLOC",
    growth: "GROW",
  }[type];

  return (
    <div className={cn("relative min-h-56 overflow-hidden rounded-2xl border border-blue-300/18 bg-slate-950/70", `stock-illustration-${type}`)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(59,130,246,0.30),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.2),rgba(2,6,23,0.72))]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(148,163,184,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.14)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute right-8 top-8 grid h-28 w-28 rotate-[-12deg] place-items-center rounded-3xl border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_60px_rgba(34,211,238,0.18)]">
        <span className="text-4xl font-black text-cyan-100">{label}</span>
      </div>
      <div className="absolute bottom-5 left-5 right-5">
        <p className="text-xs font-bold uppercase text-cyan-200/80">Research Theme</p>
        <p className="text-2xl font-extrabold text-white">{title}</p>
      </div>
    </div>
  );
}

function LogoBadge({ item }: { item: StockItem }) {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 text-sm font-black text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${item.accent}, rgba(15,23,42,.86))` }}>
      {item.ticker.replace(".", "").slice(0, 2)}
    </span>
  );
}

function Sparkline({ values, violet = false }: { values: number[]; violet?: boolean }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${34 - ((value - min) / span) * 28}`).join(" ");
  return (
    <svg viewBox="0 0 100 40" className="h-full w-full" role="img" aria-label="trend sparkline">
      <defs>
        <linearGradient id={violet ? "sparkViolet" : "sparkGreen"} x1="0" x2="1" y1="0" y2="0">
          <stop stopColor={violet ? "#d946ef" : "#22c55e"} />
          <stop offset="1" stopColor={violet ? "#8b5cf6" : "#86efac"} />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={`url(#${violet ? "sparkViolet" : "sparkGreen"})`} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" points={points} />
    </svg>
  );
}

function tagTone(index: number) {
  const tones = [
    "border-violet-300/25 bg-violet-400/12 text-violet-200",
    "border-blue-300/25 bg-blue-400/12 text-blue-200",
    "border-cyan-300/25 bg-cyan-400/12 text-cyan-200",
    "border-emerald-300/25 bg-emerald-400/12 text-emerald-200",
    "border-amber-300/25 bg-amber-400/12 text-amber-200",
    "border-fuchsia-300/25 bg-fuchsia-400/12 text-fuchsia-200",
  ];
  return tones[index % tones.length];
}

function donutGradient(allocation: (string | number)[][]) {
  const colors = ["#22c55e", "#38bdf8", "#facc15", "#8b5cf6", "#f97316", "#f472b6"];
  let cursor = 0;
  const stops = allocation.map(([, rawValue], index) => {
    const value = Number(rawValue);
    const start = cursor;
    cursor += value;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}
