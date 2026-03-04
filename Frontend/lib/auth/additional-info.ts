"use client";

const FALLBACK_KEY = "gaucho.additional_info";

export interface AdditionalInfo {
  major?: string;
  year?: string;
}

function keyForUser(userId?: string | null) {
  if (!userId || userId.trim().length === 0) return FALLBACK_KEY;
  return `gaucho.user.${userId}.additional_info`;
}

export function saveAdditionalInfo(userId: string | null | undefined, info: AdditionalInfo) {
  if (typeof window === "undefined") return;
  const payload: AdditionalInfo = {
    major: info.major?.trim() ?? "",
    year: info.year?.trim() ?? "",
  };
  window.localStorage.setItem(keyForUser(userId), JSON.stringify(payload));
}

export function loadAdditionalInfo(userId: string | null | undefined): AdditionalInfo | null {
  if (typeof window === "undefined") return null;
  const raw =
    window.localStorage.getItem(keyForUser(userId)) ??
    window.localStorage.getItem(FALLBACK_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AdditionalInfo;
    return {
      major: typeof parsed.major === "string" ? parsed.major : "",
      year: typeof parsed.year === "string" ? parsed.year : "",
    };
  } catch {
    return null;
  }
}
