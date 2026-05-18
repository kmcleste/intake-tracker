import { describe, it, expect } from "vitest";
import { ZOOM } from "../../lib/settings";
import { THEMES } from "../../lib/theme";

const REQUIRED_VARS = [
  "--c-bg", "--c-bg-card", "--c-bg-panel", "--c-bg-stat", "--c-bg-note",
  "--c-bg-care", "--c-bg-success", "--c-bg-error", "--c-tag-bg",
  "--c-accent", "--c-accent-lt", "--c-accent-hd", "--c-accent-mid",
  "--c-accent-bdr", "--c-accent-warm",
  "--c-text", "--c-text-mid", "--c-text-muted", "--c-text-subtle", "--c-text-warm",
  "--c-err-text", "--c-err-text-dk", "--c-err-bdr",
  "--c-border", "--c-border-card", "--c-border-care",
  "--c-shadow", "--c-overlay",
];

describe("ZOOM", () => {
  it("exports all four size levels", () => {
    expect(Object.keys(ZOOM)).toEqual(["sm", "md", "lg", "xl"]);
  });

  it("md is exactly 1 (baseline)", () => {
    expect(ZOOM.md).toBe(1);
  });

  it("sm is smaller than md", () => {
    expect(ZOOM.sm).toBeLessThan(ZOOM.md);
  });

  it("lg is between md and xl", () => {
    expect(ZOOM.lg).toBeGreaterThan(ZOOM.md);
    expect(ZOOM.lg).toBeLessThan(ZOOM.xl);
  });

  it("xl is largest", () => {
    const vals = Object.values(ZOOM);
    expect(Math.max(...vals)).toBe(ZOOM.xl);
  });

  it("all values are positive numbers", () => {
    Object.values(ZOOM).forEach(v => {
      expect(v).toBeGreaterThan(0);
      expect(typeof v).toBe("number");
    });
  });
});

describe("THEMES", () => {
  it("exports light and dark only", () => {
    expect(Object.keys(THEMES)).toEqual(["light", "dark"]);
  });

  describe.each(["light", "dark"])("%s theme", (mode) => {
    const theme = THEMES[mode];

    it("is a plain object", () => {
      expect(typeof theme).toBe("object");
      expect(Array.isArray(theme)).toBe(false);
    });

    REQUIRED_VARS.forEach(varName => {
      it(`has ${varName}`, () => {
        expect(theme).toHaveProperty(varName);
        expect(theme[varName]).toBeTruthy();
      });
    });

    it("all keys start with --c-", () => {
      Object.keys(theme).forEach(k => {
        expect(k.startsWith("--c-")).toBe(true);
      });
    });
  });

  it("light and dark backgrounds are different", () => {
    expect(THEMES.light["--c-bg"]).not.toBe(THEMES.dark["--c-bg"]);
  });

  it("light and dark text colors are different", () => {
    expect(THEMES.light["--c-text"]).not.toBe(THEMES.dark["--c-text"]);
  });
});
