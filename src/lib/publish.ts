export type BookVisibility = "draft" | "url_only" | "password" | "private";

export function canViewBook(
  visibility: BookVisibility,
  ownerId: string,
  viewerId: string | null,
): boolean | "password_required" {
  if (viewerId === ownerId) return true;

  switch (visibility) {
    case "draft":
    case "private":
      return false;
    case "url_only":
      return true;
    case "password":
      return "password_required";
  }
}
