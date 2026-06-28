import { NextRequest, NextResponse } from "next/server";

const USER_AGENT = "NimbusDaily/1.0 poster preview (+local dashboard)";

const FALLBACK_COLORS: Record<string, { accent: string; bg: string }> = {
  cinema: { accent: "#d946ef", bg: "#050816" },
  streaming: { accent: "#ef4444", bg: "#050816" },
  concert: { accent: "#a855f7", bg: "#020617" },
  event: { accent: "#22c55e", bg: "#052e16" },
  news: { accent: "#38bdf8", bg: "#020617" },
};

function isPrivateIpLiteral(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "::1" || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;

  const [a, b] = ipv4.slice(1, 3).map(Number);
  return a === 10
    || a === 127
    || a === 0
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168);
}

function isFetchablePublicUrl(url: URL) {
  return ["http:", "https:"].includes(url.protocol) && !isPrivateIpLiteral(url.hostname);
}

function looksLikeImageUrl(url: string) {
  return /\.(?:jpg|jpeg|png|webp|gif|avif)(?:[?#].*)?$/i.test(url);
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function escapeSvg(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&apos;",
    };
    return entities[char] ?? char;
  });
}

function buildFallback(title: string, kind: string) {
  const palette = FALLBACK_COLORS[kind] ?? FALLBACK_COLORS.concert;
  const safeTitle = escapeSvg(title || "NimbusDaily");
  const safeKind = escapeSvg(kind || "poster");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="900" viewBox="0 0 640 900">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${palette.accent}" stop-opacity=".92"/>
          <stop offset=".48" stop-color="${palette.bg}" stop-opacity=".98"/>
          <stop offset="1" stop-color="#0891b2" stop-opacity=".72"/>
        </linearGradient>
        <radialGradient id="r" cx=".42" cy=".18" r=".62">
          <stop offset="0" stop-color="#ffffff" stop-opacity=".28"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="640" height="900" fill="url(#g)"/>
      <rect width="640" height="900" fill="url(#r)"/>
      <rect x="34" y="34" width="572" height="832" rx="42" fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width="3"/>
      <text x="64" y="118" fill="#ffffff" fill-opacity=".72" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" letter-spacing="5">${safeKind.toUpperCase()}</text>
      <text x="64" y="716" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="900">
        <tspan x="64" dy="0">${safeTitle.slice(0, 18)}</tspan>
        <tspan x="64" dy="66">${safeTitle.slice(18, 36)}</tspan>
        <tspan x="64" dy="66">${safeTitle.slice(36, 54)}</tspan>
      </text>
      <text x="64" y="830" fill="#cffafe" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800">NimbusDaily poster preview</text>
    </svg>
  `;

  return new NextResponse(svg.trim(), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

function toAbsoluteImageUrl(value: string, pageUrl: string) {
  const decoded = decodeHtml(value.trim());
  if (!decoded) return null;
  try {
    return new URL(decoded, pageUrl).toString();
  } catch {
    return null;
  }
}

function extractMetaImage(html: string, pageUrl: string) {
  const patterns = [
    /<meta\s+[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const imageUrl = match?.[1] ? toAbsoluteImageUrl(match[1], pageUrl) : null;
    if (imageUrl) return imageUrl;
  }

  return null;
}

function extractFirstPageImage(html: string, pageUrl: string) {
  const matches = [...html.matchAll(/https?:\/\/[^"'\s<>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>]*)?/gi)]
    .map((match) => decodeHtml(match[0]))
    .filter((url) => !/favicon|touch-icon|apple-touch-icon|sprite|logo/i.test(url))
    .filter((url) => !url.includes("statamic-thailand.festival-thailand.svc.cluster.local"));

  return matches[0] ? toAbsoluteImageUrl(matches[0], pageUrl) : null;
}

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleVariants(query: string) {
  const clean = query.trim();
  const variants = [
    clean,
    clean.replace(/\s+Season\s+\d+.*/i, ""),
    clean.replace(/\s+Part\s+(One|Two|Three|Four|\d+).*/i, ""),
    clean.replace(/:\s*Season\s+\d+.*/i, ""),
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(variants)];
}

function tmdbCandidates(html: string) {
  return [...html.matchAll(/<img\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => /media\.themoviedb\.org\/t\/p\//.test(tag))
    .filter((tag) => !tag.includes("${"))
    .map((tag) => {
      const alt = decodeHtml(tag.match(/alt=["']([^"']*)["']/i)?.[1] ?? "");
      const image = tag.match(/https:\/\/media\.themoviedb\.org\/t\/p\/[^"'\s<>]+/i)?.[0] ?? "";
      return { alt, image: image.replace(/\/t\/p\/[^/]+\//, "/t/p/w500/") };
    })
    .filter((candidate) => candidate.image && !/w\d+_and_h\d+_face\$\{/.test(candidate.image));
}

function candidateScore(alt: string, query: string) {
  const normalizedAlt = normalizeTitle(alt);
  const normalizedQuery = normalizeTitle(query);
  const stopWords = new Set(["the", "and", "season", "part", "episode", "episodes", "movie", "film", "series", "netflix", "live", "action"]);
  if (!normalizedAlt || !normalizedQuery) return 0;
  if (normalizedAlt.includes(normalizedQuery) || normalizedQuery.includes(normalizedAlt)) return 100;
  return normalizedQuery.split(" ").filter((token) => token.length > 2 && !stopWords.has(token) && normalizedAlt.includes(token)).length;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!response.ok) return null;
  return response.text();
}

async function resolveOpenGraphImage(rawUrl: string) {
  let pageUrl: URL;
  try {
    pageUrl = new URL(rawUrl);
  } catch {
    return null;
  }

  if (!isFetchablePublicUrl(pageUrl)) return null;
  if (looksLikeImageUrl(pageUrl.toString())) return pageUrl.toString();

  const html = await fetchHtml(pageUrl.toString());
  if (!html) return null;

  return extractMetaImage(html, pageUrl.toString()) ?? extractFirstPageImage(html, pageUrl.toString());
}

async function resolveTmdbPoster(query: string) {
  let fallback = "";
  const variants = titleVariants(query);
  const originalVariant = variants[0];

  for (const variant of variants) {
    const url = new URL("https://www.themoviedb.org/search");
    url.searchParams.set("query", variant);
    const html = await fetchHtml(url.toString());
    if (!html) continue;

    const candidates = tmdbCandidates(html);
    if (!candidates.length) continue;
    fallback ||= candidates[0].image;

    if (variant !== originalVariant) return candidates[0].image;

    const scored = candidates
      .map((candidate) => ({ ...candidate, score: candidateScore(candidate.alt, variant) }))
      .sort((a, b) => b.score - a.score);

    if (scored[0]?.score > 0) return scored[0].image;
  }

  return fallback || null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sourceUrl = searchParams.get("url");
  const query = searchParams.get("query");
  const title = searchParams.get("title") ?? query ?? "Poster";
  const kind = searchParams.get("kind") ?? "poster";
  const strict = searchParams.get("strict") === "1" || searchParams.get("strict") === "true";

  const imageUrl = sourceUrl ? await resolveOpenGraphImage(sourceUrl) : query ? await resolveTmdbPoster(query) : null;

  if (!imageUrl) {
    if (strict) {
      return NextResponse.json(
        { success: false, error: { code: "REAL_IMAGE_NOT_FOUND", message: "No source image was found for this item." } },
        { status: 404, headers: { "cache-control": "public, max-age=900" } },
      );
    }
    return buildFallback(title, kind);
  }

  return NextResponse.redirect(imageUrl, {
    headers: {
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
