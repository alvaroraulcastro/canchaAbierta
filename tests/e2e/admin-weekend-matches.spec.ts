import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "alvaroraulcastrosm@gmail.com";

test.describe.configure({ mode: "serial" });

test("admin crea partidos para el proximo fin de semana", async ({ page, baseURL }) => {
  const origin = baseURL ?? "http://127.0.0.1:3000";
  await page.goto(
    `${origin}/api/e2e/auth/signin?email=${encodeURIComponent(ADMIN_EMAIL)}&callbackUrl=${encodeURIComponent("/admin/partidos")}`,
  );
  await expect(page).toHaveURL(/\/admin\/partidos/);
  await expect(page.getByRole("heading", { name: "Panel admin" })).toBeVisible();

  const weekendSlots = [
    { label: "sabado-manana", local: "2026-11-08T10:00" },
    { label: "sabado-tarde", local: "2026-11-08T18:00" },
    { label: "domingo-manana", local: "2026-11-09T11:00" },
  ];

  const courtSelect = page.locator('select[name="courtId"]');
  await expect(courtSelect).not.toHaveValue("", { timeout: 15_000 });
  const courtOptions = await courtSelect.locator("option").all();
  expect(courtOptions.length).toBeGreaterThan(0);

  for (const slot of weekendSlots) {
    await page.locator('input[name="dateTimeLocal"]').fill(slot.local);
    await page.locator('input[name="durationMin"]').fill("90");
    await page.locator('input[name="maxPlayers"]').fill("4");
    await page.getByRole("button", { name: "Publicar partido" }).click();
    await expect(page).toHaveURL(/\/admin\/partidos\?ok=1/, { timeout: 30_000 });
    await expect(page.getByText("Cambios guardados.")).toBeVisible();
    await page.goto(`${origin}/admin/partidos`);
  }

  await expect(page.getByText("2026")).toBeVisible();
});
