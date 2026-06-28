"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type ConcertMonthId = "july-2026" | "august-2026";

type ConcertEvent = {
  id: string;
  number: number;
  title: string;
  dateTh: string;
  dateEn: string;
  time: string;
  venueTh: string;
  venueEn: string;
  lineup: string[];
  priceTh: string;
  priceEn: string;
  poster: string;
};

type ConcertMonth = {
  id: ConcertMonthId;
  labelTh: string;
  labelEn: string;
  shortTh: string;
  shortEn: string;
  updatedTh: string;
  updatedEn: string;
  layout: "grid" | "list";
  events: ConcertEvent[];
};

const concertMonths: ConcertMonth[] = [
  {
    id: "july-2026",
    labelTh: "กรกฎาคม 2026",
    labelEn: "July 2026",
    shortTh: "ก.ค.",
    shortEn: "Jul",
    updatedTh: "อัปเดตล่าสุด 28 มิ.ย. 2026",
    updatedEn: "Updated Jun 28, 2026",
    layout: "grid",
    events: [
      {
        id: "vol-72-volume-phase-7",
        number: 1,
        title: "VOL.72 - VOLUME PHASE 7",
        dateTh: "4 ก.ค. 2026",
        dateEn: "Jul 4, 2026",
        time: "15:00-23:59",
        venueTh: "The Street Hall ชั้น 5",
        venueEn: "The Street Hall, 5th floor",
        lineup: ["Phum Viphurit", "KIKI", "temp.", "quicksand bed", "_less", "VVAS", "MAKARA"],
        priceTh: "Early Bird 500 / Regular 900 บาท",
        priceEn: "Early Bird THB 500 / Regular THB 900",
        poster: "VOL.72",
      },
      {
        id: "slot-machine-machinema",
        number: 2,
        title: "SLOT MACHINE PRESENTS MACHINEMA // 01 at VOLUME",
        dateTh: "9 ก.ค. 2026",
        dateEn: "Jul 9, 2026",
        time: "18:00-23:00",
        venueTh: "The Street Hall ชั้น 5",
        venueEn: "The Street Hall, 5th floor",
        lineup: ["Slot Machine"],
        priceTh: "Membership 100 / Early 200 / Regular 300 บาท",
        priceEn: "Membership THB 100 / Early THB 200 / Regular THB 300",
        poster: "MACHINEMA // 01",
      },
      {
        id: "diiv-live-bangkok",
        number: 3,
        title: "LOUDLY PREFER Presents DIIV Live in Bangkok 2026",
        dateTh: "11 ก.ค. 2026",
        dateEn: "Jul 11, 2026",
        time: "17:00-23:30",
        venueTh: "Volume Livehouse ชั้น 5",
        venueEn: "Volume Livehouse, 5th floor",
        lineup: ["DIIV", "Death of Heather", "VVAS"],
        priceTh: "เช็กกับผู้จัด",
        priceEn: "Check with organizer",
        poster: "DIIV LIVE IN BANGKOK",
      },
      {
        id: "base-010-yungtarr-shogun",
        number: 4,
        title: "VOLUME PRESENTS BASE 010: YUNGTARR + SHOGUN®",
        dateTh: "12 ก.ค. 2026",
        dateEn: "Jul 12, 2026",
        time: "18:00-22:30",
        venueTh: "Volume Livehouse B Floor",
        venueEn: "Volume Livehouse B Floor",
        lineup: ["YUNGTARR", "SHOGUN®"],
        priceTh: "Early 450 / Regular 700 บาท",
        priceEn: "Early THB 450 / Regular THB 700",
        poster: "BASE 010",
      },
      {
        id: "vol-73-volume-phase-7",
        number: 5,
        title: "VOL.73 - VOLUME PHASE 7",
        dateTh: "18 ก.ค. 2026",
        dateEn: "Jul 18, 2026",
        time: "15:00-23:59",
        venueTh: "The Street Hall ชั้น 5",
        venueEn: "The Street Hall, 5th floor",
        lineup: ["Sweet Mullet", "NAP the NAP", "Bomb at Track", "Annalynn", "Hot Like Hell", "Ebola", "torrayot"],
        priceTh: "Early Bird 500 / Regular 900 บาท",
        priceEn: "Early Bird THB 500 / Regular THB 900",
        poster: "VOL.73",
      },
      {
        id: "base-011-television-off",
        number: 6,
        title: "ZATO PRESENTS BASE 011: TELEVISION OFF SPECIAL SHOW",
        dateTh: "19 ก.ค. 2026",
        dateEn: "Jul 19, 2026",
        time: "18:00-22:30",
        venueTh: "Volume Livehouse B Floor",
        venueEn: "Volume Livehouse B Floor",
        lineup: ["Television Off"],
        priceTh: "Early 450 / Regular 700 บาท",
        priceEn: "Early THB 450 / Regular THB 700",
        poster: "BASE 011",
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
    layout: "list",
    events: [
      {
        id: "vol-74-volume-phase-7",
        number: 1,
        title: "VOL.74 - VOLUME PHASE 7",
        dateTh: "1 ส.ค. 2026",
        dateEn: "Aug 1, 2026",
        time: "15:00-23:59",
        venueTh: "The Street Hall ชั้น 5",
        venueEn: "The Street Hall, 5th floor",
        lineup: ["POLYCAT", "The Parkinson", "TELEX TELEXS", "electric.neon.lamp", "Whal & Dolph", "WAV", "NINETEMBER"],
        priceTh: "Early Bird 550 / Regular 900 บาท",
        priceEn: "Early Bird THB 550 / Regular THB 900",
        poster: "VOL.74",
      },
      {
        id: "vol-75-volume-phase-7",
        number: 2,
        title: "VOL.75 - VOLUME PHASE 7",
        dateTh: "8 ส.ค. 2026",
        dateEn: "Aug 8, 2026",
        time: "15:00-23:59",
        venueTh: "The Street Hall ชั้น 5",
        venueEn: "The Street Hall, 5th floor",
        lineup: ["DEPT", "YEW", "YEP MAY YEP", "LANDOKMAI", "Safeplanet", "PURPEECH", "TOFU"],
        priceTh: "Early Bird 500 / Regular 800 บาท",
        priceEn: "Early Bird THB 500 / Regular THB 800",
        poster: "VOL.75",
      },
      {
        id: "vol-76-volume-phase-7",
        number: 3,
        title: "VOL.76 - VOLUME PHASE 7",
        dateTh: "29 ส.ค. 2026",
        dateEn: "Aug 29, 2026",
        time: "15:00-23:59",
        venueTh: "The Street Hall ชั้น 5",
        venueEn: "The Street Hall, 5th floor",
        lineup: ["Moderndog", "SLUR", "The Richman Toy", "Apartment Khunpa", "THE JUKKS", "Death Of A Salesman", "SHO LULLABY", "ROYSENBERG"],
        priceTh: "Early Bird 800 / Regular 1,200 บาท",
        priceEn: "Early Bird THB 800 / Regular THB 1,200",
        poster: "VOL.76",
      },
    ],
  },
];

function Poster({ event }: { event: ConcertEvent }) {
  return (
    <div className="concert-poster relative flex aspect-[4/5] min-h-36 w-full max-w-40 shrink-0 flex-col justify-end overflow-hidden rounded-xl border border-fuchsia-300/35 bg-slate-950 p-4 shadow-[0_18px_42px_rgba(126,34,206,0.28)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(216,180,254,0.52),transparent_24%),linear-gradient(180deg,rgba(76,29,149,0.95),rgba(3,7,18,0.98))]" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.74))]" />
      <div className="absolute left-0 top-0 rounded-br-lg bg-fuchsia-400/70 px-3 py-1 text-sm font-black text-white">{event.number}</div>
      <div className="relative text-center">
        <p className="concert-title text-2xl font-black leading-none tracking-wide text-fuchsia-100">{event.poster}</p>
        <p className="concert-muted mt-1 text-xs font-bold uppercase tracking-[0.22em] text-fuchsia-200/80">Volume Phase 7</p>
      </div>
    </div>
  );
}

function DetailRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="concert-muted flex items-center gap-2 text-sm font-semibold text-slate-300">
      <span className="grid h-6 w-6 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-xs text-fuchsia-100">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export function ConcertScheduleView() {
  const { lang } = useLanguage();
  const [activeMonthId, setActiveMonthId] = useState<ConcertMonthId>("july-2026");
  const activeMonth = concertMonths.find((month) => month.id === activeMonthId) ?? concertMonths[0];
  const totalEvents = useMemo(() => concertMonths.reduce((total, month) => total + month.events.length, 0), []);
  const isThai = lang === "th";

  return (
    <section className="concert-page overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 text-slate-100 shadow-2xl shadow-black/30">
      <div className="relative border-b border-white/10 bg-[radial-gradient(circle_at_82%_0%,rgba(147,51,234,0.48),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,12,27,0.94))] px-5 py-6 sm:px-8 lg:px-10">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_22%,rgba(217,70,239,0.52),transparent_18%),linear-gradient(90deg,transparent,rgba(59,130,246,0.16))] md:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="purple">NimbusDaily Live</Badge>
              <Badge tone="gray">{isThai ? "ข้อมูลสำหรับตรวจสอบก่อนซื้อบัตร" : "Verify before buying tickets"}</Badge>
            </div>
            <h1 className="concert-title mt-5 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
              {isThai ? `ตารางคอนเสิร์ต The Street Ratchada เดือน${activeMonth.labelTh}` : `The Street Ratchada Concerts - ${activeMonth.labelEn}`}
            </h1>
            <p className="concert-muted mt-4 max-w-3xl text-base font-medium leading-8 text-slate-300">
              {isThai
                ? `รวมงานที่ยืนยันสถานที่เป็น The Street Ratchada / Volume Livehouse พร้อมวัน เวลา lineup และราคาเบื้องต้น`
                : "Confirmed The Street Ratchada / Volume Livehouse events with date, time, lineup, and ticket price notes."}
            </p>
          </div>
          <div className="relative flex flex-col items-start gap-3 lg:items-end">
            <div className="rounded-2xl border border-fuchsia-300/40 bg-gradient-to-r from-fuchsia-500/85 to-blue-500/85 px-6 py-3 text-xl font-black text-white shadow-[0_0_36px_rgba(217,70,239,0.34)]">
              {isThai ? `รวม ${activeMonth.events.length} งาน` : `${activeMonth.events.length} events`}
            </div>
            <p className="concert-muted text-sm font-semibold text-slate-400">{isThai ? activeMonth.updatedTh : activeMonth.updatedEn}</p>
          </div>
        </div>

        <div className="relative mt-7 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            {concertMonths.map((month) => {
              const isActive = month.id === activeMonthId;
              return (
                <button
                  key={month.id}
                  type="button"
                  onClick={() => setActiveMonthId(month.id)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm font-black transition",
                    isActive
                      ? "border-fuchsia-300/70 bg-fuchsia-400/18 text-white shadow-[0_0_24px_rgba(217,70,239,0.22)]"
                      : "border-white/10 bg-white/[0.045] text-slate-300 hover:border-fuchsia-300/40 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  <span className="block">{isThai ? month.labelTh : month.labelEn}</span>
                  <span className="concert-muted mt-1 block text-xs font-bold text-slate-400">
                    {isThai ? `${month.events.length} งาน` : `${month.events.length} events`}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="concert-mini-card px-4 py-3">
              <p className="concert-accent text-xs font-black uppercase text-fuchsia-200">{isThai ? "เดือน" : "Month"}</p>
              <p className="concert-title mt-1 text-sm font-extrabold text-white">{isThai ? activeMonth.shortTh : activeMonth.shortEn}</p>
            </Card>
            <Card className="concert-mini-card px-4 py-3">
              <p className="concert-accent text-xs font-black uppercase text-fuchsia-200">{isThai ? "สถานที่" : "Venue"}</p>
              <p className="concert-title mt-1 text-sm font-extrabold text-white">The Street Ratchada</p>
            </Card>
            <Card className="concert-mini-card px-4 py-3">
              <p className="concert-accent text-xs font-black uppercase text-fuchsia-200">{isThai ? "ทั้งหมด" : "Total"}</p>
              <p className="concert-title mt-1 text-sm font-extrabold text-white">{totalEvents} {isThai ? "งานในระบบ" : "events tracked"}</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-8 lg:px-10">
        <div className={cn(activeMonth.layout === "grid" ? "grid gap-4 xl:grid-cols-2" : "space-y-4")}>
          {activeMonth.events.map((event) => (
            <article
              key={event.id}
              className={cn(
                "concert-card rounded-2xl border border-white/12 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,12,27,0.94))] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.25)] transition hover:border-fuchsia-300/45 hover:bg-slate-900/90",
                activeMonth.layout === "list" ? "md:flex md:items-center md:gap-6" : "sm:flex sm:gap-5",
              )}
            >
              <Poster event={event} />
              <div className="mt-4 min-w-0 flex-1 sm:mt-0">
                <h2 className="concert-title text-xl font-black leading-snug text-white">{event.title}</h2>
                <div className="mt-3 grid gap-2">
                  <DetailRow icon="📅" label={isThai ? event.dateTh : event.dateEn} />
                  <DetailRow icon="⏱" label={event.time} />
                  <DetailRow icon="📍" label={isThai ? event.venueTh : event.venueEn} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="concert-accent mr-1 text-xs font-black uppercase text-fuchsia-200">Lineup</span>
                  {event.lineup.map((artist) => (
                    <span key={artist} className="concert-chip rounded-full border border-white/15 bg-white/[0.055] px-3 py-1 text-xs font-bold text-slate-200">
                      {artist}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <DetailRow icon="🎟" label={isThai ? event.priceTh : event.priceEn} />
                  <Button variant="outline" size="sm" className="concert-button w-full justify-center sm:w-auto">
                    {isThai ? "ดูรายละเอียด" : "Details"} →
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="concert-note mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-sm font-semibold text-slate-400">
          {isThai ? "ข้อมูลอาจมีการเปลี่ยนแปลง โปรดตรวจสอบจากผู้จัดงานอีกครั้งก่อนซื้อบัตร" : "Event details may change. Please verify with the organizer before purchasing tickets."}
        </div>
      </div>
    </section>
  );
}
