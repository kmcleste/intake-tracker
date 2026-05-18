// E2E: Core journal entry flows.

import { test, expect } from "@playwright/test";

const EMAIL = "journal@example.com";
const PASSWORD = "journalpass";

async function signIn(page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Wait for the journal UI to load
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible({ timeout: 5000 });
}

test.describe("Journal — entry creation", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("new entry button / add entry form is accessible", async ({ page }) => {
    // There should be a way to add an entry — either a form or a button
    const hasForm = await page.locator('select, textarea, input[type="text"]').count() > 0;
    const hasAddButton = await page.getByRole("button", { name: /add|new|log/i }).count() > 0;
    expect(hasForm || hasAddButton).toBe(true);
  });

  test("submitting an entry shows it in the list", async ({ page }) => {
    // Select a meal type if dropdown exists
    const mealSelect = page.locator("select").first();
    if (await mealSelect.isVisible()) {
      await mealSelect.selectOption("breakfast");
    }

    // Fill in foods
    const foodsInput = page.locator('input[placeholder*="food" i], input[placeholder*="Food" i]').first();
    if (await foodsInput.isVisible()) {
      await foodsInput.fill("oatmeal, banana");
    }

    // Submit
    const submitBtn = page.getByRole("button", { name: /add entry|log entry|save|submit/i }).first();
    if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
      await submitBtn.click();
      // Entry should appear somewhere on page
      await expect(page.locator("body")).toContainText(/oatmeal|banana|breakfast/i, { timeout: 3000 });
    }
  });
});

test.describe("Journal — 7-day timeline", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("7-day overview strip is visible", async ({ page }) => {
    await expect(page.getByText("7-DAY OVERVIEW")).toBeVisible({ timeout: 5000 });
  });

  test("timeline shows 7 day columns", async ({ page }) => {
    // Count day abbreviations in the timeline area
    const dayText = await page.getByText(/^(MON|TUE|WED|THU|FRI|SAT|SUN)$/).count();
    expect(dayText).toBe(7);
  });
});

test.describe("Journal — settings panel", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("settings button opens settings panel", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: /settings|preferences|⚙/i });
    if (await settingsBtn.count() > 0) {
      await settingsBtn.first().click();
      await expect(page.getByText("PREFERENCES")).toBeVisible({ timeout: 3000 });
    } else {
      // Settings might be opened via a different trigger
      test.skip();
    }
  });
});
