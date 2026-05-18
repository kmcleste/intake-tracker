import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Auth from "../../components/Auth";

// Selectors — Auth uses unstyled labels without for/id, so use type selectors.
const emailInput = (container) => container.querySelector('input[type="email"]');
const passwordInput = (container) => container.querySelector('input[type="password"]');

const signInMock = vi.fn();
const signUpMock = vi.fn();

vi.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args) => signInMock(...args),
      signUp: (...args) => signUpMock(...args),
    },
  },
}));

describe("Auth — initial render", () => {
  it("shows the app title", () => {
    render(<Auth />);
    expect(screen.getByText("Food & Symptom Journal")).toBeInTheDocument();
  });

  it("shows 'DAILY FOOD & WELLNESS JOURNAL' label", () => {
    render(<Auth />);
    expect(screen.getByText("DAILY FOOD & WELLNESS JOURNAL")).toBeInTheDocument();
  });

  it("starts in login mode", () => {
    render(<Auth />);
    expect(screen.getByText("SIGN IN")).toBeInTheDocument();
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("shows email and password inputs", () => {
    const { container } = render(<Auth />);
    expect(emailInput(container)).toBeInTheDocument();
    expect(passwordInput(container)).toBeInTheDocument();
  });

  it("shows Remember me checkbox in login mode", () => {
    render(<Auth />);
    expect(screen.getByText(/remember me/i)).toBeInTheDocument();
  });

  it("submit button is disabled when fields empty", () => {
    render(<Auth />);
    const btn = screen.getByRole("button", { name: /sign in/i });
    expect(btn).toBeDisabled();
  });
});

describe("Auth — mode switching", () => {
  it("switches to signup mode on toggle click", async () => {
    const user = userEvent.setup();
    render(<Auth />);
    await user.click(screen.getByText(/need an account/i));
    expect(screen.getByText("CREATE ACCOUNT")).toBeInTheDocument();
    expect(screen.getByText("Get started")).toBeInTheDocument();
  });

  it("hides Remember me in signup mode", async () => {
    const user = userEvent.setup();
    render(<Auth />);
    await user.click(screen.getByText(/need an account/i));
    expect(screen.queryByText(/remember me/i)).not.toBeInTheDocument();
  });

  it("shows 'Already have an account?' in signup mode", async () => {
    const user = userEvent.setup();
    render(<Auth />);
    await user.click(screen.getByText(/need an account/i));
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it("toggles back to login mode from signup", async () => {
    const user = userEvent.setup();
    render(<Auth />);
    await user.click(screen.getByText(/need an account/i));
    await user.click(screen.getByText(/already have an account/i));
    expect(screen.getByText("SIGN IN")).toBeInTheDocument();
  });

  it("clears error when switching modes", async () => {
    signInMock.mockResolvedValue({ error: { message: "Bad credentials" } });
    const user = userEvent.setup();
    const { container } = render(<Auth />);
    await user.type(emailInput(container), "a@b.com");
    await user.type(passwordInput(container), "wrong");
    fireEvent.submit(emailInput(container).closest("form"));
    await waitFor(() => screen.getByText("Bad credentials"));
    await user.click(screen.getByText(/need an account/i));
    expect(screen.queryByText("Bad credentials")).not.toBeInTheDocument();
  });
});

describe("Auth — login flow", () => {
  beforeEach(() => {
    signInMock.mockResolvedValue({ error: null });
  });

  it("enables submit when email and password are filled", async () => {
    const user = userEvent.setup();
    const { container } = render(<Auth />);
    await user.type(emailInput(container), "a@b.com");
    await user.type(passwordInput(container), "password");
    expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled();
  });

  it("calls signInWithPassword with form values", async () => {
    const user = userEvent.setup();
    const { container } = render(<Auth />);
    await user.type(emailInput(container), "user@example.com");
    await user.type(passwordInput(container), "secret123");
    fireEvent.submit(emailInput(container).closest("form"));
    await waitFor(() =>
      expect(signInMock).toHaveBeenCalledWith({ email: "user@example.com", password: "secret123" })
    );
  });

  it("shows error message on failed login", async () => {
    signInMock.mockResolvedValue({ error: { message: "Invalid credentials" } });
    const user = userEvent.setup();
    const { container } = render(<Auth />);
    await user.type(emailInput(container), "a@b.com");
    await user.type(passwordInput(container), "wrong");
    fireEvent.submit(emailInput(container).closest("form"));
    await waitFor(() => expect(screen.getByText("Invalid credentials")).toBeInTheDocument());
  });

  it("shows loading indicator during submission", async () => {
    let resolve;
    signInMock.mockReturnValue(new Promise(r => { resolve = r; }));
    const user = userEvent.setup();
    const { container } = render(<Auth />);
    await user.type(emailInput(container), "a@b.com");
    await user.type(passwordInput(container), "pw");
    fireEvent.submit(emailInput(container).closest("form"));
    expect(screen.getByText("…")).toBeInTheDocument();
    resolve({ error: null });
  });
});

describe("Auth — signup flow", () => {
  beforeEach(() => {
    signUpMock.mockResolvedValue({ data: { user: { identities: [{}] } }, error: null });
  });

  it("calls signUp with email and password", async () => {
    const user = userEvent.setup();
    const { container } = render(<Auth />);
    await user.click(screen.getByText(/need an account/i));
    await user.type(emailInput(container), "new@test.com");
    await user.type(passwordInput(container), "pass123");
    fireEvent.submit(emailInput(container).closest("form"));
    await waitFor(() =>
      expect(signUpMock).toHaveBeenCalledWith({ email: "new@test.com", password: "pass123" })
    );
  });

  it("shows success message and switches to login after signup", async () => {
    const user = userEvent.setup();
    const { container } = render(<Auth />);
    await user.click(screen.getByText(/need an account/i));
    await user.type(emailInput(container), "new@test.com");
    await user.type(passwordInput(container), "pass123");
    fireEvent.submit(emailInput(container).closest("form"));
    await waitFor(() => expect(screen.getByText(/account created/i)).toBeInTheDocument());
    expect(screen.getByText("SIGN IN")).toBeInTheDocument();
  });

  it("shows duplicate email error when identities array is empty — regression REG-003", async () => {
    signUpMock.mockResolvedValue({ data: { user: { identities: [] } }, error: null });
    const user = userEvent.setup();
    const { container } = render(<Auth />);
    await user.click(screen.getByText(/need an account/i));
    await user.type(emailInput(container), "existing@test.com");
    await user.type(passwordInput(container), "pass123");
    fireEvent.submit(emailInput(container).closest("form"));
    await waitFor(() => expect(screen.getByText(/already exists/i)).toBeInTheDocument());
  });

  it("switches to login mode after duplicate email detection", async () => {
    signUpMock.mockResolvedValue({ data: { user: { identities: [] } }, error: null });
    const user = userEvent.setup();
    const { container } = render(<Auth />);
    await user.click(screen.getByText(/need an account/i));
    await user.type(emailInput(container), "existing@test.com");
    await user.type(passwordInput(container), "pass123");
    fireEvent.submit(emailInput(container).closest("form"));
    await waitFor(() => expect(screen.getByText("SIGN IN")).toBeInTheDocument());
  });

  it("shows API error message on signup failure", async () => {
    signUpMock.mockResolvedValue({ data: {}, error: { message: "Signup disabled" } });
    const user = userEvent.setup();
    const { container } = render(<Auth />);
    await user.click(screen.getByText(/need an account/i));
    await user.type(emailInput(container), "new@test.com");
    await user.type(passwordInput(container), "pass123");
    fireEvent.submit(emailInput(container).closest("form"));
    await waitFor(() => expect(screen.getByText("Signup disabled")).toBeInTheDocument());
  });
});

describe("Auth — remember me", () => {
  it("checkbox is checked by default (no localStorage value)", () => {
    render(<Auth />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("checkbox is checked when localStorage says true", () => {
    localStorage.setItem("intake_remember", "true");
    render(<Auth />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("checkbox is unchecked when localStorage says false — regression REG-004", () => {
    localStorage.setItem("intake_remember", "false");
    render(<Auth />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("toggling checkbox updates localStorage", async () => {
    const user = userEvent.setup();
    render(<Auth />);
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    expect(localStorage.getItem("intake_remember")).toBe("false");
    await user.click(checkbox);
    expect(localStorage.getItem("intake_remember")).toBe("true");
  });
});
