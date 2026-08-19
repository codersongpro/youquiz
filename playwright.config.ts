import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry"
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath: "/opt/pw-browsers/chromium" } } }
  ]
});
