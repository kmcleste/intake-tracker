import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReminder } from "../../lib/reminder";

const todayISO = () => new Date().toISOString();
const yesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString();
};

describe("useReminder — showBanner", () => {
  it("is true when no entries exist", () => {
    const { result } = renderHook(() => useReminder([]));
    expect(result.current.showBanner).toBe(true);
  });

  it("is false when an entry exists for today", () => {
    const entries = [{ id: "1", timestamp: todayISO() }];
    const { result } = renderHook(() => useReminder(entries));
    expect(result.current.showBanner).toBe(false);
  });

  it("is true when all entries are from yesterday or earlier", () => {
    const entries = [{ id: "1", timestamp: yesterdayISO() }];
    const { result } = renderHook(() => useReminder(entries));
    expect(result.current.showBanner).toBe(true);
  });

  it("is false after dismissBanner() is called", () => {
    const { result } = renderHook(() => useReminder([]));
    act(() => result.current.dismissBanner());
    expect(result.current.showBanner).toBe(false);
  });

  it("dismissal is session-level (not persisted to localStorage)", () => {
    const { result } = renderHook(() => useReminder([]));
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
