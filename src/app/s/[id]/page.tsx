import { use } from "react";
import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/server/supabase";
import { GalleryViewClient } from "@/app/gallery/[id]/GalleryViewClient";
import { detectLocaleFromHeaders, serverT } from "@/lib/i18n/server";
import { getPhotoBookCoverImage } from "@/lib/photobook";

async function getBookMeta(
  id: string,
  fallbackTitle: string,
): Promise<{ title: string; coverImage?: string; isPrivate: boolean }> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("books")
      .select("title, published_manuscript, visibility")
      .eq("id", id)
      .maybeSingle();
    const title = data?.title || fallbackTitle;
    const isPrivate = data?.visibility === "private" || data?.visibility === "password";
    const coverImage = !isPrivate && data?.published_manuscript
      ? getPhotoBookCoverImage(data.published_manuscript)
      : undefined;
    return { title, coverImage, isPrivate };
  } catch {
    return { title: fallbackTitle, isPrivate: false };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await detectLocaleFromHeaders();
  const { title, coverImage, isPrivate } = await getBookMeta(
    id,
    serverT(locale, "untitled"),
  );
  if (isPrivate) {
    return {
      title: { absolute: "tarie" },
      robots: { index: false, follow: false },
    };
  }
  return {
    title: { absolute: `${title} - tarie` },
    description: title,
    ...(coverImage ? { icons: { icon: coverImage } } : {}),
    openGraph: {
      title: `${title} - tarie`,
      description: title,
      ...(coverImage ? { images: [{ url: coverImage }] } : {}),
    },
  };
}

export default function ShortViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ draft?: string }>;
}) {
  const { id } = use(params);
  const query = use(searchParams);
  const isDraft = "draft" in query;
  return <GalleryViewClient id={id} isDraft={isDraft} />;
}
