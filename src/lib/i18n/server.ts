import { headers } from "next/headers";
import { ja, type MessageKey, type Messages } from "./messages/ja";
import { en } from "./messages/en";
import type { Locale } from "./i18n";

const dictionaries: Record<Locale, Messages> = { ja, en };

export async function detectLocaleFromHeaders(): Promise<Locale> {
  const h = await headers();
  const accept = h.get("accept-language") || "";
  if (accept.startsWith("ja")) return "ja";
  const parts = accept.split(",");
  for (const part of parts) {
    const lang = part.split(";")[0].trim().toLowerCase();
    if (lang.startsWith("ja")) return "ja";
    if (lang.startsWith("en")) return "en";
  }
  return "ja";
}

export function serverT(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  let msg = dictionaries[locale][key];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replace(`{${k}}`, String(v));
    }
  }
  return msg;
}
