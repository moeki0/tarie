import { describe, it, expect } from "vitest";
import { getNextIndex, getPrevIndex } from "./slideshow";

describe("slideshow navigation", () => {
  it("goes to next index", () => {
    expect(getNextIndex(0, 5)).toBe(1);
    expect(getNextIndex(4, 5)).toBe(0);
  });

  it("goes to previous index", () => {
    expect(getPrevIndex(1, 5)).toBe(0);
    expect(getPrevIndex(0, 5)).toBe(4);
  });
});
