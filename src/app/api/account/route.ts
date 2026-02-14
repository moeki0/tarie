import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/server/auth";
import { getSupabaseAdmin } from "@/server/supabase";

export async function DELETE(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
