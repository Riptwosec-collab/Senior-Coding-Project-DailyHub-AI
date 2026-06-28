"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type EventMonthId = "july-2026" | "august-2026" | "september-2026" | "october-2026" | "november-2026" | "december-2026";
type EventKind = "expo" | "fair" | "festival" | "outdoor";

type ExpoEvent = {
  id: string;
  kind: EventKind;
  title: string;
  dateTh: string;
  dateEn: string;
  venueTh: string;
  venueEn: string;
  highlights: string[];
  sourceTh: string;
  sourceEn: string;
  sourceUrl: string;
  imageTitle: string;
};

type EventMonth = {
  id: EventMonthId;
  labelTh: string;
  labelEn: string;
  shortTh: string;
  shortEn: string;
  noteTh: string;
  noteEn: string;
  events: ExpoEvent[];
};

const kindMeta = {
  expo: { labelTh: "Expo", labelEn: "Expo", icon: "🏢", tone: "blue", className: "border-cyan-300/28 bg-cyan-300/[0.075]" },
  fair: { labelTh: "Fair", labelEn: "Fair", icon: "🎪", tone: "purple", className: "border-fuchsia-300/28 bg-fuchsia-300/[0.075]" },
  festival: { labelTh: "Festival", labelEn: "Festival", icon: "✨", tone: "green", className: "border-emerald-300/28 bg-emerald-300/[0.065]" },
  outdoor: { labelTh: "Outdoor", labelEn: "Outdoor", icon: "⛺", tone: "green", className: "border-emerald-300/28 bg-emerald-300/[0.065]" },
} satisfies Record<EventKind, { labelTh: string; labelEn: string; icon: string; tone: "blue" | "purple" | "green"; className: string }>;

const eventMonths: EventMonth[] = [
  {
    id: "july-2026",
    labelTh: "กรกฎาคม 2026",
    labelEn: "July 2026",
    shortTh: "ก.ค.",
    shortEn: "Jul",
    noteTh: "คัดเฉพาะงานอีเวนต์ / แฟร์ / outdoor ที่ไม่ซ้ำกับตารางคอนเสิร์ตหลัก",
    noteEn: "Curated event, fair, and outdoor listings without duplicating the main concert schedule.",
    events: [
      {
        id: "y-book-fair-11",
        kind: "fair",
        title: "Y BOOK FAIR #11",
        dateTh: "11-12 ก.ค. 2026",
        dateEn: "Jul 11-12, 2026",
        venueTh: "QSNCC Event Hall B2",
        venueEn: "QSNCC Event Hall B2",
        highlights: ["BL / GL / LGBTQ community fair", "publishers", "writers", "artists", "fan activities"],
        sourceTh: "QSNCC",
        sourceEn: "QSNCC",
        sourceUrl: "https://www.qsncc.com/th/whats-on/event-calendar/y-book-fair-11/?r=%2F",
        imageTitle: "Y BOOK FAIR #11",
      },
      {
        id: "impact-speed-fest-2",
        kind: "expo",
        title: "IMPACT Speed Fest ครั้งที่ 2",
        dateTh: "17-19 ก.ค. 2026",
        dateEn: "Jul 17-19, 2026",
        venueTh: "IMPACT Challenger",
        venueEn: "IMPACT Challenger",
        highlights: ["auto", "speed", "lifestyle festival", "motorsport showcase"],
        sourceTh: "IMPACT / Zipevent",
        sourceEn: "IMPACT / Zipevent",
        sourceUrl: "https://www.zipeventapp.com/e/IMPACT-Speed-Fest-2026-D9BE5513",
        imageTitle: "IMPACT Speed Fest 2026",
      },
      {
        id: "awakening-song-wat-2026",
        kind: "outdoor",
        title: "Awakening Song Wat 2026",
        dateTh: "3-12 ก.ค. 2026",
        dateEn: "Jul 3-12, 2026",
        venueTh: "Song Wat Road, Bangkok",
        venueEn: "Song Wat Road, Bangkok",
        highlights: ["light art", "digital art", "installations", "walking festival"],
        sourceTh: "Eventpop",
        sourceEn: "Eventpop",
        sourceUrl: "https://www.eventpop.me/e/157832/awakening-song-wat-2026",
        imageTitle: "Awakening Song Wat 2026",
      },
      {
        id: "phi-ta-khon-bangkok-island",
        kind: "festival",
        title: "Phi Ta Khon Bangkok Island",
        dateTh: "11 ก.ค. 2026",
        dateEn: "Jul 11, 2026",
        venueTh: "Bangkok Island",
        venueEn: "Bangkok Island",
        highlights: ["cultural theme", "festival", "community event"],
        sourceTh: "Eventpop",
        sourceEn: "Eventpop",
        sourceUrl: "https://www.eventpop.me/e/154264",
        imageTitle: "Phi Ta Khon Bangkok Island",
      },
    ],
  },
  {
    id: "august-2026",
    labelTh: "สิงหาคม 2026",
    labelEn: "August 2026",
    shortTh: "ส.ค.",
    shortEn: "Aug",
    noteTh: "เดือนนี้มีงาน expo และ event hall เด่นกว่ากลางแจ้ง",
    noteEn: "Expo and hall-based events are stronger than outdoor events this month.",
    events: [
      {
        id: "franchise-expo-thailand-2026",
        kind: "expo",
        title: "Franchise Expo Thailand by Smart SME Expo",
        dateTh: "6-9 ส.ค. 2026",
        dateEn: "Aug 6-9, 2026",
        venueTh: "IMPACT Exhibition Center",
        venueEn: "IMPACT Exhibition Center",
        highlights: ["franchise", "SME", "business expo", "investment ideas"],
        sourceTh: "IMPACT",
        sourceEn: "IMPACT",
        sourceUrl: "https://www.impact.co.th/en/visitors/event-calendar/exhibition-trade/franchise-expo-thailand-by-smart-sme-expo",
        imageTitle: "Franchise Expo Thailand 2026",
      },
      {
        id: "foodism-health-wellness-2026",
        kind: "expo",
        title: "The Foodism Thailand x Thailand Health & Wellness 2026",
        dateTh: "27-29 ส.ค. 2026",
        dateEn: "Aug 27-29, 2026",
        venueTh: "IMPACT Exhibition Center",
        venueEn: "IMPACT Exhibition Center",
        highlights: ["food", "wellness", "lifestyle expo", "health products"],
        sourceTh: "IMPACT",
        sourceEn: "IMPACT",
        sourceUrl: "https://www.impact.co.th/en/visitors/event-calendar/exhibition-trade/the-foodism-show-x-thailand-health-and-wellness-2026",
        imageTitle: "Foodism Thailand Health Wellness 2026",
      },
    ],
  },
  {
    id: "september-2026",
    labelTh: "กันยายน 2026",
    labelEn: "September 2026",
    shortTh: "ก.ย.",
    shortEn: "Sep",
    noteTh: "เน้น performing arts และงานต่อเนื่องที่ประกาศชัดเจน",
    noteEn: "Focused on confirmed performing arts and long-running events.",
    events: [
      {
        id: "bangkok-festival-dance-music-28",
        kind: "festival",
        title: "Bangkok's 28th International Festival of Dance & Music",
        dateTh: "5 ก.ย.-17 ต.ค. 2026",
        dateEn: "Sep 5-Oct 17, 2026",
        venueTh: "Thailand Cultural Centre",
        venueEn: "Thailand Cultural Centre",
        highlights: ["performing arts", "international dance", "opera", "ballet", "orchestra"],
        sourceTh: "ThaiTicketMajor / Bangkok Festival",
        sourceEn: "ThaiTicketMajor / Bangkok Festival",
        sourceUrl: "https://www.thaiticketmajor.com/bangkokfestivals/",
        imageTitle: "Bangkok International Festival of Dance and Music",
      },
    ],
  },
  {
    id: "october-2026",
    labelTh: "ตุลาคม 2026",
    labelEn: "October 2026",
    shortTh: "ต.ค.",
    shortEn: "Oct",
    noteTh: "เดือนตุลาคมเริ่มมีงาน open-air และ performing arts ต่อเนื่อง",
    noteEn: "October includes open-air and performing arts continuations.",
    events: [
      {
        id: "bangkok-festival-dance-music-october",
        kind: "festival",
        title: "Bangkok's 28th International Festival of Dance & Music",
        dateTh: "ต่อเนื่องถึง 17 ต.ค. 2026",
        dateEn: "Runs until Oct 17, 2026",
        venueTh: "Thailand Cultural Centre",
        venueEn: "Thailand Cultural Centre",
        highlights: ["Coco Chanel", "La Traviata", "Madama Butterfly", "Russian Hamlet"],
        sourceTh: "ThaiTicketMajor / Bangkok Festival",
        sourceEn: "ThaiTicketMajor / Bangkok Festival",
        sourceUrl: "https://www.thaiticketmajor.com/bangkokfestivals/",
        imageTitle: "Bangkok Festival Dance Music October",
      },
      {
        id: "808-festival-2026",
        kind: "outdoor",
        title: "808 Festival 2026",
        dateTh: "2-3 ต.ค. 2026",
        dateEn: "Oct 2-3, 2026",
        venueTh: "Bangkok (venue TBA)",
        venueEn: "Bangkok (venue TBA)",
        highlights: ["open-air", "EDM", "large festival", "teaser lineup"],
        sourceTh: "Instagram / organizer",
        sourceEn: "Instagram / organizer",
        sourceUrl: "https://www.instagram.com/p/DaAr5M5Dxx2/",
        imageTitle: "808 Festival 2026",
      },
    ],
  },
  {
    id: "november-2026",
    labelTh: "พฤศจิกายน 2026",
    labelEn: "November 2026",
    shortTh: "พ.ย.",
    shortEn: "Nov",
    noteTh: "ตอนนี้มีประกาศงาน outdoor/กิจกรรมเด่นค่อนข้างน้อย",
    noteEn: "Confirmed outdoor and event listings are still limited this month.",
    events: [
      {
        id: "red-earth-renegades-2026",
        kind: "outdoor",
        title: "RED EARTH RENEGADES Enduro and Adventure Festival",
        dateTh: "7 พ.ย. 2026",
        dateEn: "Nov 7, 2026",
        venueTh: "สถานที่จัดงาน TBA",
        venueEn: "Venue TBA",
        highlights: ["adventure", "enduro festival", "outdoor activity"],
        sourceTh: "Eventpop",
        sourceEn: "Eventpop",
        sourceUrl: "https://www.eventpop.me/e/156323",
        imageTitle: "Red Earth Renegades 2026",
      },
    ],
  },
  {
    id: "december-2026",
    labelTh: "ธันวาคม 2026",
    labelEn: "December 2026",
    shortTh: "ธ.ค.",
    shortEn: "Dec",
    noteTh: "เดือนนี้มี mega festival กลางแจ้งหลายงาน อยู่ในหน้า event เพื่อไม่ปนกับตารางคอนเสิร์ตทั่วไป",
    noteEn: "Mega outdoor festivals are grouped here to keep the concert schedule clean.",
    events: [
      {
        id: "wonderfruit-2026",
        kind: "outdoor",
        title: "Wonderfruit 2026",
        dateTh: "3-7 ธ.ค. 2026",
        dateEn: "Dec 3-7, 2026",
        venueTh: "The Fields at Siam Country Club, Chonburi",
        venueEn: "The Fields at Siam Country Club, Chonburi",
        highlights: ["art", "music", "nature festival", "community"],
        sourceTh: "Wonderfruit",
        sourceEn: "Wonderfruit",
        sourceUrl: "https://wonderfruit.co/tickets",
        imageTitle: "Wonderfruit 2026",
      },
      {
        id: "tomorrowland-thailand-2026",
        kind: "outdoor",
        title: "Tomorrowland Thailand 2026",
        dateTh: "11-13 ธ.ค. 2026",
        dateEn: "Dec 11-13, 2026",
        venueTh: "Wisdom Valley, Chonburi",
        venueEn: "Wisdom Valley, Chonburi",
        highlights: ["large open-air festival", "multiple stages", "international EDM"],
        sourceTh: "Tomorrowland Thailand",
        sourceEn: "Tomorrowland Thailand",
        sourceUrl: "https://thailand.tomorrowland.com/en/passes-packages/",
        imageTitle: "Tomorrowland Thailand 2026",
      },
      {
        id: "edc-thailand-2026",
        kind: "outdoor",
        title: "EDC Thailand 2026",
        dateTh: "18-20 ธ.ค. 2026",
        dateEn: "Dec 18-20, 2026",
        venueTh: "Rhythm Park, Phuket",
        venueEn: "Rhythm Park, Phuket",
        highlights: ["EDM", "large outdoor festival", "official ticket page"],
        sourceTh: "EDC Thailand",
        sourceEn: "EDC Thailand",
        sourceUrl: "https://thailand.edc.com/en/tickets/",
        imageTitle: "EDC Thailand 2026",
      },
    ],
  },
];

function eventImageSrc(event: ExpoEvent) {
  const params = new URLSearchParams({
    url: event.sourceUrl,
    title: event.imageTitle,
    kind: "event",
    strict: "1",
  });
  return `/api/poster-image?${params.toString()}`;
}

function EventArtwork({ event }: { event: ExpoEvent }) {
  const [failed, setFailed] = useState(false);
  const meta = kindMeta[event.kind];

  return (
    <div className={cn("relative min-h-56 overflow-hidden rounded-2xl border bg-slate-950/70", meta.className)}>
      {!failed && (
        <>
          <Image
            src={eventImageSrc(event)}
            alt=""
            aria-hidden
            className="scale-110 object-cover opacity-55 blur-[6px]"
            fill
            sizes="(min-width: 1280px) 380px, 100vw"
            unoptimized
            loading="lazy"
            onError={() => setFailed(true)}
          />
          <Image
            src={eventImageSrc(event)}
            alt={`${event.title} poster`}
            className="object-cover opacity-95"
            fill
            sizes="(min-width: 1280px) 380px, 100vw"
            unoptimized
            loading="lazy"
            onError={() => setFailed(true)}
          />
        </>
      )}
      {failed && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_38%_12%,rgba(34,197,94,0.20),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,0.95))]">
          <div className="absolute right-4 top-4 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-300">
            Source image unavailable
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.94)_100%)]" />
      <div className="absolute left-4 top-4 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs font-black text-white">
        {meta.icon} {meta.labelEn}
      </div>
      <div className="relative flex min-h-56 flex-col justify-end p-5">
        <h3 className="text-2xl font-black leading-tight text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.65)]">{event.title}</h3>
        <p className="mt-2 text-sm font-bold text-white/82">{event.sourceEn}</p>
      </div>
    </div>
  );
}

function EventCard({ event, index, isThai }: { event: ExpoEvent; index: number; isThai: boolean }) {
  const meta = kindMeta[event.kind];

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <EventArtwork event={event} />
        <div className="flex min-w-0 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.08] text-sm font-black text-white">{index + 1}</span>
            <Badge tone={meta.tone}>{isThai ? meta.labelTh : meta.labelEn}</Badge>
            <Badge tone="gray">{isThai ? event.sourceTh : event.sourceEn}</Badge>
          </div>
          <h3 className="mt-4 text-2xl font-black leading-tight text-white">{event.title}</h3>
          <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-300 md:grid-cols-2">
            <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">📅 {isThai ? event.dateTh : event.dateEn}</p>
            <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">📍 {isThai ? event.venueTh : event.venueEn}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {event.highlights.map((item) => (
              <span key={item} className="rounded-full border border-white/12 bg-white/[0.055] px-3 py-1 text-xs font-bold text-slate-200">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-auto flex flex-wrap justify-end gap-2 pt-5">
            <Button asChild size="sm" variant="outline">
              <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">
                {isThai ? "ดูรายละเอียด / ซื้อบัตร" : "Details / Tickets"} ↗
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function EventExpoFairView() {
  const { lang } = useLanguage();
  const isThai = lang === "th";
  const [activeMonthId, setActiveMonthId] = useState<EventMonthId>(eventMonths[0].id);
  const [kind, setKind] = useState<EventKind | "all">("all");
  const activeMonth = eventMonths.find((month) => month.id === activeMonthId) ?? eventMonths[0];
  const events = useMemo(() => activeMonth.events.filter((event) => kind === "all" || event.kind === kind), [activeMonth, kind]);
  const total = eventMonths.reduce((sum, month) => sum + month.events.length, 0);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-300/20 bg-slate-950/72 p-4 shadow-2xl shadow-emerald-950/20 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_4%,rgba(34,197,94,0.22),transparent_28%),radial-gradient(circle_at_86%_2%,rgba(168,85,247,0.24),transparent_28%)]" />
      <div className="relative">
        <header className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="green">NimbusDaily Events</Badge>
              <Badge tone="purple">Expo / Fair / Outdoor</Badge>
              <Badge tone="gray">{isThai ? "ตัดรายการซ้ำจากหน้าคอนเสิร์ตแล้ว" : "Deduped from concert page"}</Badge>
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-6xl">
              {isThai ? "งานอีเวนต์ / Expo / Fair" : "Events / Expo / Fair"}
              <span className="block bg-gradient-to-r from-emerald-200 via-cyan-200 to-fuchsia-200 bg-clip-text text-transparent">
                {isThai ? `เดือน${activeMonth.labelTh}` : activeMonth.labelEn}
              </span>
            </h1>
            <p className="mt-3 max-w-4xl text-base font-semibold leading-8 text-slate-200">
              {isThai
                ? "รวมงานแฟร์ งานแสดงสินค้า งานเทศกาล และกิจกรรมกลางแจ้ง แยกตามเดือนและประเภท พร้อมรูปจริงจากเว็บต้นทางและปุ่มเปิดรายละเอียดจริง"
                : "A month-by-month guide to fairs, expos, festivals, and outdoor events with source images and real detail links."}
            </p>
          </div>
          <Card className="p-5 text-center">
            <p className="text-5xl font-black text-white">{events.length}</p>
            <p className="mt-2 text-sm font-bold text-slate-300">{isThai ? `จากทั้งหมด ${total} งาน` : `of ${total} tracked`}</p>
          </Card>
        </header>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-emerald-300/28 bg-emerald-300/[0.07] p-4 text-sm font-bold text-slate-200">📅 <span className="text-emerald-200">{isThai ? "เดือน:" : "Month:"}</span> {isThai ? activeMonth.labelTh : activeMonth.labelEn}</div>
          <div className="rounded-2xl border border-fuchsia-300/28 bg-fuchsia-300/[0.07] p-4 text-sm font-bold text-slate-200">🏷 <span className="text-fuchsia-200">{isThai ? "ประเภท:" : "Type:"}</span> {kind === "all" ? (isThai ? "ทั้งหมด" : "All") : (isThai ? kindMeta[kind].labelTh : kindMeta[kind].labelEn)}</div>
          <div className="rounded-2xl border border-cyan-300/28 bg-cyan-300/[0.07] p-4 text-sm font-bold text-slate-200">ⓘ {isThai ? activeMonth.noteTh : activeMonth.noteEn}</div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {eventMonths.map((month) => (
              <button key={month.id} type="button" onClick={() => setActiveMonthId(month.id)} className={cn("min-h-11 shrink-0 rounded-2xl border px-4 text-sm font-black transition", activeMonthId === month.id ? "border-emerald-300/45 bg-emerald-300/15 text-white shadow-[0_0_24px_rgba(34,197,94,0.18)]" : "border-white/10 bg-white/[0.045] text-slate-400 hover:text-white")}>
                {isThai ? month.shortTh : month.shortEn}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "expo", "fair", "festival", "outdoor"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setKind(value)} className={cn("rounded-2xl border px-4 py-2.5 text-sm font-black transition", kind === value ? "border-cyan-300/45 bg-cyan-300/15 text-white" : "border-white/10 bg-white/[0.045] text-slate-400 hover:text-white")}>
                {value === "all" ? "✨" : kindMeta[value].icon} {value === "all" ? (isThai ? "ทั้งหมด" : "All") : (isThai ? kindMeta[value].labelTh : kindMeta[value].labelEn)}
              </button>
            ))}
          </div>
        </div>

        <main className="mt-6 grid gap-4 2xl:grid-cols-2">
          {events.map((event, index) => <EventCard key={event.id} event={event} index={index} isThai={isThai} />)}
          {!events.length && (
            <Card className="p-8 text-center 2xl:col-span-2">
              <p className="text-3xl">🔎</p>
              <h2 className="mt-3 text-2xl font-black text-white">{isThai ? "ยังไม่มีงานในตัวกรองนี้" : "No events in this filter"}</h2>
              <p className="mt-2 text-sm text-slate-400">{isThai ? "ลองเปลี่ยนเดือนหรือประเภทงาน" : "Try another month or type."}</p>
            </Card>
          )}
        </main>
      </div>
    </section>
  );
}
