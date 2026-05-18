// E2E: Full authentication flows against the mock Supabase client.

import { test, expect } from "@playwright/test";

const EMAIL = "testuser@example.com";
const PASSWORD = "test-password-123";

async function signIn(page) {
  await page.goto("/");
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test.describe("Auth — sign in", () => {
  test.beforeEach(async ({ page }) => {
    // Clear mock session/localStorage state
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("successful login shows the journal UI", async ({ page }) => {
    await signIn(page);
    await expect(page.getByText(/DAILY FOOD JOURNAL|Food Journal|JOURNAL/i)).toBeVisible({ timeout: 5000 });
  });

  test("login with empty password shows disabled button", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="email"]').fill(EMAIL);
    const btn = page.getByRole("button", { name: /sign in/i });
    await expect(btn).toBeDisabled();
  });

  test("login with empty email shows disabled button", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="password"]').fill(PASSWORD);
    const btn = page.getByRole("button", { name: /sign in/i });
    await expect(btn).toBeDisabled();
  });
});

test.describe("Auth — mode switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("clicking 'Need an account' switches to signup mode", async ({ page }) => {
    await page.goto("/");
    await page.getByText(/need an account/i).click();
    await expect(page.getByText("CREATE ACCOUNT")).toBeVisible();
  });

  test("remember me checkbox is visible in login mode", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/remember me/i)).toBeVisible();
  });

  test("remember me checkbox is NOT visible in signup mode", async ({ page }) => {
    await page.goto("/");
    await page.getByText(/need an account/i).click();
    await expect(page.getByText(/remember me/i)).not.toBeVisible();
  });

  test("toggling back from signup to login shows SIGN IN", async ({ page }) => {
    await page.goto("/");
    await page.getByText(/need an account/i).click();
    await page.getByText(/already have an account/i).click();
    await expect(page.getByText("SIGN IN")).toBeVisible();
  });
});

test.describe("Auth — sign out", () => {
  test("sign out returns to auth screen", async ({ page }) => {
    await signIn(page);
    // Find and click sign out
    const signOutBtn = page.getByRole("button", { name: /sign out/i });
    await expect(signOutBtn).toBeVisible({ timeout: 5000 });
    await signOutBtn.click();
    await expect(page.getByText("Food & Symptom Journal")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Auth — remember me persistence", () => {
  test("unchecking remember me persists to localStorage", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const checkbox = page.getByRole("checkbox");
    await checkbox.uncheck();
    const val = await page.evaluate(() => localStorage.getItem("intake_remember"));
    expect(val).toBe("false");
  });

  test("checking remember me persists to localStorage", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("intake_remember", "false"));
    await page.reload();
    const checkbox = page.getByRole("checkbox");
    await checkbox.check();
    const val = await page.evaluate(() => localStorage.getItem("intake_remember"));
    expect(val).toBe("true");
  });
});
