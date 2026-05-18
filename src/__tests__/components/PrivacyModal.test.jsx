import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PrivacyModal from "../../components/PrivacyModal";

describe("PrivacyModal", () => {
  it("renders the Privacy heading", () => {
    render(<PrivacyModal onClose={vi.fn()} />);
    expect(screen.getByText("Privacy")).toBeInTheDocument();
  });

  it("renders all six privacy sections", () => {
    render(<PrivacyModal onClose={vi.fn()} />);
    expect(screen.getByText("What we collect")).toBeInTheDocument();
    expect(screen.getByText("Who can see it")).toBeInTheDocument();
    expect(screen.getByText("Where it's stored")).toBeInTheDocument();
    expect(screen.getByText("What we don't do")).toBeInTheDocument();
    expect(screen.getByText("Your rights")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("mentions food entries in What we collect", () => {
    render(<PrivacyModal onClose={vi.fn()} />);
    expect(screen.getByText(/food entries/i)).toBeInTheDocument();
  });

  it("mentions care team in Who can see it", () => {
    render(<PrivacyModal onClose={vi.fn()} />);
    expect(screen.getByText(/care team/i)).toBeInTheDocument();
  });

  it("mentions Supabase in Where it's stored", () => {
    render(<PrivacyModal onClose={vi.fn()} />);
    expect(screen.getByText(/supabase/i)).toBeInTheDocument();
  });

  it("mentions data export in Your rights", () => {
    render(<PrivacyModal onClose={vi.fn()} />);
    expect(screen.getByText(/export your data/i)).toBeInTheDocument();
  });

  it("does not mention selling data in What we don't do", () => {
    render(<PrivacyModal onClose={vi.fn()} />);
    expect(screen.getByText(/don't sell your data/i)).toBeInTheDocument();
  });

  it("renders close button", () => {
    render(<PrivacyModal onClose={vi.fn()} />);
    expect(screen.getByText("×")).toBeInTheDocument();
  });

  it("calls onClose when × is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<PrivacyModal onClose={onClose} />);
    await user.click(screen.getByText("×"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders without crashing when onClose is a no-op", () => {
    expect(() => render(<PrivacyModal onClose={() => {}} />)).not.toThrow();
  });
});
