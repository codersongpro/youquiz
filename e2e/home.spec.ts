import { test, expect } from "@playwright/test";

const PASSWORD = "e2e-test-password";

test("redirects unauthenticated visitors to the login page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "YouQuiz" })).toBeVisible();
});

test("returns to the originally requested page after signing in", async ({ page }) => {
  await page.goto("/history");
  await expect(page).toHaveURL(/\/login\?next=%2Fhistory/);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/history$/);
});

test("rejects an incorrect password", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Incorrect password.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("signs in, stays signed in across pages, then signs out cleanly", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "YouQuiz" })).toBeVisible();
  await expect(page.getByText("Turn a YouTube video into a quiz that fits the learner.")).toBeVisible();

  await page.goto("/history");
  await expect(page).not.toHaveURL(/\/login/);

  await page.getByRole("link", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});
