"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type ConcertMonthId = "july-2026" | "august-2026" | "september-2026" | "october-2026" | "november-2026" | "december-2026";
type EventCategory = "indoor" | "outdoor";

type FestivalEvent = {
  id: string;
  category: EventCategory;
  title: string;
  dateTh: string;
  dateEn: string;
  time?: string;
  venueTh: string;
  venueEn: string;
  highlights: string[];
  priceTh?: string;
  priceEn?: string;
  sourceTh: string;
  sourceEn: string;
  poster: string;
  isPlaceholder?: boolean;
};

type FestivalMonth = {
  id: ConcertMonthId;
  labelTh: string;
  labelEn: string;
  shortTh: string;
  shortEn: string;
  updatedTh: string;
  updatedEn: string;
  noteTh: string;
  noteEn: string;
  sourcesTh: string;
  sourcesEn: string;
  events: FestivalEvent[];
};

const festivalMonths: FestivalMonth[] = [
  {
    id: "july-2026",
    labelTh: "กรกฎาคม 2026",
    labelEn: "July 2026",
    shortTh: "ก.ค.",
    shortEn: "Jul",
    updatedTh: "อัปเดตล่าสุด 28 มิ.ย. 2026",
    updatedEn: "Updated Jun 28, 2026",
    noteTh: "เดือนกรกฎาคมรวมงานคอนเสิร์ตฮอลล์ งานแฟร์ และ open-air event ที่ประกาศชัดเจนแล้ว",
    noteEn: "July combines confirmed concert hall shows, fairs, and open-air events.",
    sourcesTh: "The Street Ratchada, Eventpop, ThaiTicketMajor, QSNCC, IMPACT, เว็บไซต์ผู้จัด",
    sourcesEn: "The Street Ratchada, Eventpop, ThaiTicketMajor, QSNCC, IMPACT, organizer websites",
    events: [
      {
        id: "vol-72-volume-phase-7",
        category: "indoor",
        title: "VOL.72 - VOLUME PHASE 7",
        dateTh: "4 ก.ค. 2026",
        dateEn: "Jul 4, 2026",
        time: "15:00-23:59",
        venueTh: "The Street Hall ชั้น 5",
        venueEn: "The Street Hall, 5th floor",
        highlights: ["Phum Viphurit", "KIKI", "temp.", "quicksand bed", "_less", "VVAS", "MAKARA"],
        priceTh: "Early Bird 500 / Regular 900 บาท",
        priceEn: "Early Bird THB 500 / Regular THB 900",
        sourceTh: "The Street Ratchada / Volume Livehouse",
        sourceEn: "The Street Ratchada / Volume Livehouse",
        poster: "VOL.72",
      },
      {
        id: "colorists-music-festival-5",
        category: "indoor",
        title: "COLORISTS MUSIC FESTIVAL 5",
        dateTh: "4 ก.ค. 2026",
        dateEn: "Jul 4, 2026",
        venueTh: "Union Hall, Bangkok",
        venueEn: "Union Hall, Bangkok",
        highlights: ["2 เวที", "20 ศิลปิน", "Silly Fools", "MIRRR", "The Parkinson", "Polycat", "Bowkylion", "Little John + more"],
        sourceTh: "Thailand Festival Guide 2026",
        sourceEn: "Thailand Festival Guide 2026",
        poster: "COLORISTS",
      },
      {
        id: "slot-machine-machinema",
        category: "indoor",
        title: "SLOT MACHINE PRESENTS MACHINEMA // 01 at VOLUME",
        dateTh: "9 ก.ค. 2026",
        dateEn: "Jul 9, 2026",
        time: "18:00-23:00",
        venueTh: "The Street Hall ชั้น 5",
        venueEn: "The Street Hall, 5th floor",
        highlights: ["Slot Machine"],
        priceTh: "Membership 100 / Early 200 / Regular 300 บาท",
        priceEn: "Membership THB 100 / Early THB 200 / Regular THB 300",
        sourceTh: "The Street Ratchada / Volume Livehouse",
        sourceEn: "The Street Ratchada / Volume Livehouse",
        poster: "MACHINEMA",
      },
      {
        id: "diiv-live-bangkok",
        category: "indoor",
        title: "LOUDLY PREFER Presents DIIV Live in Bangkok 2026",
        dateTh: "11 ก.ค. 2026",
        dateEn: "Jul 11, 2026",
        time: "17:00-23:30",
        venueTh: "Volume Livehouse ชั้น 5",
        venueEn: "Volume Livehouse, 5th floor",
        highlights: ["DIIV", "Death of Heather", "VVAS"],
        priceTh: "เช็กกับผู้จัด",
        priceEn: "Check with organizer",
        sourceTh: "The Street Ratchada / Volume Livehouse",
        sourceEn: "The Street Ratchada / Volume Livehouse",
        poster: "DIIV",
      },
      {
        id: "y-book-fair-11",
        category: "indoor",
        title: "Y BOOK FAIR #11",
        dateTh: "11-12 ก.ค. 2026",
        dateEn: "Jul 11-12, 2026",
        venueTh: "QSNCC Event Hall B2",
        venueEn: "QSNCC Event Hall B2",
        highlights: ["BL / GL / LGBTQ community fair", "publishers", "writers", "artists", "fan activities"],
        sourceTh: "QSNCC / Thailand Festival Guide 2026",
        sourceEn: "QSNCC / Thailand Festival Guide 2026",
        poster: "Y BOOK FAIR",
      },
      {
        id: "base-010-yungtarr-shogun",
        category: "indoor",
        title: "VOLUME PRESENTS BASE 010: YUNGTARR + SHOGUN®",
        dateTh: "12 ก.ค. 2026",
        dateEn: "Jul 12, 2026",
        time: "18:00-22:30",
        venueTh: "Volume Livehouse B Floor",
        venueEn: "Volume Livehouse B Floor",
        highlights: ["YUNGTARR", "SHOGUN®"],
        priceTh: "Early 450 / Regular 700 บาท",
        priceEn: "Early THB 450 / Regular THB 700",
        sourceTh: "The Street Ratchada / Volume Livehouse",
        sourceEn: "The Street Ratchada / Volume Livehouse",
        poster: "BASE 010",
      },
      {
        id: "howareyou-fest-summer-edition",
        category: "indoor",
        title: "HOWAREYOU FEST Summer Edition",
        dateTh: "17-18 ก.ค. 2026",
        dateEn: "Jul 17-18, 2026",
        venueTh: "MGI Hall, Bravo BKK (Rama 9)",
        venueEn: "MGI Hall, Bravo BKK (Rama 9)",
        highlights: ["Day 1: Nont Tanont, Timethai, UrboyTJ, BASE10, Setty, Tiito, Plato", "Day 2: Youngohm, Tobii, Tattoo Colour, Gunner x Diamond x Younggu, BASE10, 4EVE"],
        sourceTh: "Thailand Festival Guide 2026",
        sourceEn: "Thailand Festival Guide 2026",
        poster: "HOWAREYOU",
      },
      {
        id: "impact-speed-fest-2",
        category: "indoor",
        title: "IMPACT Speed Fest ครั้งที่ 2",
        dateTh: "17-19 ก.ค. 2026",
        dateEn: "Jul 17-19, 2026",
        venueTh: "IMPACT Challenger",
        venueEn: "IMPACT Challenger",
        highlights: ["auto", "speed", "lifestyle festival"],
        sourceTh: "IMPACT / Thailand Festival Guide 2026",
        sourceEn: "IMPACT / Thailand Festival Guide 2026",
        poster: "SPEED FEST",
      },
      {
        id: "vol-73-volume-phase-7",
        category: "indoor",
        title: "VOL.73 - VOLUME PHASE 7",
        dateTh: "18 ก.ค. 2026",
        dateEn: "Jul 18, 2026",
        time: "15:00-23:59",
        venueTh: "The Street Hall ชั้น 5",
        venueEn: "The Street Hall, 5th floor",
        highlights: ["Sweet Mullet", "NAP the NAP", "Bomb at Track", "Annalynn", "Hot Like Hell", "Ebola", "torrayot"],
        priceTh: "Early Bird 500 / Regular 900 บาท",
        priceEn: "Early Bird THB 500 / Regular THB 900",
        sourceTh: "The Street Ratchada / Volume Livehouse",
        sourceEn: "The Street Ratchada / Volume Livehouse",
        poster: "VOL.73",
      },
      {
        id: "base-011-television-off",
        category: "indoor",
        title: "ZATO PRESENTS BASE 011: TELEVISION OFF SPECIAL SHOW",
        dateTh: "19 ก.ค. 2026",
        dateEn: "Jul 19, 2026",
        time: "18:00-22:30",
        venueTh: "Volume Livehouse B Floor",
        venueEn: "Volume Livehouse B Floor",
        highlights: ["Television Off"],
        priceTh: "Early 450 / Regular 700 บาท",
        priceEn: "Early THB 450 / Regular THB 700",
        sourceTh: "The Street Ratchada / Volume Livehouse",
        sourceEn: "The Street Ratchada / Volume Livehouse",
        poster: "BASE 011",
      },
      {
        id: "awakening-song-wat-2026",
        category: "outdoor",
        title: "Awakening Song Wat 2026",
        dateTh: "3-12 ก.ค. 2026",
        dateEn: "Jul 3-12, 2026",
        venueTh: "Song Wat Road, Bangkok",
        venueEn: "Song Wat Road, Bangkok",
        highlights: ["light art", "digital art", "installations", "walking festival"],
        sourceTh: "Thailand Festival Guide 2026",
        sourceEn: "Thailand Festival Guide 2026",
        poster: "SONG WAT",
      },
      {
        id: "halfmoon-festival-july-2026",
        category: "outdoor",
        title: "Halfmoon Festival",
        dateTh: "7 ก.ค. 2026 และ 23 ก.ค. 2026",
        dateEn: "Jul 7 and Jul 23, 2026",
        venueTh: "Bantai, Koh Phangan, Surat Thani",
        venueEn: "Bantai, Koh Phangan, Surat Thani",
        highlights: ["outdoor electronic", "party festival"],
        sourceTh: "Thailand Festival Guide 2026",
        sourceEn: "Thailand Festival Guide 2026",
        poster: "HALFMOON",
      },
      {
        id: "phi-ta-khon-bangkok-island",
        category: "outdoor",
        title: "Phi Ta Khon Bangkok Island",
        dateTh: "11 ก.ค. 2026",
        dateEn: "Jul 11, 2026",
        venueTh: "Bangkok Island",
        venueEn: "Bangkok Island",
        highlights: ["music festival", "themed cultural event"],
        sourceTh: "Thailand Festival Guide 2026",
        sourceEn: "Thailand Festival Guide 2026",
        poster: "PHI TA KHON",
      },
    ],
  },
  {
    id: "august-2026",
    labelTh: "สิงหาคม 2026",
    labelEn: "August 2026",
    shortTh: "ส.ค.",
    shortEn: "Aug",
    updatedTh: "อัปเดตล่าสุด 28 มิ.ย. 2026",
    updatedEn: "Updated Jun 28, 2026",
    noteTh: "เดือนสิงหาคมมีงาน indoor / expo / concert hall เด่นมากกว่า outdoor",
    noteEn: "August is stronger on indoor, expo, and concert hall events than outdoor announcements.",
    sourcesTh: "IMPACT, ThaiTicketMajor, เว็บไซต์ผู้จัด",
    sourcesEn: "IMPACT, ThaiTicketMajor, organizer websites",
    events: [
      {
        id: "vol-74-volume-phase-7",
        category: "indoor",
        title: "VOL.74 - VOLUME PHASE 7",
        dateTh: "1 ส.ค. 2026",
        dateEn: "Aug 1, 2026",
        time: "15:00-23:59",
        venueTh: "The Street Hall ชั้น 5",
        venueEn: "The Street Hall, 5th floor",
        highlights: ["POLYCAT", "The Parkinson", "TELEX TELEXS", "electric.neon.lamp", "Whal & Dolph", "WAV", "NINETEMBER"],
        priceTh: "Early Bird 550 / Regular 900 บาท",
        priceEn: "Early Bird THB 550 / Regular THB 900",
        sourceTh: "The Street Ratchada / Volume Livehouse",
        sourceEn: "The Street Ratchada / Volume Livehouse",
        poster: "VOL.74",
      },
      {
        id: "franchise-expo-thailand-2026",
        category: "indoor",
        title: "Franchise Expo Thailand by Smart SME Expo",
        dateTh: "6-9 ส.ค. 2026",
        dateEn: "Aug 6-9, 2026",
        venueTh: "IMPACT Exhibition Center",
        venueEn: "IMPACT Exhibition Center",
        highlights: ["franchise", "SME", "business expo"],
        sourceTh: "IMPACT / Thailand Festival Guide 2026",
        sourceEn: "IMPACT / Thailand Festival Guide 2026",
        poster: "FRANCHISE",
      },
      {
        id: "vol-75-volume-phase-7",
        category: "indoor",
        title: "VOL.75 - VOLUME PHASE 7",
        dateTh: "8 ส.ค. 2026",
        dateEn: "Aug 8, 2026",
        time: "15:00-23:59",
        venueTh: "The Street Hall ชั้น 5",
        venueEn: "The Street Hall, 5th floor",
        highlights: ["DEPT", "YEW", "YEP MAY YEP", "LANDOKMAI", "Safeplanet", "PURPEECH", "TOFU"],
        priceTh: "Early Bird 500 / Regular 800 บาท",
        priceEn: "Early Bird THB 500 / Regular THB 800",
        sourceTh: "The Street Ratchada / Volume Livehouse",
        sourceEn: "The Street Ratchada / Volume Livehouse",
        poster: "VOL.75",
      },
      {
        id: "foodism-health-wellness-2026",
        category: "indoor",
        title: "The Foodism Thailand x Thailand Health & Wellness 2026",
        dateTh: "27-29 ส.ค. 2026",
        dateEn: "Aug 27-29, 2026",
        venueTh: "IMPACT Exhibition Center",
        venueEn: "IMPACT Exhibition Center",
        highlights: ["food", "wellness", "lifestyle expo"],
        sourceTh: "IMPACT / Thailand Festival Guide 2026",
        sourceEn: "IMPACT / Thailand Festival Guide 2026",
        poster: "FOODISM",
      },
      {
        id: "vol-76-volume-phase-7",
        category: "indoor",
        title: "VOL.76 - VOLUME PHASE 7",
        dateTh: "29 ส.ค. 2026",
        dateEn: "Aug 29, 2026",
        time: "15:00-23:59",
        venueTh: "The Street Hall ชั้น 5",
        venueEn: "The Street Hall, 5th floor",
        highlights: ["Moderndog", "SLUR", "The Richman Toy", "Apartment Khunpa", "THE JUKKS", "Death Of A Salesman", "SHO LULLABY", "ROYSENBERG"],
        priceTh: "Early Bird 800 / Regular 1,200 บาท",
        priceEn: "Early Bird THB 800 / Regular THB 1,200",
        sourceTh: "The Street Ratchada / Volume Livehouse",
        sourceEn: "The Street Ratchada / Volume Livehouse",
        poster: "VOL.76",
      },
      {
        id: "gfest-marathon-concert-2026",
        category: "indoor",
        title: "GFEST Marathon Concert 2026",
        dateTh: "29-30 ส.ค. 2026",
        dateEn: "Aug 29-30, 2026",
        venueTh: "IMPACT Arena",
        venueEn: "IMPACT Arena",
        highlights: ["POP DAY: Bowkylion, Jeff Satur, Ink Waruntorn, Lipta, Nont Tanont, Pixxie, Pun, The Toys", "ROCK DAY: Big Ass, Bodyslam, Little John, Sweet Mullet, Palmy, Potato, Taitosmith, Three Man Down"],
        sourceTh: "ThaiTicketMajor / Thailand Festival Guide 2026",
        sourceEn: "ThaiTicketMajor / Thailand Festival Guide 2026",
        poster: "GFEST",
      },
      {
        id: "august-outdoor-watch",
        category: "outdoor",
        title: "เดือนนี้ยังไม่พบงาน outdoor เด่นที่ประกาศชัดเจน",
        dateTh: "รออัปเดต",
        dateEn: "TBA",
        venueTh: "รออัปเดต",
        venueEn: "TBA",
        highlights: ["ติดตามประกาศใหม่จากผู้จัดอีกครั้ง"],
        sourceTh: "Thailand Festival Guide 2026",
        sourceEn: "Thailand Festival Guide 2026",
        poster: "WATCH",
        isPlaceholder: true,
      },
    ],
  },
  {
    id: "september-2026",
    labelTh: "กันยายน 2026",
    labelEn: "September 2026",
    shortTh: "ก.ย.",
    shortEn: "Sep",
    updatedTh: "อัปเดตล่าสุด 28 มิ.ย. 2026",
    updatedEn: "Updated Jun 28, 2026",
    noteTh: "เดือนกันยายนมีงาน indoor / performing arts เด่น และหลายงานต่อเนื่องถึงเดือนตุลาคม",
    noteEn: "September highlights indoor performing arts, with several events continuing into October.",
    sourcesTh: "ThaiTicketMajor, Bangkok Festival of Dance & Music",
    sourcesEn: "ThaiTicketMajor, Bangkok Festival of Dance & Music",
    events: [
      {
        id: "bangkok-festival-dance-music-28",
        category: "indoor",
        title: "Bangkok's 28th International Festival of Dance & Music",
        dateTh: "5 ก.ย.-17 ต.ค. 2026",
        dateEn: "Sep 5-Oct 17, 2026",
        venueTh: "Thailand Cultural Centre",
        venueEn: "Thailand Cultural Centre",
        highlights: ["performing arts festival", "international dance", "opera", "ballet", "orchestra"],
        sourceTh: "Bangkok Festival of Dance & Music",
        sourceEn: "Bangkok Festival of Dance & Music",
        poster: "DANCE MUSIC",
      },
      {
        id: "great-gatsby-enrique-gasa-valga",
        category: "indoor",
        title: "The Great Gatsby - Enrique Gasa Valga Dance Company",
        dateTh: "29 ก.ย. 2026",
        dateEn: "Sep 29, 2026",
        venueTh: "Thailand Cultural Centre",
        venueEn: "Thailand Cultural Centre",
        highlights: ["festival highlight show"],
        sourceTh: "Bangkok Festival of Dance & Music",
        sourceEn: "Bangkok Festival of Dance & Music",
        poster: "GATSBY",
      },
      {
        id: "september-outdoor-watch",
        category: "outdoor",
        title: "เดือนนี้ยังไม่พบงาน outdoor เด่นที่ประกาศชัดเจน",
        dateTh: "รออัปเดต",
        dateEn: "TBA",
        venueTh: "รออัปเดต",
        venueEn: "TBA",
        highlights: ["ช่วงกันยายนประกาศงาน open-air ค่อนข้างน้อย"],
        sourceTh: "Thailand Festival Guide 2026",
        sourceEn: "Thailand Festival Guide 2026",
        poster: "WATCH",
        isPlaceholder: true,
      },
    ],
  },
  {
    id: "october-2026",
    labelTh: "ตุลาคม 2026",
    labelEn: "October 2026",
    shortTh: "ต.ค.",
    shortEn: "Oct",
    updatedTh: "อัปเดตล่าสุด 28 มิ.ย. 2026",
    updatedEn: "Updated Jun 28, 2026",
    noteTh: "เดือนตุลาคมมีงาน indoor ต่อเนื่อง และเริ่มมีงาน open-air / EDM ใหญ่ปลายปี",
    noteEn: "October includes continuing indoor festival shows and the start of major open-air EDM events.",
    sourcesTh: "Bangkok Festival of Dance & Music, Instagram ทางการของ 808 Festival",
    sourcesEn: "Bangkok Festival of Dance & Music, 808 Festival official Instagram",
    events: [
      {
        id: "bangkok-festival-dance-music-october",
        category: "indoor",
        title: "Bangkok's 28th International Festival of Dance & Music",
        dateTh: "ต่อเนื่องถึง 17 ต.ค. 2026",
        dateEn: "Continues until Oct 17, 2026",
        venueTh: "Thailand Cultural Centre",
        venueEn: "Thailand Cultural Centre",
        highlights: ["Coco Chanel", "La Traviata", "Madama Butterfly", "The Pygmalion Effect", "Russian Hamlet"],
        sourceTh: "Bangkok Festival of Dance & Music",
        sourceEn: "Bangkok Festival of Dance & Music",
        poster: "DANCE MUSIC",
      },
      {
        id: "808-festival-2026",
        category: "outdoor",
        title: "808 Festival 2026",
        dateTh: "2-3 ต.ค. 2026",
        dateEn: "Oct 2-3, 2026",
        venueTh: "Bangkok (venue TBA)",
        venueEn: "Bangkok (venue TBA)",
        highlights: ["ChaseWest", "Clara Cuve", "Coone", "Da Tweekaz", "Darren Styles", "Daxson", "Dean Turnley", "Dennett", "DJ Snake", "Dom Dolla + more"],
        sourceTh: "Instagram ทางการของ 808 Festival",
        sourceEn: "808 Festival official Instagram",
        poster: "808",
      },
    ],
  },
  {
    id: "november-2026",
    labelTh: "พฤศจิกายน 2026",
    labelEn: "November 2026",
    shortTh: "พ.ย.",
    shortEn: "Nov",
    updatedTh: "อัปเดตล่าสุด 28 มิ.ย. 2026",
    updatedEn: "Updated Jun 28, 2026",
    noteTh: "เดือนพฤศจิกายน ณ ตอนนี้มีประกาศงานเด่นค่อนข้างน้อย และหลายงานยังรอเปิดรายละเอียด",
    noteEn: "November currently has fewer highlighted announcements, with several events awaiting details.",
    sourcesTh: "Eventpop, ผู้จัดงาน",
    sourcesEn: "Eventpop, organizers",
    events: [
      {
        id: "november-indoor-watch",
        category: "indoor",
        title: "เดือนนี้ยังไม่พบงาน indoor / hall เด่นแบบ festival ที่ประกาศชัดเจน",
        dateTh: "รออัปเดต",
        dateEn: "TBA",
        venueTh: "รออัปเดต",
        venueEn: "TBA",
        highlights: ["ติดตามประกาศใหม่จากผู้จัดอีกครั้ง"],
        sourceTh: "Thailand Festival Guide 2026",
        sourceEn: "Thailand Festival Guide 2026",
        poster: "WATCH",
        isPlaceholder: true,
      },
      {
        id: "red-earth-renegades-2026",
        category: "outdoor",
        title: "RED EARTH RENEGADES Enduro and Adventure Festival",
        dateTh: "7 พ.ย. 2026",
        dateEn: "Nov 7, 2026",
        venueTh: "สถานที่จัดงาน: TBA",
        venueEn: "Venue TBA",
        highlights: ["adventure", "enduro festival"],
        sourceTh: "Eventpop / ผู้จัดงาน",
        sourceEn: "Eventpop / organizer",
        poster: "RED EARTH",
      },
    ],
  },
  {
    id: "december-2026",
    labelTh: "ธันวาคม 2026",
    labelEn: "December 2026",
    shortTh: "ธ.ค.",
    shortEn: "Dec",
    updatedTh: "อัปเดตล่าสุด 28 มิ.ย. 2026",
    updatedEn: "Updated Jun 28, 2026",
    noteTh: "ธันวาคมเป็นเดือนของ outdoor mega festivals ในไทย",
    noteEn: "December is the month of Thailand's outdoor mega festivals.",
    sourcesTh: "Wonderfruit, Tomorrowland Thailand, EDC Thailand เว็บไซต์ทางการ",
    sourcesEn: "Wonderfruit, Tomorrowland Thailand, EDC Thailand official websites",
    events: [
      {
        id: "december-indoor-watch",
        category: "indoor",
        title: "เดือนนี้ยังไม่พบงาน indoor / hall เด่นที่อยู่ในลิสต์หลัก",
        dateTh: "รออัปเดต",
        dateEn: "TBA",
        venueTh: "รออัปเดต",
        venueEn: "TBA",
        highlights: ["โฟกัสหลักของเดือนนี้อยู่ที่งาน outdoor ขนาดใหญ่"],
        sourceTh: "Thailand Festival Guide 2026",
        sourceEn: "Thailand Festival Guide 2026",
        poster: "WATCH",
        isPlaceholder: true,
      },
      {
        id: "wonderfruit-2026",
        category: "outdoor",
        title: "Wonderfruit 2026",
        dateTh: "3-7 ธ.ค. 2026",
        dateEn: "Dec 3-7, 2026",
        venueTh: "The Fields at Siam Country Club, Chonburi",
        venueEn: "The Fields at Siam Country Club, Chonburi",
        highlights: ["art + music + nature festival", "FKJ (DJ Set)", "Eduardo Castillo"],
        sourceTh: "Wonderfruit เว็บไซต์ทางการ",
        sourceEn: "Wonderfruit official website",
        poster: "WONDERFRUIT",
      },
      {
        id: "tomorrowland-thailand-2026",
        category: "outdoor",
        title: "Tomorrowland Thailand 2026",
        dateTh: "11-13 ธ.ค. 2026",
        dateEn: "Dec 11-13, 2026",
        venueTh: "Wisdom Valley, Chonburi",
        venueEn: "Wisdom Valley, Chonburi",
        highlights: ["6 stages incl. MainStage, CORE, Freedom", "official line-up page live", "more artists to be announced"],
        sourceTh: "Tomorrowland Thailand เว็บไซต์ทางการ",
        sourceEn: "Tomorrowland Thailand official website",
        poster: "TML TH",
      },
      {
        id: "edc-thailand-2026",
        category: "outdoor",
        title: "EDC Thailand 2026",
        dateTh: "18-20 ธ.ค. 2026",
        dateEn: "Dec 18-20, 2026",
        venueTh: "Rhythm Park, Phuket",
        venueEn: "Rhythm Park, Phuket",
        highlights: ["Above & Beyond", "CamelPhat", "Charlotte de Witte", "DJ Snake", "Dom Dolla", "Green Velvet B2B Steve Angello", "Hamdi", "Hannah Laing + more"],
        sourceTh: "EDC Thailand เว็บไซต์ทางการ",
        sourceEn: "EDC Thailand official website",
        poster: "EDC TH",
      },
    ],
  },
];

const eventLinks: Partial<Record<string, string>> = {
  "vol-72-volume-phase-7": "https://www.zipeventapp.com/e/volume-livehouse-vol72",
  "colorists-music-festival-5": "https://www.eventpop.me/s/colorists-5",
  "slot-machine-machinema": "https://www.zipeventapp.com/e/SLOT-MACHINE-at-VOLUME",
  "diiv-live-bangkok": "https://www.ticketmelon.com/loudlypreferth/DIIVBKK2026",
  "y-book-fair-11": "https://www.qsncc.com/th/whats-on/event-calendar/y-book-fair-11/?r=%2F",
  "base-010-yungtarr-shogun": "https://www.zipeventapp.com/e/VOLUME-Base-010-Yungtarr-Shogun",
  "howareyou-fest-summer-edition": "https://www.eventpop.me/e/150964/howareyoufest",
  "impact-speed-fest-2": "https://www.zipeventapp.com/e/IMPACT-Speed-Fest-2026-D9BE5513",
  "vol-73-volume-phase-7": "https://www.zipeventapp.com/e/Volume-Livehouse-Vol73",
  "base-011-television-off": "https://www.zipeventapp.com/e/Volume-Base-011-TELEVISION-OFF-SPECIAL-SHOW",
  "awakening-song-wat-2026": "https://www.eventpop.me/e/157832/awakening-song-wat-2026",
  "halfmoon-festival-july-2026": "https://www.eventpop.me/e/150897",
  "phi-ta-khon-bangkok-island": "https://www.eventpop.me/e/154264",
  "vol-74-volume-phase-7": "https://www.zipeventapp.com/e/Volume-Livehouse-Vol74",
  "franchise-expo-thailand-2026": "https://www.impact.co.th/en/visitors/event-calendar/exhibition-trade/franchise-expo-thailand-by-smart-sme-expo",
  "vol-75-volume-phase-7": "https://www.zipeventapp.com/e/Volume-Livehouse-Vol75",
  "foodism-health-wellness-2026": "https://www.impact.co.th/en/visitors/event-calendar/exhibition-trade/the-foodism-show-x-thailand-health-and-wellness-2026",
  "vol-76-volume-phase-7": "https://www.zipeventapp.com/e/Volume-Livehouse-Vol76",
  "gfest-marathon-concert-2026": "https://www.thaiticketmajor.com/concert/gfest-marathon-concert-2026.html",
  "bangkok-festival-dance-music-28": "https://www.thaiticketmajor.com/bangkokfestivals/",
  "great-gatsby-enrique-gasa-valga": "https://bangkokfestivals.com/program/the-great-gatsby-enrique-gasa-valga-2026/",
  "bangkok-festival-dance-music-october": "https://www.thaiticketmajor.com/bangkokfestivals/",
  "808-festival-2026": "https://www.instagram.com/p/DaAr5M5Dxx2/",
  "red-earth-renegades-2026": "https://www.eventpop.me/e/156323",
  "wonderfruit-2026": "https://wonderfruit.co/tickets",
  "tomorrowland-thailand-2026": "https://thailand.tomorrowland.com/en/passes-packages/",
  "edc-thailand-2026": "https://thailand.edc.com/en/tickets/",
};

const expoFairEventIds = new Set([
  "y-book-fair-11",
  "impact-speed-fest-2",
  "awakening-song-wat-2026",
  "phi-ta-khon-bangkok-island",
  "franchise-expo-thailand-2026",
  "foodism-health-wellness-2026",
  "bangkok-festival-dance-music-28",
  "bangkok-festival-dance-music-october",
  "red-earth-renegades-2026",
]);

function isConcertVisible(event: FestivalEvent) {
  return !expoFairEventIds.has(event.id);
}

const sectionMeta = {
  indoor: {
    icon: "🏛",
    title: "INDOOR / HALL",
    th: "งานฮอลล์ / อินดอร์",
    en: "Hall and indoor events",
    border: "border-fuchsia-300/35",
    bg: "from-violet-700/90 to-fuchsia-600/60",
    chip: "border-fuchsia-300/35 bg-fuchsia-400/10 text-fuchsia-100",
  },
  outdoor: {
    icon: "⛺",
    title: "OUTDOOR / OPEN-AIR",
    th: "งานกลางแจ้ง / โอเพนแอร์",
    en: "Outdoor and open-air events",
    border: "border-emerald-300/35",
    bg: "from-emerald-700/90 to-teal-500/60",
    chip: "border-emerald-300/35 bg-emerald-400/10 text-emerald-100",
  },
} satisfies Record<EventCategory, { icon: string; title: string; th: string; en: string; border: string; bg: string; chip: string }>;

function getRealEventCount(month: FestivalMonth) {
  return month.events.filter((event) => isConcertVisible(event) && !event.isPlaceholder).length;
}

function concertPosterSrc(event: FestivalEvent, detailUrl: string) {
  const params = new URLSearchParams({
    url: detailUrl,
    title: event.title,
    kind: "concert",
    strict: "1",
  });
  return `/api/poster-image?${params.toString()}`;
}

function Poster({ event, index, category }: { event: FestivalEvent; index: number; category: EventCategory }) {
  const meta = sectionMeta[category];
  const detailUrl = eventLinks[event.id];
  const [failed, setFailed] = useState(false);
  const showRemotePoster = Boolean(detailUrl && !event.isPlaceholder && !failed);

  return (
    <div className={cn("concert-poster relative flex aspect-[4/5] min-h-36 w-full max-w-40 shrink-0 flex-col justify-end overflow-hidden rounded-xl border shadow-[0_18px_42px_rgba(126,34,206,0.24)]", meta.border, event.isPlaceholder && "opacity-80")}>
      {showRemotePoster ? (
        <Image
          src={concertPosterSrc(event, detailUrl ?? "")}
          alt={`${event.title} poster`}
          className="object-cover"
          fill
          sizes="160px"
          unoptimized
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br", meta.bg)}>
          {!event.isPlaceholder && (
            <span className="absolute right-2 top-2 rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-300">
              Source image unavailable
            </span>
          )}
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(255,255,255,0.20),transparent_26%),linear-gradient(180deg,transparent_34%,rgba(2,6,23,0.94))]" />
      <div className="absolute left-0 top-0 rounded-br-lg bg-white/18 px-3 py-1 text-sm font-black text-white">{index + 1}</div>
      <div className="relative p-4 text-center">
        <p className="text-3xl" aria-hidden>{event.isPlaceholder ? "…" : meta.icon}</p>
        <p className="concert-title mt-2 text-xl font-black leading-none tracking-wide text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.65)]">{event.poster}</p>
        <p className="concert-muted mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/78">{event.isPlaceholder ? "Watchlist" : showRemotePoster ? "Official cover" : meta.title}</p>
      </div>
    </div>
  );
}

function DetailRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="concert-muted flex items-start gap-2 text-sm font-semibold text-slate-300">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-xs text-fuchsia-100">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function EventCard({ event, index, isThai }: { event: FestivalEvent; index: number; isThai: boolean }) {
  const meta = sectionMeta[event.category];
  const highlightLabel = event.category === "indoor" ? "ศิลปิน / ไฮไลต์" : "ไฮไลต์ / รูปแบบงาน";
  const detailUrl = eventLinks[event.id];

  return (
    <article
      className={cn(
        "concert-card rounded-2xl border border-white/12 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,12,27,0.94))] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.25)] transition hover:border-fuchsia-300/45 hover:bg-slate-900/90 sm:flex sm:gap-5",
        event.isPlaceholder && "border-dashed bg-[linear-gradient(135deg,rgba(15,23,42,0.72),rgba(2,12,27,0.72))]",
      )}
    >
      <Poster event={event} index={index} category={event.category} />
      <div className="mt-4 min-w-0 flex-1 sm:mt-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="concert-title text-xl font-black leading-snug text-white">{event.title}</h3>
          <span className={cn("concert-chip rounded-full border px-3 py-1 text-xs font-black", meta.chip)}>
            {event.isPlaceholder ? (isThai ? "รออัปเดต" : "Watch") : meta.title}
          </span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <DetailRow icon="📅" label={isThai ? event.dateTh : event.dateEn} />
          {event.time && <DetailRow icon="⏱" label={event.time} />}
          <DetailRow icon="📍" label={isThai ? event.venueTh : event.venueEn} />
          {event.priceTh && <DetailRow icon="🎟" label={isThai ? event.priceTh : event.priceEn ?? event.priceTh} />}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="concert-accent mr-1 text-xs font-black uppercase text-fuchsia-200">{isThai ? highlightLabel : "Highlights"}</span>
          {event.highlights.map((item) => (
            <span key={item} className="concert-chip rounded-full border border-white/15 bg-white/[0.055] px-3 py-1 text-xs font-bold text-slate-200">
              {item}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <DetailRow icon="🔗" label={isThai ? event.sourceTh : event.sourceEn} />
          {detailUrl && !event.isPlaceholder ? (
            <Button asChild variant="outline" size="sm" className="concert-button w-full justify-center sm:w-auto">
              <a href={detailUrl} target="_blank" rel="noopener noreferrer">
                {isThai ? "ซื้อบัตร / ดูรายละเอียด" : "Tickets / Details"} <span aria-hidden>↗</span>
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="concert-button w-full justify-center sm:w-auto" disabled>
              {isThai ? "กำลังติดตาม" : "Tracking"} →
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function EventSection({ category, events, isThai }: { category: EventCategory; events: FestivalEvent[]; isThai: boolean }) {
  const meta = sectionMeta[category];
  const realCount = events.filter((event) => !event.isPlaceholder).length;

  return (
    <section className="space-y-4">
      <div className={cn("overflow-hidden rounded-2xl border shadow-[0_20px_54px_rgba(0,0,0,0.22)]", meta.border)}>
        <div className={cn("flex flex-col gap-3 bg-gradient-to-r px-5 py-4 sm:flex-row sm:items-center sm:justify-between", meta.bg)}>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-2xl shadow-lg" aria-hidden>{meta.icon}</span>
            <div>
              <h2 className="concert-title text-2xl font-black text-white">{meta.title}</h2>
              <p className="concert-muted text-sm font-semibold text-white/72">{isThai ? meta.th : meta.en}</p>
            </div>
          </div>
          <Badge tone={category === "indoor" ? "purple" : "green"}>
            {realCount ? (isThai ? `${realCount} งานยืนยัน` : `${realCount} confirmed`) : (isThai ? "รออัปเดต" : "Watchlist")}
          </Badge>
        </div>
        <div className="grid gap-4 bg-slate-950/72 p-4 xl:grid-cols-2">
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} isThai={isThai} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ConcertScheduleView() {
  const { lang } = useLanguage();
  const [activeMonthId, setActiveMonthId] = useState<ConcertMonthId>("july-2026");
  const activeMonth = festivalMonths.find((month) => month.id === activeMonthId) ?? festivalMonths[0];
  const totalEvents = useMemo(() => festivalMonths.reduce((total, month) => total + getRealEventCount(month), 0), []);
  const monthRealCount = getRealEventCount(activeMonth);
  const visibleEvents = activeMonth.events.filter(isConcertVisible);
  const indoorEvents = visibleEvents.filter((event) => event.category === "indoor");
  const outdoorEvents = visibleEvents.filter((event) => event.category === "outdoor");
  const isThai = lang === "th";

  return (
    <section className="concert-page overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 text-slate-100 shadow-2xl shadow-black/30">
      <div className="relative border-b border-white/10 bg-[radial-gradient(circle_at_82%_0%,rgba(147,51,234,0.48),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,12,27,0.94))] px-5 py-6 sm:px-8 lg:px-10">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_22%,rgba(217,70,239,0.52),transparent_18%),linear-gradient(90deg,transparent,rgba(34,197,94,0.12))] md:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-5xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="purple">Thailand Festival Guide 2026</Badge>
              <Badge tone="green">Indoor / Outdoor</Badge>
              <Badge tone="gray">{isThai ? "รวมกับตารางคอนเสิร์ตเดิมแล้ว" : "Merged with existing concert schedule"}</Badge>
            </div>
            <h1 className="concert-title mt-5 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
              {isThai ? `ตารางคอนเสิร์ตและเทศกาลไทย เดือน${activeMonth.labelTh}` : `Thailand Concert & Festival Guide - ${activeMonth.labelEn}`}
            </h1>
            <p className="concert-muted mt-4 max-w-4xl text-base font-medium leading-8 text-slate-300">
              {isThai
                ? "รวมงานจากหน้าคอนเดิมกับข้อมูล Festival Guide ที่ส่งมา แยกเป็น Indoor / Hall และ Outdoor / Open-air เพื่อสแกนง่ายก่อนใช้งานจริง"
                : "Existing concert listings are merged with the provided Festival Guide data and split into Indoor / Hall and Outdoor / Open-air sections."}
            </p>
          </div>
          <div className="relative flex flex-col items-start gap-3 lg:items-end">
            <div className="rounded-2xl border border-fuchsia-300/40 bg-gradient-to-r from-fuchsia-500/85 to-blue-500/85 px-6 py-3 text-xl font-black text-white shadow-[0_0_36px_rgba(217,70,239,0.34)]">
              {isThai ? `รวม ${monthRealCount} งาน` : `${monthRealCount} events`}
            </div>
            <p className="concert-muted text-sm font-semibold text-slate-400">{isThai ? activeMonth.updatedTh : activeMonth.updatedEn}</p>
          </div>
        </div>

        <div className="relative mt-7 flex flex-col gap-4">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {festivalMonths.map((month) => {
              const isActive = month.id === activeMonthId;
              return (
                <button
                  key={month.id}
                  type="button"
                  onClick={() => setActiveMonthId(month.id)}
                  className={cn(
                    "min-w-[9.5rem] rounded-xl border px-4 py-3 text-left text-sm font-black transition",
                    isActive
                      ? "border-fuchsia-300/70 bg-fuchsia-400/18 text-white shadow-[0_0_24px_rgba(217,70,239,0.22)]"
                      : "border-white/10 bg-white/[0.045] text-slate-300 hover:border-fuchsia-300/40 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  <span className="block">{isThai ? month.labelTh : month.labelEn}</span>
                  <span className="concert-muted mt-1 block text-xs font-bold text-slate-400">
                    {isThai ? `${getRealEventCount(month)} งาน` : `${getRealEventCount(month)} events`}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Card className="concert-mini-card px-4 py-3">
              <p className="concert-accent text-xs font-black uppercase text-fuchsia-200">{isThai ? "เดือน" : "Month"}</p>
              <p className="concert-title mt-1 text-sm font-extrabold text-white">{isThai ? activeMonth.shortTh : activeMonth.shortEn}</p>
            </Card>
            <Card className="concert-mini-card px-4 py-3">
              <p className="concert-accent text-xs font-black uppercase text-fuchsia-200">Indoor</p>
              <p className="concert-title mt-1 text-sm font-extrabold text-white">{indoorEvents.filter((event) => !event.isPlaceholder).length} {isThai ? "งาน" : "events"}</p>
            </Card>
            <Card className="concert-mini-card px-4 py-3">
              <p className="concert-accent text-xs font-black uppercase text-emerald-200">Outdoor</p>
              <p className="concert-title mt-1 text-sm font-extrabold text-white">{outdoorEvents.filter((event) => !event.isPlaceholder).length} {isThai ? "งาน" : "events"}</p>
            </Card>
            <Card className="concert-mini-card px-4 py-3">
              <p className="concert-accent text-xs font-black uppercase text-fuchsia-200">{isThai ? "ทั้งหมด" : "Total"}</p>
              <p className="concert-title mt-1 text-sm font-extrabold text-white">{totalEvents} {isThai ? "งานในระบบ" : "tracked events"}</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-5 py-5 sm:px-8 lg:px-10">
        <EventSection category="indoor" events={indoorEvents} isThai={isThai} />
        <EventSection category="outdoor" events={outdoorEvents} isThai={isThai} />

        <div className="concert-note rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-slate-400">
          <p><span className="font-black text-fuchsia-200">{isThai ? "หมายเหตุ:" : "Note:"}</span> {isThai ? activeMonth.noteTh : activeMonth.noteEn}</p>
          <p className="mt-2"><span className="font-black text-fuchsia-200">{isThai ? "แหล่งอ้างอิงหลัก:" : "Main sources:"}</span> {isThai ? activeMonth.sourcesTh : activeMonth.sourcesEn}</p>
          <p className="mt-2 text-xs">
            {isThai ? "ข้อมูลอาจมีการเปลี่ยนแปลง โปรดตรวจสอบจากผู้จัดงานอีกครั้งก่อนซื้อบัตรหรือเดินทาง" : "Details may change. Please verify with organizers before buying tickets or traveling."}
          </p>
        </div>
      </div>
    </section>
  );
}
