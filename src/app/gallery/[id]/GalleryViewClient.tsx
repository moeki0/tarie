"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PreviewStack, buildPages } from "./PreviewStack";
import {
  getPreviewIndexFromUrl,
  replacePreviewIndexInUrl,
  useGalleryById,
  usePhotoBook,
  usePreloadImagesWithProgress,
} from "./useGalleryRuntime";
import { useLocale } from "@/lib/i18n";

// ── Title text loading animation ──

function LoadingScreen({ pct }: { pct: number }) {
  return (
    <main className="relative w-screen h-dvh overflow-hidden bg-white flex items-center justify-center">
      <p className="text-base text-stone-300 tabular-nums">{pct}%</p>
    </main>
  );
}

export function GalleryViewClient({ id, isDraft }: { id: string; isDraft?: boolean }) {
  const { t } = useLocale();
  const { gallery, isLoading, accessStatus, refresh } = useGalleryById(id, { draft: isDraft });
  const [previewIndex, setPreviewIndex] = useState(() => getPreviewIndexFromUrl());
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [liveManuscript, setLiveManuscript] = useState<string | null>(null);

  // Listen for real-time draft updates from editor tab
  useEffect(() => {
    if (!isDraft) return;
    const ch = new BroadcastChannel(`tarie-draft-${id}`);
    ch.onmessage = (e) => setLiveManuscript(e.data as string);
    return () => ch.close();
  }, [id, isDraft]);

  const manuscript = liveManuscript ?? gallery?.manuscript ?? "";
  const book = usePhotoBook(manuscript);
  const { loaded, total, ready: imagesReady } = usePreloadImagesWithProgress(book);
  const pageList = buildPages(book);
  const maxPreviewIndex = Math.max(pageList.length - 1, 0);
  const activePreviewIndex = Math.min(previewIndex, maxPreviewIndex);

  useEffect(() => {
    replacePreviewIndexInUrl(activePreviewIndex);
  }, [activePreviewIndex]);

  const allReady = imagesReady && !!gallery;

  if (isLoading && !gallery) {
    return <LoadingScreen pct={0} />;
  }

  if (accessStatus === "password_required" || accessStatus === "wrong_password") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="w-full max-w-xs">
          <p className="text-base text-stone-600 mb-4">{t("enterPassword")}</p>
          {(passwordError || accessStatus === "wrong_password") && (
            <p className="text-base text-red-500 mb-2">{t("wrongPassword")}</p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!password.trim()) return;
              setPasswordError(false);
              void refresh(password);
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-base text-stone-700 placeholder:text-stone-300 focus:outline-none focus:border-stone-400"
              autoFocus
            />
            <button
              type="submit"
              className="mt-3 w-full rounded-full bg-stone-900 px-4 py-2 text-base text-white hover:bg-stone-700 transition-colors"
            >
              {t("submitPassword")}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (!gallery) {
    return (
      <main className="min-h-dvh px-6 py-16 max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-base text-stone-300 hover:text-stone-500 transition-colors"
        >
          &larr; {t("back")}
        </Link>
        <p className="text-stone-300 text-base mt-8">{t("bookNotFound")}</p>
      </main>
    );
  }

  if (!allReady) {
    const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
    return <LoadingScreen pct={pct} />;
  }

  return (
    <main className="relative w-screen h-dvh overflow-hidden bg-white animate-[fade-in_0.15s_ease_both]">
      <section className="w-full h-full">
        <PreviewStack
          book={book}
          activePreviewIndex={activePreviewIndex}
          setPreviewIndex={setPreviewIndex}
          containerClassName="h-full"
        />
      </section>
    </main>
  );
}
