import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getUserIdFromRequest } from "@/server/auth";
import { getSupabaseAdmin } from "@/server/supabase";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function toSafeExt(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "image/avif") return "avif";
  return "bin";
}

/**
 * Returns a signed upload URL so the client can upload directly to Supabase
 * Storage without proxying the file through this function.
 */
export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
    if (!ALLOWED_TYPES.has(mimeType)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "book-images";

    const ext = toSafeExt(mimeType);
    const shortId = randomBytes(6).toString("base64url");
    const path = `${shortId}.${ext}`;

    const { data: signed, error: signError } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(path);

    if (signError || !signed) {
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
    }

    const origin = new URL(request.url).origin;
    return NextResponse.json({
      signedUrl: signed.signedUrl,
      token: signed.token,
      path,
      publicUrl: `${origin}/i/${encodeURIComponent(path)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
