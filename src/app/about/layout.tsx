import type { Metadata } from "next";
import { detectLocaleFromHeaders, serverT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocaleFromHeaders();
  return {
    title: serverT(locale, "metaAboutTitle"),
    description: serverT(locale, "metaDescription"),
  };
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
