import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInactivityTimeout } from "../../lib/inactivity";

describe("useInactivityTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const TIMEOUT = 30 * 60 * 1000;   // 30 min
  const WARN_OFFSET = 2 * 60 * 1000; // warn at 28 min

  it("does not show warning when disabled", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useInactivityTimeout(false, TIMEOUT, onTimeout));
    act(() => vi.advanceTimersByTime(TIMEOUT));
    expect(result.current.warnVisible).toBe(false);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("shows warning at (timeout - 2 min) when enabled", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useInactivityTimeout(true, TIMEOUT, onTimeout));
    act(() => vi.advanceTimersByTime(TIMEOUT - WARN_OFFSET));
    expect(result.current.warnVisible).toBe(true);
  });

  it("does not show warning before threshold", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useInactivityTimeout(true, TIMEOUT, onTimeout));
    act(() => vi.advanceTimersByTime(TIMEOUT - WARN_OFFSET - 1));
    expect(result.current.warnVisible).toBe(false);
  });

  it("calls onTimeout at full timeout", () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(true, TIMEOUT, onTimeout));
    act(() => vi.advanceTimersByTime(TIMEOUT));
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("does not call onTimeout before timeout elapses", () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(true, TIMEOUT, onTimeout));
    act(() => vi.advanceTimersByTime(TIMEOUT - 1));
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("hides warning after onTimeout fires", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useInactivityTimeout(true, TIMEOUT, onTimeout));
    act(() => vi.advanceTimersByTime(TIMEOUT));
    expect(result.current.warnVisible).toBe(false);
  });

  it("resets timers on user activity events", () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(true, TIMEOUT, onTimeout));
    act(() => {
      vi.advanceTimersByTime(TIMEOUT - 1000);
      window.dispatchEvent(new MouseEvent("mousemove"));
      vi.advanceTimersByTime(TIMEOUT - 1000);
    });
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("hides warning on activity after warn is shown", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useInactivityTimeout(true, TIMEOUT, onTimeout));
    act(() => {
      vi.advanceTimersByTime(TIMEOUT - WARN_OFFSET);
      window.dispatchEvent(new Event("keydown"));
    });
    expect(result.current.warnVisible).toBe(false);
  });

  it("cleans up event listeners on unmount", () => {
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const onTimeout = vi.fn();
    const { unmount } = renderHook(() => useInactivityTimeout(true, TIMEOUT, onTimeout));
    unmount();
    expect(removeEventListener).toHaveBeenCalled();
  });

  it("listens to touchstart events", () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(true, TIMEOUT, onTimeout));
    act(() => {
      vi.advanceTimersByTime(TIMEOUT - WARN_OFFSET);
      window.dispatchEvent(new Event("touchstart"));
    });
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("listens to scroll events", () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(true, TIMEOUT, onTimeout));
    act(() => {
      vi.advanceTimersByTime(TIMEOUT - WARN_OFFSET);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("clearing enabled flag hides warnVisible", () => {
    const onTimeout = vi.fn();
    let enabled = true;
    const { result, rerender } = renderHook(() => useInactivityTimeout(enabled, TIMEOUT, onTimeout));
    act(() => vi.advanceTimersByTime(TIMEOUT - WARN_OFFSET));
    expect(result.current.warnVisible).toBe(true);
    enabled = false;
    rerender();
    expect(result.current.warnVisible).toBe(false);
  });
});
