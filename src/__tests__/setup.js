import "@testing-library/jest-dom";
import { vi, beforeEach, afterEach } from "vitest";

// jsdom doesn't implement matchMedia — stub it.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Silence known noise in tests
const originalError = console.error;
beforeEach(() => {
  localStorage.clear();
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("act(")) return;
    originalError(...args);
  };
});
afterEach(() => {
  console.error = originalError;
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// Stub Notification API for reminder tests
if (!("Notification" in globalThis)) {
  globalThis.Notification = {
    permission: "default",
    requestPermission: vi.fn().mockResolvedValue("granted"),
  };
}
