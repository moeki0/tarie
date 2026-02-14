const GYAZO_PAGE_RE = /^https:\/\/gyazo\.com\/[a-f0-9]+$/;

export function toGyazoImageUrl(url: string): string {
  if (GYAZO_PAGE_RE.test(url.trim())) {
    return `${url.trim()}/raw`;
  }
  return url;
}

export function isSafeImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
