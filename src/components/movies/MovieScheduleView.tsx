"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type PlatformKey = "all" | "cinema" | "streaming";
type MoviePlatform = Exclude<PlatformKey, "all">;

interface WatchItem {
  id: string;
  platform: MoviePlatform;
  title: string;
  dateTh: string;
  dateEn: string;
  genreTh: string;
  genreEn: string;
  sourceLabel: string;
  sourceUrl: string;
  posterQuery?: string;
  status?: "confirmed" | "watch";
}

interface MovieMonth {
  id: string;
  labelTh: string;
  labelEn: string;
  shortTh: string;
  shortEn: string;
  noteTh: string;
  noteEn: string;
  items: WatchItem[];
}

const platformMeta = {
  cinema: {
    labelTh: "โรงหนังไทย",
    labelEn: "Thai Cinema",
    icon: "🎬",
    gradient: "from-fuchsia-500/28 via-violet-500/18 to-cyan-500/18",
    border: "border-fuchsia-300/35",
    source: "Major Cineplex / โรงภาพยนตร์",
  },
  streaming: {
    labelTh: "Netflix / ซีรีส์",
    labelEn: "Netflix / Series",
    icon: "▰",
    gradient: "from-rose-500/26 via-fuchsia-500/18 to-blue-500/18",
    border: "border-blue-300/35",
    source: "Netflix / Tudum",
  },
} satisfies Record<MoviePlatform, { labelTh: string; labelEn: string; icon: string; gradient: string; border: string; source: string }>;

const months: MovieMonth[] = [
  {
    id: "july-2026",
    labelTh: "กรกฎาคม 2026",
    labelEn: "July 2026",
    shortTh: "ก.ค.",
    shortEn: "Jul",
    noteTh: "รวมเรื่องเด่นที่เข้าโรงไทยหรือเริ่มสตรีมในเดือนนี้ ควรตรวจสอบวันฉายจริงอีกครั้งก่อนจอง",
    noteEn: "Highlighted theatrical and streaming titles for the month. Check official dates before booking.",
    items: [
      { id: "moana-live-action", platform: "cinema", title: "Moana Live Action", dateTh: "9 ก.ค. 2026", dateEn: "Jul 9, 2026", genreTh: "แฟนตาซี / ผจญภัย / หนังครอบครัว", genreEn: "Fantasy / Adventure / Family", sourceLabel: "Major Cineplex", sourceUrl: "https://www.majorcineplex.com/movie", status: "watch" },
      { id: "the-odyssey", platform: "cinema", title: "The Odyssey", dateTh: "16 ก.ค. 2026", dateEn: "Jul 16, 2026", genreTh: "มหากาพย์ / ผจญภัย / งานใหญ่ภาพสวย", genreEn: "Epic / Adventure / Large-scale spectacle", sourceLabel: "Major Cineplex", sourceUrl: "https://www.majorcineplex.com/movie", status: "watch" },
      { id: "spider-man-brand-new-day", platform: "cinema", title: "Spider-Man: Brand New Day", dateTh: "31 ก.ค. 2026", dateEn: "Jul 31, 2026", genreTh: "Marvel / แอ็กชัน / ภาคใหม่ของ Spider-Man", genreEn: "Marvel / Action / New Spider-Man chapter", sourceLabel: "Major Cineplex", sourceUrl: "https://www.majorcineplex.com/movie", status: "watch" },
      { id: "enola-holmes-3", platform: "streaming", title: "Enola Holmes 3", dateTh: "1 ก.ค. 2026", dateEn: "Jul 1, 2026", genreTh: "Netflix Film / สืบสวนดูง่าย", genreEn: "Netflix Film / Mystery", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
      { id: "little-house-prairie", platform: "streaming", title: "Little House on the Prairie", dateTh: "9 ก.ค. 2026", dateEn: "Jul 9, 2026", genreTh: "Netflix Series / ดราม่าครอบครัว", genreEn: "Netflix Series / Family drama", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
      { id: "heartstopper-forever", platform: "streaming", title: "Heartstopper Forever", dateTh: "17 ก.ค. 2026", dateEn: "Jul 17, 2026", genreTh: "Netflix Film / โรแมนติก / ตอนปิดเรื่อง", genreEn: "Netflix Film / Romance / Finale", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
      { id: "72-hours", platform: "streaming", title: "72 Hours", dateTh: "24 ก.ค. 2026", dateEn: "Jul 24, 2026", genreTh: "Comedy Film / ดูเพลิน", genreEn: "Comedy Film / Easy watch", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
    ],
  },
  {
    id: "august-2026",
    labelTh: "สิงหาคม 2026",
    labelEn: "August 2026",
    shortTh: "ส.ค.",
    shortEn: "Aug",
    noteTh: "เดือนนี้ฝั่ง Netflix เด่นกว่าโรงหนังไทย ข้อมูลวันฉายอาจเปลี่ยนได้",
    noteEn: "Streaming highlights are stronger this month. Dates may change.",
    items: [
      { id: "tires-season-3", platform: "streaming", title: "Tires Season 3", dateTh: "13 ส.ค. 2026", dateEn: "Aug 13, 2026", genreTh: "Comedy Series / ดูง่าย", genreEn: "Comedy Series / Easy watch", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
      { id: "outer-banks-season-5", platform: "streaming", title: "Outer Banks Season 5", dateTh: "20 ส.ค. 2026", dateEn: "Aug 20, 2026", genreTh: "ผจญภัย / วัยรุ่น / ตามล่าสมบัติ", genreEn: "Adventure / Teen / Treasure hunt", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
      { id: "the-whisper-man", platform: "streaming", title: "The Whisper Man", dateTh: "28 ส.ค. 2026", dateEn: "Aug 28, 2026", genreTh: "Thriller Film / หนังระทึกขวัญ", genreEn: "Thriller Film", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
      { id: "one-hundred-years-solitude-2", platform: "streaming", title: "One Hundred Years of Solitude Season 2", dateTh: "ส.ค. 2026 (TBA)", dateEn: "Aug 2026 (TBA)", genreTh: "ดราม่า / แฟนซีเรียลลิสม์", genreEn: "Drama / Magical realism", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
      { id: "love-is-blind-uk-3", platform: "streaming", title: "Love is Blind: UK Season 3", dateTh: "ส.ค. 2026 (TBA)", dateEn: "Aug 2026 (TBA)", genreTh: "Reality Series / ดูเพลิน", genreEn: "Reality Series / Easy watch", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
    ],
  },
  {
    id: "september-2026",
    labelTh: "กันยายน 2026",
    labelEn: "September 2026",
    shortTh: "ก.ย.",
    shortEn: "Sep",
    noteTh: "เดือนนี้มีคอนเทนต์เด่นฝั่งสตรีมมิงมากกว่า พร้อมหนึ่งเรื่องฝั่งโรงหนังไทย",
    noteEn: "Streaming has more highlighted titles, with one theatrical watch item.",
    items: [
      { id: "resident-evil-2026", platform: "cinema", title: "Resident Evil", dateTh: "24 ก.ย. 2026", dateEn: "Sep 24, 2026", genreTh: "สยองขวัญ / รีบูตใหม่ / วันฉายในไทยตามลิสต์ Major", genreEn: "Horror / Reboot / Thai listing watch", sourceLabel: "Major Cineplex", sourceUrl: "https://www.majorcineplex.com/movie", status: "watch" },
      { id: "best-of-the-best", platform: "streaming", title: "Best of the Best", dateTh: "18 ก.ย. 2026", dateEn: "Sep 18, 2026", genreTh: "Comedy Film / Netflix", genreEn: "Comedy Film / Netflix", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
      { id: "mayweather-pacquiao-2", platform: "streaming", title: "Floyd Mayweather Jr. vs. Manny Pacquiao II", dateTh: "19 ก.ย. 2026", dateEn: "Sep 19, 2026", genreTh: "LIVE Event / มวยคู่ใหญ่", genreEn: "LIVE Event / Boxing", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
      { id: "balaraw-blood-island", platform: "streaming", title: "Balaraw: Blood Island Season 1", dateTh: "24 ก.ย. 2026", dateEn: "Sep 24, 2026", genreTh: "Folk Horror Series / ระทึกขวัญ", genreEn: "Folk Horror Series", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
    ],
  },
  {
    id: "october-2026",
    labelTh: "ตุลาคม 2026",
    labelEn: "October 2026",
    shortTh: "ต.ค.",
    shortEn: "Oct",
    noteTh: "เดือนนี้คอนเทนต์เด่นอยู่ฝั่ง Netflix และยังรออัปเดตหนังโรงไทยเพิ่มเติม",
    noteEn: "Netflix has the clearer highlights; Thai cinema listings are still being watched.",
    items: [
      { id: "bass-x-machina", platform: "streaming", title: "Bass x Machina Season 1", dateTh: "6 ต.ค. 2026", dateEn: "Oct 6, 2026", genreTh: "Animation Series / steampunk western", genreEn: "Animation Series / Steampunk western", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
      { id: "dead-end-job", platform: "streaming", title: "Dead-End Job", dateTh: "9 ต.ค. 2026", dateEn: "Oct 9, 2026", genreTh: "Korean mystery horror fantasy", genreEn: "Korean mystery horror fantasy", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
      { id: "six-kings-slam", platform: "streaming", title: "Six Kings Slam", dateTh: "ต.ค. 2026 (TBD)", dateEn: "Oct 2026 (TBD)", genreTh: "LIVE Tennis Event", genreEn: "LIVE Tennis Event", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
    ],
  },
  {
    id: "november-2026",
    labelTh: "พฤศจิกายน 2026",
    labelEn: "November 2026",
    shortTh: "พ.ย.",
    shortEn: "Nov",
    noteTh: "เดือนนี้หนังโรงไทยมีหลายเรื่องน่าสนใจ ส่วน Netflix ยังรอประกาศลิสต์เพิ่ม",
    noteEn: "Thai cinema has several watch items; Netflix may announce more later.",
    items: [
      { id: "cat-in-the-hat", platform: "cinema", title: "The Cat in the Hat", dateTh: "6 พ.ย. 2026", dateEn: "Nov 6, 2026", genreTh: "แอนิเมชัน / ครอบครัว", genreEn: "Animation / Family", sourceLabel: "Major Cineplex", sourceUrl: "https://www.majorcineplex.com/movie", status: "watch" },
      { id: "hunger-games-sunrise", platform: "cinema", title: "The Hunger Games: Sunrise on the Reaping", dateTh: "19 พ.ย. 2026", dateEn: "Nov 19, 2026", genreTh: "มหากาพย์ / แอ็กชัน / prequel", genreEn: "Epic / Action / Prequel", sourceLabel: "Major Cineplex", sourceUrl: "https://www.majorcineplex.com/movie", status: "watch" },
      { id: "hexed", platform: "cinema", title: "Hexed", dateTh: "26 พ.ย. 2026", dateEn: "Nov 26, 2026", genreTh: "แอนิเมชัน / แฟนตาซี", genreEn: "Animation / Fantasy", sourceLabel: "Major Cineplex", sourceUrl: "https://www.majorcineplex.com/movie", status: "watch" },
      { id: "wild-horse-nine", platform: "cinema", title: "Wild Horse Nine", dateTh: "5 พ.ย. 2026", dateEn: "Nov 5, 2026", genreTh: "ตลก / อาชญากรรม / ระทึกขวัญ", genreEn: "Comedy / Crime / Thriller", sourceLabel: "Major Cineplex", sourceUrl: "https://www.majorcineplex.com/movie", status: "watch" },
    ],
  },
  {
    id: "december-2026",
    labelTh: "ธันวาคม 2026",
    labelEn: "December 2026",
    shortTh: "ธ.ค.",
    shortEn: "Dec",
    noteTh: "เดือนนี้มีทั้งหนังโรงใหญ่และสตรีมมิงปลายปี",
    noteEn: "A year-end mix of major cinema releases and streaming titles.",
    items: [
      { id: "avengers-doomsday", platform: "cinema", title: "Avengers: Doomsday", dateTh: "18 ธ.ค. 2026", dateEn: "Dec 18, 2026", genreTh: "Marvel / หนังใหญ่ปลายปี", genreEn: "Marvel / Major year-end release", sourceLabel: "Major Cineplex", sourceUrl: "https://www.majorcineplex.com/movie", status: "watch" },
      { id: "dune-part-three", platform: "cinema", title: "Dune: Part Three", dateTh: "18 ธ.ค. 2026", dateEn: "Dec 18, 2026", genreTh: "ไซไฟ / มหากาพย์ / ภาพอลังการ", genreEn: "Sci-fi / Epic / Large-scale spectacle", sourceLabel: "Major Cineplex", sourceUrl: "https://www.majorcineplex.com/movie", status: "watch" },
      { id: "a-filipino-christmas", platform: "streaming", title: "A Filipino Christmas", dateTh: "3 ธ.ค. 2026", dateEn: "Dec 3, 2026", genreTh: "Holiday Drama Anthology", genreEn: "Holiday Drama Anthology", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
      { id: "tantara", platform: "streaming", title: "Tantara", dateTh: "11 ธ.ค. 2026", dateEn: "Dec 11, 2026", genreTh: "Korean Period Drama", genreEn: "Korean Period Drama", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
      { id: "nfl-christmas-gameday", platform: "streaming", title: "NFL Christmas Gameday", dateTh: "25 ธ.ค. 2026", dateEn: "Dec 25, 2026", genreTh: "LIVE Sports Event", genreEn: "LIVE Sports Event", sourceLabel: "Netflix Tudum", sourceUrl: "https://www.netflix.com/tudum", status: "watch" },
    ],
  },
];

function PlatformArt({ platform, items }: { platform: MoviePlatform; items: WatchItem[] }) {
  const meta = platformMeta[platform];
  const previewItems = items.slice(0, 3);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  return (
    <div className={cn("relative h-full min-h-72 overflow-hidden rounded-2xl border p-5 shadow-[0_0_34px_rgba(168,85,247,0.22)] lg:min-h-[28rem]", meta.border)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br", meta.gradient)} />
      {previewItems[0] && !failed[previewItems[0].id] && (
        <Image
          src={moviePosterSrc(previewItems[0])}
          alt=""
          aria-hidden
          className="scale-110 object-cover opacity-45 blur-[6px]"
          fill
          sizes="320px"
          unoptimized
          loading="lazy"
          onError={() => setFailed((current) => ({ ...current, [previewItems[0].id]: true }))}
        />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.28),transparent_30%),linear-gradient(180deg,transparent,rgba(2,6,23,0.92))]" />
      <div className="absolute right-3 top-3 flex -space-x-6">
        {previewItems.map((item, index) => !failed[item.id] && (
          <div key={item.id} className={cn("relative aspect-[2/3] w-20 overflow-hidden rounded-xl border border-white/20 shadow-[0_14px_30px_rgba(0,0,0,0.36)] sm:w-24", index === 1 && "mt-8", index === 2 && "mt-16")}>
            <Image
              src={moviePosterSrc(item)}
              alt={item.title}
              className="object-cover"
              fill
              sizes="64px"
              unoptimized
              loading="lazy"
              onError={() => setFailed((current) => ({ ...current, [item.id]: true }))}
            />
          </div>
        ))}
      </div>
      <div className="relative flex h-full min-h-64 flex-col justify-end lg:min-h-[25rem]">
        <span className="text-5xl drop-shadow-[0_0_18px_rgba(217,70,239,0.75)]">{meta.icon}</span>
        <p className="mt-3 text-2xl font-black text-white">{meta.labelTh}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-100/75">{meta.labelEn}</p>
      </div>
    </div>
  );
}

function moviePosterSrc(item: WatchItem) {
  const params = new URLSearchParams({
    query: item.posterQuery ?? item.title,
    title: item.title,
    kind: item.platform,
    strict: "1",
  });
  return `/api/poster-image?${params.toString()}`;
}

function MoviePoster({ item, isThai }: { item: WatchItem; isThai: boolean }) {
  const [failed, setFailed] = useState(false);
  const meta = platformMeta[item.platform];

  if (failed) {
    return (
      <div className={cn("relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-xl border bg-slate-950/70 shadow-[0_14px_34px_rgba(0,0,0,0.28)]", meta.border)}>
        <div className={cn("absolute inset-0 bg-gradient-to-br", meta.gradient)} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.32),transparent_28%),linear-gradient(180deg,transparent,rgba(2,6,23,0.88))]" />
        <div className="relative flex h-full flex-col justify-end p-2">
          <span className="text-2xl" aria-hidden>{meta.icon}</span>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/70">Source poster unavailable</p>
          <p className="mt-1 line-clamp-3 text-[11px] font-black leading-3 text-white">{item.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-xl border bg-slate-950/70 shadow-[0_14px_34px_rgba(0,0,0,0.28)]", meta.border)}>
      <Image
        src={moviePosterSrc(item)}
        alt={`${item.title} ${isThai ? "โปสเตอร์" : "poster"}`}
        className="object-cover"
        fill
        sizes="80px"
        unoptimized
        loading="lazy"
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/92 to-transparent p-2">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/80">{item.platform === "cinema" ? "TMDB / Cinema" : "TMDB / Series"}</p>
      </div>
    </div>
  );
}

function WatchRow({ item, index, isThai }: { item: WatchItem; index: number; isThai: boolean }) {
  return (
    <div className="grid gap-3 border-b border-white/10 px-3 py-3 last:border-b-0 sm:grid-cols-[3.25rem_5rem_minmax(0,1.15fr)_11rem_minmax(0,1fr)_auto] sm:items-center">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-fuchsia-300/35 bg-fuchsia-400/10 text-lg font-black text-white shadow-[0_0_18px_rgba(217,70,239,0.28)]">{index + 1}</span>
      <MoviePoster item={item} isThai={isThai} />
      <div className="min-w-0">
        <p className="line-clamp-2 text-base font-black leading-snug text-white sm:text-lg">{item.title}</p>
        <p className="mt-1 text-xs font-bold text-slate-400">{item.sourceLabel} · {isThai ? "โปสเตอร์จาก TMDB" : "Poster via TMDB"}</p>
      </div>
      <p className="text-sm font-black text-fuchsia-100">📅 {isThai ? item.dateTh : item.dateEn}</p>
      <p className="text-sm font-semibold leading-6 text-slate-200">☆ {isThai ? item.genreTh : item.genreEn}</p>
      <Button asChild variant="outline" size="sm" className="justify-center">
        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{isThai ? "ดูแหล่งข้อมูล" : "Source"} ↗</a>
      </Button>
    </div>
  );
}

function PlatformSection({ platform, items, isThai }: { platform: MoviePlatform; items: WatchItem[]; isThai: boolean }) {
  const meta = platformMeta[platform];
  return (
    <section className={cn("rounded-3xl border bg-slate-950/52 p-3 shadow-[0_0_42px_rgba(37,99,235,0.18)] sm:p-4", meta.border)}>
      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <PlatformArt platform={platform} items={items} />
        {items.length ? (
          <div className="overflow-hidden rounded-2xl border border-white/12 bg-slate-950/42">
            {items.map((item, index) => <WatchRow key={item.id} item={item} index={index} isThai={isThai} />)}
          </div>
        ) : (
          <div className="flex min-h-40 items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.035] p-6">
            <div>
              <p className="text-xl font-black text-white">{isThai ? `เดือนนี้ยังไม่มีรายการเด่นฝั่ง${meta.labelTh}` : `No highlighted ${meta.labelEn} items yet`}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{isThai ? "รอติดตามประกาศจากแพลตฟอร์มหรือโรงภาพยนตร์อีกครั้ง" : "Watch official platform and cinema announcements for updates."}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function MovieScheduleView() {
  const { lang } = useLanguage();
  const isThai = lang === "th";
  const [activeMonthId, setActiveMonthId] = useState(months[0].id);
  const [platform, setPlatform] = useState<PlatformKey>("all");
  const activeMonth = months.find((month) => month.id === activeMonthId) ?? months[0];
  const filteredItems = useMemo(() => activeMonth.items.filter((item) => platform === "all" || item.platform === platform), [activeMonth, platform]);
  const countLabel = isThai ? `รวม ${filteredItems.length} เรื่อง` : `${filteredItems.length} titles`;
  const platformKeys: PlatformKey[] = ["all", "cinema", "streaming"];

  return (
    <div className="movie-page relative overflow-hidden rounded-3xl border border-fuchsia-300/20 bg-slate-950/65 p-4 shadow-2xl shadow-fuchsia-950/30 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_0%,rgba(168,85,247,0.30),transparent_30%),radial-gradient(circle_at_90%_8%,rgba(59,130,246,0.22),transparent_28%)]" />
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-[38rem] bg-[linear-gradient(180deg,rgba(99,102,241,0.18),transparent)]" />
      <div className="relative">
        <header className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-200">NimbusDaily Watchlist</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-6xl">
              {isThai ? "หนังโรงไทย + Netflix / ซีรีส์น่าดู" : "Thai Cinema + Netflix / Series"}
              <span className="block bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                {isThai ? `เดือน${activeMonth.labelTh}` : activeMonth.labelEn}
              </span>
            </h1>
            <p className="mt-3 max-w-4xl text-base font-semibold leading-8 text-slate-200">
              {isThai ? "รวมเรื่องเด่นที่เข้าโรงไทย หรือเริ่มสตรีมในเดือนนี้ จัดแยกตามแพลตฟอร์มเพื่ออ่านง่ายเหมือนตารางใช้งานจริง" : "A month-by-month guide for Thai cinema releases and Netflix or series highlights, grouped by platform."}
            </p>
          </div>
          <div className="rounded-3xl border border-cyan-300/35 bg-slate-950/68 p-5 text-center shadow-[0_0_42px_rgba(59,130,246,0.28)]">
            <p className="text-5xl font-black text-white">{countLabel}</p>
            <p className="mt-2 text-sm font-bold text-cyan-100">{isThai ? "ในตัวกรองนี้" : "in this filter"}</p>
          </div>
        </header>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-fuchsia-300/35 bg-slate-950/45 p-4 text-sm font-bold text-slate-200">📅 <span className="text-fuchsia-200">{isThai ? "เดือน:" : "Month:"}</span> {isThai ? activeMonth.labelTh : activeMonth.labelEn}</div>
          <div className="rounded-2xl border border-fuchsia-300/35 bg-slate-950/45 p-4 text-sm font-bold text-slate-200">🎞 <span className="text-fuchsia-200">{isThai ? "หมวด:" : "Category:"}</span> {isThai ? "หนังโรงไทย / Netflix / ซีรีส์" : "Thai cinema / Netflix / Series"}</div>
          <div className="rounded-2xl border border-cyan-300/35 bg-slate-950/45 p-4 text-sm font-bold text-slate-200">ⓘ <span className="text-fuchsia-200">{isThai ? "หมายเหตุ:" : "Note:"}</span> {isThai ? activeMonth.noteTh : activeMonth.noteEn}</div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {months.map((month) => (
              <button key={month.id} type="button" onClick={() => setActiveMonthId(month.id)} className={cn("min-h-11 shrink-0 rounded-2xl border px-4 text-sm font-black transition", activeMonthId === month.id ? "border-fuchsia-300/45 bg-fuchsia-300/15 text-white shadow-[0_0_24px_rgba(217,70,239,0.18)]" : "border-white/10 bg-white/[0.045] text-slate-400 hover:text-white")}>
                {isThai ? month.shortTh : month.shortEn}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {platformKeys.map((key) => {
              const label = key === "all" ? (isThai ? "ทั้งหมด" : "All") : isThai ? platformMeta[key].labelTh : platformMeta[key].labelEn;
              return (
                <button key={key} type="button" onClick={() => setPlatform(key)} className={cn("rounded-2xl border px-4 py-2.5 text-sm font-black transition", platform === key ? "border-cyan-300/45 bg-cyan-300/15 text-white" : "border-white/10 bg-white/[0.045] text-slate-400 hover:text-white")}>
                  {key === "all" ? "★" : platformMeta[key].icon} {label}
                </button>
              );
            })}
          </div>
        </div>

        <main className="mt-6 space-y-4">
          {(platform === "all" || platform === "cinema") && <PlatformSection platform="cinema" items={filteredItems.filter((item) => item.platform === "cinema")} isThai={isThai} />}
          {(platform === "all" || platform === "streaming") && <PlatformSection platform="streaming" items={filteredItems.filter((item) => item.platform === "streaming")} isThai={isThai} />}
          <div className="rounded-2xl border border-fuchsia-300/25 bg-slate-950/52 p-4 text-center text-sm font-semibold leading-7 text-slate-300">
            ⓘ {isThai ? "ข้อมูลอาจมีการเปลี่ยนแปลง โปรดตรวจสอบ Major / Netflix อีกครั้งก่อนซื้อตั๋วหรือวางแผนรับชม" : "Details may change. Please verify Major / Netflix before buying tickets or planning your watchlist."}
          </div>
        </main>
      </div>
    </div>
  );
}
