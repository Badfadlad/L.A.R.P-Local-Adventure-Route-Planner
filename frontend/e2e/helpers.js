import { expect } from "@playwright/test";

export const API = process.env.E2E_API_URL || "http://localhost:8000/api/v1";

/** A username nobody has used yet (letters, digits and _ only, like the backend requires). */
export function uniqueUser(prefix = "e2e") {
  const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  return { username: `${prefix}_${id}`, email: `${prefix}_${id}@example.com`, password: "password123" };
}

/** Sign up through the real form. Ends logged in on the homepage. */
export async function signUpWithForm(page, user) {
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const form = page.locator("main form");
  await expect(async () => {
    await form.getByLabel("Username").fill(user.username);
    await form.getByLabel("Email").fill(user.email);
    await form.getByLabel("Password", { exact: true }).fill(user.password);
    await form.getByLabel("Confirm password").fill(user.password);
    await form.getByRole("button", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 3000 });
  }).toPass({ timeout: 30_000 });
}

/** Faster: create the account through the API and drop the token into the browser. */
export async function signUpWithApi(page, request, user) {
  const reg = await request.post(`${API}/auth/register`, {
    data: { username: user.username, email: user.email, password: user.password },
  });
  expect(reg.ok()).toBeTruthy();
  const login = await request.post(`${API}/auth/login`, {
    form: { username: user.username, password: user.password },
  });
  const { access_token } = await login.json();
  await page.addInitScript((token) => localStorage.setItem("token", token), access_token);
  return access_token;
}

/** Make sure there are places to discover (same data as backend/scripts/seed.py). */
export async function ensurePlaces(request) {
  const res = await request.get(`${API}/places`);
  const places = await res.json();
  if (places.some((p) => p.name === "Balboa Park")) return;
  throw new Error("No sample places found. Run `python scripts/seed.py` in the backend folder first.");
}

/** Fail if the page is wider than the screen (horizontal scrolling = broken mobile layout). */
export async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "page should not scroll sideways").toBeLessThanOrEqual(1);
}
