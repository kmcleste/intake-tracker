import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPanel from "../../components/SettingsPanel";

const rpcMock = vi.fn().mockResolvedValue({ error: null });

vi.mock("../../lib/supabase", () => ({
  supabase: { rpc: (...args) => rpcMock(...args) },
}));

const defaultSettings = { theme: "light", fontSize: "md", font: "serif" };
const defaultProps = {
  settings: defaultSettings,
  update: vi.fn(),
  onClose: vi.fn(),
  notifEnabled: false,
  onToggleNotif: vi.fn(),
};

describe("SettingsPanel — rendering", () => {
  it("renders PREFERENCES header", () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText("PREFERENCES")).toBeInTheDocument();
  });

  it("renders Theme row", () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });

  it("renders Text Size row", () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText("Text Size")).toBeInTheDocument();
  });

  it("renders Font row", () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText("Font")).toBeInTheDocument();
  });

  it("renders Data & Privacy section", () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText("Data & Privacy")).toBeInTheDocument();
  });

  it("renders Daily reminder row", () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText("Daily reminder")).toBeInTheDocument();
  });

  it("renders delete account button", () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText(/delete my account/i)).toBeInTheDocument();
  });

  it("renders close button", () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText("×")).toBeInTheDocument();
  });

  it("calls onClose when × is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByText("×"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("SettingsPanel — theme selection", () => {
  it("calls update('theme', 'dark') when Dark is clicked", async () => {
    const update = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} update={update} />);
    await user.click(screen.getByText("Dark"));
    expect(update).toHaveBeenCalledWith("theme", "dark");
  });

  it("calls update('theme', 'light') when Light is clicked", async () => {
    const update = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} settings={{ ...defaultSettings, theme: "dark" }} update={update} />);
    await user.click(screen.getByText("Light"));
    expect(update).toHaveBeenCalledWith("theme", "light");
  });

  it("calls update('theme', 'auto') when Auto is clicked", async () => {
    const update = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} update={update} />);
    await user.click(screen.getByText("Auto"));
    expect(update).toHaveBeenCalledWith("theme", "auto");
  });
});

describe("SettingsPanel — font size selection", () => {
  it("calls update('fontSize', 'sm') when Small is clicked", async () => {
    const update = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} update={update} />);
    await user.click(screen.getByText("Small"));
    expect(update).toHaveBeenCalledWith("fontSize", "sm");
  });

  it("calls update('fontSize', 'lg') when Large is clicked", async () => {
    const update = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} update={update} />);
    await user.click(screen.getByText("Large"));
    expect(update).toHaveBeenCalledWith("fontSize", "lg");
  });

  it("calls update('fontSize', 'xl') when X-Large is clicked", async () => {
    const update = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} update={update} />);
    await user.click(screen.getByText("X-Large"));
    expect(update).toHaveBeenCalledWith("fontSize", "xl");
  });

  it("calls update('fontSize', 'md') when Medium is clicked", async () => {
    const update = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} settings={{ ...defaultSettings, fontSize: "sm" }} update={update} />);
    await user.click(screen.getByText("Medium"));
    expect(update).toHaveBeenCalledWith("fontSize", "md");
  });
});

describe("SettingsPanel — font selection", () => {
  it("calls update('font', 'sans') when Sans-serif is clicked", async () => {
    const update = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} update={update} />);
    await user.click(screen.getByText("Sans-serif"));
    expect(update).toHaveBeenCalledWith("font", "sans");
  });

  it("calls update('font', 'serif') when Serif is clicked", async () => {
    const update = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} settings={{ ...defaultSettings, font: "sans" }} update={update} />);
    await user.click(screen.getByText("Serif"));
    expect(update).toHaveBeenCalledWith("font", "serif");
  });
});

describe("SettingsPanel — daily reminder toggle", () => {
  it("shows OFF when notifEnabled is false", () => {
    render(<SettingsPanel {...defaultProps} notifEnabled={false} />);
    expect(screen.getByText("OFF")).toBeInTheDocument();
  });

  it("shows ON when notifEnabled is true", () => {
    render(<SettingsPanel {...defaultProps} notifEnabled={true} />);
    expect(screen.getByText("ON")).toBeInTheDocument();
  });

  it("calls onToggleNotif when toggled", async () => {
    const onToggleNotif = vi.fn();
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} onToggleNotif={onToggleNotif} />);
    await user.click(screen.getByText("OFF"));
    expect(onToggleNotif).toHaveBeenCalled();
  });
});

describe("SettingsPanel — delete account", () => {
  beforeEach(() => {
    rpcMock.mockResolvedValue({ error: null });
  });

  it("shows confirmation step after first click", async () => {
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} />);
    await user.click(screen.getByText(/delete my account/i));
    expect(screen.getByText(/yes, delete everything/i)).toBeInTheDocument();
  });

  it("shows warning text in confirmation step", async () => {
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} />);
    await user.click(screen.getByText(/delete my account/i));
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it("cancel button restores initial state", async () => {
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} />);
    await user.click(screen.getByText(/delete my account/i));
    await user.click(screen.getByText("Cancel"));
    expect(screen.queryByText(/yes, delete everything/i)).not.toBeInTheDocument();
    expect(screen.getByText(/delete my account/i)).toBeInTheDocument();
  });

  it("calls supabase.rpc('delete_user_account') on confirmation", async () => {
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} />);
    await user.click(screen.getByText(/delete my account/i));
    await user.click(screen.getByText(/yes, delete everything/i));
    await waitFor(() => expect(rpcMock).toHaveBeenCalledWith("delete_user_account"));
  });

  it("shows error message if rpc returns error", async () => {
    rpcMock.mockResolvedValue({ error: { message: "Deletion failed" } });
    const user = userEvent.setup();
    render(<SettingsPanel {...defaultProps} />);
    await user.click(screen.getByText(/delete my account/i));
    await user.click(screen.getByText(/yes, delete everything/i));
    await waitFor(() => expect(screen.getByText("Deletion failed")).toBeInTheDocument());
  });
});
