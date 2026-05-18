// Smoke tests: verify the app boots and the critical render path works.
// These run against the Vite dev server with the mock Supabase client.

import { test, expect } from "@playwright/test";

test.describe("Smoke — app shell", () => {
  test("page loads without JS errors", async ({ page }) => {
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors.filter(m => !m.includes("ResizeObserver"))).toHaveLength(0);
  });

  test("renders Auth screen (not blank, not stuck on LOADING)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Food & Symptom Journal")).toBeVisible({ timeout: 8000 });
  });

  test("shows SIGN IN header by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("SIGN IN", { exact: true })).toBeVisible();
  });

  test("email and password inputs are present", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("submit button is present and disabled when fields empty", async ({ page }) => {
    await page.goto("/");
    const btn = page.getByRole("button", { name: /sign in/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });
});
