import { useCallback, useEffect, useRef, useState } from "react";
import type { PhotoBook, PhotoEntry } from "@/lib/photobook";
import { useLocale } from "@/lib/i18n";

type Props = {
  book: PhotoBook;
  activePreviewIndex: number;
  setPreviewIndex: (next: number) => void;
  containerClassName?: string;
  isEditable?: boolean;
};


function getFontFamily(fontFamily: string | undefined): string {
  switch ((fontFamily || "serif-jp").toLowerCase()) {
    case "sans-jp":
      return "var(--font-noto-sans-jp)";
    case "playfair":
      return "var(--font-playfair-display)";
    case "lora":
      return "var(--font-lora)";
    case "zen-kaku":
      return "var(--font-zen-kaku)";
    case "mplus":
      return "var(--font-mplus-1p)";
    case "serif-jp":
    default:
      return "var(--font-noto-serif-jp)";
  }
}


function SinglePhotoPage({
  photo,
  bgColor,
  textColor,
  maxWidth,
  showDate,
  showLocation,
  dateFormat,
}: {
  photo: PhotoEntry;
  bgColor: string;
  textColor: string;
  maxWidth?: number;
  showDate?: boolean;
  showLocation?: boolean;
  dateFormat?: string;
}) {
  const metaParts = formatMetaParts(photo, showDate, showLocation, dateFormat);
  const captionParts = [photo.caption, ...metaParts].filter(Boolean);
  const captionText = captionParts.join(", ");
  return (
    <div
      className="w-full min-h-full flex flex-col items-center justify-center px-2 pt-1 pb-16"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={photo.caption || ""}
        className="object-contain max-h-[calc(100dvh-120px)]"
        style={{ maxWidth: maxWidth && maxWidth > 0 ? `min(${maxWidth}px, 100%)` : "100%" }}
        loading="eager"
      />
      {captionText && (
        <p
          className="mt-2 text-base leading-tight w-full px-2"
          style={{
            textAlign: "right",
            color: textColor,
            opacity: 0.45,
            maxWidth: maxWidth && maxWidth > 0 ? `${maxWidth}px` : "32rem",
          }}
        >
          {captionText}
        </p>
      )}
    </div>
  );
}

/** Default is side-by-side (grid-cols-2). Stack vertically only if both fit within viewport height. */
function useShouldStack(photos: PhotoEntry[], cols: number): boolean {
  const [shouldStack, setShouldStack] = useState(false);

  useEffect(() => {
    if (cols !== 2 || typeof window === "undefined") {
      setShouldStack(false);
      return;
    }

    const check = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Calculate total height if stacked vertically (full width)
      const fullWidth = vw - 16; // px-2 padding
      let totalHeight = 0;
      for (const p of photos) {
        if (!p.url) continue;
        const img = new Image();
        img.src = p.url;
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          totalHeight += (img.naturalHeight / img.naturalWidth) * fullWidth;
        }
      }
      totalHeight += 8; // gap
      // Stack only if total height fits within viewport
      setShouldStack(totalHeight <= vh * 0.85);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [photos, cols]);

  return shouldStack;
}

function formatDate(iso: string, format?: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const [, y, mm, dd] = m;
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  switch (format) {
    case "dots": return `${y}.${mm}.${dd}`;
    case "en": return `${monthNames[parseInt(mm, 10) - 1]} ${parseInt(dd, 10)}, ${y}`;
    case "ja": return `${y}年${parseInt(mm, 10)}月${parseInt(dd, 10)}日`;
    case "short": return `${parseInt(mm, 10)}/${parseInt(dd, 10)}`;
    default: return iso; // "iso" or undefined → "2024-03-15"
  }
}

function formatMetaParts(
  photo: PhotoEntry,
  showDate?: boolean,
  showLocation?: boolean,
  dateFormat?: string,
): string[] {
  const parts: string[] = [];
  if (showDate && photo.meta?.date) parts.push(formatDate(photo.meta.date, dateFormat));
  if (showLocation && photo.meta?.locationName) {
    parts.push(photo.meta.locationName);
  } else if (showLocation && photo.meta?.lat != null && photo.meta?.lng != null) {
    parts.push(`${photo.meta.lat.toFixed(4)}, ${photo.meta.lng.toFixed(4)}`);
  }
  return parts;
}

function GroupPhotoPage({
  photos,
  bgColor,
  textColor,
  maxWidth,
  showDate,
  showLocation,
  dateFormat,
}: {
  photos: PhotoEntry[];
  bgColor: string;
  textColor: string;
  maxWidth?: number;
  showDate?: boolean;
  showLocation?: boolean;
  dateFormat?: string;
}) {
  const count = photos.length;
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;
  const shouldStack = useShouldStack(photos, cols);

  const colsClass =
    cols === 2
      ? shouldStack ? "grid-cols-1" : "grid-cols-2"
      : cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "";

  return (
    <div
      className="w-full min-h-full flex flex-col items-center justify-center pb-16"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div
        className={`grid gap-2 px-2 pt-1 mx-auto justify-center ${colsClass}`}
        style={{
          maxWidth: maxWidth && maxWidth > 0 ? `${maxWidth}px` : undefined,
        }}
      >
        {photos.map((photo, idx) => {
          const align = cols >= 2 && !shouldStack
            ? idx === 0 ? "text-left" : "text-right"
            : "text-right";
          const metaParts = formatMetaParts(photo, showDate, showLocation, dateFormat);
          const captionParts = [photo.caption, ...metaParts].filter(Boolean);
          const captionText = captionParts.join(", ");
          return (
            <div key={photo.id} className="relative flex flex-col min-h-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption || ""}
                className="w-full h-full object-contain max-h-[80vh]"
                loading="eager"
              />
              {captionText && (
                <p className={`${align} text-base leading-tight mt-1.5 opacity-60`}>
                  {captionText}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TextPage({
  text,
  bgColor,
  textColor,
  writingMode,
}: {
  text: string;
  bgColor: string;
  textColor: string;
  writingMode?: "horizontal" | "vertical";
}) {
  const isHtml = text.startsWith("<");
  const baseCls = "leading-7";
  const cls = isHtml
    ? `prose ${baseCls} mx-auto`
    : `whitespace-pre-wrap ${baseCls} mx-auto`;
  const fontSize = { fontSize: "16px" };
  const isVertical = writingMode === "vertical";

  const innerCls = isVertical
    ? `${cls} h-full vertical-prose`
    : cls;

  return (
    <div
      className={`w-full min-h-dvh flex items-center justify-center ${isVertical ? "px-4 py-6" : "p-6"}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div
        className={isVertical ? "h-[80dvh] overflow-auto mx-auto no-scrollbar" : "max-h-[80dvh] overflow-auto"}
        style={isVertical ? {
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          width: "fit-content",
          maxWidth: "100%",
          maskImage: "linear-gradient(to right, transparent, black 2rem, black calc(100% - 2rem), transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 2rem, black calc(100% - 2rem), transparent)",
        } : undefined}
      >
        {isHtml ? (
          <div
            className={innerCls}
            style={{
              ...fontSize,
              color: textColor,
              "--tw-prose-body": textColor,
              "--tw-prose-headings": textColor,
              "--tw-prose-bold": textColor,
              "--tw-prose-counters": textColor,
              "--tw-prose-bullets": textColor,
              "--tw-prose-links": textColor,
              ...(isVertical ? { whiteSpace: "pre-wrap", paddingBlockStart: "3rem" } : undefined),
            } as React.CSSProperties}
            dangerouslySetInnerHTML={{ __html: isVertical ? text.replace(/<p><br\s*\/?>/g, "<p>") : text }}
          />
        ) : (
          <p
            className={innerCls}
            style={{ ...fontSize, color: textColor, ...(isVertical ? { paddingBlockStart: "3rem" } : undefined) }}
          >{text}</p>
        )}
      </div>
    </div>
  );
}

/** A page is either a cover, a text page, or a group of 1+ photos */
export type PageDef = {
  key: string;
  type: "photo" | "group" | "text";
  /** Indices into book.photos for the entries on this page */
  photoIndices: number[];
};

/** Build the page list from a PhotoBook using the global layout setting */
export function buildPages(book: PhotoBook): PageDef[] {
  const pages: PageDef[] = [];

  const layout = book.config?.layout ?? "double";
  // Separate text entries and photo entries with their original indices
  const photoEntries: number[] = [];
  for (let i = 0; i < book.photos.length; i++) {
    const entry = book.photos[i];
    if (entry.text && !entry.url) {
      // Flush any pending photos before inserting text page
      if (layout === "double") {
        for (let j = 0; j < photoEntries.length; j += 2) {
          const indices = photoEntries.slice(j, j + 2);
          pages.push({
            key: `photo-${indices[0]}`,
            type: indices.length === 2 ? "group" : "photo",
            photoIndices: indices,
          });
        }
        photoEntries.length = 0;
      }
      pages.push({ key: `text-${i}`, type: "text", photoIndices: [i] });
    } else {
      if (layout === "double") {
        photoEntries.push(i);
      } else {
        pages.push({ key: `photo-${i}`, type: "photo", photoIndices: [i] });
      }
    }
  }

  // Flush remaining photos for double layout
  if (layout === "double") {
    for (let j = 0; j < photoEntries.length; j += 2) {
      const indices = photoEntries.slice(j, j + 2);
      pages.push({
        key: `photo-${indices[0]}`,
        type: indices.length === 2 ? "group" : "photo",
        photoIndices: indices,
      });
    }
  }

  return pages;
}

export function PreviewStack({
  book,
  activePreviewIndex,
  setPreviewIndex,
  containerClassName,
  isEditable,
}: Props) {
  const isDark = book.config?.coverColor === "#000000";
  const bgColor = isDark ? "#000000" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#2f2a24";
  const { t } = useLocale();

  const pageList = buildPages(book);
  const articleRef = useRef<HTMLElement>(null);
  const totalPages = pageList.length;

  const goNext = useCallback(() => {
    setPreviewIndex(Math.min(activePreviewIndex + 1, totalPages - 1));
  }, [activePreviewIndex, totalPages, setPreviewIndex]);

  const goPrev = useCallback(() => {
    setPreviewIndex(Math.max(activePreviewIndex - 1, 0));
  }, [activePreviewIndex, setPreviewIndex]);

  const hasPrev = activePreviewIndex > 0;
  const hasNext = activePreviewIndex < totalPages - 1;

  // Keyboard
  useEffect(() => {
    if (isEditable) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditable, goNext, goPrev]);

  if (pageList.length === 0) {
    return <p className="text-sm text-stone-300">{t("noPagesYet")}</p>;
  }

  return (
    <article
      ref={articleRef}
      className={`relative w-full min-w-0 font-serif overflow-hidden ${containerClassName || "h-auto"}`}
      style={{
        fontFamily: getFontFamily(book.config?.fontFamily),
        backgroundColor: bgColor,
      }}
    >
      {pageList.map((page, pageIndex) => {
        const isActive = pageIndex === activePreviewIndex;
        const isBefore = pageIndex < activePreviewIndex;
        const transition = book.config?.transition || "none";

        let opacity: number;
        let transform: string;

        if (transition === "none") {
          opacity = isActive ? 1 : 0;
          transform = "";
        } else if (transition === "slide") {
          if (isActive) { opacity = 1; transform = "translateX(0)"; }
          else if (isBefore) { opacity = 0; transform = "translateX(-8%)"; }
          else { opacity = 0; transform = "translateX(8%)"; }
        } else if (transition === "zoom") {
          if (isActive) { opacity = 1; transform = "scale(1)"; }
          else if (isBefore) { opacity = 0; transform = "scale(1.06)"; }
          else { opacity = 0; transform = "scale(0.94)"; }
        } else {
          // "fade" (default)
          if (isActive) { opacity = 1; transform = "translateY(0)"; }
          else if (isBefore) { opacity = 0; transform = "translateY(-12px)"; }
          else { opacity = 0; transform = "translateY(12px)"; }
        }

        const noAnim = transition === "none";
        const dur = "0.35s";
        const ease = "cubic-bezier(0.2, 0.9, 0.3, 1)";
        const exitDur = "0.15s";
        const exitEase = "cubic-bezier(0.4, 0, 1, 1)";

        return (
          <div
            key={page.key}
            aria-hidden={!isActive}
            data-page-active={isActive}
            className="absolute inset-0 h-full overflow-auto"
            style={{
              backgroundColor: bgColor,
              ...(noAnim
                ? { visibility: isActive ? "visible" as const : "hidden" as const }
                : {
                    opacity,
                    transform,
                    transition: isActive
                      ? `opacity ${dur} ${ease}, transform ${dur} ${ease}`
                      : `opacity ${exitDur} ${exitEase}, transform ${exitDur} ${exitEase}`,
                  }),
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            {page.type === "photo" && page.photoIndices.length === 1 && (
              <SinglePhotoPage
                photo={book.photos[page.photoIndices[0]]}
                bgColor={bgColor}
                textColor={textColor}
                maxWidth={book.config?.maxWidth}
                showDate={book.config?.showDate}
                showLocation={book.config?.showLocation}
                dateFormat={book.config?.dateFormat}
              />
            )}
            {page.type === "group" && (
              <GroupPhotoPage
                photos={page.photoIndices.map((i) => book.photos[i])}
                bgColor={bgColor}
                textColor={textColor}
                maxWidth={book.config?.maxWidth}
                showDate={book.config?.showDate}
                showLocation={book.config?.showLocation}
                dateFormat={book.config?.dateFormat}
              />
            )}
            {page.type === "text" && (() => {
              const entry = book.photos[page.photoIndices[0]];
              return entry?.text ? (
                <TextPage
                  text={entry.text}
                  bgColor={bgColor}
                  textColor={isDark ? "#e7e5e4" : "#57534e"}
                  writingMode={book.config?.writingMode}
                />
              ) : null;
            })()}
          </div>
        );
      })}

      {/* Navigation buttons */}
      {!isEditable && totalPages > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
              color: textColor,
              opacity: hasPrev ? 0.6 : 0.15,
            }}
            aria-label="Previous page"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8L10 13" />
            </svg>
          </button>
          <span
            className="text-[11px] tabular-nums select-none"
            style={{ color: textColor, opacity: 0.35 }}
          >
            {activePreviewIndex + 1} / {totalPages}
          </span>
          <button
            onClick={goNext}
            disabled={!hasNext}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
              color: textColor,
              opacity: hasNext ? 0.6 : 0.15,
            }}
            aria-label="Next page"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3L11 8L6 13" />
            </svg>
          </button>
        </div>
      )}
    </article>
  );
}
