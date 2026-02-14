import { describe, it, expect } from "vitest";
import { canViewBook, type BookVisibility } from "./publish";

describe("canViewBook", () => {
  const ownerId = "user-1";
  const otherId = "user-2";

  it("owner can always view their own book", () => {
    const visibilities: BookVisibility[] = ["draft", "private", "url_only", "password"];
    for (const v of visibilities) {
      expect(canViewBook(v, ownerId, ownerId)).toBe(true);
    }
  });

  it("draft is not viewable by others", () => {
    expect(canViewBook("draft", ownerId, otherId)).toBe(false);
    expect(canViewBook("draft", ownerId, null)).toBe(false);
  });

  it("private is not viewable by others", () => {
    expect(canViewBook("private", ownerId, otherId)).toBe(false);
    expect(canViewBook("private", ownerId, null)).toBe(false);
  });

  it("url_only is viewable by anyone with the URL", () => {
    expect(canViewBook("url_only", ownerId, otherId)).toBe(true);
    expect(canViewBook("url_only", ownerId, null)).toBe(true);
  });

  it("password requires password check (returns 'password_required')", () => {
    expect(canViewBook("password", ownerId, otherId)).toBe("password_required");
    expect(canViewBook("password", ownerId, null)).toBe("password_required");
  });
});
