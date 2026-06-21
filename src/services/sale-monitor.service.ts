import type { ScheduledTask } from "@/types/scheduled-task";
import type { DataSourceResult } from "./data-source.service";

type GlobalProductItem = {
  product: string;
  category: string;
  trendType: string;
  country: string;
  brandOrMaker: string;
  globalSource: string;
  whyInteresting: string;
  highlight: string;
  useCase: string;
  audience: string;
  priceHint: string;
  availability: string;
  caution: string;
  action: string;
  contentIdea: string;
  score: number;
  url: string;
};

export async function fetchSaleUpdates(_task: ScheduledTask): Promise<DataSourceResult> {
  const items: GlobalProductItem[] = [
    {
      product: "AI Wearable Voice Recorder",
      category: "AI Gadget / Productivity",
      trendType: "สินค้า AI สำหรับจดโน้ตและสรุปประชุม",
      country: "Global / US / Japan",
      brandOrMaker: "หลายแบรนด์สาย AI wearable",
      globalSource: "Global tech launches, gadget communities, productivity creators",
      whyInteresting: "กระแสอุปกรณ์พกพาที่อัดเสียง สรุปบทสนทนา และดึง action items กำลังโต เหมาะกับนักเรียน คนทำงาน และสายประชุม",
      highlight: "พกง่าย ใช้เก็บไอเดีย/ประชุม/สัมภาษณ์ แล้วเอาไปสรุปต่อด้วย AI",
      useCase: "จดประชุม, สัมภาษณ์, เก็บไอเดีย, ทำสรุปงานประจำวัน",
      audience: "นักเรียน, คนทำงาน, creator, sales, project manager",
      priceHint: "ประมาณกลาง-สูง แล้วแต่แบรนด์และ subscription",
      availability: "เริ่มมีหลายรุ่นในตลาดโลก ควรเช็กรีวิวจริงก่อนซื้อ",
      caution: "ต้องระวังเรื่อง privacy, การขออนุญาตอัดเสียง และค่า subscription รายเดือน",
      action: "น่าติดตามมากกว่ารีบซื้อ ให้เทียบคุณภาพสรุปภาษาไทย แบตเตอรี่ และนโยบายข้อมูลก่อน",
      contentIdea: "ทำโพสต์ 9:16: ‘AI gadget ที่เปลี่ยนเสียงประชุมเป็น To-do list ได้’ พร้อมเทียบข้อดี/ข้อควรระวัง",
      score: 92,
      url: "https://www.google.com/search?q=AI+wearable+voice+recorder+meeting+summary",
    },
    {
      product: "Portable Dual-Screen Laptop Monitor",
      category: "Work Setup / Remote Work",
      trendType: "จอเสริมพกพาสำหรับทำงานหลายหน้าจอ",
      country: "Global / China / US",
      brandOrMaker: "หลายแบรนด์สาย mobile workstation",
      globalSource: "Remote work gear, Kickstarter-style gadgets, laptop accessory trends",
      whyInteresting: "คนทำงานนอกบ้านและสาย coding ต้องการ workspace หลายจอแบบพกได้ ทำให้จอเสริมบางเบายังน่าจับตา",
      highlight: "ต่อโน้ตบุ๊กแล้วได้พื้นที่ทำงานเพิ่ม เหมาะกับ dashboard, coding, spreadsheet, monitoring",
      useCase: "เขียนโค้ด, ดู dashboard, เทรดหุ้น, monitor system, ทำรายงาน",
      audience: "developer, network engineer, analyst, student, digital nomad",
      priceHint: "ประมาณกลาง-สูง ขึ้นกับขนาดจอ ความสว่าง และพอร์ต USB-C",
      availability: "มีหลายรุ่นทั่วโลก ควรดูรีวิวเรื่องน้ำหนัก ขาตั้ง และความสว่างกลางแจ้ง",
      caution: "บางรุ่นกินไฟเยอะ หรือขาตั้งไม่แน่น ต้องเช็กพอร์ตเครื่องก่อนซื้อ",
      action: "เหมาะเก็บเข้ารายการ ‘ของน่าสนใจสำหรับโต๊ะทำงาน’ แล้วคัดรุ่นที่รีวิวดี",
      contentIdea: "ทำคลิป/ภาพ: ‘ของชิ้นเดียวที่ทำให้โน้ตบุ๊กกลายเป็น mini command center’",
      score: 88,
      url: "https://www.google.com/search?q=portable+dual+screen+laptop+monitor+2026",
    },
    {
      product: "E-Ink Smart Dashboard / Desk Display",
      category: "Smart Desk / Minimal Tech",
      trendType: "จอ e-ink สำหรับแสดง calendar, weather, tasks, habit",
      country: "Global / EU / Japan",
      brandOrMaker: "Indie hardware makers และ smart home creators",
      globalSource: "Smart desk setups, e-ink projects, productivity hardware",
      whyInteresting: "จอ e-ink อ่านง่าย ประหยัดไฟ และดูมินิมอล เหมาะกับคนที่อยากเห็น schedule โดยไม่ต้องเปิดมือถือ",
      highlight: "แสดงงานวันนี้ สภาพอากาศ ตารางเรียน/ประชุม หรือ habit แบบไม่รบกวนสายตา",
      useCase: "โต๊ะทำงาน, ห้องนอน, daily planner, dashboard ส่วนตัว",
      audience: "สาย productivity, นักเรียน, คนทำงาน, smart home enthusiast",
      priceHint: "หลากหลาย ตั้งแต่ DIY kit ถึงสินค้าพรีเมียม",
      availability: "บางรุ่นเป็นสินค้ากลุ่ม niche หรือ pre-order ต้องดูความน่าเชื่อถือร้าน",
      caution: "ต้องเช็ก app, API, ภาษาไทย และการ sync กับ Google Calendar/Notion",
      action: "เหมาะเอาไปเป็นไอเดียฟีเจอร์ Nimbus Daily dashboard เวอร์ชัน physical display",
      contentIdea: "โพสต์: ‘Dashboard ที่ไม่ต้องเปิดมือถือ—จอ e-ink บนโต๊ะทำงาน’",
      score: 86,
      url: "https://www.google.com/search?q=e-ink+smart+dashboard+desk+display",
    },
    {
      product: "Compact GaN Charger with Smart Display",
      category: "Charging / Everyday Carry",
      trendType: "หัวชาร์จ GaN เล็กลงแต่ watt สูงขึ้น พร้อมหน้าจอแสดงกำลังไฟ",
      country: "Global / China / Taiwan",
      brandOrMaker: "หลายแบรนด์สาย charging accessory",
      globalSource: "EDC communities, charger reviews, USB-C accessory trends",
      whyInteresting: "USB-C กลายเป็นมาตรฐานหลัก คนเริ่มสนใจหัวชาร์จตัวเดียวที่ชาร์จมือถือ แท็บเล็ต และโน้ตบุ๊กได้",
      highlight: "ขนาดเล็ก พอร์ตหลายช่อง แสดง watt เพื่อเช็กว่าชาร์จเร็วจริงหรือไม่",
      useCase: "เดินทาง, ทำงานนอกบ้าน, ชาร์จโน้ตบุ๊ก/มือถือ/หูฟังพร้อมกัน",
      audience: "นักเรียน, คนทำงาน, traveler, gadget user",
      priceHint: "ประมาณกลาง ขึ้นกับ watt, จำนวนพอร์ต, certification",
      availability: "มีหลายรุ่นทั่วโลก ควรซื้อจากแบรนด์ที่มีมาตรฐานความปลอดภัย",
      caution: "ต้องเช็กมาตรฐาน PD/PPS, ความร้อน, ปลั๊ก, ประกัน และรีวิวระยะยาว",
      action: "น่าสนใจแต่ควรทำ checklist ก่อนซื้อ ไม่ควรดูแค่ watt สูง",
      contentIdea: "ทำภาพ checklist: ‘ก่อนซื้อหัวชาร์จ GaN ต้องดู 5 อย่าง’",
      score: 84,
      url: "https://www.google.com/search?q=GaN+charger+smart+display+USB-C+PD",
    },
    {
      product: "Mini Robot Vacuum for Desk / Small Room",
      category: "Home Gadget / Cleaning",
      trendType: "หุ่นยนต์ทำความสะอาดขนาดเล็กสำหรับพื้นที่เฉพาะ",
      country: "Global / Korea / China",
      brandOrMaker: "Home gadget brands และ lifestyle gadget makers",
      globalSource: "Home gadget trends, small-space living, desk setup communities",
      whyInteresting: "สินค้าแนว convenience gadget โตเพราะคนอยู่คอนโด/หอ/ห้องเล็กมากขึ้น และอยากได้อุปกรณ์ดูแลง่าย",
      highlight: "ช่วยเก็บฝุ่นเล็ก ๆ บนโต๊ะหรือพื้นห้องเล็ก เหมาะกับ content สายห้องน่าอยู่",
      useCase: "โต๊ะทำงาน, ห้องเล็ก, หอพัก, มุม gaming setup",
      audience: "นักเรียน, คนอยู่คอนโด, คนรัก desk setup, pet owner",
      priceHint: "มีตั้งแต่ประหยัดถึงกลาง แล้วแต่ sensor และแรงดูด",
      availability: "มีหลายรุ่นในตลาดโลก แต่คุณภาพต่างกันมาก",
      caution: "ต้องเช็กแรงดูด เสียงดัง แบตเตอรี่ อะไหล่ และรีวิวจริง อย่าดูแค่ความน่ารัก",
      action: "เหมาะทำเป็น content ‘ของแต่งห้องที่ใช้งานได้จริงไหม’ มากกว่าฟันธงซื้อทันที",
      contentIdea: "โพสต์รีวิวแนว: ‘น่ารัก vs ใช้งานจริง: mini robot vacuum คุ้มไหม?’",
      score: 79,
      url: "https://www.google.com/search?q=mini+robot+vacuum+desk+small+room+gadget",
    },
  ];

  return {
    source: "Global Product Radar",
    status: "mock",
    title: "สินค้าออกใหม่/น่าสนใจจากทั่วโลก",
    originalContent: items
      .map(
        (item) =>
          `${item.product} (${item.category}) from ${item.country}. Trend: ${item.trendType}. Why interesting: ${item.whyInteresting}. Highlight: ${item.highlight}. Use case: ${item.useCase}. Audience: ${item.audience}. Price hint: ${item.priceHint}. Caution: ${item.caution}. Action: ${item.action}. Score: ${item.score}/100.`,
      )
      .join("\n"),
    language: "mixed",
    items,
    data: items,
  };
}
