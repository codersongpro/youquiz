import { test, expect } from "@playwright/test";

test("homepage shows the quiz builder and unconfigured status", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "YouQuiz" })).toBeVisible();
  await expect(page.getByText("Turn a YouTube video into a quiz that fits the learner.")).toBeVisible();
  await expect(page.getByText("Setup needed")).toBeVisible();
  await expect(page.getByText(/Add the Firebase and API values/)).toBeVisible();
});

test("history, review, and stats pages prompt sign-in when unconfigured", async ({ page }) => {
  await page.goto("/history");
  await expect(page.getByText("Sign in to see completed and in-progress quizzes here.")).toBeVisible();

  await page.goto("/review");
  await expect(page.getByText("Sign in to revisit questions that need another look.")).toBeVisible();

  await page.goto("/stats");
  await expect(page.getByText("Sign in to see your overall and recent results.")).toBeVisible();
});

test("quiz builder actions are disabled before signing in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Use URL" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Search" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Create quiz" })).toBeDisabled();
});
