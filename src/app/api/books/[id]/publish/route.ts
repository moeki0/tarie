import { createHash } from "node:crypto";
import { getUserIdFromRequest } from "@/server/auth";
import { getSupabaseAdmin } from "@/server/supabase";
import type { BookVisibility } from "@/lib/publish";

function hashPassword(pw: string): string {
  return createHash("sha256").update(pw).digest("hex");
}

export const runtime = "nodejs";

const VALID_VISIBILITIES: BookVisibility[] = ["url_only", "password", "private"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | { visibility?: string; password?: string }
      | null;

    const visibility = body?.visibility as BookVisibility | undefined;
    if (!visibility || !VALID_VISIBILITIES.includes(visibility)) {
      return Response.json({ error: "invalid visibility" }, { status: 400 });
    }

    if (visibility === "password" && !body?.password) {
      return Response.json({ error: "password required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: book, error: fetchError } = await supabase
      .from("books")
      .select("id, manuscript, owner_id")
      .eq("id", id)
      .eq("owner_id", userId)
      .maybeSingle();

    if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });
    if (!book) return Response.json({ error: "not found" }, { status: 404 });

    const patch: Record<string, unknown> = {
      visibility,
      published_manuscript: book.manuscript,
      published_at: new Date().toISOString(),
    };

    if (visibility === "password" && body?.password) {
      patch.share_password = hashPassword(body.password);
    } else {
      patch.share_password = null;
    }

    const { error: updateError } = await supabase
      .from("books")
      .update(patch)
      .eq("id", id)
      .eq("owner_id", userId);

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

    return Response.json({ ok: true, visibility });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("books")
      .update({
        visibility: "draft",
        published_manuscript: null,
        published_at: null,
        share_password: null,
      })
      .eq("id", id)
      .eq("owner_id", userId);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "unknown error" },
      { status: 500 },
    );
  }
}
