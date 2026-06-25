import type { ScheduledTask } from "@/types/scheduled-task";
import type { DataSourceResult } from "./data-source.service";

type FootballNewsItem = {
  category: string;
  competition: string;
  leagueGroup: string;
  headline: string;
  teamNames: string;
  homeTeam?: string;
  awayTeam?: string;
  scoreOrStatus: string;
  matchStatus: string;
  kickoff?: string;
  countryOrRegion: string;
  summary: string;
  keyMoment: string;
  playerFocus?: string;
  whyItMatters: string;
  whatToWatchNext: string;
  contentAngle: string;
  priorityScore: number;
};

export async function fetchFootballUpdates(_task: ScheduledTask): Promise<DataSourceResult> {
  const items: FootballNewsItem[] = [
    {
      category: "บอลไทย",
      competition: "Thai League / Thailand Football",
      leagueGroup: "Thailand",
      headline: "จับตาฟอร์มทีมไทยลีกและทีมชาติไทยก่อนโปรแกรมสำคัญ",
      teamNames: "Buriram United / Bangkok United / Thailand National Team",
      scoreOrStatus: "News watch",
      matchStatus: "Preview",
      countryOrRegion: "Thailand",
      summary: "สรุปข่าวบอลไทยเน้นฟอร์มทีมใหญ่, นักเตะทีมชาติ, โปรแกรมถัดไป และประเด็นที่ส่งผลต่อทีมชาติไทย",
      keyMoment: "ควรดูข่าวอาการบาดเจ็บและการหมุนเวียนนักเตะก่อนเกมใหญ่",
      playerFocus: "นักเตะทีมชาติไทยและตัวหลักของทีมลุ้นแชมป์ไทยลีก",
      whyItMatters: "บอลไทยเป็นหมวดที่ผู้ใช้ต้องการติดตามใกล้ตัวและต่อยอดเป็นคอนเทนต์ภาษาไทยได้ง่าย",
      whatToWatchNext: "โปรแกรมไทยลีก, ช้างศึก, ACL และข่าวตลาดนักเตะในไทย",
      contentAngle: "ทำโพสต์: สรุปบอลไทยวันนี้ ทีมไหนน่าจับตา / นักเตะคนไหนกำลังฟอร์มดี",
      priorityScore: 88,
    },
    {
      category: "บอลโลก",
      competition: "FIFA World Cup",
      leagueGroup: "World Cup",
      headline: "โปรแกรมบอลโลกต้องสรุปด้วยชื่อทีมจริงและสถานะล่าสุด",
      teamNames: "Ecuador vs Germany / Tunisia vs Netherlands / Japan vs Sweden",
      homeTeam: "Ecuador",
      awayTeam: "Germany",
      scoreOrStatus: "Scheduled / Results watch",
      matchStatus: "Upcoming",
      kickoff: "ตามตาราง FIFA World Cup",
      countryOrRegion: "Global",
      summary: "สรุปคู่สำคัญบอลโลกโดยเน้นชื่อทีมจริง สถานะการแข่งขัน กลุ่ม และประเด็นเข้ารอบ",
      keyMoment: "ดูทีมที่ต้องชนะเพื่อเข้ารอบและทีมที่ต้องรักษาอันดับกลุ่ม",
      playerFocus: "ตัวรุกทีมใหญ่และผู้รักษาประตูในเกมชี้ชะตา",
      whyItMatters: "บอลโลกเป็นรายการใหญ่สุด ข่าวแต่ละวันมีผลต่อ bracket และทีมเต็ง",
      whatToWatchNext: "ผลการแข่งขัน, ตารางรอบต่อไป, ทีมที่เข้ารอบ/ตกรอบ",
      contentAngle: "ทำโพสต์: คู่บอลโลกคืนนี้ดูอะไรดี + ทีมไหนต้องชนะ",
      priorityScore: 92,
    },
    {
      category: "พรีเมียร์ลีก",
      competition: "English Premier League",
      leagueGroup: "Premier League",
      headline: "พรีเมียร์ลีกต้องติดตามข่าวทีมใหญ่ ตารางแข่ง และตลาดนักเตะ",
      teamNames: "Manchester City / Arsenal / Liverpool / Manchester United / Chelsea / Tottenham",
      scoreOrStatus: "News watch",
      matchStatus: "League news",
      countryOrRegion: "England",
      summary: "เก็บข่าวทีมใหญ่ พรีเมียร์ลีก ทั้งฟอร์มล่าสุด การบาดเจ็บ ข่าวซื้อขาย และบทวิเคราะห์ก่อนเกม",
      keyMoment: "ทีมลุ้นแชมป์และทีมลุ้นพื้นที่ UCL มักทำให้ข่าวมีผลต่อความสนใจสูง",
      playerFocus: "กองหน้าตัวหลัก, playmaker และผู้เล่นที่มีข่าวย้ายทีม",
      whyItMatters: "พรีเมียร์ลีกเป็นลีกที่คนไทยติดตามมากและเหมาะทำสรุปประจำวัน",
      whatToWatchNext: "ข่าว lineup, injury report, transfer rumor และ match preview",
      contentAngle: "ทำโพสต์: ข่าวพรีเมียร์ลีกวันนี้แบบสั้น อ่านจบใน 1 นาที",
      priorityScore: 90,
    },
    {
      category: "ลาลีก้า",
      competition: "LaLiga",
      leagueGroup: "LaLiga",
      headline: "ลาลีก้าเน้นข่าว Real Madrid, Barcelona และทีมลุ้นยุโรป",
      teamNames: "Real Madrid / Barcelona / Atletico Madrid / Girona",
      scoreOrStatus: "News watch",
      matchStatus: "League news",
      countryOrRegion: "Spain",
      summary: "สรุปข่าวลาลีก้าทั้งฟอร์มทีมใหญ่ ดาวรุ่ง และประเด็นแท็กติกก่อนเกม",
      keyMoment: "ข่าวตัวจริงและการหมุนเวียนนักเตะส่งผลต่อเกมใหญ่",
      playerFocus: "ดาวรุ่งและนักเตะแนวรุกทีมใหญ่",
      whyItMatters: "ลาลีก้าเป็นลีกหลักยุโรปที่มีฐานแฟนจำนวนมากและข่าวทีมใหญ่กระทบกระแสฟุตบอลโลก/ยุโรป",
      whatToWatchNext: "ข่าวก่อนเกม El Clasico, injury, transfer และ UCL form",
      contentAngle: "ทำโพสต์: สรุปลาลีก้าวันนี้ ทีมใหญ่มีอะไรอัปเดต",
      priorityScore: 82,
    },
    {
      category: "บุนเดสลีก้า",
      competition: "Bundesliga",
      leagueGroup: "Bundesliga",
      headline: "บุนเดสลีก้าติดตาม Bayern, Dortmund, Leverkusen และดาวรุ่ง",
      teamNames: "Bayern Munich / Borussia Dortmund / Bayer Leverkusen / RB Leipzig",
      scoreOrStatus: "News watch",
      matchStatus: "League news",
      countryOrRegion: "Germany",
      summary: "เน้นข่าวทีมลุ้นแชมป์ ดาวรุ่ง และนักเตะที่มีโอกาสย้ายทีมสู่ลีกใหญ่",
      keyMoment: "ลีกนี้มีข่าวดาวรุ่งและ pressing style ที่น่าสนใจสำหรับวิเคราะห์แท็กติก",
      playerFocus: "กองกลางดาวรุ่ง, ปีกความเร็วสูง และ striker ฟอร์มแรง",
      whyItMatters: "เหมาะกับคอนเทนต์วิเคราะห์ฟอร์มผู้เล่นและตลาดซื้อขาย",
      whatToWatchNext: "ฟอร์มทีมลุ้นแชมป์, ดาวรุ่ง, ข่าวย้ายทีม",
      contentAngle: "ทำโพสต์: ดาวรุ่งบุนเดสลีก้าที่ควรรู้จัก",
      priorityScore: 78,
    },
    {
      category: "เซเรียอา",
      competition: "Serie A",
      leagueGroup: "Serie A",
      headline: "เซเรียอาเน้นแท็กติก ทีมลุ้นแชมป์ และเกมรับคุณภาพ",
      teamNames: "Inter Milan / AC Milan / Juventus / Napoli / Roma",
      scoreOrStatus: "News watch",
      matchStatus: "League news",
      countryOrRegion: "Italy",
      summary: "สรุปข่าวเซเรียอาเน้นการแข่งขันหัวตาราง แท็กติกเกมรับ และข่าวโค้ช/นักเตะสำคัญ",
      keyMoment: "เกมใหญ่ของเซเรียอามักมีรายละเอียดแท็กติกสูงและเหมาะกับสรุปเชิงวิเคราะห์",
      playerFocus: "กองหลัง, กองกลางคุมจังหวะ และ striker ตัวเป้า",
      whyItMatters: "เพิ่มความหลากหลายให้ Football Recap ไม่ติดแค่พรีเมียร์ลีก",
      whatToWatchNext: "โปรแกรม big match, injury, tactical changes",
      contentAngle: "ทำโพสต์: เซเรียอาวันนี้ เกมไหนน่าดูเพราะแท็กติก",
      priorityScore: 76,
    },
    {
      category: "ลีกเอิง",
      competition: "Ligue 1",
      leagueGroup: "Ligue 1",
      headline: "ลีกเอิงเน้น PSG, ดาวรุ่งฝรั่งเศส และทีมที่ฟอร์มแรง",
      teamNames: "Paris Saint-Germain / Marseille / Lyon / Monaco / Lille",
      scoreOrStatus: "News watch",
      matchStatus: "League news",
      countryOrRegion: "France",
      summary: "ติดตามข่าวทีมใหญ่และดาวรุ่งฝรั่งเศสที่อาจย้ายสู่ลีกยุโรปชั้นนำ",
      keyMoment: "ข่าวดาวรุ่งและเกมยุโรปของทีมฝรั่งเศสมักน่าสนใจต่อเนื่อง",
      playerFocus: "ดาวรุ่งตัวรุกและกองกลางฝรั่งเศส",
      whyItMatters: "เป็นแหล่งข่าว talent pipeline ของยุโรป",
      whatToWatchNext: "ดาวรุ่ง, UCL/UEL form, transfer links",
      contentAngle: "ทำโพสต์: ดาวรุ่งลีกเอิงที่กำลังเป็นกระแส",
      priorityScore: 72,
    },
    {
      category: "ยูฟ่า",
      competition: "UEFA Champions League / Europa League",
      leagueGroup: "UEFA",
      headline: "ยูฟ่าเน้นเกมใหญ่ข้ามลีกและผลกระทบต่อทีมเต็ง",
      teamNames: "Top European clubs",
      scoreOrStatus: "Fixtures / Results watch",
      matchStatus: "European competition news",
      countryOrRegion: "Europe",
      summary: "สรุปข่าว UCL/UEL จากทีมใหญ่ ตารางแข่ง ผลการแข่งขัน และประเด็นเข้ารอบ",
      keyMoment: "เกมสองนัดเหย้าเยือนและผลต่างประตูมีผลต่อ narrative ทีมเต็ง",
      playerFocus: "นักเตะฟอร์มแรงในเกมยุโรป",
      whyItMatters: "รายการยุโรปเชื่อมทุกลีกใหญ่และเป็นหัวข้อที่คนอ่านสนใจสูง",
      whatToWatchNext: "draw, knockout bracket, injury before big match",
      contentAngle: "ทำโพสต์: UCL คืนนี้ดูคู่ไหนก่อนดี",
      priorityScore: 89,
    },
    {
      category: "ยูโร / เอเชียนเกมส์ / โอลิมปิก",
      competition: "EURO / Asian Games / Olympic Football",
      leagueGroup: "International tournaments",
      headline: "รายการทีมชาติควรถูกรวมไว้ในสรุปรายวันเมื่อมีข่าวหรือโปรแกรม",
      teamNames: "Thailand U23 / Japan / South Korea / Spain / France / England",
      scoreOrStatus: "Tournament news watch",
      matchStatus: "International news",
      countryOrRegion: "Global / Asia / Europe",
      summary: "ครอบคลุมข่าวทีมชาติ รายการยูโร เอเชียนเกมส์ และฟุตบอลโอลิมปิก โดยเน้นทีมไทยและทีมใหญ่",
      keyMoment: "โปรแกรมทีมชาติและรายชื่อผู้เล่นมีผลต่อความสนใจสูงในช่วงทัวร์นาเมนต์",
      playerFocus: "ผู้เล่น U23, ทีมชาติไทย และดาวรุ่งยุโรป",
      whyItMatters: "ทำให้ Football Recap ครบทั้งบอลสโมสรและทีมชาติ",
      whatToWatchNext: "ประกาศรายชื่อทีม, ตารางแข่ง, ผลการแข่งขัน, เส้นทางเข้ารอบ",
      contentAngle: "ทำโพสต์: โปรแกรมทีมชาติที่ควรดูสัปดาห์นี้",
      priorityScore: 84,
    },
  ];

  return {
    source: "Football News Hub",
    status: "mock",
    title: "ข่าวบอลไทย บอลโลก และลีกใหญ่ยุโรป",
    originalContent: items
      .map((item) => `${item.category} | ${item.competition} | ${item.teamNames} | ${item.headline} | ${item.summary} | Watch next: ${item.whatToWatchNext}`)
      .join("\n\n"),
    language: "th",
    items,
    data: {
      scope: "Thai football, World Cup, Premier League, LaLiga, Bundesliga, Serie A, Ligue 1, UEFA, EURO, Asian Games, Olympics",
      items,
    },
  };
}
