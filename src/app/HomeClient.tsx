"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiMoreHorizontal } from "react-icons/fi";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { createGallery, deleteGallery } from "@/lib/gallery";
import { useGalleries } from "@/lib/useGalleries";
import { getPhotoBookTitle, getPhotoBookCoverImage } from "@/lib/photobook";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useLocale } from "@/lib/i18n";

const SHIMMER_OFFSETS = [0, -700, -300, -1200, -500, -1000, -200, -800];

export default function HomeClient() {
  const router = useRouter();
  const { galleries, refresh, isLoading } = useGalleries();
  const { t } = useLocale();
  const [userEmail, setUserEmail] = useState<string>("");
  const [authChecked, setAuthChecked] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [bookMenuId, setBookMenuId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    void supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
      setAuthChecked(true);
      void refresh();
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || "");
      setAuthChecked(true);
      void refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  useEffect(() => {
    if (!authChecked) return;
    if (!userEmail) router.replace("/about");
  }, [authChecked, userEmail, router]);

  const handleDelete = useCallback(async (id: string) => {
    setConfirmDeleteId(null);
    setRemovingId(id);
    await new Promise((r) => setTimeout(r, 250));
    await deleteGallery(id);
    setRemovingId(null);
    await refresh();
  }, [refresh]);

  if (!authChecked || !userEmail) {
    return (
      <main className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))" }}>
            {SHIMMER_OFFSETS.map((offset, i) => (
              <div key={i} className="aspect-square skeleton-shimmer" style={{ animationDelay: `${offset}ms` }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const handleCreate = async () => {
    setCreating(true);
    try {
      const created = await createGallery("book");
      await refresh();
      router.push(`/e/${created.id}`);
    } catch {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen">

      <div className="max-w-5xl mx-auto px-4 py-4">
      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))" }}>
          {SHIMMER_OFFSETS.map((offset, i) => (
            <div key={i} className="aspect-square skeleton-shimmer" style={{ animationDelay: `${offset}ms` }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && galleries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
          <p className="text-stone-400 text-base mb-6">{t("noBooksYet")}</p>
          <button
            onClick={() => void handleCreate()}
            className="rounded-full bg-stone-900 px-6 py-3 text-base font-medium text-white hover:bg-stone-700 transition-colors focus-ring"
          >
            {t("createFirstBook")}
          </button>
        </div>
      )}

      {/* Fullbleed grid */}
      {!isLoading && galleries.length > 0 && (
        <div ref={gridRef} className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))" }}>
          {/* New book tile */}
          <button
            onClick={() => void handleCreate()}
            className="group/add aspect-square flex items-center justify-center bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer grid-stagger-in"
          >
            <span className="text-2xl text-stone-300 group-hover/add:text-stone-500 transition-colors">+</span>
          </button>
          {galleries.map((g, i) => {
            const title =
              getPhotoBookTitle(g.manuscript || "") || t("untitled");
            const coverImage = getPhotoBookCoverImage(g.manuscript || "");
            const isMenuOpen = bookMenuId === g.id;
            const isRemoving = removingId === g.id;
            return (
              <div
                key={g.id}
                className={`group relative ${isRemoving ? "item-removing" : "grid-stagger-in"}`}
                style={{ animationDelay: `${(i + 1) * 30}ms` }}
              >
                <Link
                  href={`/e/${g.id}`}
                  className="block focus-ring"
                >
                  <div className="aspect-square overflow-hidden bg-stone-100">
                    {coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverImage}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-stone-300 font-serif text-lg">
                          {title}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Hover overlay — dark with centered title */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-base text-white font-bold px-3 text-center line-clamp-2">{title}</p>
                  </div>
                </Link>
                {/* Three-dot menu */}
                <div className="absolute top-1.5 right-1.5">
                  <DropdownMenu.Root open={isMenuOpen} onOpenChange={(open) => setBookMenuId(open ? g.id : null)}>
                    <DropdownMenu.Trigger asChild>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                      >
                        <FiMoreHorizontal size={12} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="end"
                        sideOffset={4}
                        className="z-50 w-36 rounded-lg bg-white shadow-lg border border-stone-200 overflow-hidden animate-scale-in dropdown-animate origin-[var(--radix-dropdown-menu-content-transform-origin)]"
                      >
                        {g.publishedManuscript != null && (
                          <DropdownMenu.Item asChild>
                            <Link
                              href={`/s/${g.id}`}
                              className="block w-full text-left px-3 py-2 text-base text-stone-700 hover:bg-stone-50 outline-none cursor-default transition-colors"
                            >
                              {t("published")}
                            </Link>
                          </DropdownMenu.Item>
                        )}
                        {g.publishedManuscript != null && g.manuscript !== g.publishedManuscript && (
                          <DropdownMenu.Item asChild>
                            <Link
                              href={`/s/${g.id}?draft`}
                              className="block w-full text-left px-3 py-2 text-base text-stone-700 hover:bg-stone-50 outline-none cursor-default transition-colors"
                            >
                              {t("draft")}
                            </Link>
                          </DropdownMenu.Item>
                        )}
                        <DropdownMenu.Item
                          onSelect={() => {
                            setConfirmDeleteId(g.id);
                          }}
                          className="w-full text-left px-3 py-2 text-base text-red-500 hover:bg-red-50 outline-none cursor-default transition-colors"
                        >
                          {t("delete")}
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>
            );
          })}
        </div>
      )}

      </div>

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full mx-4 animate-scale-in">
            <p className="text-base text-stone-700 mb-4">
              {t("deleteConfirmMessage")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-full px-4 py-2 text-base text-stone-500 hover:text-stone-700 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => void handleDelete(confirmDeleteId)}
                className="rounded-full bg-red-500 px-4 py-2 text-base text-white hover:bg-red-600 transition-colors"
              >
                {t("confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creating overlay */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-fade-in">
          <p className="text-base text-stone-400">{t("creatingBook")}</p>
        </div>
      )}
    </main>
  );
}
