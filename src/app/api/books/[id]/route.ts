import { createHash } from "node:crypto";
import { getUserIdFromRequest } from "@/server/auth";
import { getSupabaseAdmin } from "@/server/supabase";
import { getPhotoBookTitle } from "@/lib/photobook";
import { canViewBook, type BookVisibility } from "@/lib/publish";

function hashPassword(pw: string): string {
  return createHash("sha256").update(pw).digest("hex");
}

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const userId = await getUserIdFromRequest(request);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("books")
      .select("id, title, manuscript, created_at, visibility, published_manuscript, published_at, owner_id")
      .eq("id", id)
      .maybeSingle();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data) return Response.json({ error: "not found" }, { status: 404 });

    const visibility = (data.visibility ?? "draft") as BookVisibility;
    const isOwner = userId === data.owner_id;

    if (isOwner) {
      const url = new URL(request.url);
      const wantsDraft = url.searchParams.has("draft");
      if (wantsDraft) {
        return Response.json({ book: data, isOwner: true });
      }
      if (data.published_manuscript != null) {
        return Response.json({
          book: {
            id: data.id,
            title: data.title,
            manuscript: data.published_manuscript,
            created_at: data.created_at,
            visibility: data.visibility,
            published_at: data.published_at,
            owner_id: data.owner_id,
          },
          isOwner: true,
        });
      }
      return Response.json({ book: data, isOwner: true, notPublished: true });
    }

    const access = canViewBook(visibility, data.owner_id, userId);
    if (access === false) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    if (access === "password_required") {
      const url = new URL(request.url);
      const password = url.searchParams.get("password");
      if (!password) {
        return Response.json({ error: "password_required" }, { status: 403 });
      }
      const { data: pwData } = await supabase
        .from("books")
        .select("share_password")
        .eq("id", id)
        .maybeSingle();
      if (hashPassword(password) !== pwData?.share_password) {
        return Response.json({ error: "wrong_password" }, { status: 403 });
      }
    }

    return Response.json({
      book: {
        id: data.id,
        title: data.title,
        manuscript: data.published_manuscript ?? "",
        created_at: data.created_at,
        visibility: data.visibility,
        published_at: data.published_at,
      },
      isOwner: false,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "unknown error" },
      { status: 500 },
    );
  }
}

export async function PUT(
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
      | { title?: string; manuscript?: string }
      | null;

    if (!body || (typeof body.title !== "string" && typeof body.manuscript !== "string")) {
      return Response.json({ error: "invalid payload" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if (typeof body.title === "string") patch.title = body.title;
    if (typeof body.manuscript === "string") {
      patch.manuscript = body.manuscript;
      if (typeof body.title !== "string") {
        patch.title = getPhotoBookTitle(body.manuscript) || "無題";
      }
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("books")
      .update(patch)
      .eq("id", id)
      .eq("owner_id", userId)
      .select("id, title, manuscript, created_at, visibility, published_at, owner_id")
      .maybeSingle();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ book: data });
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
      .delete()
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
