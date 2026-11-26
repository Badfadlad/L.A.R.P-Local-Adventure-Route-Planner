// Main user flows, end to end: sign up -> log in -> find places -> build a
// route -> save -> complete -> review. Runs in every browser in playwright.config.mjs.
import { expect, test } from "@playwright/test";
import { ensurePlaces, signUpWithApi, signUpWithForm, uniqueUser } from "./helpers";

test.beforeAll(async ({ request }) => {
  await ensurePlaces(request);
});

test("sign up, log out, and log back in", async ({ page }) => {
  const user = uniqueUser("signup");
  await signUpWithForm(page, user);

  // Logged in: the profile shows our username
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Your Adventure Profile" })).toBeVisible();
  await expect(page.locator("main").getByText(`@${user.username}`)).toBeVisible();

  // Log out (desktop header button, or the Menu sheet on phones)
  const headerLogout = page.locator("header").getByRole("button", { name: "Log out" });
  if (await headerLogout.isVisible()) {
    await headerLogout.click();
  } else {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Log out" }).click();
  }
  await expect(page.getByRole("heading", { name: "You're not logged in" })).toBeVisible();

  // Wrong password shows an error, right password works
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  const form = page.locator("main form");
  await form.getByLabel("Username or email").fill(user.username);
  await form.getByLabel("Password").fill("wrong-password");
  await form.getByRole("button", { name: "Log in" }).click();
  await expect(form.getByRole("alert")).toContainText("Incorrect username or password");

  await form.getByLabel("Password").fill(user.password);
  await form.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeTruthy();
});

test("pages that need an account ask you to log in", async ({ page }) => {
  for (const path of ["/plan", "/trips", "/profile"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "You're not logged in" })).toBeVisible();
  }
});

test("homepage prompt opens Discover with matching filters", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("What kind of day do you want?").fill("Parks and lunch under $60");
  await page.getByRole("button", { name: "Plan my day" }).click();
  await expect(page).toHaveURL(/\/discover\?chips=park&budget=60/);
  await expect(page.getByRole("button", { name: "Parks" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Balboa Park" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Better Buzz Coffee" })).toHaveCount(0);
});

test("discover, build a route, save, complete and review a trip", async ({ page, request }) => {
  const user = uniqueUser("trip");
  await signUpWithApi(page, request, user);

  // --- Discover: search, filter, bookmark, add stops
  await page.goto("/discover");
  await page.getByRole("searchbox", { name: "Search places" }).fill("coffee");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("heading", { name: "Better Buzz Coffee" })).toBeVisible();
  await page.getByRole("button", { name: "Add Better Buzz Coffee as a stop" }).click();
  await expect(page.getByRole("status")).toContainText("Better Buzz Coffee was added to your trip");

  await page.getByRole("searchbox", { name: "Search places" }).fill("");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("button", { name: "Parks" }).click();
  await page.getByRole("button", { name: "Bookmark Balboa Park" }).click();
  await expect(page.getByRole("button", { name: "Remove Balboa Park from bookmarks" })).toBeVisible();
  await page.getByRole("button", { name: "Add Balboa Park as a stop" }).click();
  await expect(page.getByRole("button", { name: "Balboa Park is in your trip" })).toBeDisabled();
  await page.getByRole("button", { name: "Add Japanese Friendship Garden as a stop" }).click();
  await expect(page.getByRole("button", { name: "Japanese Friendship Garden is in your trip" })).toBeDisabled();

  // --- Route Builder
  await page.getByRole("link", { name: "View your route" }).click();
  await expect(page.getByRole("heading", { name: "Build your route" })).toBeVisible();
  const itinerary = page.locator("article[aria-label^='Stop ']");
  await expect(itinerary).toHaveCount(3);
  await expect(itinerary.first()).toHaveAttribute("aria-label", "Stop 1: Better Buzz Coffee");

  // Reorder with the arrow buttons
  await page.getByRole("button", { name: "Move Balboa Park later" }).click();
  await expect(itinerary.nth(2)).toHaveAttribute("aria-label", "Stop 3: Balboa Park");

  // Switch travel mode: driving costs money, walking doesn't
  await page.getByRole("radiogroup").first().getByRole("radio", { name: /Driving/ }).click();
  await expect(page.getByRole("radiogroup").first().getByRole("radio", { name: /Driving/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Transportation")).toBeVisible();

  // Budget: $12 + $16 + $0 stops, remaining is shown
  await expect(page.getByText("Remaining")).toBeVisible();

  // Save
  await page.getByRole("button", { name: "Save this trip" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Trip name").fill("E2E Saturday");
  await dialog.getByRole("button", { name: "Save trip" }).click();
  await expect(page).toHaveURL(/\/trips\?saved=1/);
  await expect(page.getByRole("status")).toContainText("Trip saved");
  await expect(page.getByRole("heading", { name: "E2E Saturday" })).toBeVisible();

  // --- Complete it
  await page.getByRole("button", { name: "Mark completed" }).click();
  await expect(page.getByRole("region", { name: "Travel history" }).getByText("E2E Saturday")).toBeVisible();

  // --- Review a place on the profile
  await page.goto("/profile");
  const review = page.getByRole("form", { name: /^Review / });
  await expect(review).toBeVisible();
  await review.getByRole("radio", { name: "5 stars" }).click();
  await review.getByLabel("Write a short review").fill("Great stop on our E2E day!");
  await review.getByRole("button", { name: "Submit Review" }).click();
  await expect(page.getByRole("status")).toContainText("Your review of");

  await page.getByRole("tab", { name: /Reviews \(1\)/ }).click();
  await expect(page.getByText("Great stop on our E2E day!")).toBeVisible();

  // Bookmark shows up too
  await page.getByRole("tab", { name: /Bookmarks \(1\)/ }).click();
  await expect(page.getByRole("tabpanel").getByRole("heading", { name: "Balboa Park" })).toBeVisible();
});

test("edit profile", async ({ page, request }) => {
  const user = uniqueUser("profile");
  await signUpWithApi(page, request, user);
  await page.goto("/profile");
  await page.getByRole("button", { name: "Edit Profile" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Display name").fill("Trail Blazer");
  await dialog.getByLabel("Home city").fill("San Diego, CA");
  await dialog.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("heading", { name: "Trail Blazer" })).toBeVisible();
  await expect(page.getByText(/San Diego, CA/).first()).toBeVisible();
});
