import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../../App";

// Control auth state via mock
const getSessionMock = vi.fn();
const onAuthStateChangeMock = vi.fn();
const rpcMock = vi.fn().mockResolvedValue({ data: null, error: null });
const fromMock = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ error: null }),
  then: (res) => res({ data: [], error: null }),
});

vi.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => getSessionMock(),
      onAuthStateChange: (...args) => onAuthStateChangeMock(...args),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: () => fromMock(),
    rpc: () => rpcMock(),
  },
}));

const unsubscribe = vi.fn();

describe("App — unauthenticated state", () => {
  beforeEach(() => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    onAuthStateChangeMock.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
  });

  it("renders Auth component when not signed in", async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText("Food & Symptom Journal")).toBeInTheDocument()
    );
  });

  it("shows SIGN IN mode by default", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText("SIGN IN")).toBeInTheDocument());
  });

  it("does not show loading spinner after session resolves", async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.queryByText("LOADING…")).not.toBeInTheDocument()
    );
  });
});

describe("App — loading state", () => {
  beforeEach(() => {
    // getSession never resolves → session stays undefined
    let resolve;
    getSessionMock.mockReturnValue(new Promise(r => { resolve = r; }));
    onAuthStateChangeMock.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
  });

  it("shows LOADING… while session is being determined", async () => {
    render(<App />);
    expect(screen.getByText("LOADING…")).toBeInTheDocument();
  });
});

describe("App — session error handling (regression REG-002)", () => {
  it("shows Auth screen (not stuck on LOADING) when getSession() rejects", async () => {
    getSessionMock.mockRejectedValue(new Error("network error"));
    onAuthStateChangeMock.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText("Food & Symptom Journal")).toBeInTheDocument(), { timeout: 3000 }
    );
  });
});

describe("App — authenticated state", () => {
  const mockSession = {
    user: { id: "user-1", email: "user@test.com" },
    access_token: "token",
  };

  beforeEach(() => {
    getSessionMock.mockResolvedValue({ data: { session: mockSession }, error: null });
    onAuthStateChangeMock.mockImplementation((cb) => {
      // Don't fire any events automatically
      return { data: { subscription: { unsubscribe } } };
    });
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      then: (res) => res({ data: [], error: null }),
    });
  });

  it("does not show Auth screen when session exists", async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.queryByText("Food & Symptom Journal")).not.toBeInTheDocument(),
      { timeout: 3000 }
    );
  });
});

describe("App — subscription cleanup", () => {
  it("unsubscribes from auth state changes on unmount", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    onAuthStateChangeMock.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
    const { unmount } = render(<App />);
    await waitFor(() => screen.getByText("Food & Symptom Journal"));
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
