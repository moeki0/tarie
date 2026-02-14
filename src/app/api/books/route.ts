import { getUserIdFromRequest } from "@/server/auth";
import { getSupabaseAdmin } from "@/server/supabase";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("books")
      .select("id, title, manuscript, created_at, visibility, published_at, published_manuscript, owner_id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ books: data ?? [] });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | { title?: string; manuscript?: string }
      | null;

    const id = generateId();
    const title = body?.title?.trim() || "book";
    const manuscript = typeof body?.manuscript === "string" ? body.manuscript : "";

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("books")
      .insert({ id, title, manuscript, owner_id: userId })
      .select("id, title, manuscript, created_at, visibility, published_at, owner_id")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ book: data }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "unknown error" },
      { status: 500 },
    );
  }
}
