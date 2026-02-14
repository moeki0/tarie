import { use } from "react";
import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/server/supabase";
import { GalleryEditClient } from "@/app/gallery/[id]/GalleryEditClient";
import { detectLocaleFromHeaders, serverT } from "@/lib/i18n/server";
import { getPhotoBookCoverImage } from "@/lib/photobook";

async function getBookMeta(
  id: string,
  fallback: string,
): Promise<{ title: string; coverImage?: string }> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("books")
      .select("title, manuscript")
      .eq("id", id)
      .maybeSingle();
    const title = data?.title || fallback;
    const coverImage = data?.manuscript
      ? getPhotoBookCoverImage(data.manuscript)
      : undefined;
    return { title, coverImage };
  } catch {
    return { title: fallback };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await detectLocaleFromHeaders();
  const { title, coverImage } = await getBookMeta(id, serverT(locale, "untitled"));
  return {
    title: `${title} - ${serverT(locale, "metaEditSuffix")}`,
    ...(coverImage ? { icons: { icon: coverImage } } : {}),
  };
}

export default function ShortEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <GalleryEditClient id={id} />;
}
