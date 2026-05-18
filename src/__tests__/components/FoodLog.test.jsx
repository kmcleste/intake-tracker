import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FoodLog from "../../components/FoodLog";

const session = { user: { id: "user-1", email: "test@example.com" } };

const defaultProps = {
  session,
  caregiverFor: [],
  pendingInvites: [],
  settings: { theme: "auto", fontSize: "md", fontFamily: "serif", inactivityTimeout: 30 },
  onUpdateSetting: vi.fn(),
  onAcceptInvite: vi.fn(),
  onDeclineInvite: vi.fn(),
  onSwitchToCaregiver: vi.fn(),
  onLinksChanged: vi.fn(),
};

const baseEntry = {
  id: "entry-1",
  user_id: "user-1",
  timestamp: new Date().toISOString(),
  meal: "Breakfast",
  foods: "Oatmeal",
  notes: "Good meal",
  tags: ["gluten-free"],
  wellbeing: 4,
  symptoms: ["headache"],
  photo_url: null,
  created_at: new Date().toISOString(),
  deleted_at: null,
};

function seed(entries = [baseEntry]) {
  localStorage.setItem("intake_entries", JSON.stringify(entries));
  localStorage.setItem("intake_caregiver_notes", JSON.stringify([]));
}

// ── Entry Editing ────────────────────────────────────────────────────────────

describe("FoodLog — entry editing", () => {
  it("EDIT button appears when an entry card is expanded", async () => {
    const user = userEvent.setup();
    seed();
    render(<FoodLog {...defaultProps} />);
    await waitFor(() => expect(screen.getByText("Oatmeal")).toBeInTheDocument());
    await user.click(screen.getByText("Oatmeal"));
    expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
  });

  it("clicking EDIT opens EditEntryModal with EDIT ENTRY header", async () => {
    const user = userEvent.setup();
    seed();
    render(<FoodLog {...defaultProps} />);
    await waitFor(() => expect(screen.getByText("Oatmeal")).toBeInTheDocument());
    await user.click(screen.getByText("Oatmeal"));
    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    expect(screen.getByText("EDIT ENTRY")).toBeInTheDocument();
  });

  it("EditEntryModal is pre-filled with the selected entry's foods", async () => {
    const user = userEvent.setup();
    seed();
    render(<FoodLog {...defaultProps} />);
    await waitFor(() => expect(screen.getByText("Oatmeal")).toBeInTheDocument());
    await user.click(screen.getByText("Oatmeal"));
    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    expect(screen.getByDisplayValue("Oatmeal")).toBeInTheDocument();
  });

  it("saving edits closes EditEntryModal", async () => {
    const user = userEvent.setup();
    seed();
    render(<FoodLog {...defaultProps} />);
    await waitFor(() => expect(screen.getByText("Oatmeal")).toBeInTheDocument());
    await user.click(screen.getByText("Oatmeal"));
    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() =>
      expect(screen.queryByText("EDIT ENTRY")).not.toBeInTheDocument()
    );
  });

  it("saved edits are reflected in the entry list", async () => {
    const user = userEvent.setup();
    seed();
    render(<FoodLog {...defaultProps} />);
    await waitFor(() => expect(screen.getByText("Oatmeal")).toBeInTheDocument());
    await user.click(screen.getByText("Oatmeal"));
    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    const foodsTextarea = screen.getByDisplayValue("Oatmeal");
    await user.clear(foodsTextarea);
    await user.type(foodsTextarea, "Eggs and toast");
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() =>
      expect(screen.queryByText("EDIT ENTRY")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Eggs and toast")).toBeInTheDocument();
  });

  it("cancelling edit closes EditEntryModal without changing the entry", async () => {
    const user = userEvent.setup();
    seed();
    render(<FoodLog {...defaultProps} />);
    await waitFor(() => expect(screen.getByText("Oatmeal")).toBeInTheDocument());
    await user.click(screen.getByText("Oatmeal"));
    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() =>
      expect(screen.queryByText("EDIT ENTRY")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Oatmeal")).toBeInTheDocument();
  });
});

// ── ExportModal format tabs ──────────────────────────────────────────────────

describe("FoodLog — ExportModal format tabs", () => {
  beforeEach(() => seed());

  async function openExport(user) {
    render(<FoodLog {...defaultProps} />);
    await waitFor(() => expect(screen.getByText("Oatmeal")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /^export$/i }));
  }

  it("ExportModal shows TEXT, CSV, and JSON format tabs", async () => {
    const user = userEvent.setup();
    await openExport(user);
    expect(screen.getByRole("button", { name: /^text$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^csv$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^json$/i })).toBeInTheDocument();
  });

  it("ExportModal has a Download button", async () => {
    const user = userEvent.setup();
    await openExport(user);
    expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument();
  });

  it("TEXT tab is active by default and textarea shows text format", async () => {
    const user = userEvent.setup();
    await openExport(user);
    const textBtn = screen.getByRole("button", { name: /^text$/i });
    expect(textBtn).toHaveAttribute("data-active", "true");
    const textarea = document.querySelector("textarea");
    expect(textarea.value).toMatch(/===.*===/); // date header pattern
  });

  it("switching to CSV tab shows CSV header row in textarea", async () => {
    const user = userEvent.setup();
    await openExport(user);
    await user.click(screen.getByRole("button", { name: /^csv$/i }));
    const textarea = document.querySelector("textarea");
    expect(textarea.value).toMatch(/Date,Time,Meal/);
  });

  it("switching to JSON tab shows JSON array in textarea", async () => {
    const user = userEvent.setup();
    await openExport(user);
    await user.click(screen.getByRole("button", { name: /^json$/i }));
    const textarea = document.querySelector("textarea");
    expect(textarea.value.trim()).toMatch(/^\[/);
  });

  it("switching back to TEXT tab shows text format again", async () => {
    const user = userEvent.setup();
    await openExport(user);
    await user.click(screen.getByRole("button", { name: /^csv$/i }));
    await user.click(screen.getByRole("button", { name: /^text$/i }));
    const textarea = document.querySelector("textarea");
    expect(textarea.value).toMatch(/===/);
  });

  it("Download button triggers a file download (anchor click)", async () => {
    const user = userEvent.setup();
    // Spy on document.createElement to intercept anchor creation
    const origCreate = document.createElement.bind(document);
    const clickSpy = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = origCreate(tag);
      if (tag === "a") el.click = clickSpy;
      return el;
    });
    await openExport(user);
    await user.click(screen.getByRole("button", { name: /download/i }));
    expect(clickSpy).toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

// ── Trends panel ─────────────────────────────────────────────────────────────

describe("FoodLog — Trends button and panel", () => {
  it("TRENDS button is visible in the header", async () => {
    seed([]);
    render(<FoodLog {...defaultProps} />);
    await waitFor(() =>
      expect(screen.queryByText("LOADING ENTRIES…")).not.toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /trends/i })).toBeInTheDocument();
  });

  it("clicking TRENDS opens the TrendsPanel", async () => {
    const user = userEvent.setup();
    seed([]);
    render(<FoodLog {...defaultProps} />);
    await waitFor(() =>
      expect(screen.queryByText("LOADING ENTRIES…")).not.toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: /trends/i }));
    expect(screen.getByText(/WELLNESS TRENDS/i)).toBeInTheDocument();
  });

  it("TrendsPanel has a close button that closes the panel", async () => {
    const user = userEvent.setup();
    seed([]);
    render(<FoodLog {...defaultProps} />);
    await waitFor(() =>
      expect(screen.queryByText("LOADING ENTRIES…")).not.toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: /trends/i }));
    await user.click(screen.getByRole("button", { name: /×/i }));
    await waitFor(() =>
      expect(screen.queryByText(/WELLNESS TRENDS/i)).not.toBeInTheDocument()
    );
  });
});
