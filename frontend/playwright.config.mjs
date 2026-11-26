// End-to-end + UI tests with Playwright (Part 5 + extra credit).
// Runs the real site against the real backend in real browsers:
// Chrome, Firefox and Safari (WebKit) on desktop, plus phone-sized Chrome and Safari.
//
//   npx playwright install          # first time only: downloads the browsers
//   npm run test:e2e                # starts the frontend (and backend if needed) and runs everything
import { defineConfig, devices } from "@playwright/test";

const chromePath = process.env.PW_CHROMIUM_PATH; // optional: use an already-installed Chrome
const chromeLaunch = chromePath ? { launchOptions: { executablePath: chromePath } } : {};

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // tests share one backend database
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"], ...chromeLaunch } },
    { name: "desktop-firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "desktop-safari", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"], ...chromeLaunch } },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] } },
  ],
  webServer: [
    {
      // FastAPI backend. Reuses it if you already started it yourself.
      command: "python -m uvicorn app.main:app --app-dir src --port 8000",
      cwd: "../backend",
      url: "http://localhost:8000/docs",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "npm run build && npm run start",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 300_000,
    },
  ],
});
