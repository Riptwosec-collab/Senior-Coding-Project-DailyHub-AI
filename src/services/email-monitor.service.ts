import type { ScheduledTask } from "@/types/scheduled-task";
import type { DataSourceResult } from "./data-source.service";

type DailyEmailItem = {
  subject: string;
  from: string;
  category: string;
  priorityHint: "high" | "medium" | "low";
  summary: string;
  suggestedAction: string;
  receivedAt: string;
  status: "unread" | "read";
};

export async function fetchEmailUpdates(_task: ScheduledTask): Promise<DataSourceResult> {
  const today = new Date().toISOString();
  const items: DailyEmailItem[] = [
    {
      subject: "Security alert: new sign-in detected",
      from: "security@example.com",
      category: "Security",
      priorityHint: "high",
      summary: "มีอีเมลแจ้งเตือนความปลอดภัยเกี่ยวกับการเข้าสู่ระบบใหม่ ควรตรวจสอบว่าเป็นการใช้งานของเราหรือไม่",
      suggestedAction: "ตรวจสอบอุปกรณ์และ location ถ้าไม่ใช่เราให้เปลี่ยนรหัสผ่าน/เปิด MFA",
      receivedAt: today,
      status: "unread",
    },
    {
      subject: "Invoice reminder for cloud services",
      from: "billing@example.com",
      category: "Billing",
      priorityHint: "medium",
      summary: "แจ้งเตือนใบแจ้งหนี้หรือรอบชำระค่าบริการ cloud/API",
      suggestedAction: "ตรวจยอด ค่าใช้จ่าย และวันครบกำหนดก่อนหมดรอบ",
      receivedAt: today,
      status: "unread",
    },
    {
      subject: "Daily project update: Nimbus deploy status",
      from: "devops@example.com",
      category: "Project / DevOps",
      priorityHint: "medium",
      summary: "สรุปสถานะ deploy และงานที่ควรเช็กต่อ เช่น build, error log และ environment variables",
      suggestedAction: "เปิดดู deploy ล่าสุดและแก้ error ที่ยังค้าง",
      receivedAt: today,
      status: "read",
    },
    {
      subject: "Meeting notes and action items",
      from: "team@example.com",
      category: "Work",
      priorityHint: "medium",
      summary: "มีโน้ตประชุมพร้อม action items ที่ต้องติดตาม",
      suggestedAction: "ดึง task ที่ต้องทำไปใส่ scheduled tasks หรือ checklist",
      receivedAt: today,
      status: "read",
    },
    {
      subject: "Newsletter: AI infrastructure weekly",
      from: "newsletter@example.com",
      category: "Newsletter / Learning",
      priorityHint: "low",
      summary: "บทความอ่านต่อเกี่ยวกับ AI infrastructure, data center และ network capacity",
      suggestedAction: "เก็บไว้ใน Data Library / Long Read",
      receivedAt: today,
      status: "unread",
    },
    {
      subject: "Promotion / product update",
      from: "updates@example.com",
      category: "Updates",
      priorityHint: "low",
      summary: "อัปเดตสินค้า/บริการทั่วไป ยังไม่เร่งด่วน",
      suggestedAction: "อ่านเมื่อว่างหรือ archive ถ้าไม่เกี่ยวข้อง",
      receivedAt: today,
      status: "read",
    },
  ];

  const high = items.filter((item) => item.priorityHint === "high").length;
  const medium = items.filter((item) => item.priorityHint === "medium").length;
  const low = items.filter((item) => item.priorityHint === "low").length;

  return {
    source: "Gmail Daily Digest",
    status: process.env.ENABLE_GMAIL_SOURCE === "true" ? "skipped" : "mock",
    title: "สรุปอีเมลรายวันทั้งหมด",
    originalContent: items.map((item) => `${item.category} | ${item.subject} from ${item.from} | ${item.priorityHint} | ${item.summary} | Action: ${item.suggestedAction}`).join("\n"),
    language: "th",
    items,
    data: {
      scope: "all daily emails",
      total: items.length,
      high,
      medium,
      low,
      unread: items.filter((item) => item.status === "unread").length,
      items,
    },
  };
}
