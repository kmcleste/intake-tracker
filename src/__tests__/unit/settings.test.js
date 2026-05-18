import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings } from "../../lib/settings";

const STORAGE_KEY = "intake_settings";

describe("useSettings", () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it("returns defaults when localStorage is empty", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({ theme: "light", fontSize: "md", font: "serif" });
  });

  it("loads persisted settings from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: "dark", fontSize: "lg", font: "sans" }));
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({ theme: "dark", fontSize: "lg", font: "sans" });
  });

  it("merges persisted settings with defaults (partial storage)", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: "dark" }));
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.theme).toBe("dark");
    expect(result.current.settings.fontSize).toBe("md");
    expect(result.current.settings.font).toBe("serif");
  });

  it("falls back to defaults when localStorage contains invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not-json{{{");
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({ theme: "light", fontSize: "md", font: "serif" });
  });

  it("update() changes state", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update("theme", "dark"));
    expect(result.current.settings.theme).toBe("dark");
  });

  it("update() persists to localStorage", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update("fontSize", "xl"));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.fontSize).toBe("xl");
  });

  it("update() preserves other settings", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update("font", "sans"));
    expect(result.current.settings.theme).toBe("light");
    expect(result.current.settings.fontSize).toBe("md");
    expect(result.current.settings.font).toBe("sans");
  });

  it("update() can set theme to auto", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update("theme", "auto"));
    expect(result.current.settings.theme).toBe("auto");
  });

  it("exposes update function", () => {
    const { result } = renderHook(() => useSettings());
    expect(typeof result.current.update).toBe("function");
  });

  it("multiple sequential updates all take effect", () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.update("theme", "dark");
      result.current.update("fontSize", "sm");
      result.current.update("font", "sans");
    });
    expect(result.current.settings).toMatchObject({ theme: "dark", fontSize: "sm", font: "sans" });
  });
});
