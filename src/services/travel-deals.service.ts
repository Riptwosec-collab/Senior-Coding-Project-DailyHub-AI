import type { ScheduledTask } from "@/types/scheduled-task";
import type { DataSourceResult } from "./data-source.service";

type TravelDealItem = {
  deal: string;
  category: "domestic-flight" | "international-flight" | "hotel" | "travel-package";
  origin: string;
  destination: string;
  summary: string;
  whatToCheck: string[];
  priorityScore: number;
};

export async function fetchTravelDealsInput(_task: ScheduledTask): Promise<DataSourceResult> {
  void _task;

  const items: TravelDealItem[] = [
    {
      deal: "โปรตั๋วเครื่องบินในประเทศจากกรุงเทพฯ",
      category: "domestic-flight",
      origin: "Bangkok / Thailand",
      destination: "Chiang Mai / Phuket / Krabi watchlist",
      summary: "ติดตามโปรเส้นทางในประเทศที่เริ่มบินจากไทย เหมาะกับทริปสั้นและวันหยุดต่อเนื่อง",
      whatToCheck: ["วันเดินทาง", "น้ำหนักกระเป๋า", "สนามบินต้นทาง", "ค่าธรรมเนียมจ่ายเงิน", "เงื่อนไขเปลี่ยนวัน"],
      priorityScore: 80,
    },
    {
      deal: "โปรต่างประเทศที่เริ่มบินจากไทย",
      category: "international-flight",
      origin: "Thailand",
      destination: "Japan / Korea / Singapore / Europe watchlist",
      summary: "รวมข่าวโปร airfare และเส้นทางบินใหม่จากไทยที่ควรอ่านเงื่อนไขก่อนจอง",
      whatToCheck: ["ภาษีสนามบิน", "ช่วง blackout date", "transit", "visa", "รวมโหลดกระเป๋าหรือไม่"],
      priorityScore: 82,
    },
    {
      deal: "โปรห้องพัก โรงแรม และรีสอร์ตในไทย",
      category: "hotel",
      origin: "Thailand",
      destination: "Bangkok / Pattaya / Hua Hin / Phuket watchlist",
      summary: "ติดตามราคาห้องพัก โปรโรงแรม รีสอร์ต และแพ็กเกจที่เกี่ยวกับเที่ยวไทย",
      whatToCheck: ["รวมอาหารเช้าหรือไม่", "ยกเลิกฟรีไหม", "วันเข้าพัก", "ภาษี/ค่าบริการ", "รีวิวล่าสุด"],
      priorityScore: 76,
    },
    {
      deal: "แพ็กเกจเที่ยวไทยและกิจกรรมพร้อมส่วนลด",
      category: "travel-package",
      origin: "Thailand",
      destination: "Thailand destinations",
      summary: "รวมโปรท่องเที่ยวที่เกี่ยวกับที่เที่ยวในไทย เช่น บัตรกิจกรรม ทัวร์วันเดียว หรือแพ็กเกจเดินทาง",
      whatToCheck: ["วันหมดอายุ", "เงื่อนไขคืนเงิน", "จำนวนคนขั้นต่ำ", "สถานที่รับบริการ", "ค่าใช้จ่ายเพิ่มเติม"],
      priorityScore: 72,
    },
  ];

  return {
    source: "Travel Promotions",
    status: "mock",
    title: "โปรเดินทาง / ตั๋วเครื่องบิน / โรงแรม",
    originalContent: items.map((item) => `${item.deal} | ${item.origin} -> ${item.destination} | ${item.summary} | ควรเช็ก: ${item.whatToCheck.join(", ")}`).join("\n\n"),
    language: "th",
    items,
    data: {
      scope: "flight deals, hotel room rates, and Thailand travel promotions",
      items,
    },
  };
}
