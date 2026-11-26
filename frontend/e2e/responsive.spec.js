// Part 4 + 5: the layout adapts to phones and desktops, and is accessible.
import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, signUpWithApi, uniqueUser } from "./helpers";

const PAGES = ["/", "/discover", "/login", "/register", "/plan", "/trips", "/profile"];

test("no page scrolls sideways (logged out)", async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expectNoHorizontalScroll(page);
  }
});

test("no page scrolls sideways (logged in, with a trip)", async ({ page, request }) => {
  await signUpWithApi(page, request, uniqueUser("layout"));
  await page.goto("/discover");
  await page.getByRole("button", { name: "Add Balboa Park as a stop" }).click();
  await expect(page.getByRole("status")).toContainText("added to your trip");
  for (const path of PAGES.filter((p) => !["/login", "/register"].includes(p))) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expectNoHorizontalScroll(page);
  }
});

test("navigation matches the screen size", async ({ page, isMobile }) => {
  await page.goto("/discover");
  const desktopNav = page.getByRole("navigation", { name: "Main" });
  const tabBar = page.getByRole("navigation", { name: "Tabs" });

  if (isMobile) {
    // Phones: bottom tab bar + Menu button, no desktop links
    await expect(desktopNav).toBeHidden();
    await expect(tabBar).toBeVisible();
    await expect(tabBar.getByRole("link", { name: "Explore" })).toHaveAttribute("aria-current", "page");

    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog");
    await expect(menu.getByRole("link", { name: "My Trips" })).toBeVisible();
    await menu.getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole("dialog")).toBeHidden();

    await tabBar.getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL(/\/$/);
  } else {
    // Desktop: header links, no tab bar
    await expect(desktopNav).toBeVisible();
    await expect(tabBar).toBeHidden();
    await expect(desktopNav.getByRole("link", { name: "Discover" })).toHaveAttribute("aria-current", "page");
    await desktopNav.getByRole("link", { name: "My Trips" }).click();
    await expect(page).toHaveURL(/\/trips/);
  }
});

test("Discover puts the map beside the list on desktop and above it on phones", async ({ page, isMobile }) => {
  await page.goto("/discover");
  const map = page.getByRole("img", { name: /^Map with/ });
  const firstPlace = page.locator("main article").first();
  await expect(firstPlace).toBeVisible();
  const mapBox = await map.boundingBox();
  const placeBox = await firstPlace.boundingBox();
  if (isMobile) {
    expect(mapBox.y + mapBox.height).toBeLessThanOrEqual(placeBox.y);
  } else {
    expect(mapBox.x).toBeGreaterThan(placeBox.x + placeBox.width - 1);
  }
});

test("keyboard users can skip to the content", async ({ page, browserName }) => {
  test.skip(browserName === "webkit", "Safari only tabs to links when its 'Press Tab to highlight each item' setting is on");
  await page.goto("/discover");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("every image has alt text and every form field has a label", async ({ page }) => {
  for (const path of ["/", "/discover", "/login", "/register"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const unlabeled = await page.evaluate(() => {
      const problems = [];
      document.querySelectorAll("img").forEach((img) => !img.hasAttribute("alt") && problems.push(img.src));
      document.querySelectorAll("input, textarea, select").forEach((el) => {
        if (el.type === "hidden") return;
        const labelled = el.labels?.length || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
        if (!labelled) problems.push(`${el.tagName} ${el.name || el.id}`);
      });
      return problems;
    });
    expect(unlabeled, `on ${path}`).toEqual([]);
  }
});

test("security headers are sent", async ({ request }) => {
  const res = await request.get("/");
  const headers = res.headers();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
});
