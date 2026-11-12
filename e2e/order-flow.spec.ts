import { expect, test, type Page } from "@playwright/test";

/**
 * Full path from CLAUDE.md: add to bag -> place order -> admin sees it as New
 * -> mark Paid -> stock drops. Then it cancels the order so stock is restored.
 *
 * WRITES TO THE DATABASE. Runs only when admin credentials are set:
 *   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... pnpm test:e2e
 * Use a staging/dev Supabase project, not the live shop.
 */
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;
const PRODUCT = process.env.E2E_PRODUCT ?? "Single Watch Winder";

test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run the order flow.");
test.use({ viewport: { width: 1280, height: 900 } });

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function stockOf(page: Page) {
  await page.goto("/admin/products");
  const row = page.locator(`li[data-product-name="${PRODUCT}"]`);
  await expect(row).toBeVisible();
  return Number(await row.getAttribute("data-stock"));
}

async function setStatus(page: Page, ref: string, label: string) {
  await page.goto(`/admin/orders/${ref}`);
  await page.getByLabel(`Change status of ${ref}`).selectOption({ label });
  await expect(page.getByLabel(`Change status of ${ref}`)).toBeEnabled();
  await page.waitForLoadState("networkidle");
}

test("order -> New -> Paid -> stock drops -> Cancelled restores it", async ({ browser }) => {
  test.skip(test.info().project.name !== "desktop", "Run once, on desktop.");
  const admin = await (await browser.newContext()).newPage();
  await signIn(admin);
  const before = await stockOf(admin);
  expect(before).toBeGreaterThan(0);

  // Customer
  const shop = await (await browser.newContext()).newPage();
  await shop.goto("/accessories");
  await shop.waitForLoadState("networkidle");
  await shop.locator("#catalogue a", { hasText: PRODUCT }).click();
  await shop.getByRole("dialog").getByRole("button", { name: "Add to bag" }).click();
  await shop.getByRole("button", { name: /^Bag\s*\d+/ }).click();
  const bag = shop.getByRole("dialog", { name: "Your bag" });
  await bag.getByLabel("Your name").fill("E2E Test");
  await bag.getByLabel("Phone number").fill("077 000 0000");
  await bag.getByLabel("Notes (optional)").fill("Automated test order");
  await bag.getByRole("button", { name: "Send order on WhatsApp" }).click();
  const heading = shop.getByRole("dialog").getByRole("heading", { name: /^Order LL-\d+$/ });
  await expect(heading).toBeVisible({ timeout: 30_000 });
  const ref = (await heading.textContent())!.replace("Order ", "").trim();
  const message = await shop.getByRole("dialog").locator(".select-all").textContent();
  expect(message).toContain(`Order ${ref}`);
  expect(message).toContain(`1 × ${PRODUCT}`);
  await expect(shop.getByRole("link", { name: "Open WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+\?text=/);

  // Owner sees it as New
  await admin.goto("/admin/orders?status=new");
  await expect(admin.getByRole("link", { name: ref }).first()).toBeVisible();

  // Paid -> stock drops by one
  await setStatus(admin, ref, "Paid");
  expect(await stockOf(admin)).toBe(before - 1);

  // Clean up: Cancelled -> stock back
  await setStatus(admin, ref, "Cancelled");
  expect(await stockOf(admin)).toBe(before);
});
