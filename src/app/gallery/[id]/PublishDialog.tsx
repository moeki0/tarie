"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiPlus, FiMinus, FiRefreshCw, FiType, FiImage, FiFileText, FiSettings, FiEdit3, FiCheck, FiLink } from "react-icons/fi";
import * as Popover from "@radix-ui/react-popover";
import { publishBook, unpublishBook } from "@/lib/gallery";
import type { BookVisibility } from "@/lib/publish";
import { parsePhotoBook, createPhotoBook, diffPhotoBooks, type DiffChange, type DiffChangeType } from "@/lib/photobook";
import { useLocale } from "@/lib/i18n";

const VISIBILITY_OPTIONS: {
  value: BookVisibility;
  labelKey: string;
}[] = [
  { value: "url_only", labelKey: "visibilityUrlOnly" },
  { value: "password", labelKey: "visibilityPassword" },
  { value: "private", labelKey: "visibilityPrivate" },
];

function ChangeIcon({ type, size }: { type: DiffChangeType; size: number }) {
  switch (type) {
    case "title": return <FiType size={size} />;
    case "coverPhoto": return <FiImage size={size} />;
    case "photoAdded": return <FiPlus size={size} />;
    case "photoRemoved": return <FiMinus size={size} />;
    case "photoReordered": return <FiRefreshCw size={size} />;
    case "captionChanged": return <FiEdit3 size={size} />;
    case "textAdded": case "textRemoved": case "textChanged": return <FiFileText size={size} />;
    case "config": return <FiSettings size={size} />;
  }
}

function getChangeColor(type: DiffChangeType) {
  switch (type) {
    case "photoAdded": return "text-emerald-600 bg-emerald-50";
    case "photoRemoved": return "text-red-500 bg-red-50";
    default: return "text-amber-600 bg-amber-50";
  }
}

function useDiffLabel(change: DiffChange): string {
  const { t } = useLocale();
  switch (change.type) {
    case "title": return t("diffTitleChanged");
    case "coverPhoto":
      if (change.action === "added") return t("diffCoverPhotoAdded");
      if (change.action === "removed") return t("diffCoverPhotoRemoved");
      return t("diffCoverPhotoChanged");
    case "photoAdded": return t("diffPhotoAdded");
    case "photoRemoved": return t("diffPhotoRemoved");
    case "photoReordered": return t("diffPhotoReordered");
    case "captionChanged": return t("diffCaptionChanged");
    case "textAdded": return t("diffTextAdded");
    case "textRemoved": return t("diffTextRemoved");
    case "textChanged": return t("diffTextChanged");
    case "config": {
      const configLabelMap: Record<string, string> = {
        coverPattern: t("diffConfigCoverPattern"),
        fontFamily: t("diffConfigFontFamily"),
        coverColor: t("diffConfigCoverColor"),
        transition: t("diffConfigTransition"),
        author: t("diffConfigAuthor"),
        showAuthorOnCover: t("diffConfigShowAuthorOnCover"),
        layout: t("diffConfigLayout"),
        writingMode: t("diffConfigWritingMode"),
      };
      const keyLabel = change.configKey ? configLabelMap[change.configKey] ?? change.configKey : "";
      return t("diffConfigChanged").replace("{key}", keyLabel);
    }
  }
}

function DiffChangeItem({ change }: { change: DiffChange }) {
  const colorClass = getChangeColor(change.type);
  const label = useDiffLabel(change);

  return (
    <div className="flex items-center gap-3 py-2">
      <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
        <ChangeIcon type={change.type} size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-base text-stone-700">{label}</p>
      </div>
      {change.thumbUrls && change.thumbUrls.length > 0 ? (
        <div className="shrink-0 flex -space-x-2">
          {change.thumbUrls.slice(0, 3).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className="w-8 h-8 rounded object-cover border-2 border-white"
            />
          ))}
        </div>
      ) : change.thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={change.thumbUrl}
          alt=""
          className="shrink-0 w-9 h-9 rounded object-cover"
        />
      ) : null}
    </div>
  );
}

function TabBar({
  tab,
  onTabChange,
  changesCount,
}: {
  tab: "settings" | "diff";
  onTabChange: (tab: "settings" | "diff") => void;
  changesCount: number;
}) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);
  const diffRef = useRef<HTMLButtonElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const isFirstRender = useRef(true);
  const animFrameRef = useRef(0);

  const measure = (target: "settings" | "diff") => {
    const el = target === "settings" ? settingsRef.current : diffRef.current;
    const container = containerRef.current;
    if (!el || !container) return null;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    return { left: eRect.left - cRect.left, width: eRect.width };
  };

  useEffect(() => {
    const pos = measure(tab);
    if (pos) setIndicator(pos);
    isFirstRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitch = (next: "settings" | "diff") => {
    if (next === tab) return;
    const from = measure(tab);
    const to = measure(next);
    if (!from || !to) { onTabChange(next); return; }

    const minLeft = Math.min(from.left, to.left);
    const maxRight = Math.max(from.left + from.width, to.left + to.width);
    const expandedWidth = maxRight - minLeft;

    cancelAnimationFrame(animFrameRef.current);

    setIndicator({ left: minLeft, width: expandedWidth });
    onTabChange(next);

    animFrameRef.current = requestAnimationFrame(() => {
      setTimeout(() => {
        setIndicator(to);
      }, 150);
    });
  };

  return (
    <div ref={containerRef} className="relative flex border-b border-stone-100 px-4 pt-3">
      <button
        ref={settingsRef}
        onClick={() => handleSwitch("settings")}
        className={`px-2.5 pb-2 text-base transition-colors duration-200 ${
          tab === "settings" ? "text-stone-800 font-medium" : "text-stone-400 hover:text-stone-600"
        }`}
      >
        {t("publishSettings")}
      </button>
      <button
        ref={diffRef}
        onClick={() => handleSwitch("diff")}
        className={`px-2.5 pb-2 text-base transition-colors duration-200 flex items-center gap-1.5 ${
          tab === "diff" ? "text-stone-800 font-medium" : "text-stone-400 hover:text-stone-600"
        }`}
      >
        {t("diffTitle")}
        {changesCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-amber-100 text-amber-700 text-[11px] font-medium px-1">
            {changesCount}
          </span>
        )}
      </button>
      <div
        className="absolute bottom-0 h-[2px] bg-stone-800 rounded-full"
        style={{
          left: indicator.left,
          width: indicator.width,
          transition: isFirstRender.current
            ? "none"
            : "left 0.35s cubic-bezier(0.22, 1, 0.36, 1), width 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}

interface PublishDropdownProps {
  bookId: string;
  currentVisibility: BookVisibility;
  draft: string;
  publishedManuscript: string | null | undefined;
  hasUnpublishedChanges: boolean;
  onPublished: () => void;
}

export function PublishDropdown({
  bookId,
  currentVisibility,
  draft,
  publishedManuscript,
  hasUnpublishedChanges,
  onPublished,
}: PublishDropdownProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<BookVisibility>(
    currentVisibility === "draft" ? "url_only" : currentVisibility,
  );
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tab, setTab] = useState<"settings" | "diff">("settings");
  const [copied, setCopied] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const isPublished = currentVisibility !== "draft";

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/s/${bookId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [bookId]);

  const changes = useMemo(() => {
    if (publishedManuscript == null) return [];
    const pubBook = parsePhotoBook(publishedManuscript) ?? createPhotoBook("");
    const draftBook = parsePhotoBook(draft) ?? createPhotoBook("");
    return diffPhotoBooks(pubBook, draftBook);
  }, [publishedManuscript, draft]);

  const handlePublish = async () => {
    if (selected === "password" && !password.trim()) return;
    setIsSubmitting(true);
    try {
      await publishBook(bookId, selected, selected === "password" ? password : undefined);
      setShowSuccess(true);
      setJustPublished(true);
      onPublished();
      setTimeout(() => {
        setShowSuccess(false);
      }, 900);
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnpublish = async () => {
    setIsSubmitting(true);
    try {
      await unpublishBook(bookId);
      setOpen(false);
      onPublished();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setJustPublished(false); setCopied(false); } }}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-base font-medium transition-colors ${
            isPublished
              ? "bg-stone-800 text-white hover:bg-stone-700"
              : "bg-stone-900 text-white hover:bg-stone-700"
          }`}
        >
          {hasUnpublishedChanges && (
            <span className="absolute -top-0.5 -right-0.5 inline-block w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
          )}
          <FiCheck size={18} aria-hidden />
          {isPublished ? t("published") : t("publish")}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 bg-white rounded-xl shadow-lg border border-stone-200 flex flex-col animate-scale-in dropdown-animate origin-[var(--radix-popover-content-transform-origin)] relative overflow-hidden"
        >
          {/* Success overlay */}
          {showSuccess && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 rounded-xl">
              <div className="success-check-circle">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" stroke="#22c55e" strokeWidth="2.5" fill="#f0fdf4" />
                  <path
                    d="M15 24.5L21 30.5L33 18.5"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="success-check-stroke"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Tabs */}
          {isPublished && publishedManuscript != null && hasUnpublishedChanges && (
            <TabBar tab={tab} onTabChange={setTab} changesCount={changes.length} />
          )}

          {tab === "settings" ? (
            <div className="overflow-auto p-4 max-h-[50vh]">
              <div className="space-y-1.5">
                {VISIBILITY_OPTIONS.map((opt) => {
                  const isSelected = selected === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelected(opt.value)}
                      className={`w-full p-2.5 rounded-lg border transition-colors text-left ${
                        isSelected
                          ? "border-stone-800 bg-stone-50"
                          : "border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      <p className={`text-base ${isSelected ? "font-medium text-stone-800" : "text-stone-600"}`}>
                        {t(opt.labelKey as Parameters<typeof t>[0])}
                      </p>
                    </button>
                  );
                })}
              </div>

              {selected === "password" && (
                <div className="mt-2.5">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("passwordPlaceholder")}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-base text-stone-700 placeholder:text-stone-300 focus:outline-none focus:border-stone-400"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-auto p-4 max-h-[50vh]">
              {changes.length > 0 ? (
                <div className="divide-y divide-stone-100">
                  {changes.map((change, i) => (
                    <DiffChangeItem key={i} change={change} />
                  ))}
                </div>
              ) : (
                <p className="text-base text-stone-400 text-center py-6">
                  {t("unpublishedChanges")}
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          {justPublished ? (
            <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100">
              <button
                onClick={() => void handleCopyLink()}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-base text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <FiLink size={14} />
                {copied ? t("copiedLink") : t("copyLink")}
              </button>
              <button
                onClick={() => { setJustPublished(false); setCopied(false); setOpen(false); }}
                className="rounded-full bg-stone-900 px-4 py-1.5 text-base font-medium text-white hover:bg-stone-700 transition-colors"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100">
              <div>
                {isPublished && (
                  <button
                    onClick={() => void handleUnpublish()}
                    disabled={isSubmitting}
                    className="text-base text-stone-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {t("unpublish")}
                  </button>
                )}
              </div>
              <button
                onClick={() => void handlePublish()}
                disabled={isSubmitting || (selected === "password" && !password.trim())}
                className="rounded-full bg-stone-900 px-4 py-1.5 text-base font-medium text-white hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "..." : t("publish")}
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
