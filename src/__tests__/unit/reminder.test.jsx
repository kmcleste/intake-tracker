import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReminder } from "../../lib/reminder";

const GRACE = 2 * 60 * 1000; // must match reminder.js

const todayISO = () => new Date().toISOString();
const yesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString();
};

describe("useReminder — showBanner grace period", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is false immediately on open (grace period active)", () => {
    const { result } = renderHook(() => useReminder([]));
    expect(result.current.showBanner).toBe(false);
  });

  it("is false just before grace period elapses", () => {
    const { result } = renderHook(() => useReminder([]));
    act(() => vi.advanceTimersByTime(GRACE - 1));
    expect(result.current.showBanner).toBe(false);
  });

  it("is true once grace period elapses with no today entry", () => {
    const { result } = renderHook(() => useReminder([]));
    act(() => vi.advanceTimersByTime(GRACE));
    expect(result.current.showBanner).toBe(true);
  });

  it("is true after grace period when all entries are from yesterday or earlier", () => {
    const { result } = renderHook(() => useReminder([{ id: "1", timestamp: yesterdayISO() }]));
    act(() => vi.advanceTimersByTime(GRACE));
    expect(result.current.showBanner).toBe(true);
  });

  it("never shows if today entry is present from the start", () => {
    const { result } = renderHook(() => useReminder([{ id: "1", timestamp: todayISO() }]));
    act(() => vi.advanceTimersByTime(GRACE));
    expect(result.current.showBanner).toBe(false);
  });

  it("clears timer and never shows if entry is logged before grace elapses", () => {
    const { result, rerender } = renderHook(({ entries }) => useReminder(entries), {
      initialProps: { entries: [] },
    });
    act(() => vi.advanceTimersByTime(GRACE / 2));
    rerender({ entries: [{ id: "1", timestamp: todayISO() }] });
    act(() => vi.advanceTimersByTime(GRACE));
    expect(result.current.showBanner).toBe(false);
  });

  it("is false after dismissBanner() even after grace elapses", () => {
    const { result } = renderHook(() => useReminder([]));
    act(() => vi.advanceTimersByTime(GRACE));
    act(() => result.current.dismissBanner());
    expect(result.current.showBanner).toBe(false);
  });

  it("dismissal is session-level (not persisted to localStorage)", () => {
    const { result } = renderHook(() => useReminder([]));
    act(() => vi.advanceTimersByTime(GRACE));
    act(() => result.current.dismissBanner());
    expect(localStorage.getItem("intake_dismiss")).toBeNull();
  });
});

describe("useReminder — notifEnabled", () => {
  it("is false by default", () => {
    const { result } = renderHook(() => useReminder([]));
    expect(result.current.notifEnabled).toBe(false);
  });

  it("is true when localStorage has intake_notif=true", () => {
    localStorage.setItem("intake_notif", "true");
    const { result } = renderHook(() => useReminder([]));
    expect(result.current.notifEnabled).toBe(true);
  });
});

describe("useReminder — toggleNotif()", () => {
  beforeEach(() => {
    localStorage.removeItem("intake_notif");
    globalThis.Notification = {
      permission: "default",
      requestPermission: vi.fn().mockResolvedValue("granted"),
    };
  });

  it("enables notifications when permission granted", async () => {
    const { result } = renderHook(() => useReminder([]));
    await act(() => result.current.toggleNotif());
    expect(result.current.notifEnabled).toBe(true);
    expect(localStorage.getItem("intake_notif")).toBe("true");
  });

  it("does not enable when permission denied", async () => {
    globalThis.Notification.requestPermission = vi.fn().mockResolvedValue("denied");
    const { result } = renderHook(() => useReminder([]));
    await act(() => result.current.toggleNotif());
    expect(result.current.notifEnabled).toBe(false);
  });

  it("disables when already enabled", async () => {
    localStorage.setItem("intake_notif", "true");
    const { result } = renderHook(() => useReminder([]));
    expect(result.current.notifEnabled).toBe(true);
    await act(() => result.current.toggleNotif());
    expect(result.current.notifEnabled).toBe(false);
    expect(localStorage.getItem("intake_notif")).toBeNull();
  });

  it("does not call requestPermission when disabling", async () => {
    localStorage.setItem("intake_notif", "true");
    const { result } = renderHook(() => useReminder([]));
    await act(() => result.current.toggleNotif());
    expect(globalThis.Notification.requestPermission).not.toHaveBeenCalled();
  });
});
