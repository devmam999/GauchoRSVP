import { EVENT_CATEGORIES, type EventCategory } from "@/lib/dashboard/types";

const FALLBACK_CATEGORY_RANKING_KEY = "gaucho.preferences.categoryRanking";
const USER_ID_KEY = "gaucho.auth.userId";

function getCategoryRankingKey(): string {
  if (typeof window === "undefined") return FALLBACK_CATEGORY_RANKING_KEY;
  const userId = window.localStorage.getItem(USER_ID_KEY);
  if (userId && userId.trim().length > 0) {
    return `gaucho.user.${userId}.preferences.categoryRanking`;
  }
  return FALLBACK_CATEGORY_RANKING_KEY;
}

function isEventCategory(value: unknown): value is EventCategory {
  return typeof value === "string" && (EVENT_CATEGORIES as readonly string[]).includes(value);
}

export function loadCategoryRanking(): EventCategory[] | null {
  if (typeof window === "undefined") return null;
  const primaryKey = getCategoryRankingKey();
  const raw =
    window.localStorage.getItem(primaryKey) ??
    window.localStorage.getItem(FALLBACK_CATEGORY_RANKING_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const ranking = parsed.filter(isEventCategory);
    return ranking.length > 0 ? ranking : null;
  } catch {
    return null;
  }
}

export function saveCategoryRanking(ranking: EventCategory[]) {
  if (typeof window === "undefined") return;
  const deduped = Array.from(new Set(ranking)).filter(isEventCategory);
  window.localStorage.setItem(getCategoryRankingKey(), JSON.stringify(deduped));
}

export function getCategoryRank(category: EventCategory, ranking: EventCategory[] | null): number {
  if (!ranking || ranking.length === 0) return Number.POSITIVE_INFINITY;
  const idx = ranking.indexOf(category);
  return idx === -1 ? Number.POSITIVE_INFINITY : idx;
}

