import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return new NextResponse("not found", { status: 404 });
    }

    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "book-images";
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(id, 60 * 60 * 24 * 7); // 7 days

    if (error || !data?.signedUrl) {
      return new NextResponse("not found", { status: 404 });
    }

    return new NextResponse(null, {
      status: 307,
      headers: {
        Location: data.signedUrl,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("failed", { status: 500 });
  }
}
