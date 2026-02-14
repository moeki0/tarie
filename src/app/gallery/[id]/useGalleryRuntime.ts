import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Gallery, GetGalleryResult } from "@/lib/gallery";
import { getGallery } from "@/lib/gallery";
import type { PhotoBook } from "@/lib/photobook";
import { parsePhotoBook, createPhotoBook } from "@/lib/photobook";

function getStoredPassword(id: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(`tarie:pw:${id}`);
  } catch {
    return null;
  }
}

function storePassword(id: string, password: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`tarie:pw:${id}`, password);
  } catch { /* ignore */ }
}

function clearStoredPassword(id: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`tarie:pw:${id}`);
  } catch { /* ignore */ }
}

const galleryCache = new Map<string, Gallery | undefined>();
const galleryLoading = new Map<string, boolean>();
const galleryStatus = new Map<string, GetGalleryResult["status"]>();
const galleryListeners = new Map<string, Array<() => void>>();

function emitGalleryChange(id: string) {
  const listeners = galleryListeners.get(id) ?? [];
  for (const listener of listeners) listener();
}

function subscribeGallery(id: string, listener: () => void) {
  const existing = galleryListeners.get(id) ?? [];
  galleryListeners.set(id, [...existing, listener]);
  return () => {
    const current = galleryListeners.get(id) ?? [];
    galleryListeners.set(
      id,
      current.filter((l) => l !== listener),
    );
  };
}

function getGallerySnapshot(id: string) {
  return galleryCache.get(id);
}

function getGalleryLoadingSnapshot(id: string) {
  return galleryLoading.get(id) ?? true;
}

function getGalleryStatusSnapshot(id: string) {
  return galleryStatus.get(id) ?? "ok";
}

async function refreshGalleryStore(cacheKey: string, bookId: string, password: string | undefined, options?: { draft?: boolean }) {
  galleryLoading.set(cacheKey, true);
  emitGalleryChange(cacheKey);
  try {
    const pw = password ?? getStoredPassword(bookId) ?? undefined;
    const result = await getGallery(bookId, pw, options);
    galleryStatus.set(cacheKey, result.status);
    if (result.status === "ok") {
      galleryCache.set(cacheKey, result.gallery);
      if (pw) storePassword(bookId, pw);
    } else {
      galleryCache.set(cacheKey, undefined);
      if (result.status === "wrong_password") {
        clearStoredPassword(bookId);
      }
    }
  } catch {
    galleryCache.set(cacheKey, undefined);
    galleryStatus.set(cacheKey, "not_found");
  }
  galleryLoading.set(cacheKey, false);
  emitGalleryChange(cacheKey);
}

export function useGalleryById(id: string, options?: { draft?: boolean }) {
  const draft = options?.draft;
  const cacheKey = draft ? `${id}:draft` : id;
  const refreshVersionRef = useRef(0);
  const gallery = useSyncExternalStore(
    useCallback((listener: () => void) => subscribeGallery(cacheKey, listener), [cacheKey]),
    useCallback(() => getGallerySnapshot(cacheKey), [cacheKey]),
    () => undefined,
  );
  const isLoading = useSyncExternalStore(
    useCallback((listener: () => void) => subscribeGallery(cacheKey, listener), [cacheKey]),
    useCallback(() => getGalleryLoadingSnapshot(cacheKey), [cacheKey]),
    () => true,
  );
  const accessStatus = useSyncExternalStore(
    useCallback((listener: () => void) => subscribeGallery(cacheKey, listener), [cacheKey]),
    useCallback(() => getGalleryStatusSnapshot(cacheKey), [cacheKey]),
    () => "ok" as const,
  );

  const refresh = useCallback(async (password?: string) => {
    refreshVersionRef.current += 1;
    const currentVersion = refreshVersionRef.current;
    await refreshGalleryStore(cacheKey, id, password, { draft });
    if (currentVersion !== refreshVersionRef.current) {
      return;
    }
  }, [cacheKey, id, draft]);

  useEffect(() => {
    if (galleryCache.has(cacheKey)) return;
    void refreshGalleryStore(cacheKey, id, undefined, { draft });
  }, [cacheKey, id, draft]);

  return { gallery, refresh, isLoading, accessStatus };
}

/** Parse PhotoBook from manuscript string */
export function usePhotoBook(manuscript: string): PhotoBook {
  return useMemo(() => {
    const book = parsePhotoBook(manuscript);
    if (book) return book;
    return createPhotoBook("無題");
  }, [manuscript]);
}

/** Collect all image URLs from a PhotoBook for preloading */
function collectImageUrls(book: PhotoBook): string[] {
  const urls: string[] = [];
  if (book.coverPhoto) urls.push(book.coverPhoto);
  for (const photo of book.photos) {
    if (photo.url) urls.push(photo.url);
  }
  return [...new Set(urls)];
}

export function usePreloadImages(book: PhotoBook) {
  const allImageUrls = useMemo(() => collectImageUrls(book), [book]);
  const preloadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const url of allImageUrls) {
      if (preloadedRef.current.has(url)) continue;
      preloadedRef.current.add(url);
      const img = new Image();
      img.loading = "eager";
      img.decoding = "async";
      img.setAttribute("fetchpriority", "high");
      img.src = url;
      void img.decode?.().catch(() => {});
    }
  }, [allImageUrls]);
}

export function usePreloadImagesWithProgress(book: PhotoBook) {
  const allImageUrls = useMemo(() => collectImageUrls(book), [book]);
  const [loaded, setLoaded] = useState(0);
  const [done, setDone] = useState(false);
  const genRef = useRef(0);
  const everReadyRef = useRef(false);
  const loadedSetRef = useRef<Set<string>>(new Set());

  const total = allImageUrls.length;

  useEffect(() => {
    // Find only URLs not yet loaded
    const newUrls = allImageUrls.filter((url) => !loadedSetRef.current.has(url));

    if (newUrls.length === 0) {
      setDone(true);
      setLoaded(allImageUrls.length);
      return;
    }

    // Only reset progress if we haven't finished the initial load yet
    if (!everReadyRef.current) {
      setLoaded(loadedSetRef.current.size);
      setDone(false);
    }

    const gen = ++genRef.current;
    let count = 0;
    let nextIndex = 0;
    const concurrency = 4;

    const loadNext = () => {
      if (gen !== genRef.current) return;
      if (nextIndex >= newUrls.length) return;
      const url = newUrls[nextIndex++];
      const img = new Image();
      img.src = url;
      const onFinish = () => {
        if (gen !== genRef.current) return;
        loadedSetRef.current.add(url);
        count++;
        setLoaded(loadedSetRef.current.size);
        if (count >= newUrls.length) {
          setDone(true);
          everReadyRef.current = true;
        } else {
          loadNext();
        }
      };
      img.onload = onFinish;
      img.onerror = onFinish;
    };

    for (let i = 0; i < Math.min(concurrency, newUrls.length); i++) {
      loadNext();
    }
  }, [allImageUrls]);

  // Once ready, never go back to not-ready
  const ready = done || everReadyRef.current;

  return { loaded, total, ready };
}

export function getPreviewIndexFromUrl(maxIndex?: number): number {
  if (typeof window === "undefined") return 0;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("p");
  const pageNumber = Number(raw);
  if (!Number.isFinite(pageNumber)) return 0;
  const index = Math.trunc(pageNumber) - 1;
  if (index < 0) return 0;
  if (typeof maxIndex !== "number") return index;
  return Math.min(index, Math.max(maxIndex, 0));
}

export function replacePreviewIndexInUrl(index: number) {
  if (typeof window === "undefined") return;
  const pageNumber = Math.max(1, index + 1);
  const url = new URL(window.location.href);
  if (pageNumber === 1) {
    url.searchParams.delete("p");
  } else {
    url.searchParams.set("p", String(pageNumber));
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}
