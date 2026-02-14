import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;
    if (!path || path.length === 0) {
      return new NextResponse("not found", { status: 404 });
    }

    const objectPath = path.map((segment) => decodeURIComponent(segment)).join("/");
    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "book-images";
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from(bucketName).download(objectPath);

    if (error || !data) {
      return new NextResponse("not found", { status: 404 });
    }

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": data.type || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("failed", { status: 500 });
  }
}
