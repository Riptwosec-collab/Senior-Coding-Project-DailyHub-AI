import type { ScheduledTask } from "@/types/scheduled-task";
import type { DataSourceResult } from "./data-source.service";

type PublicAlertItem = {
  title: string;
  agency: string;
  area: string;
  severity: "high" | "medium" | "low";
  summary: string;
  recommendedAction: string;
  priorityScore: number;
};

export async function fetchPublicAlertsInput(_task: ScheduledTask): Promise<DataSourceResult> {
  void _task;

  const items: PublicAlertItem[] = [
    {
      title: "เฝ้าระวังประกาศบริการรถไฟฟ้า BTS/MRT",
      agency: "Transit Status Watch",
      area: "Bangkok Metropolitan Area",
      severity: "high",
      summary: "ระบบควรติดตามประกาศขัดข้อง ปรับรูปแบบเดินรถ หรือปิดสถานีชั่วคราวที่อาจกระทบชั่วโมงเร่งด่วน",
      recommendedAction: "ตรวจประกาศทางการและเตรียมเส้นทางสำรองก่อนออกเดินทาง",
      priorityScore: 88,
    },
    {
      title: "ประกาศหน่วยงานรัฐที่กระทบประชาชน",
      agency: "Government Notice Desk",
      area: "Thailand",
      severity: "medium",
      summary: "รวมประกาศปิดพื้นที่ ปรับเวลาบริการสาธารณะ หรือแจ้งเตือนที่ควรรู้ในวันนั้น",
      recommendedAction: "อ่านรายละเอียดจากหน่วยงานทางการและส่ง Telegram เฉพาะรายการสำคัญ",
      priorityScore: 82,
    },
    {
      title: "แจ้งเตือนปิดถนนหรือเปลี่ยนเส้นทาง",
      agency: "Public Route Alert",
      area: "Bangkok / Thailand",
      severity: "medium",
      summary: "สรุปเส้นทางที่ควรหลีกเลี่ยงจากงานซ่อม งานอีเวนต์ หรือเหตุฉุกเฉิน",
      recommendedAction: "เช็กแผนที่และเผื่อเวลาเดินทางเพิ่มเติม",
      priorityScore: 78,
    },
  ];

  return {
    source: "Public Notices",
    status: "mock",
    title: "ประกาศสำคัญ / แจ้งเตือนรัฐ / BTS-MRT",
    originalContent: items.map((item) => `${item.title} | ${item.agency} | ${item.area} | ${item.summary} | ${item.recommendedAction}`).join("\n\n"),
    language: "th",
    items,
    data: {
      scope: "government notices, public alerts, and BTS/MRT disruption watch",
      items,
    },
  };
}
