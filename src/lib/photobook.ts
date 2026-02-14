export interface PhotoMeta {
  date?: string;
  lat?: number;
  lng?: number;
  locationName?: string;
}

export interface PhotoEntry {
  id: string;
  url?: string;
  text?: string;
  caption?: string;
  meta?: PhotoMeta;
}

export interface PhotoBookConfig {
  coverPattern?: string;
  fontFamily?: string;
  coverColor?: string;
  transition?: string;
  author?: string;
  showAuthorOnCover?: boolean;
  layout?: "single" | "double";
  writingMode?: "horizontal" | "vertical";
  maxWidth?: number;
  showDate?: boolean;
  showLocation?: boolean;
  dateFormat?: "iso" | "dots" | "en" | "ja" | "short";
}

export interface PhotoBook {
  version: 2;
  title: string;
  coverPhoto?: string;
  photos: PhotoEntry[];
  config?: PhotoBookConfig;
}

let _counter = 0;
function generateId(): string {
  return `p-${Date.now()}-${++_counter}`;
}

export function createPhotoBook(title: string): PhotoBook {
  return { version: 2, title, photos: [] };
}

export function addPhoto(book: PhotoBook, url: string, meta?: PhotoMeta): PhotoBook {
  const entry: PhotoEntry = { id: generateId(), url, ...(meta ? { meta } : {}) };
  return { ...book, photos: [...book.photos, entry] };
}

export function removePhoto(book: PhotoBook, id: string): PhotoBook {
  return { ...book, photos: book.photos.filter((p) => p.id !== id) };
}

export function reorderPhotos(book: PhotoBook, fromIndex: number, toIndex: number): PhotoBook {
  const photos = [...book.photos];
  const [moved] = photos.splice(fromIndex, 1);
  if (!moved) return book;
  photos.splice(toIndex, 0, moved);
  return { ...book, photos };
}

export function setCaption(book: PhotoBook, photoId: string, caption: string): PhotoBook {
  return {
    ...book,
    photos: book.photos.map((p) => (p.id === photoId ? { ...p, caption: caption || undefined } : p)),
  };
}

export function setCoverPhoto(book: PhotoBook, url: string | undefined): PhotoBook {
  return { ...book, coverPhoto: url };
}

export function addTextPage(book: PhotoBook, text: string): PhotoBook {
  const entry: PhotoEntry = { id: generateId(), text };
  return { ...book, photos: [...book.photos, entry] };
}

export function setTextContent(book: PhotoBook, entryId: string, text: string): PhotoBook {
  return {
    ...book,
    photos: book.photos.map((p) => (p.id === entryId ? { ...p, text: text || undefined } : p)),
  };
}

export function setTitle(book: PhotoBook, title: string): PhotoBook {
  return { ...book, title };
}

export function setConfig(book: PhotoBook, config: Partial<PhotoBookConfig>): PhotoBook {
  return { ...book, config: { ...book.config, ...config } };
}

export function serializePhotoBook(book: PhotoBook): string {
  return JSON.stringify(book);
}

export function parsePhotoBook(json: string): PhotoBook | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object" && parsed.version === 2) {
      return parsed as PhotoBook;
    }
    return null;
  } catch {
    return null;
  }
}

/** Extract title from manuscript column (supports both old text format and new PhotoBook JSON) */
export function getPhotoBookTitle(manuscript: string): string {
  const book = parsePhotoBook(manuscript);
  if (book) return book.title;
  // Fallback: old text format — first non-empty line after frontmatter
  const lines = manuscript.replace(/\r\n/g, "\n").split("\n");
  let inFrontmatter = lines[0]?.trim() === "---";
  for (let i = inFrontmatter ? 1 : 0; i < lines.length; i++) {
    if (inFrontmatter) {
      if (lines[i].trim() === "---") { inFrontmatter = false; continue; }
      continue;
    }
    const trimmed = lines[i].trim();
    if (trimmed) return trimmed;
  }
  return "";
}

/** Extract cover image from manuscript column */
export function getPhotoBookCoverImage(manuscript: string): string | undefined {
  const book = parsePhotoBook(manuscript);
  if (book) return book.coverPhoto ?? book.photos.find((p) => p.url)?.url;
  return undefined;
}

// ── Semantic diff ──

export type DiffChangeType = "title" | "coverPhoto" | "config" | "photoAdded" | "photoRemoved" | "photoReordered" | "captionChanged" | "textAdded" | "textRemoved" | "textChanged";

/** Sub-action for coverPhoto and config changes */
export type DiffAction = "added" | "removed" | "changed";

export interface DiffChange {
  type: DiffChangeType;
  action?: DiffAction;
  /** Config key for config changes */
  configKey?: string;
  detail?: string;
  thumbUrl?: string;
  thumbUrls?: string[];
}

export function diffPhotoBooks(published: PhotoBook, draft: PhotoBook): DiffChange[] {
  const changes: DiffChange[] = [];

  if (published.title !== draft.title) {
    changes.push({
      type: "title",
      detail: `${published.title || ""} → ${draft.title || ""}`,
    });
  }

  if (published.coverPhoto !== draft.coverPhoto) {
    if (!published.coverPhoto && draft.coverPhoto) {
      changes.push({ type: "coverPhoto", action: "added", thumbUrl: draft.coverPhoto });
    } else if (published.coverPhoto && !draft.coverPhoto) {
      changes.push({ type: "coverPhoto", action: "removed" });
    } else {
      changes.push({ type: "coverPhoto", action: "changed", thumbUrl: draft.coverPhoto });
    }
  }

  // Photo additions & removals
  const pubIds = new Set(published.photos.map((p) => p.id));
  const draftIds = new Set(draft.photos.map((p) => p.id));

  const added = draft.photos.filter((p) => !pubIds.has(p.id));
  const removed = published.photos.filter((p) => !draftIds.has(p.id));

  for (const p of added) {
    changes.push({
      type: "photoAdded",
      detail: p.caption || undefined,
      thumbUrl: p.url,
    });
  }
  for (const p of removed) {
    changes.push({
      type: "photoRemoved",
      detail: p.caption || undefined,
      thumbUrl: p.url,
    });
  }

  // Reorder detection (compare order of shared IDs)
  const pubOrder = published.photos.filter((p) => draftIds.has(p.id)).map((p) => p.id);
  const draftOrder = draft.photos.filter((p) => pubIds.has(p.id)).map((p) => p.id);
  if (pubOrder.length > 1 && pubOrder.join(",") !== draftOrder.join(",")) {
    const draftMap = new Map(draft.photos.map((p) => [p.id, p]));
    const movedIds = pubOrder.filter((id, i) => id !== draftOrder[i]);
    const movedUrls = movedIds.map((id) => draftMap.get(id)!.url).filter((u): u is string => !!u);
    changes.push({ type: "photoReordered", thumbUrls: movedUrls });
  }

  // Caption changes
  const pubMap = new Map(published.photos.map((p) => [p.id, p]));
  for (const dp of draft.photos) {
    const pp = pubMap.get(dp.id);
    if (!pp) continue;
    if ((pp.caption || "") !== (dp.caption || "")) {
      changes.push({
        type: "captionChanged",
        detail: `${pp.caption || ""} → ${dp.caption || ""}`,
        thumbUrl: dp.url,
      });
    }
  }

  // Text page changes
  const pubTextEntries = published.photos.filter((p) => p.text && !p.url);
  const draftTextEntries = draft.photos.filter((p) => p.text && !p.url);
  const pubTextIds = new Set(pubTextEntries.map((p) => p.id));
  const draftTextIds = new Set(draftTextEntries.map((p) => p.id));

  for (const p of draftTextEntries) {
    if (!pubTextIds.has(p.id)) {
      changes.push({ type: "textAdded" });
    }
  }
  for (const p of pubTextEntries) {
    if (!draftTextIds.has(p.id)) {
      changes.push({ type: "textRemoved" });
    }
  }
  for (const dp of draftTextEntries) {
    const pp = pubMap.get(dp.id);
    if (!pp) continue;
    if ((pp.text || "") !== (dp.text || "")) {
      changes.push({ type: "textChanged" });
    }
  }

  // Config changes
  const pubCfg = published.config ?? {};
  const draftCfg = draft.config ?? {};
  const configKeys: (keyof PhotoBookConfig)[] = ["coverPattern", "fontFamily", "coverColor", "transition", "author", "showAuthorOnCover", "layout", "writingMode"];
  for (const key of configKeys) {
    if ((pubCfg[key] || "") !== (draftCfg[key] || "")) {
      changes.push({
        type: "config",
        configKey: key,
        detail: `${pubCfg[key] || ""} → ${draftCfg[key] || ""}`,
      });
    }
  }

  return changes;
}
