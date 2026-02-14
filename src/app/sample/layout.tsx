import type { Metadata } from "next";
import { detectLocaleFromHeaders, serverT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocaleFromHeaders();
  return {
    title: serverT(locale, "metaSampleTitle"),
    description: serverT(locale, "metaSampleDescription"),
  };
}

export default function SampleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
