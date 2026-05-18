import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrendsPanel from "../../components/TrendsPanel";

const onClose = vi.fn();

const baseEntry = (overrides = {}) => ({
  id: crypto.randomUUID(),
  user_id: "user-1",
  timestamp: new Date().toISOString(),
  meal: "Breakfast",
  foods: "Oatmeal",
  notes: "",
  tags: [],
  wellbeing: 4,
  symptoms: ["headache"],
  photo_url: null,
  created_at: new Date().toISOString(),
  deleted_at: null,
  ...overrides,
});

describe("TrendsPanel — empty state", () => {
  it("renders without crashing when entries is empty", () => {
    render(<TrendsPanel entries={[]} onClose={onClose} />);
    expect(screen.getByText(/WELLNESS TRENDS/i)).toBeInTheDocument();
  });

  it("shows a no-data message when there are no entries", () => {
    render(<TrendsPanel entries={[]} onClose={onClose} />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it("has a close button that calls onClose", async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    render(<TrendsPanel entries={[]} onClose={close} />);
    await user.click(screen.getByRole("button", { name: /×/i }));
    expect(close).toHaveBeenCalled();
  });
});

describe("TrendsPanel — with data", () => {
  it("renders without crashing with entries that have wellbeing and symptoms", () => {
    const entries = [baseEntry(), baseEntry({ wellbeing: 3, symptoms: ["fatigue", "headache"] })];
    render(<TrendsPanel entries={entries} onClose={onClose} />);
    expect(screen.getByText(/WELLNESS TRENDS/i)).toBeInTheDocument();
  });

  it("shows wellbeing section label", () => {
    const entries = [baseEntry()];
    render(<TrendsPanel entries={entries} onClose={onClose} />);
    expect(screen.getByText(/wellbeing/i)).toBeInTheDocument();
  });

  it("shows symptom section when entries have symptoms", () => {
    const entries = [baseEntry({ symptoms: ["headache", "fatigue"] })];
    render(<TrendsPanel entries={entries} onClose={onClose} />);
    expect(screen.getByText(/symptom/i)).toBeInTheDocument();
  });
});

describe("TrendsPanel — day range selector", () => {
  it("shows 7 DAYS and 30 DAYS buttons", () => {
    render(<TrendsPanel entries={[]} onClose={onClose} />);
    expect(screen.getByRole("button", { name: /7 days/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /30 days/i })).toBeInTheDocument();
  });

  it("30 DAYS button is active by default", () => {
    render(<TrendsPanel entries={[]} onClose={onClose} />);
    expect(screen.getByRole("button", { name: /30 days/i })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("button", { name: /7 days/i })).toHaveAttribute("data-active", "false");
  });

  it("clicking 7 DAYS sets it as active", async () => {
    const user = userEvent.setup();
    render(<TrendsPanel entries={[]} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /7 days/i }));
    expect(screen.getByRole("button", { name: /7 days/i })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("button", { name: /30 days/i })).toHaveAttribute("data-active", "false");
  });
});
