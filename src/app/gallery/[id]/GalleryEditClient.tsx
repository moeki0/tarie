"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { FiMoreHorizontal, FiMoreVertical, FiBold, FiItalic } from "react-icons/fi";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateGalleryContent, uploadImageToSupabase } from "@/lib/gallery";
import { PublishDropdown } from "./PublishDialog";
import type { PhotoBook, PhotoBookConfig, PhotoEntry, PhotoMeta } from "@/lib/photobook";
import { extractPhotoMeta } from "@/lib/exif";
import {
  addPhoto,
  removePhoto,
  reorderPhotos,
  setCaption,
  addTextPage,
  setTextContent,
  setTitle,
  setConfig,
  serializePhotoBook,
  parsePhotoBook,
  createPhotoBook,
} from "@/lib/photobook";
import {
  useGalleryById,
  usePreloadImages,
} from "./useGalleryRuntime";
import { TRANSITION_OPTIONS, FONT_OPTIONS } from "./renderers";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useLocale } from "@/lib/i18n";

function TransitionDemo({ type, active }: { type: string; active: boolean }) {
  const boxClass = active ? "bg-stone-700" : "bg-stone-300";
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      <div
        className={`w-5 h-7 rounded-sm ${boxClass}`}
        style={{
          animation:
            type === "fade" ? "demo-fade 2s ease-in-out infinite" :
            type === "slide" ? "demo-slide 2s ease-in-out infinite" :
            type === "zoom" ? "demo-zoom 2s ease-in-out infinite" :
            "none",
        }}
      />
    </div>
  );
}

/**
 * ProseMirror plugin: when Space is pressed at the start of a text block,
 * insert a non-breaking space (\u00a0) so it isn't collapsed by HTML.
 */
const PreserveLeadingSpace = Extension.create({
  name: "preserveLeadingSpace",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("preserveLeadingSpace"),
        props: {
          handleKeyDown(view, event) {
            if (event.key !== " ") return false;
            const { state } = view;
            const { $from } = state.selection;
            // Check if cursor is at the start of the text block, or all preceding text is only nbsp
            const parentOffset = $from.parentOffset;
            const textBefore = $from.parent.textContent.slice(0, parentOffset);
            if (textBefore.length === 0 || /^\u00a0+$/.test(textBefore)) {
              view.dispatch(state.tr.insertText("\u00a0"));
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});

function textToHtml(text: string): string {
  if (text.startsWith("<")) return text;
  return text.split("\n").map((line) => {
    if (!line) return "<p><br></p>";
    // Preserve leading spaces as &nbsp; so TipTap/browser doesn't collapse them
    const match = line.match(/^( +)/);
    const preserved = match ? "\u00a0".repeat(match[1].length) + line.slice(match[1].length) : line;
    return `<p>${preserved}</p>`;
  }).join("");
}

function TextEditorPanel({
  value,
  onSave,
}: {
  value: string;
  onSave: (text: string) => void;
}) {
  const { t } = useLocale();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        horizontalRule: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        listItem: false,
        bulletList: false,
        orderedList: false,
      }),
      Placeholder.configure({ placeholder: t("textPlaceholder") }),
      PreserveLeadingSpace,
    ],
    content: value ? textToHtml(value) : "",
    editorProps: {
      attributes: {
        class: "w-full text-stone-700 outline-none min-h-[360px] prose prose-stone max-w-none",
        style: "font-size: 16px;",
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.isEmpty ? "" : e.getHTML();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => onSave(html), 600);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (editor && !editor.isDestroyed) {
        const html = editor.isEmpty ? "" : editor.getHTML();
        onSave(html);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pt-2">
      {editor && (
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-stone-100 -mx-3 md:-mx-4 px-3 md:px-4 py-2 flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors text-base font-bold ${
              editor.isActive("heading", { level: 2 }) ? "bg-stone-800 text-white" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
            }`}
          >
            H
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              editor.isActive("bold") ? "bg-stone-800 text-white" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
            }`}
          >
            <FiBold size={18} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              editor.isActive("italic") ? "bg-stone-800 text-white" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
            }`}
          >
            <FiItalic size={18} />
          </button>
        </div>
      )}
      <div className="py-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function SortablePhotoItem({
  photo,
  index,
  isRemoving,
  isSelected,
  selectionActive,
  onCaptionChange,
  onRemove,
  onRemoveAnimated,
  onToggleSelect,
  onEditText,
  onZoom,
}: {
  photo: PhotoEntry;
  index: number;
  isRemoving?: boolean;
  isSelected?: boolean;
  selectionActive?: boolean;
  onCaptionChange: (caption: string) => void;
  onRemove: () => void;
  onRemoveAnimated?: () => void;
  onToggleSelect?: () => void;
  onEditText?: () => void;
  onZoom?: (rect: DOMRect, natW: number, natH: number) => void;
}) {
  const { t } = useLocale();
  const isTextEntry = !photo.url;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(photo.caption ?? "");
  const composingRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [settling, setSettling] = useState(false);
  const [tapped, setTapped] = useState(false);
  const didDragRef = useRef(false);
  const pressTimerRef = useRef<number>(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const style = {
    transform: CSS.Translate.toString(transform),
    ...(isDragging || transform ? { transition } : {}),
  };

  useEffect(() => {
    if (isDragging) {
      didDragRef.current = true;
      setPressing(false);
      setSettling(true);
    } else if (settling) {
      const t = setTimeout(() => setSettling(false), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  // Dismiss tapped state when clicking/tapping outside
  useEffect(() => {
    if (!tapped) return;
    const handler = (e: PointerEvent) => {
      if (itemRef.current && !itemRef.current.contains(e.target as Node)) {
        setTapped(false);
      }
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [tapped]);

  const isTouchDevice = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  const handleTouchStart = useCallback(() => {
    pressTimerRef.current = window.setTimeout(() => setPressing(true), 150);
  }, []);
  const handleTouchEnd = useCallback(() => {
    window.clearTimeout(pressTimerRef.current);
    setPressing(false);
  }, []);

  const firstChar = isTextEntry
    ? (photo.text?.replace(/<[^>]*>/g, "").trim()[0] || "")
    : "";

  return (
    <div
      ref={(node) => { setNodeRef(node); itemRef.current = node; }}
      style={isRemoving ? undefined : style}
      className={`photo-grid-item group/photo relative w-full aspect-square ${
        isRemoving ? "item-removing" :
        "cursor-grab active:cursor-grabbing select-none " + (
          isDragging ? "z-50 opacity-50" :
          pressing ? "scale-95 brightness-90 ring-2 ring-stone-300/50" :
          settling ? "" : "photo-grid-hover"
        )
      }`}
      {...(isRemoving ? {} : attributes)}
      {...(isRemoving ? {} : listeners)}
      onAnimationEnd={isRemoving ? () => onRemoveAnimated?.() : undefined}
      onPointerDown={() => { didDragRef.current = false; }}
      onTouchStart={(e) => {
        handleTouchStart();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (listeners as any)?.onTouchStart?.(e);
      }}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={(e) => {
        if (didDragRef.current || menuOpen) return;
        if (isTextEntry) { onEditText?.(); return; }
        if (isTouchDevice && !tapped) {
          setTapped(true);
          return;
        }
        setTapped(false);
        const el = e.currentTarget as HTMLElement;
        const img = el.querySelector("img");
        const natW = img?.naturalWidth || 1;
        const natH = img?.naturalHeight || 1;
        onZoom?.(el.getBoundingClientRect(), natW, natH);
      }}
    >
      {isTextEntry ? (
        <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
          {firstChar ? (
            <span className="text-3xl font-serif text-stone-300">{firstChar}</span>
          ) : (
            <FiMoreVertical size={20} className="text-stone-300 rotate-90" />
          )}
        </div>
      ) : (
        <>
          <div
            className={`absolute inset-0 ${loaded ? "skeleton-dissolving" : "skeleton-shimmer"}`}
            style={{ animationDelay: loaded ? undefined : `${index * 300}ms`, backgroundColor: `hsl(30, 10%, ${78 + (index % 5) * 3}%)` }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt=""
            onLoad={() => setLoaded(true)}
            className={`w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </>
      )}
      {/* Selection checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected
            ? "bg-blue-500 border-blue-500"
            : selectionActive
              ? "bg-black/30 border-white/80"
              : `bg-black/30 border-white/80 ${tapped ? "opacity-100" : "opacity-0 group-hover/photo:opacity-100"}`
        }`}
      >
        {isSelected && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7L6 10L11 4" />
          </svg>
        )}
      </button>
      {/* Selection dimming */}
      {selectionActive && !isSelected && (
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      )}
      {/* Three-dot menu */}
      <DropdownMenu.Root open={menuOpen} onOpenChange={(open) => { setMenuOpen(open); if (!open) { setEditingCaption(false); setTapped(false); } }}>
        <DropdownMenu.Trigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className={`absolute top-1 right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              isTextEntry
                ? `bg-stone-300/60 hover:bg-stone-300/80 text-stone-600 ${tapped ? "opacity-100" : "opacity-0 group-hover/photo:opacity-100"}`
                : `bg-black/40 hover:bg-black/60 text-white ${tapped ? "opacity-100" : "opacity-0 group-hover/photo:opacity-100"}`
            }`}
          >
            <FiMoreHorizontal size={16} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            onPointerDown={(e) => e.stopPropagation()}
            className="z-50 w-48 rounded-lg bg-white shadow-lg border border-stone-200 overflow-hidden animate-scale-in dropdown-animate origin-[var(--radix-dropdown-menu-content-transform-origin)]"
          >
            {editingCaption ? (
              <div className="p-2" onKeyDown={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={captionDraft}
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  placeholder={t("caption")}
                  autoFocus
                  className="w-full text-base text-stone-700 border border-stone-200 rounded px-2 py-1.5 outline-none focus:border-stone-400"
                  onCompositionStart={() => { composingRef.current = true; }}
                  onCompositionEnd={() => { composingRef.current = false; }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !composingRef.current) {
                      onCaptionChange(captionDraft);
                      setEditingCaption(false);
                      setMenuOpen(false);
                    }
                  }}
                />
                <div className="flex justify-end gap-1 mt-1.5">
                  <button
                    onClick={() => { setEditingCaption(false); setCaptionDraft(photo.caption ?? ""); }}
                    className="text-base text-stone-400 hover:text-stone-600 px-2 py-0.5"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={() => {
                      onCaptionChange(captionDraft);
                      setEditingCaption(false);
                      setMenuOpen(false);
                    }}
                    className="text-base bg-stone-800 text-white rounded px-2 py-0.5 hover:bg-stone-700"
                  >
                    {t("save")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {!isTextEntry && (
                  <DropdownMenu.Item
                    onSelect={(e) => { e.preventDefault(); setCaptionDraft(photo.caption ?? ""); setEditingCaption(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-base text-stone-700 hover:bg-stone-50 outline-none cursor-default transition-colors"
                  >
                    {t("caption")}
                  </DropdownMenu.Item>
                )}
                <DropdownMenu.Item
                  onSelect={() => onRemove()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-base text-red-500 hover:bg-red-50 outline-none cursor-default transition-colors"
                >
                  {t("delete")}
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}


function parseBook(manuscript: string, fallbackTitle: string): PhotoBook {
  return parsePhotoBook(manuscript) ?? createPhotoBook(fallbackTitle);
}

export function GalleryEditClient({ id }: { id: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const { gallery, isLoading, refresh } = useGalleryById(id, { draft: true });

  const [draft, setDraft] = useState<PhotoBook | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<"settings" | null>(null);
  const [editingTextEntryId, setEditingTextEntryId] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState<{ url: string; rect: DOMRect; natW: number; natH: number } | null>(null);
  const [zoomExpanded, setZoomExpanded] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const uploading = uploadProgress !== null;
  const contentRef = useRef<HTMLDivElement>(null);

  const savedBook = useMemo(
    () => parseBook(gallery?.manuscript ?? "", t("untitled")),
    [gallery?.manuscript, t],
  );
  const working = draft ?? savedBook;
  const workingText = serializePhotoBook(working);

  const hasUnpublishedChanges = gallery?.visibility !== "draft"
    && gallery?.publishedManuscript != null
    && workingText !== gallery.publishedManuscript;

  usePreloadImages(working);

  // Broadcast draft to preview tab
  useEffect(() => {
    const ch = new BroadcastChannel(`tarie-draft-${id}`);
    ch.postMessage(workingText);
    return () => ch.close();
  }, [id, workingText]);

  // Mutations
  const update = useCallback(
    (fn: (book: PhotoBook) => PhotoBook) => {
      setDraft((prev) => fn(prev ?? savedBook));
    },
    [savedBook],
  );

  const handleTitleChange = useCallback(
    (newTitle: string) => update((b) => setTitle(b, newTitle)),
    [update],
  );

  const handleAddPhotos = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) return;
      const total = imageFiles.length;
      let done = 0;
      setUploadProgress({ done: 0, total });
      try {
        // Process in chunks of 4 for parallel upload
        const concurrency = 4;
        let nextIndex = 0;
        const results: { index: number; url: string; meta?: PhotoMeta }[] = [];

        await new Promise<void>((resolve, reject) => {
          let active = 0;
          const startNext = () => {
            while (active < concurrency && nextIndex < imageFiles.length) {
              const idx = nextIndex++;
              active++;
              Promise.all([
                uploadImageToSupabase(id, imageFiles[idx]),
                extractPhotoMeta(imageFiles[idx]),
              ])
                .then(([url, meta]) => {
                  results.push({ index: idx, url, meta });
                  done++;
                  setUploadProgress({ done, total });
                  active--;
                  if (done === total) resolve();
                  else startNext();
                })
                .catch(reject);
            }
          };
          startNext();
        });

        // Add photos in original order
        results.sort((a, b) => a.index - b.index);
        for (const { url, meta } of results) {
          update((b) => addPhoto(b, url, meta));
        }
      } finally {
        setUploadProgress(null);
      }
    },
    [id, update],
  );

  const handleRemovePhoto = useCallback(
    (photoId: string) => {
      setRemovingIds((prev) => new Set(prev).add(photoId));
    },
    [],
  );

  const handleRemoveAnimated = useCallback(
    (photoId: string) => {
      update((b) => removePhoto(b, photoId));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    },
    [update],
  );

  const handleToggleSelect = useCallback(
    (photoId: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(photoId)) next.delete(photoId);
        else next.add(photoId);
        return next;
      });
    },
    [],
  );

  const handleBulkDelete = useCallback(() => {
    for (const photoId of selectedIds) {
      setRemovingIds((prev) => new Set(prev).add(photoId));
    }
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleCaptionChange = useCallback(
    (photoId: string, caption: string) => update((b) => setCaption(b, photoId, caption)),
    [update],
  );

  const handleAddTextPage = useCallback(
    () => update((b) => addTextPage(b, "")),
    [update],
  );

  const handleTextContentChange = useCallback(
    (entryId: string, text: string) => update((b) => setTextContent(b, entryId, text)),
    [update],
  );

  const handleConfigChange = useCallback(
    (partial: Partial<PhotoBookConfig>) => update((b) => setConfig(b, partial)),
    [update],
  );

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const fromIndex = working.photos.findIndex((p) => p.id === active.id);
      const toIndex = working.photos.findIndex((p) => p.id === over.id);
      if (fromIndex < 0 || toIndex < 0) return;
      update((b) => reorderPhotos(b, fromIndex, toIndex));
    },
    [working.photos, update],
  );

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auth check
  useEffect(() => {
    const supabase = getBrowserSupabase();
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/about");
    });
  }, [router]);

  // Auto-save debounced
  useEffect(() => {
    if (!gallery) return;
    if (draft === null) return;
    const serialized = serializePhotoBook(draft);
    if (serialized === gallery.manuscript) return;
    const timer = window.setTimeout(() => {
      void updateGalleryContent(id, { manuscript: serialized, title: draft.title });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft, gallery, id]);


  if (isLoading && !gallery) {
    return (
      <main className="mx-auto w-full min-h-dvh bg-white">
        <div className="shrink-0 px-3 py-2 md:px-4">
          <div className="w-6 h-6 rounded skeleton-shimmer" />
        </div>
        <div className="flex-1 max-w-5xl mx-auto w-full px-4">
          <div className="flex items-center gap-2 py-2">
            <div className="flex-1 h-6 rounded skeleton-shimmer" />
            <div className="flex gap-1.5">
              <div className="w-7 h-7 rounded-full skeleton-shimmer" />
              <div className="w-16 h-7 rounded-full skeleton-shimmer" />
            </div>
          </div>
          <div className="grid gap-0.5 py-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(7rem, 1fr))" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full aspect-square skeleton-shimmer" style={{ animationDuration: `${1.5 + i * 0.3}s` }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!gallery) {
    return (
      <main className="min-h-screen px-6 py-16 max-w-4xl mx-auto">
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

  return (
    <main className="relative mx-auto w-full min-h-dvh bg-white">
      <div ref={contentRef}>
        <div className="max-w-5xl mx-auto w-full px-4">
          {/* Title row + menu + publish */}
          <div className={`flex items-center gap-2 pt-4 pb-4 ${selectedIds.size > 0 ? "sticky top-0 z-20 bg-white" : ""}`}>
            {selectedIds.size > 0 ? (
              <>
                <span className="flex-1 text-base text-stone-600">
                  {t("deskSelectCount").replace("{n}", String(selectedIds.size))}
                </span>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-base text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="rounded-full bg-red-500 px-4 py-2 text-base text-white hover:bg-red-600 transition-colors"
                >
                  {t("delete")}
                </button>
              </>
            ) : panel === "settings" || editingTextEntryId ? (
              <button
                onClick={() => { setPanel(null); setEditingTextEntryId(null); }}
                className="flex items-center gap-1 text-stone-400 hover:text-stone-700 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 3L5 8L10 13" />
                </svg>
                <span className="text-base">{panel === "settings" ? t("settings") : t("text")}</span>
              </button>
            ) : (
              <input
                type="text"
                value={working.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={t("untitled")}
                className="flex-1 min-w-0 text-lg font-bold text-stone-800 bg-transparent border-none outline-none placeholder:text-stone-300"
              />
            )}

            {panel !== "settings" && !editingTextEntryId && selectedIds.size === 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Three-dot menu */}
                <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
                  <DropdownMenu.Trigger asChild>
                    <button
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                    >
                      <FiMoreVertical size={18} aria-hidden />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={4}
                      className="z-50 w-44 rounded-lg bg-white shadow-lg border border-stone-200 overflow-hidden animate-scale-in dropdown-animate origin-[var(--radix-dropdown-menu-content-transform-origin)]"
                    >
                      <DropdownMenu.Item
                        onSelect={() => setPanel("settings")}
                        className="w-full text-left px-3 py-2.5 text-base text-stone-700 hover:bg-stone-50 outline-none cursor-default transition-colors"
                      >
                        {t("settings")}
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onSelect={() => window.open(`/s/${id}?draft=1`, "_blank")}
                        className="w-full text-left px-3 py-2.5 text-base text-stone-700 hover:bg-stone-50 outline-none cursor-default transition-colors"
                      >
                        {t("preview")}
                      </DropdownMenu.Item>
                      {gallery.visibility !== "draft" && (
                        <DropdownMenu.Item asChild>
                          <Link
                            href={`/s/${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-left px-3 py-2.5 text-base text-stone-700 hover:bg-stone-50 outline-none cursor-default transition-colors"
                          >
                            {t("viewPublished")}
                          </Link>
                        </DropdownMenu.Item>
                      )}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>

                {/* Publish dropdown */}
                <PublishDropdown
                  bookId={id}
                  currentVisibility={gallery.visibility ?? "draft"}
                  draft={workingText}
                  publishedManuscript={gallery.publishedManuscript}
                  hasUnpublishedChanges={hasUnpublishedChanges}
                  onPublished={() => void refresh()}
                />
              </div>
            )}
          </div>

          {editingTextEntryId ? (
            <TextEditorPanel
              value={working.photos.find((p) => p.id === editingTextEntryId)?.text ?? ""}
              onSave={(text: string) => handleTextContentChange(editingTextEntryId, text)}
            />
          ) : panel === "settings" ? (
          <div className="py-4 space-y-6">
              {/* Transition */}
              <div>
                <label className="block text-base text-stone-500 mb-2">{t("pageTransition")}</label>
                <div className="grid grid-cols-4 gap-2">
                  {TRANSITION_OPTIONS.map((opt) => {
                    const selected = (working.config?.transition || "none") === opt;
                    const labels: Record<string, string> = { none: t("transitionNone"), fade: t("transitionFade"), slide: t("transitionSlide"), zoom: t("transitionZoom") };
                    return (
                      <button
                        key={opt}
                        onClick={() => handleConfigChange({ transition: opt })}
                        className={`group relative rounded-xl p-2.5 border-2 transition-all duration-200 ${
                          selected
                            ? "border-stone-800 bg-stone-50 shadow-sm"
                            : "border-stone-100 bg-white hover:border-stone-300"
                        }`}
                      >
                        <div className="w-full aspect-square rounded-lg bg-stone-100 mb-1.5 flex items-center justify-center overflow-hidden">
                          <TransitionDemo type={opt} active={selected} />
                        </div>
                        <p className={`text-base text-center ${selected ? "text-stone-800 font-medium" : "text-stone-400"}`}>
                          {labels[opt] || opt}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font */}
              <div>
                <label className="block text-base text-stone-500 mb-2">{t("font")}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FONT_OPTIONS.map((opt) => {
                    const selected = (working.config?.fontFamily || "serif-jp") === opt;
                    const fontVar: Record<string, string> = {
                      "serif-jp": "var(--font-noto-serif-jp)",
                      "sans-jp": "var(--font-noto-sans-jp)",
                      "playfair": "var(--font-playfair-display)",
                      "lora": "var(--font-lora)",
                      "zen-kaku": "var(--font-zen-kaku)",
                      "mplus": "var(--font-mplus-1p)",
                    };
                    return (
                      <button
                        key={opt}
                        onClick={() => handleConfigChange({ fontFamily: opt })}
                        className={`rounded-xl p-3 border-2 transition-all duration-200 text-left ${
                          selected
                            ? "border-stone-800 bg-stone-50 shadow-sm"
                            : "border-stone-100 bg-white hover:border-stone-300"
                        }`}
                      >
                        <p
                          className="text-lg leading-tight truncate"
                          style={{ fontFamily: fontVar[opt] || "inherit" }}
                        >
                          {t("fontPreview")}
                        </p>
                        <p className={`text-base mt-1 ${selected ? "text-stone-600" : "text-stone-300"}`}>
                          {opt}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Background */}
              <div>
                <label className="block text-base text-stone-500 mb-2">{t("background")}</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleConfigChange({ coverColor: undefined })}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <span className={`w-10 h-10 rounded-full border-2 bg-white transition-all duration-200 ${
                      !working.config?.coverColor || working.config.coverColor !== "#000000"
                        ? "border-stone-800 ring-2 ring-stone-800/20 scale-110"
                        : "border-stone-200 group-hover:border-stone-400"
                    }`} />
                    <span className="text-base text-stone-400">{t("backgroundWhite")}</span>
                  </button>
                  <button
                    onClick={() => handleConfigChange({ coverColor: "#000000" })}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <span className={`w-10 h-10 rounded-full border-2 bg-stone-900 transition-all duration-200 ${
                      working.config?.coverColor === "#000000"
                        ? "border-stone-800 ring-2 ring-stone-800/20 scale-110"
                        : "border-stone-300 group-hover:border-stone-500"
                    }`} />
                    <span className="text-base text-stone-400">{t("backgroundBlack")}</span>
                  </button>
                </div>
              </div>

              {/* Layout & Writing mode */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-base text-stone-500 mb-2">{t("layout")}</label>
                  <div className="flex gap-2">
                    {(["double", "single"] as const).map((opt) => {
                      const selected = (working.config?.layout || "double") === opt;
                      const labels = { single: t("layoutSingle"), double: t("layoutDouble") };
                      return (
                        <button
                          key={opt}
                          onClick={() => handleConfigChange({ layout: opt })}
                          className={`flex-1 rounded-lg p-2 border transition-all duration-200 ${
                            selected
                              ? "border-stone-800 bg-stone-50"
                              : "border-stone-200 hover:border-stone-400"
                          }`}
                        >
                          <div className={`w-full aspect-square rounded mb-1.5 flex items-center justify-center ${
                            selected ? "bg-stone-800" : "bg-stone-100"
                          }`}>
                            {opt === "single" ? (
                              <div className={`w-3 h-4 rounded-sm ${selected ? "bg-white" : "bg-stone-300"}`} />
                            ) : (
                              <div className="flex gap-0.5">
                                <div className={`w-2.5 h-3.5 rounded-sm ${selected ? "bg-white" : "bg-stone-300"}`} />
                                <div className={`w-2.5 h-3.5 rounded-sm ${selected ? "bg-white" : "bg-stone-300"}`} />
                              </div>
                            )}
                          </div>
                          <p className={`text-sm text-center ${selected ? "text-stone-800 font-medium" : "text-stone-400"}`}>
                            {labels[opt]}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-base text-stone-500 mb-2">{t("writingDirection")}</label>
                  <div className="flex gap-2">
                    {(["horizontal", "vertical"] as const).map((opt) => {
                      const selected = (working.config?.writingMode || "horizontal") === opt;
                      const labels = { horizontal: t("writingHorizontal"), vertical: t("writingVertical") };
                      return (
                        <button
                          key={opt}
                          onClick={() => handleConfigChange({ writingMode: opt })}
                          className={`flex-1 rounded-lg p-2 border transition-all duration-200 ${
                            selected
                              ? "border-stone-800 bg-stone-50"
                              : "border-stone-200 hover:border-stone-400"
                          }`}
                        >
                          <div className={`w-full aspect-square rounded mb-1.5 flex items-center justify-center ${
                            selected ? "bg-stone-800" : "bg-stone-100"
                          }`}>
                            {opt === "horizontal" ? (
                              <div className="flex flex-col gap-0.5 items-center">
                                <div className={`w-4 h-0.5 rounded ${selected ? "bg-white" : "bg-stone-300"}`} />
                                <div className={`w-3 h-0.5 rounded ${selected ? "bg-white/60" : "bg-stone-200"}`} />
                                <div className={`w-4 h-0.5 rounded ${selected ? "bg-white" : "bg-stone-300"}`} />
                              </div>
                            ) : (
                              <div className="flex gap-1 items-center">
                                <div className={`w-0.5 h-4 rounded ${selected ? "bg-white" : "bg-stone-300"}`} />
                                <div className={`w-0.5 h-3 rounded ${selected ? "bg-white/60" : "bg-stone-200"}`} />
                                <div className={`w-0.5 h-4 rounded ${selected ? "bg-white" : "bg-stone-300"}`} />
                              </div>
                            )}
                          </div>
                          <p className={`text-sm text-center ${selected ? "text-stone-800 font-medium" : "text-stone-400"}`}>
                            {labels[opt]}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Max Width */}
              <div>
                <label className="block text-base text-stone-500 mb-2">{t("maxWidth")}</label>
                <div className="rounded-xl bg-stone-50 overflow-hidden py-4 px-3">
                  <div className="relative w-full flex items-center justify-center" style={{ height: 112 }}>
                    <button
                      onClick={() => handleConfigChange({ maxWidth: 0 })}
                      className={`absolute border rounded-lg transition-colors ${
                        (working.config?.maxWidth ?? 0) === 0 ? "border-stone-800 bg-stone-800/8" : "border-stone-300 hover:bg-stone-100/50"
                      }`}
                      style={{ width: "100%", height: "100%", zIndex: 0 }}
                    >
                      <span className={`absolute top-1.5 left-2 text-base ${
                        (working.config?.maxWidth ?? 0) === 0 ? "text-stone-700 font-medium" : "text-stone-400"
                      }`}>
                        {t("maxWidthNone")}
                      </span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleConfigChange({ maxWidth: 1200 }); }}
                      className={`absolute border rounded-lg transition-colors ${
                        (working.config?.maxWidth ?? 0) === 1200 ? "border-stone-800 bg-stone-800/8" : "border-stone-300 hover:bg-stone-100/50"
                      }`}
                      style={{ width: "72%", height: "72%", zIndex: 1 }}
                    >
                      <span className={`absolute top-1 left-1.5 text-base ${
                        (working.config?.maxWidth ?? 0) === 1200 ? "text-stone-700 font-medium" : "text-stone-400"
                      }`}>
                        {t("maxWidthWide")}
                      </span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleConfigChange({ maxWidth: 700 }); }}
                      className={`absolute border rounded-lg transition-colors ${
                        (working.config?.maxWidth ?? 0) === 700 ? "border-stone-800 bg-stone-800/8" : "border-stone-300 hover:bg-stone-100/50"
                      }`}
                      style={{ width: "44%", height: "44%", zIndex: 2 }}
                    >
                      <span className={`absolute top-1 left-1.5 text-base ${
                        (working.config?.maxWidth ?? 0) === 700 ? "text-stone-700 font-medium" : "text-stone-400"
                      }`}>
                        {t("maxWidthNarrow")}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  {([
                    { key: "showDate" as const, label: t("showDate") },
                    { key: "showLocation" as const, label: t("showLocation") },
                  ]).map(({ key, label }) => {
                    const active = working.config?.[key] ?? false;
                    return (
                      <button
                        key={key}
                        onClick={() => handleConfigChange({ [key]: !active })}
                        className={`flex-1 rounded-lg px-3 py-2.5 border transition-all duration-200 text-sm ${
                          active
                            ? "border-stone-800 bg-stone-50 text-stone-800 font-medium"
                            : "border-stone-200 text-stone-400 hover:border-stone-400"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {(working.config?.showDate ?? false) && (
                  <div>
                    <label className="block text-base text-stone-500 mb-2">{t("dateFormat")}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(["iso", "dots", "en", "ja", "short"] as const).map((fmt) => {
                        const selected = (working.config?.dateFormat || "iso") === fmt;
                        const labels: Record<string, string> = {
                          iso: t("dateFormatIso"),
                          dots: t("dateFormatDots"),
                          en: t("dateFormatEn"),
                          ja: t("dateFormatJa"),
                          short: t("dateFormatShort"),
                        };
                        return (
                          <button
                            key={fmt}
                            onClick={() => handleConfigChange({ dateFormat: fmt })}
                            className={`rounded-lg px-3 py-1.5 text-sm border transition-all duration-200 ${
                              selected
                                ? "border-stone-800 bg-stone-800 text-white"
                                : "border-stone-200 text-stone-500 hover:border-stone-400"
                            }`}
                          >
                            {labels[fmt]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="h-60" />
          </div>
          ) : (
          /* Photo grid */
          <div className="py-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={working.photos.map((p) => p.id)} strategy={rectSortingStrategy}>
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(7rem, 1fr))" }}>
                {working.photos.map((photo, index) => (
                  <SortablePhotoItem
                    key={photo.id}
                    photo={photo}
                    index={index}
                    isRemoving={removingIds.has(photo.id)}
                    isSelected={selectedIds.has(photo.id)}
                    selectionActive={selectedIds.size > 0}
                    onCaptionChange={(caption) => handleCaptionChange(photo.id, caption)}
                    onRemove={() => handleRemovePhoto(photo.id)}
                    onRemoveAnimated={() => handleRemoveAnimated(photo.id)}
                    onToggleSelect={() => handleToggleSelect(photo.id)}
                    onEditText={() => setEditingTextEntryId(photo.id)}
                    onZoom={(rect, natW, natH) => {
                      if (!photo.url) return;
                      setZoom({ url: photo.url, rect, natW, natH });
                      requestAnimationFrame(() => {
                        setTimeout(() => setZoomExpanded(true), 60);
                      });
                    }}
                  />
                ))}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      e.target.value = "";
                      void handleAddPhotos(files);
                    }}
                  />
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        disabled={uploading}
                        className="w-full aspect-square border-2 border-dashed border-stone-200 hover:border-stone-400 text-stone-400 hover:text-stone-600 text-base transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
                      >
                        <span className={uploading ? "text-base" : "text-3xl font-light"}>
                          {uploading && uploadProgress ? `${uploadProgress.done}/${uploadProgress.total}` : "+"}
                        </span>
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        sideOffset={4}
                        className="z-50 w-40 rounded-lg bg-white shadow-lg border border-stone-200 overflow-hidden animate-scale-in dropdown-animate origin-[var(--radix-dropdown-menu-content-transform-origin)]"
                      >
                        <DropdownMenu.Item
                          onSelect={() => fileInputRef.current?.click()}
                          className="w-full text-left px-3 py-2.5 text-base text-stone-700 hover:bg-stone-50 outline-none cursor-default transition-colors"
                        >
                          {t("addPhoto")}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={handleAddTextPage}
                          className="w-full text-left px-3 py-2.5 text-base text-stone-700 hover:bg-stone-50 outline-none cursor-default transition-colors"
                        >
                          {t("addTextPage")}
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>
              </SortableContext>
            </DndContext>
          </div>
          )}
        </div>
      </div>

      {/* Photo zoom lightbox */}
      {zoom && (() => {
        const vw = typeof window !== "undefined" ? window.innerWidth : 0;
        const vh = typeof window !== "undefined" ? window.innerHeight : 0;
        const border = 3;
        const pad = 4 + border;
        const maxW = vw - pad * 2;
        const maxH = vh - pad * 2;
        const aspect = zoom.natW / zoom.natH;
        let tw = maxW;
        let th = tw / aspect;
        if (th > maxH) { th = maxH; tw = th * aspect; }

        const from = zoom.rect;
        const to = {
          top: (vh - th) / 2 - border,
          left: (vw - tw) / 2 - border,
          width: tw + border * 2,
          height: th + border * 2,
        };

        const s = zoomExpanded ? to : { top: from.top, left: from.left, width: from.width, height: from.height };
        const easing = "cubic-bezier(0.16, 1, 0.3, 1)";
        const dur = "0.3s";

        return (
          <div
            className="fixed inset-0 z-50 cursor-pointer"
            style={{
              backdropFilter: zoomExpanded ? "blur(20px)" : "blur(0px)",
              WebkitBackdropFilter: zoomExpanded ? "blur(20px)" : "blur(0px)",
              transition: `backdrop-filter 0.3s ${easing}, -webkit-backdrop-filter 0.3s ${easing}`,
            }}
            onClick={() => {
              setZoomExpanded(false);
              setTimeout(() => setZoom(null), 300);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoom.url}
              alt=""
              style={{
                position: "fixed",
                top: s.top,
                left: s.left,
                width: s.width,
                height: s.height,
                objectFit: "cover",
                borderWidth: zoomExpanded ? border : 0,
                borderStyle: "solid",
                borderColor: "white",
                borderRadius: 0,
                boxShadow: zoomExpanded ? "0 12px 48px rgba(0,0,0,0.12)" : "none",
                transition: `top ${dur} ${easing}, left ${dur} ${easing}, width ${dur} ${easing}, height ${dur} ${easing}, border-width ${dur} ${easing}, box-shadow ${dur} ${easing}`,
                willChange: "top, left, width, height",
              }}
            />
          </div>
        );
      })()}
    </main>
  );
}
