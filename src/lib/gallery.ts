import { getBrowserSupabase } from "./supabase-browser";
import type { BookVisibility } from "./publish";
import type { PhotoBook } from "./photobook";
import { parsePhotoBook, createPhotoBook, serializePhotoBook } from "./photobook";

export interface Gallery {
  id: string;
  title: string;
  manuscript: string;
  createdAt: number;
  visibility?: BookVisibility;
  publishedAt?: number;
  publishedManuscript?: string | null;
  ownerId?: string;
}

type ApiBook = {
  id: string;
  title: string;
  manuscript: string;
  created_at: string;
  visibility?: string;
  published_at?: string;
  published_manuscript?: string | null;
  owner_id?: string;
};

function toGallery(book: ApiBook): Gallery {
  return {
    id: book.id,
    title: book.title,
    manuscript: book.manuscript,
    createdAt: Date.parse(book.created_at) || Date.now(),
    visibility: (book.visibility as BookVisibility) ?? "draft",
    publishedAt: book.published_at ? Date.parse(book.published_at) : undefined,
    publishedManuscript: book.published_manuscript,
    ownerId: book.owner_id,
  };
}

async function authHeaders() {
  const supabase = getBrowserSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return {} as Record<string, string>;
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function getGalleries(): Promise<Gallery[]> {
  const headers = await authHeaders();
  const res = await fetch("/api/books", { cache: "no-store", headers });
  if (res.status === 401) return [];
  if (!res.ok) throw new Error("Failed to fetch books");
  const data = (await res.json()) as { books: ApiBook[] };
  return data.books.map(toGallery);
}

export type GetGalleryResult =
  | { status: "ok"; gallery: Gallery }
  | { status: "not_found" }
  | { status: "password_required" }
  | { status: "wrong_password" };

export async function getGallery(id: string, password?: string, options?: { draft?: boolean }): Promise<GetGalleryResult> {
  const headers = await authHeaders();
  const params = new URLSearchParams();
  if (password) params.set("password", password);
  if (options?.draft) params.set("draft", "1");
  const qs = params.toString();
  const url = qs ? `/api/books/${id}?${qs}` : `/api/books/${id}`;
  const res = await fetch(url, { cache: "no-store", headers });
  if (res.status === 404) return { status: "not_found" };
  if (res.status === 403) {
    const data = (await res.json()) as { error: string };
    if (data.error === "password_required") return { status: "password_required" };
    if (data.error === "wrong_password") return { status: "wrong_password" };
    return { status: "not_found" };
  }
  if (!res.ok) throw new Error("Failed to fetch book");
  const data = (await res.json()) as { book: ApiBook };
  return { status: "ok", gallery: toGallery(data.book) };
}

export async function createGallery(title: string, manuscript?: string): Promise<Gallery> {
  const headers = await authHeaders();
  const ms = manuscript ?? serializePhotoBook(createPhotoBook(title));
  const res = await fetch("/api/books", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ title, manuscript: ms }),
  });
  if (!res.ok) throw new Error("Failed to create book");
  const data = (await res.json()) as { book: ApiBook };
  return toGallery(data.book);
}

export async function deleteGallery(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`/api/books/${id}`, { method: "DELETE", headers });
  if (!res.ok) throw new Error("Failed to delete book");
}

export async function updateGalleryContent(
  id: string,
  payload: { manuscript: string; title?: string },
): Promise<void> {
  const headers = await authHeaders();
  const body: Record<string, unknown> = { manuscript: payload.manuscript };
  if (payload.title !== undefined) body.title = payload.title;
  const res = await fetch(`/api/books/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update content");
}

export async function publishBook(
  id: string,
  visibility: BookVisibility,
  password?: string,
): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`/api/books/${id}/publish`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ visibility, password }),
  });
  if (!res.ok) throw new Error("Failed to publish book");
}

export async function unpublishBook(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`/api/books/${id}/publish`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Failed to unpublish book");
}

/** Get PhotoBook from Gallery's manuscript, with fallback */
export function getPhotoBook(gallery: Gallery): PhotoBook {
  const book = parsePhotoBook(gallery.manuscript);
  if (book) return book;
  // Fallback for old format: create empty PhotoBook with title
  return createPhotoBook(gallery.title || "無題");
}

const MAX_SIZE = 200 * 1024; // 200KB
const UPLOADABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const DEFAULT_MAX_DIMENSION = 1200;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality));
}

function compressImage(file: File, maxDimension = DEFAULT_MAX_DIMENSION): Promise<Blob> {
  return new Promise((resolve) => {
    if (file.type === "image/gif") {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);

      // Try decreasing quality until under MAX_SIZE
      for (const q of [0.7, 0.5, 0.3, 0.2]) {
        const blob = await canvasToBlob(canvas, q);
        if (blob && blob.size <= MAX_SIZE) { resolve(blob); return; }
      }

      // If still too large, shrink dimensions further
      const scale = 0.6;
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await canvasToBlob(canvas, 0.3);
      resolve(blob ?? file);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

async function uploadOneBlob(
  blob: Blob,
  mimeType: string,
  bookId: string,
  headers: Record<string, string>,
): Promise<string> {
  const res = await fetch("/api/upload-image", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ mimeType, bookId }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  const { signedUrl, publicUrl } = (await res.json()) as {
    signedUrl: string;
    token: string;
    path: string;
    publicUrl: string;
  };
  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "content-type": mimeType },
    body: blob,
  });
  if (!uploadRes.ok) throw new Error("Failed to upload image");
  return publicUrl;
}

export async function uploadImageToSupabase(
  bookId: string,
  file: File,
): Promise<string> {
  const [compressed, headers] = await Promise.all([
    compressImage(file),
    authHeaders(),
  ]);

  const rawType = compressed instanceof File ? compressed.type : "image/jpeg";
  const mimeType = UPLOADABLE_TYPES.has(rawType) ? rawType : "image/jpeg";
  return uploadOneBlob(compressed, mimeType, bookId, headers);
}
