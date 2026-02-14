export const RATIO_OPTIONS = ["3:4", "2:3", "1:1", "4:3", "16:9", "9:16"];
export const COVER_PATTERNS = [
  "photo-small-center",
  "no-photo-centered",
  "image-only",
  "split-photo-right",
  "fullphoto-tl",
  "fullphoto-tc",
  "fullphoto-tr",
  "fullphoto-cl",
  "fullphoto-cc",
  "fullphoto-cr",
  "fullphoto-bl",
  "fullphoto-bc",
  "fullphoto-br",
];
export const TRANSITION_OPTIONS = ["none", "fade", "slide", "zoom"];
export const FONT_OPTIONS = [
  "serif-jp",
  "sans-jp",
  "playfair",
  "lora",
  "zen-kaku",
  "mplus",
];

function normalizeHexColor(
  value: string | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  return fallback;
}

export function toPickerColor(
  value: string | undefined,
  fallback: string,
): string {
  return normalizeHexColor(value, fallback);
}
