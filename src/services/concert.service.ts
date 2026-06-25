import type { ScheduledTask } from "@/types/scheduled-task";
import type { DataSourceResult } from "./data-source.service";

type ThailandConcertItem = {
  artist: string;
  eventName: string;
  country: "Thailand";
  city: string;
  date: string;
  time: string;
  venue: string;
  area: string;
  genre: string;
  ticketStatus: string;
  priceRange: string;
  saleDate: string;
  source: string;
  url: string;
  whyInteresting: string;
  audience: string;
  travelNote: string;
  ticketTips: string[];
  checklist: string[];
  contentAngle: string;
  priorityReason: string;
  action: string;
  score: number;
};

export async function fetchConcertUpdates(_task: ScheduledTask): Promise<DataSourceResult> {
  const items: ThailandConcertItem[] = [
    {
      artist: "Nont Tanont",
      eventName: "Nont Tanont Live in Bangkok",
      country: "Thailand",
      city: "Bangkok",
      date: "2026-08-01",
      time: "19:00",
      venue: "Impact Arena",
      area: "Muang Thong Thani, Nonthaburi / Bangkok Metro",
      genre: "Thai Pop / Vocal",
      ticketStatus: "Coming soon",
      priceRange: "ประมาณ 1,500-5,500 บาท",
      saleDate: "รอประกาศรอบขายบัตร",
      source: "ThaiTicketMajor / Organizer announcement watchlist",
      url: "https://www.thaiticketmajor.com/",
      whyInteresting: "ศิลปินไทยกระแสสูง ฐานแฟนกว้าง โอกาสบัตรขายเร็ว เหมาะกับการแจ้งเตือนล่วงหน้า",
      audience: "แฟนเพลงไทย, คนชอบคอนเสิร์ต vocal, กลุ่มเพื่อนที่อยากไปงานใหญ่",
      travelNote: "ควรวางแผนรถติดและที่จอดรถ Impact Arena ล่วงหน้า โดยเฉพาะวันเสาร์-อาทิตย์",
      ticketTips: [
        "ล็อกอินเว็บขายบัตรก่อนเวลาเปิดขาย",
        "เช็กผังที่นั่งและงบก่อนกดซื้อ",
        "เตรียมวิธีชำระเงินสำรองเผื่อระบบหน่วง",
      ],
      checklist: [
        "วันเปิดขายบัตร",
        "ผังที่นั่ง",
        "ราคาบัตร",
        "เวลาเริ่มแสดง",
        "การเดินทางกลับหลังจบงาน",
      ],
      contentAngle: "ทำโพสต์: ‘คอนเสิร์ตไทยที่ควรตั้งแจ้งเตือนบัตร’ พร้อม checklist ก่อนกดซื้อ",
      priorityReason: "คะแนนสูงเพราะเป็นงานในไทย เดินทางได้จริง และมีโอกาสบัตรหมดเร็ว",
      action: "ตั้ง reminder วันเปิดขายบัตรและเช็กผังที่นั่งทันทีเมื่อประกาศ",
      score: 90,
    },
    {
      artist: "Slot Machine",
      eventName: "Slot Machine Rock Live Bangkok",
      country: "Thailand",
      city: "Bangkok",
      date: "2026-08-15",
      time: "18:30",
      venue: "Union Hall",
      area: "Union Mall, Lat Phrao, Bangkok",
      genre: "Thai Rock / Alternative",
      ticketStatus: "Early bird available",
      priceRange: "ประมาณ 1,200-3,800 บาท",
      saleDate: "เปิดขายรอบ Early Bird",
      source: "ThaiTicketMajor / Event platform watchlist",
      url: "https://www.thaiticketmajor.com/",
      whyInteresting: "เหมาะกับคนชอบวงร็อกไทย งานในกรุงเทพ เดินทางสะดวกด้วย MRT/BTS ต่อได้",
      audience: "แฟนเพลงร็อกไทย, วัยเรียน-วัยทำงาน, คนชอบ live band",
      travelNote: "Union Hall เดินทางง่ายกว่า Impact แต่ควรเผื่อเวลาคนเยอะช่วงเลิกงาน",
      ticketTips: [
        "เช็ก zone ยืน/นั่งให้ชัด",
        "ดูเงื่อนไข Early Bird ว่าคืนเงินหรือเปลี่ยนชื่อได้ไหม",
        "ถ้าไปเป็นกลุ่มควรกดพร้อมกันเพื่อได้นั่งใกล้กัน",
      ],
      checklist: ["ประเภทบัตร", "ทางเข้า-ออกงาน", "เวลาเปิดประตู", "ข้อห้ามนำของเข้า", "ที่จอดรถ"],
      contentAngle: "ทำโพสต์: ‘คอนเสิร์ตร็อกไทยในกรุงเทพที่น่าไป’ พร้อมเทียบค่าเดินทางและงบ",
      priorityReason: "คะแนนสูงเพราะเป็นงานในกรุงเทพและมีสถานะขายบัตรแล้ว",
      action: "น่ากดดูทันทีถ้าราคาบัตร Early Bird ยังเหลือ",
      score: 86,
    },
    {
      artist: "Tilly Birds",
      eventName: "Tilly Birds Weekend Live",
      country: "Thailand",
      city: "Bangkok",
      date: "2026-09-05",
      time: "19:00",
      venue: "Lido Connect",
      area: "Siam Square, Bangkok",
      genre: "Thai Pop Rock / Indie",
      ticketStatus: "Announced",
      priceRange: "ประมาณ 900-2,500 บาท",
      saleDate: "รอประกาศวันขายบัตร",
      source: "Organizer social watchlist / Ticket platform watchlist",
      url: "https://www.thaiticketmajor.com/",
      whyInteresting: "สถานที่กลางเมือง เดินทางง่าย เหมาะกับคนอยากดูคอนเสิร์ตขนาดกลางไม่ไกล",
      audience: "แฟนเพลงอินดี้ไทย, นักเรียน/นักศึกษา, คนชอบงานใกล้ BTS",
      travelNote: "เหมาะกับเดินทางด้วย BTS สยาม เลี่ยงเอารถไปเพราะที่จอดจำกัด",
      ticketTips: [
        "กดติดตามเพจ organizer",
        "เตรียมงบและวันว่างก่อนบัตรเปิดขาย",
        "เช็กว่าเป็น standing หรือ seated show",
      ],
      checklist: ["วันขายบัตร", "เวลาเปิดประตู", "รูปแบบงาน", "อายุผู้เข้าชม", "การเดินทาง BTS"],
      contentAngle: "ทำโพสต์: ‘คอนเสิร์ตในเมือง เดินทางง่าย เหมาะกับวันหยุด’",
      priorityReason: "คะแนนกลาง-สูงเพราะเป็นงานในไทยและเดินทางง่าย แต่ยังรอวันขายบัตร",
      action: "บันทึกไว้เป็นตัวเลือกวันหยุดและรอประกาศรอบขายบัตร",
      score: 80,
    },
    {
      artist: "BOWKYLION",
      eventName: "BOWKYLION Intimate Concert",
      country: "Thailand",
      city: "Bangkok",
      date: "2026-09-20",
      time: "18:00",
      venue: "KBank Siam Pic-Ganesha Theatre",
      area: "Siam Square One, Bangkok",
      genre: "Thai Pop / Emotional Vocal",
      ticketStatus: "Watchlist",
      priceRange: "ประมาณ 1,000-4,000 บาท",
      saleDate: "รอประกาศ",
      source: "Artist / Organizer watchlist",
      url: "https://www.thaiticketmajor.com/",
      whyInteresting: "งานในฮอลล์ขนาดไม่ใหญ่มาก เหมาะกับคนที่อยากฟังเสียงร้องและบรรยากาศใกล้ชิด",
      audience: "แฟนเพลงไทยป๊อป, คนชอบเพลงเศร้า/เสียงร้องสด, คู่เพื่อนหรือคู่เดต",
      travelNote: "เดินทางง่ายด้วย BTS สยาม แต่ควรเผื่อเวลาคนเยอะในห้าง",
      ticketTips: ["โซนใกล้เวทีอาจหมดเร็ว", "เช็กมุมมองจากที่นั่ง", "ดูรอบการแสดงว่ามีหลายรอบไหม"],
      checklist: ["รอบแสดง", "โซนที่นั่ง", "ราคาบัตร", "เงื่อนไขซื้อบัตร", "เวลาเดินทาง"],
      contentAngle: "ทำโพสต์: ‘คอนเสิร์ตไทยบรรยากาศดี เหมาะกับคนชอบฟังสด’",
      priorityReason: "เป็นงานในไทย เดินทางง่าย และเหมาะกับกลุ่มผู้ใช้ที่อยากหากิจกรรมวันหยุด",
      action: "ติดตามวันขายบัตรและเลือกโซนที่นั่งก่อนเปิดขาย",
      score: 78,
    },
  ];

  const thailandOnly = items.filter((item) => item.country === "Thailand" && /bangkok|nonthaburi|thailand/i.test(`${item.city} ${item.area} ${item.venue}`));

  return {
    source: "Concert API Thailand Only",
    status: "mock",
    title: "Thailand Concert Alerts",
    originalContent: thailandOnly
      .map(
        (item) =>
          `${item.eventName} — ${item.artist} | ${item.city}, Thailand | ${item.venue} | ${item.date} ${item.time} | Genre: ${item.genre} | Ticket: ${item.ticketStatus} | Price: ${item.priceRange} | Why: ${item.whyInteresting} | Tips: ${item.ticketTips.join("; ")} | Action: ${item.action} | Score: ${item.score}/100`,
      )
      .join("\n\n"),
    language: "th",
    items: thailandOnly,
    data: thailandOnly,
  };
}
