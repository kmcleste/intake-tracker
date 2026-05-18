import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditEntryModal from "../../components/EditEntryModal";

const baseEntry = {
  id: "entry-1",
  user_id: "user-1",
  timestamp: "2024-01-15T12:00:00Z",
  meal: "Lunch",
  foods: "Chicken salad",
  notes: "Felt good after",
  tags: ["gluten-free"],
  wellbeing: 3,
  symptoms: ["headache"],
  photo_url: null,
  created_at: "2024-01-15T12:00:00Z",
  deleted_at: null,
};

describe("EditEntryModal — renders pre-filled fields", () => {
  it("meal select has the correct pre-filled value", () => {
    render(<EditEntryModal entry={baseEntry} onSave={vi.fn()} onClose={vi.fn()} />);
    const select = screen.getByRole("combobox");
    expect(select.value).toBe("Lunch");
  });

  it("foods textarea has the entry.foods value", () => {
    render(<EditEntryModal entry={baseEntry} onSave={vi.fn()} onClose={vi.fn()} />);
    const textarea = screen.getByDisplayValue("Chicken salad");
    expect(textarea).toBeInTheDocument();
  });

  it("notes textarea has the entry.notes value", () => {
    render(<EditEntryModal entry={baseEntry} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByDisplayValue("Felt good after")).toBeInTheDocument();
  });
});

describe("EditEntryModal — save button disabled when foods is empty", () => {
  it("save button is disabled when foods is cleared", async () => {
    const user = userEvent.setup();
    render(<EditEntryModal entry={baseEntry} onSave={vi.fn()} onClose={vi.fn()} />);
    const foodsTextarea = screen.getByDisplayValue("Chicken salad");
    await user.clear(foodsTextarea);
    const saveBtn = screen.getByRole("button", { name: /save/i });
    expect(saveBtn).toBeDisabled();
  });

  it("save button is disabled when foods is whitespace only", async () => {
    const user = userEvent.setup();
    const entry = { ...baseEntry, foods: "   " };
    render(<EditEntryModal entry={entry} onSave={vi.fn()} onClose={vi.fn()} />);
    const saveBtn = screen.getByRole("button", { name: /save/i });
    expect(saveBtn).toBeDisabled();
  });
});

describe("EditEntryModal — save button enabled when foods is non-empty", () => {
  it("save button is enabled when foods has content", () => {
    render(<EditEntryModal entry={baseEntry} onSave={vi.fn()} onClose={vi.fn()} />);
    const saveBtn = screen.getByRole("button", { name: /save/i });
    expect(saveBtn).toBeEnabled();
  });

  it("save button becomes enabled after typing in cleared foods", async () => {
    const user = userEvent.setup();
    render(<EditEntryModal entry={baseEntry} onSave={vi.fn()} onClose={vi.fn()} />);
    const foodsTextarea = screen.getByDisplayValue("Chicken salad");
    await user.clear(foodsTextarea);
    await user.type(foodsTextarea, "New food");
    const saveBtn = screen.getByRole("button", { name: /save/i });
    expect(saveBtn).toBeEnabled();
  });
});

describe("EditEntryModal — onSave called with correct shape", () => {
  it("calls onSave with the correct fields object", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<EditEntryModal entry={baseEntry} onSave={onSave} onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const callArg = onSave.mock.calls[0][0];
    expect(callArg).toHaveProperty("meal", "Lunch");
    expect(callArg).toHaveProperty("foods", "Chicken salad");
    expect(callArg).toHaveProperty("notes", "Felt good after");
    expect(callArg).toHaveProperty("tags");
    expect(callArg).toHaveProperty("wellbeing");
    expect(callArg).toHaveProperty("symptoms");
    // Should NOT include id, user_id, timestamp, photo_url, etc.
    expect(callArg).not.toHaveProperty("id");
    expect(callArg).not.toHaveProperty("user_id");
    expect(callArg).not.toHaveProperty("timestamp");
    expect(callArg).not.toHaveProperty("photo_url");
  });

  it("trims whitespace from foods and notes in onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const entry = { ...baseEntry, foods: "  pasta  ", notes: "  tasty  " };
    render(<EditEntryModal entry={entry} onSave={onSave} onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /save/i }));
    const callArg = onSave.mock.calls[0][0];
    expect(callArg.foods).toBe("pasta");
    expect(callArg.notes).toBe("tasty");
  });
});

describe("EditEntryModal — onClose called on cancel", () => {
  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EditEntryModal entry={baseEntry} onSave={vi.fn()} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when × close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EditEntryModal entry={baseEntry} onSave={vi.fn()} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /×/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("EditEntryModal — wellbeing selection", () => {
  it("clicking wellbeing button 4 results in wellbeing: 4 in onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    // Start with no wellbeing so we can clearly select 4
    const entry = { ...baseEntry, wellbeing: null };
    render(<EditEntryModal entry={entry} onSave={onSave} onClose={vi.fn()} />);
    // Click the button labeled "4"
    const btn4 = screen.getByRole("button", { name: /^4/ });
    await user.click(btn4);
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSave.mock.calls[0][0].wellbeing).toBe(4);
  });

  it("clicking the active wellbeing button again deselects it (null)", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const entry = { ...baseEntry, wellbeing: 3 };
    render(<EditEntryModal entry={entry} onSave={onSave} onClose={vi.fn()} />);
    // Click the button labeled "3" to deselect
    const btn3 = screen.getByRole("button", { name: /^3/ });
    await user.click(btn3);
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSave.mock.calls[0][0].wellbeing).toBeNull();
  });
});

describe("EditEntryModal — symptom toggle", () => {
  it("clicking a symptom not in entry adds it to symptoms in onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const entry = { ...baseEntry, symptoms: [] };
    render(<EditEntryModal entry={entry} onSave={onSave} onClose={vi.fn()} />);
    await user.click(screen.getByText("fatigue"));
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSave.mock.calls[0][0].symptoms).toContain("fatigue");
  });

  it("clicking a symptom already in entry removes it from symptoms in onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const entry = { ...baseEntry, symptoms: ["headache"] };
    render(<EditEntryModal entry={entry} onSave={onSave} onClose={vi.fn()} />);
    await user.click(screen.getByText("headache"));
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSave.mock.calls[0][0].symptoms).not.toContain("headache");
  });
});

describe("EditEntryModal — tag toggle", () => {
  it("clicking a common tag not in entry adds it to tags in onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const entry = { ...baseEntry, tags: [] };
    render(<EditEntryModal entry={entry} onSave={onSave} onClose={vi.fn()} />);
    await user.click(screen.getByText("dairy-free"));
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSave.mock.calls[0][0].tags).toContain("dairy-free");
  });

  it("clicking a common tag already in entry removes it from tags in onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const entry = { ...baseEntry, tags: ["gluten-free"] };
    render(<EditEntryModal entry={entry} onSave={onSave} onClose={vi.fn()} />);
    await user.click(screen.getByText("gluten-free"));
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSave.mock.calls[0][0].tags).not.toContain("gluten-free");
  });
});

describe("EditEntryModal — pre-filled wellbeing shown as selected", () => {
  it("entry with wellbeing: 3 shows the '3' button in a selected/active state", () => {
    render(<EditEntryModal entry={{ ...baseEntry, wellbeing: 3 }} onSave={vi.fn()} onClose={vi.fn()} />);
    // The button for 3 should exist and visually indicate active state
    // We verify by checking onSave still carries wellbeing: 3 without any interaction
    const btn3 = screen.getByRole("button", { name: /^3/ });
    expect(btn3).toBeInTheDocument();
    // The button should have an active/selected indicator via aria or style attribute
    // We'll verify the aria-pressed attribute or style indicating selection
    // Since this component uses style-based selection, we check the data attribute or aria-pressed
    expect(btn3).toHaveAttribute("data-active", "true");
  });

  it("entry with wellbeing: null shows no wellbeing button as selected", () => {
    render(<EditEntryModal entry={{ ...baseEntry, wellbeing: null }} onSave={vi.fn()} onClose={vi.fn()} />);
    [1, 2, 3, 4, 5].forEach(n => {
      const btn = screen.getByRole("button", { name: new RegExp(`^${n}`) });
      expect(btn).toHaveAttribute("data-active", "false");
    });
  });
});
