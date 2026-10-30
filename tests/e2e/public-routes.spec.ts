import { test, expect } from "@playwright/test";

test.describe("rutas publicas", () => {
  test("home y listado de partidos", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "canchaAbierta" })).toBeVisible();
    await page.goto("/partidos");
    await expect(page.getByRole("heading", { name: "Partidos", exact: true })).toBeVisible();
  });

  test("cuenta requiere login", async ({ page }) => {
    await page.goto("/cuenta");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("admin requiere login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
