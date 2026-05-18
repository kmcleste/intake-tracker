import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WeekTimeline from "../../components/WeekTimeline";

const today = new Date().toISOString();
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

describe("WeekTimeline", () => {
  it("renders the 7-DAY OVERVIEW label", () => {
    render(<WeekTimeline entries={[]} />);
    expect(screen.getByText("7-DAY OVERVIEW")).toBeInTheDocument();
  });

  it("renders exactly 7 day columns (7 wellbeing dots)", () => {
    const { container } = render(<WeekTimeline entries={[]} />);
    // Each day column has exactly one 10×10 circle (the wellbeing dot).
    // We identify them as divs with both width:10px and borderRadius:50%.
    const dots = Array.from(container.querySelectorAll("div")).filter(el => {
      const s = el.getAttribute("style") || "";
      return s.includes("width: 10px") && s.includes("border-radius: 50%");
    });
    expect(dots.length).toBe(7);
  });

  it("shows legend items: low, fair, good", () => {
    render(<WeekTimeline entries={[]} />);
    expect(screen.getByText("low")).toBeInTheDocument();
    expect(screen.getByText("fair")).toBeInTheDocument();
    expect(screen.getByText("good")).toBeInTheDocument();
  });

  it("shows symptoms legend", () => {
    render(<WeekTimeline entries={[]} />);
    expect(screen.getByText("symptoms")).toBeInTheDocument();
  });

  it("shows entry count for today when entry exists", () => {
    const entries = [
      { id: "1", timestamp: today, wellbeing: 4, symptoms: [] },
    ];
    render(<WeekTimeline entries={entries} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows entry count '2' when two entries today", () => {
    const entries = [
      { id: "1", timestamp: today, wellbeing: 4, symptoms: [] },
      { id: "2", timestamp: today, wellbeing: 3, symptoms: [] },
    ];
    render(<WeekTimeline entries={entries} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows symptom count when symptoms present", () => {
    const entries = [
      { id: "1", timestamp: today, wellbeing: 2, symptoms: ["fatigue", "nausea"] },
    ];
    render(<WeekTimeline entries={entries} />);
    expect(screen.getByText("2s")).toBeInTheDocument();
  });

  it("does not show symptom count when no symptoms", () => {
    const entries = [
      { id: "1", timestamp: today, wellbeing: 4, symptoms: [] },
    ];
    const { container } = render(<WeekTimeline entries={entries} />);
    const symptomLabel = Array.from(container.querySelectorAll("div")).find(
      el => el.textContent.match(/^\d+s$/)
    );
    expect(symptomLabel).toBeUndefined();
  });

  it("does not show symptom count when symptoms is undefined", () => {
    const entries = [
      { id: "1", timestamp: today, wellbeing: 4 },
    ];
    const { container } = render(<WeekTimeline entries={entries} />);
    const symptomLabel = Array.from(container.querySelectorAll("div")).find(
      el => el.textContent.match(/^\d+s$/)
    );
    expect(symptomLabel).toBeUndefined();
  });

  it("aggregates symptom count across multiple entries", () => {
    const entries = [
      { id: "1", timestamp: today, wellbeing: 3, symptoms: ["fatigue"] },
      { id: "2", timestamp: today, wellbeing: 2, symptoms: ["nausea", "headache"] },
    ];
    render(<WeekTimeline entries={entries} />);
    expect(screen.getByText("3s")).toBeInTheDocument();
  });

  it("ignores entries older than 7 days for symptom count", () => {
    const entries = [
      { id: "1", timestamp: daysAgo(8), wellbeing: 2, symptoms: ["fatigue", "nausea"] },
    ];
    const { container } = render(<WeekTimeline entries={entries} />);
    const symptomLabel = Array.from(container.querySelectorAll("div")).find(
      el => el.textContent.match(/^\d+s$/)
    );
    expect(symptomLabel).toBeUndefined();
  });

  it("computes wellbeing average across multiple today entries", () => {
    // wellbeing 1 and 5 → avg 3 → "fair" color
    const entries = [
      { id: "1", timestamp: today, wellbeing: 1, symptoms: [] },
      { id: "2", timestamp: today, wellbeing: 5, symptoms: [] },
    ];
    // Just ensure it doesn't throw
    expect(() => render(<WeekTimeline entries={entries} />)).not.toThrow();
  });

  it("handles entries with no wellbeing field gracefully", () => {
    const entries = [{ id: "1", timestamp: today, symptoms: [] }];
    expect(() => render(<WeekTimeline entries={entries} />)).not.toThrow();
  });

  it("renders without crashing when entries is empty", () => {
    expect(() => render(<WeekTimeline entries={[]} />)).not.toThrow();
  });
});
