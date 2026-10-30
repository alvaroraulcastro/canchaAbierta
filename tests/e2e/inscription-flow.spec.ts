import { test, expect } from "@playwright/test";

const matchId = process.env.E2E_MATCH_ID?.trim();

test.describe("inscripcion con Flow mock", () => {
  test.skip(
    !matchId,
    "Define E2E_MATCH_ID (partido open, >24h) y credenciales Sheets en .env.local",
  );

  test("inscribirse, pagar mock y cancelar si la politica lo permite", async ({ page }) => {
    const email = `e2e-${Date.now()}@test.local`;
    const matchPath = `/partidos/${matchId}`;

    await page.goto(
      `/api/e2e/auth/signin?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(matchPath)}`,
    );
    await expect(page).toHaveURL(new RegExp(matchPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    await page.getByRole("button", { name: "Inscribirme y pagar" }).click();
    await expect(page).toHaveURL(/\/cuenta\/mis-inscripciones/);
    await expect(page.getByText("Pagada", { exact: true })).toBeVisible();

    const cancelButton = page.getByRole("button", { name: "Cancelar inscripción" });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await expect(page).toHaveURL(/cancelada=1/);
      await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();
    }
  });
});
