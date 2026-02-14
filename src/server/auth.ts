import { getSupabaseAdmin } from "./supabase";

export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
