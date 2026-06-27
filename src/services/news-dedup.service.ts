import type { DailyBriefItem } from "@/types/daily-brief";

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9ก-๙\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string) {
  return new Set(normalizeTitle(value).split(" ").filter((item) => item.length > 2));
}

function jaccardSimilarity(a: string, b: string) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;

  let intersection = 0;
  left.forEach((token) => {
    if (right.has(token)) intersection += 1;
  });

  return intersection / (left.size + right.size - intersection);
}

function samePublishedWindow(a: DailyBriefItem, b: DailyBriefItem) {
  const left = new Date(a.publishedAt).getTime();
  const right = new Date(b.publishedAt).getTime();
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  return Math.abs(left - right) <= 12 * 60 * 60 * 1000;
}

function isLikelyDuplicate(a: DailyBriefItem, b: DailyBriefItem) {
  const sameUrl = a.sourceUrl && b.sourceUrl && a.sourceUrl === b.sourceUrl;
  const sameNormalizedTitle = normalizeTitle(a.titleTh || a.title) === normalizeTitle(b.titleTh || b.title);
  const similarTitle = jaccardSimilarity(a.titleTh || a.title, b.titleTh || b.title) >= 0.72;
  const categoryOverlap = a.category === b.category || a.tags.some((tag) => b.tags.includes(tag));

  return Boolean(sameUrl || sameNormalizedTitle || (similarTitle && categoryOverlap && samePublishedWindow(a, b)));
}

export function dedupeDailyBriefItems(items: DailyBriefItem[]) {
  const merged: DailyBriefItem[] = [];

  items.forEach((item) => {
    const duplicateIndex = merged.findIndex((existing) => isLikelyDuplicate(existing, item));
    if (duplicateIndex === -1) {
      merged.push(item);
      return;
    }

    const existing = merged[duplicateIndex];
    const primary = item.priorityScore > existing.priorityScore ? item : existing;
    const secondary = primary === item ? existing : item;

    merged[duplicateIndex] = {
      ...primary,
      relatedSources: [
        ...primary.relatedSources,
        { name: secondary.sourceName, url: secondary.sourceUrl, publishedAt: secondary.publishedAt },
        ...secondary.relatedSources,
      ].filter((source, index, array) => source.url && array.findIndex((entry) => entry.url === source.url) === index),
      tags: Array.from(new Set([...primary.tags, ...secondary.tags])),
      summaryTh: primary.summaryTh.length >= secondary.summaryTh.length ? primary.summaryTh : secondary.summaryTh,
    };
  });

  return merged.sort((a, b) => b.priorityScore - a.priorityScore || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
