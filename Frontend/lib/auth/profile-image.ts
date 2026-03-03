"use client";

const PROFILE_IMAGE_EVENT = "gaucho_profile_image_updated";

function profileImageStorageKey(userId: string) {
  return `gaucho_profile_image_${userId}`;
}

export function loadStoredProfileImage(userId: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(profileImageStorageKey(userId)) ?? undefined;
}

export function saveStoredProfileImage(userId: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(profileImageStorageKey(userId), value);
  window.dispatchEvent(
    new CustomEvent(PROFILE_IMAGE_EVENT, {
      detail: { userId, value },
    })
  );
}

export function subscribeToProfileImageUpdates(
  callback: (payload: { userId: string; value: string }) => void
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event: Event) => {
    const custom = event as CustomEvent<{ userId?: string; value?: string }>;
    if (!custom.detail?.userId || !custom.detail?.value) return;
    callback({ userId: custom.detail.userId, value: custom.detail.value });
  };

  window.addEventListener(PROFILE_IMAGE_EVENT, listener as EventListener);
  return () => {
    window.removeEventListener(PROFILE_IMAGE_EVENT, listener as EventListener);
  };
}
