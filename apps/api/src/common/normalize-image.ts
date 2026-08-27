export const HERO_FALLBACK = "/brand/assets/hero-visual.jpg";
export const LEGACY_HERO = "/assets/hero-visual.png";

export function normalizeImageUrl(url?: string | null): string {
  if (!url) return HERO_FALLBACK;
  if (url === LEGACY_HERO) return HERO_FALLBACK;
  if (url.startsWith(LEGACY_HERO)) return url.replace(LEGACY_HERO, HERO_FALLBACK);
  if (url.includes("/assets/hero-visual.png")) return url.replace("/assets/hero-visual.png", "/brand/assets/hero-visual.jpg");
  return url;
}

export function normalizePhotoUrls(urls?: string[] | null): string[] {
  if (!urls || urls.length === 0) return [];
  return urls.map((u) => normalizeImageUrl(u));
}
