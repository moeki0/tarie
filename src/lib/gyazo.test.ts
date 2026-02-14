import { describe, it, expect } from "vitest";
import { toGyazoImageUrl, isSafeImageUrl } from "./gyazo";

describe("toGyazoImageUrl", () => {
  it("converts gyazo page url to image url", () => {
    expect(toGyazoImageUrl("https://gyazo.com/c4ed223c7f71af7b78c25edaf5cc16bb")).toBe(
      "https://gyazo.com/c4ed223c7f71af7b78c25edaf5cc16bb/raw"
    );
  });

  it("leaves already-converted url unchanged", () => {
    expect(toGyazoImageUrl("https://gyazo.com/abc123/raw")).toBe(
      "https://gyazo.com/abc123/raw"
    );
  });

  it("leaves i.gyazo.com url unchanged", () => {
    expect(toGyazoImageUrl("https://i.gyazo.com/abc123.png")).toBe(
      "https://i.gyazo.com/abc123.png"
    );
  });

  it("leaves non-gyazo url unchanged", () => {
    expect(toGyazoImageUrl("https://example.com/photo.jpg")).toBe(
      "https://example.com/photo.jpg"
    );
  });
});

describe("isSafeImageUrl", () => {
  it("allows https urls", () => {
    expect(isSafeImageUrl("https://gyazo.com/abc123")).toBe(true);
    expect(isSafeImageUrl("https://example.com/photo.jpg")).toBe(true);
  });

  it("allows http urls", () => {
    expect(isSafeImageUrl("http://example.com/photo.jpg")).toBe(true);
  });

  it("rejects javascript protocol", () => {
    expect(isSafeImageUrl("javascript:alert('xss')")).toBe(false);
  });

  it("rejects data urls", () => {
    expect(isSafeImageUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects empty and invalid urls", () => {
    expect(isSafeImageUrl("")).toBe(false);
    expect(isSafeImageUrl("not-a-url")).toBe(false);
  });
});
