import type { ScheduledTask } from "@/types/scheduled-task";
import type { DataSourceResult } from "./data-source.service";

export async function fetchFootballUpdates(_task: ScheduledTask): Promise<DataSourceResult> {
  const items = [
    {
      homeTeam: "Germany",
      awayTeam: "Ecuador",
      teamNames: "Germany vs Ecuador",
      match: "Germany vs Ecuador",
      score: "Scheduled",
      status: "Upcoming",
      competition: "FIFA World Cup 2026",
      group: "Group E",
      kickoff: "2026-06-25 16:00 EDT",
      highlight: "คู่สำคัญของกลุ่ม E เยอรมนีต้องการรักษาฟอร์มต่อเนื่อง ส่วนเอกวาดอร์ต้องการแต้มเพื่อโอกาสเข้ารอบ",
      keyMoment: "ก่อนแข่งควรจับตาการขึ้นเกมริมเส้นของ Germany และการโต้กลับของ Ecuador",
      thaiNote: "ส่ง Telegram ด้วยชื่อทีมจริง: Germany vs Ecuador ไม่ใช้ Team A / Team B",
    },
    {
      homeTeam: "Netherlands",
      awayTeam: "Tunisia",
      teamNames: "Netherlands vs Tunisia",
      match: "Netherlands vs Tunisia",
      score: "Scheduled",
      status: "Upcoming",
      competition: "FIFA World Cup 2026",
      group: "Group F",
      kickoff: "2026-06-25 19:00 EDT",
      highlight: "Netherlands ต้องการปิดจ็อบกลุ่ม ส่วน Tunisia ต้องเล่นแบบมีวินัยและใช้จังหวะสวนกลับ",
      keyMoment: "ประเด็นน่าดูคือเกมรุกของ Netherlands กับแนวรับ Tunisia",
      thaiNote: "ใช้ชื่อทีมจริงครบทั้งสองฝั่งในทุกสรุป",
    },
    {
      homeTeam: "Brazil",
      awayTeam: "Scotland",
      teamNames: "Brazil vs Scotland",
      match: "Brazil vs Scotland",
      score: "Brazil 3-0 Scotland",
      status: "Complete",
      competition: "FIFA World Cup 2026",
      group: "Group C",
      highlight: "Brazil ชนะชัดเจนด้วยเกมรุกที่คมกว่าและควบคุมจังหวะได้ดี",
      keyMoment: "Brazil ใช้การครองบอลและจังหวะเข้าทำเร็ว ทำให้ Scotland ไล่เกมยาก",
      thaiNote: "เหมาะกับสรุปเป็นบทเรียนเรื่องคุณภาพจังหวะสุดท้ายและการคุมเกม",
    },
    {
      homeTeam: "Morocco",
      awayTeam: "Haiti",
      teamNames: "Morocco vs Haiti",
      match: "Morocco vs Haiti",
      score: "Morocco 4-2 Haiti",
      status: "Complete",
      competition: "FIFA World Cup 2026",
      group: "Group C",
      highlight: "Morocco ชนะเกมที่มีหลายประตูและจังหวะสวนกลับสนุก",
      keyMoment: "Haiti สู้ได้ดีแต่ Morocco ใช้โอกาสหน้าประตูได้เฉียบกว่า",
      thaiNote: "เหมาะกับทำ recap แบบอ่านง่าย มีชื่อทีมและสกอร์ชัดเจน",
    },
  ];

  return {
    source: "Football API",
    status: "mock",
    title: "Football Recap by Team Names",
    originalContent: items
      .map((item) => `${item.match} | ${item.score} | ${item.status} | ${item.group}. ${item.highlight}. ${item.keyMoment}`)
      .join("\n"),
    language: "mixed",
    items,
    data: items,
  };
}
