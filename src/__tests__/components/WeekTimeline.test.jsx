import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WeekTimeline from "../../components/WeekTimeline";

const today = new Date().toISOString();
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

async function renderOpen(entries = []) {
  const user = userEvent.setup();
  const { container } = render(<WeekTimeline entries={entries} />);
  await user.click(screen.getByText("7-DAY OVERVIEW"));
  return { user, container };
}

describe("WeekTimeline — header / toggle", () => {
  it("renders the 7-DAY OVERVIEW label", () => {
    render(<WeekTimeline entries={[]} />);
    expect(screen.getByText("7-DAY OVERVIEW")).toBeInTheDocument();
  });

  it("is collapsed by default — day dots not visible", () => {
    const { container } = render(<WeekTimeline entries={[]} />);
    const dots = Array.from(container.querySelectorAll("div")).filter(el => {
      const s = el.getAttribute("style") || "";
      return s.includes("width: 10px") && s.includes("border-radius: 50%");
    });
    expect(dots.length).toBe(0);
  });

  it("expands to show 7 day columns when clicked", async () => {
    const { container } = await renderOpen([]);
    const dots = Array.from(container.querySelectorAll("div")).filter(el => {
      const s = el.getAttribute("style") || "";
      return s.includes("width: 10px") && s.includes("border-radius: 50%");
    });
    expect(dots.length).toBe(7);
  });

  it("collapses again on second click", async () => {
    const user = userEvent.setup();
    const { container } = render(<WeekTimeline entries={[]} />);
    await user.click(screen.getByText("7-DAY OVERVIEW"));
    await user.click(screen.getByText("7-DAY OVERVIEW"));
    const dots = Array.from(container.querySelectorAll("div")).filter(el => {
      const s = el.getAttribute("style") || "";
      return s.includes("width: 10px") && s.includes("border-radius: 50%");
    });
    expect(dots.length).toBe(0);
  });
});

describe("WeekTimeline — legend", () => {
  it("shows legend items: low, fair, good, symptoms when expanded", async () => {
    await renderOpen();
    expect(screen.getByText("low")).toBeInTheDocument();
    expect(screen.getByText("fair")).toBeInTheDocument();
    expect(screen.getByText("good")).toBeInTheDocument();
    expect(screen.getByText("symptoms")).toBeInTheDocument();
  });

  it("legend items are not visible when collapsed", () => {
    render(<WeekTimeline entries={[]} />);
    expect(screen.queryByText("low")).not.toBeInTheDocument();
    expect(screen.queryByText("symptoms")).not.toBeInTheDocument();
  });
});

describe("WeekTimeline — entry and symptom counts", () => {
  it("shows entry count for today when entry exists", async () => {
    await renderOpen([{ id: "1", timestamp: today, wellbeing: 4, symptoms: [] }]);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows entry count '2' when two entries today", async () => {
    await renderOpen([
      { id: "1", timestamp: today, wellbeing: 4, symptoms: [] },
      { id: "2", timestamp: today, wellbeing: 3, symptoms: [] },
    ]);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows symptom count with 's' suffix when symptoms present", async () => {
    await renderOpen([
      { id: "1", timestamp: today, wellbeing: 2, symptoms: ["fatigue", "nausea"] },
    ]);
    expect(screen.getByText("2s")).toBeInTheDocument();
  });

  it("does not show symptom count when no symptoms", async () => {
    const { container } = await renderOpen([
      { id: "1", timestamp: today, wellbeing: 4, symptoms: [] },
    ]);
    const symptomEl = Array.from(container.querySelectorAll("div")).find(
      el => el.textContent.match(/^\d+s$/)
    );
    expect(symptomEl).toBeUndefined();
  });

  it("does not show symptom count when symptoms is undefined", async () => {
    const { container } = await renderOpen([
      { id: "1", timestamp: today, wellbeing: 4 },
    ]);
    const symptomEl = Array.from(container.querySelectorAll("div")).find(
      el => el.textContent.match(/^\d+s$/)
    );
    expect(symptomEl).toBeUndefined();
  });

  it("aggregates symptom count across multiple entries", async () => {
    await renderOpen([
      { id: "1", timestamp: today, wellbeing: 3, symptoms: ["fatigue"] },
      { id: "2", timestamp: today, wellbeing: 2, symptoms: ["nausea", "headache"] },
    ]);
    expect(screen.getByText("3s")).toBeInTheDocument();
  });

  it("ignores entries older than 7 days for symptom count", async () => {
    const { container } = await renderOpen([
      { id: "1", timestamp: daysAgo(8), wellbeing: 2, symptoms: ["fatigue", "nausea"] },
    ]);
    const symptomEl = Array.from(container.querySelectorAll("div")).find(
      el => el.textContent.match(/^\d+s$/)
    );
    expect(symptomEl).toBeUndefined();
  });
});

describe("WeekTimeline — edge cases", () => {
  it("computes wellbeing average across multiple today entries without throwing", async () => {
    await renderOpen([
      { id: "1", timestamp: today, wellbeing: 1, symptoms: [] },
      { id: "2", timestamp: today, wellbeing: 5, symptoms: [] },
    ]);
  });

  it("handles entries with no wellbeing field gracefully", async () => {
    await renderOpen([{ id: "1", timestamp: today, symptoms: [] }]);
  });

  it("renders without crashing when entries is empty", () => {
    expect(() => render(<WeekTimeline entries={[]} />)).not.toThrow();
  });
});
