import { expect, test } from "@playwright/test";

// Read-only checks: nothing here creates an order or changes data.

test("home shows the hero, trust strip and full collection", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Timepieces chosen to be worn for a");
  await expect(page.getByText("Checked before it ships")).toBeVisible();
  const cards = page.locator("#catalogue a[href^='/product/']");
  await expect(cards.first()).toBeVisible();
  const all = await cards.count();
  expect(all).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Accessories", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Accessories", level: 2 })).toBeVisible();
  expect(await cards.count()).toBeLessThan(all);
});

test("product opens as a dialog, Escape closes it, and the URL works on its own", async ({ page }) => {
  await page.goto("/watches");
  const first = page.locator("#catalogue a[href^='/product/']").first();
  const href = (await first.getAttribute("href"))!;
  await page.waitForLoadState("networkidle");
  await first.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(href);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL("/watches");

  await page.goto(href);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(ld!)["@type"]).toBe("Product");
});

test("bag: add, validate, remove (no order placed)", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const card = page.locator("#catalogue a[href^='/product/']").filter({ hasNotText: "Sold out" }).first();
  await card.click();
  await page.getByRole("dialog").getByRole("button", { name: "Add to bag" }).click();
  await expect(page.getByRole("button", { name: /^Bag\s*1\s*item$/ })).toBeVisible();

  await page.getByRole("button", { name: /^Bag\s*\d+/ }).click();
  const bag = page.getByRole("dialog", { name: "Your bag" });
  await expect(bag.getByRole("button", { name: "Send order on WhatsApp" })).toBeVisible();
  await bag.getByRole("button", { name: "Send order on WhatsApp" }).click();
  await expect(bag.getByRole("alert")).toHaveText("Add your name so we know who the order is for.");
  await expect(bag.getByLabel("Your name")).toBeFocused();

  await bag.getByRole("button", { name: /^Remove / }).click();
  await expect(bag.getByText("Your bag is empty.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /^Bag\s*0\s*items$/ })).toBeVisible();
});

test("robots, sitemap and admin protection", async ({ request, page }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/product/");

  const res = await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login\?next=/);
  expect(res?.headers()["x-robots-tag"]).toContain("noindex");
});
