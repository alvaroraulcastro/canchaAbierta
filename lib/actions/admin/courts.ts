"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPermission, requireVenueAccess } from "@/lib/auth/require-admin";
import { redirectAdminFormError } from "@/lib/actions/admin/form-error";
import { rethrowNavigationError } from "@/lib/rethrow-navigation";
import { appendAuditEntry } from "@/lib/sheets/repos/audit";
import { deactivateCourt, getCourt, upsertCourt } from "@/lib/sheets/repos/courts";
import { getVenue } from "@/lib/sheets/repos/venues";
import { zFormCheckbox, zFormOptionalString, zFormString } from "@/lib/form-data";
import { SPORT_VALUES } from "@/lib/sheets/schemas";
import { SHEET_TAGS } from "@/lib/sheets/tags";

const courtFormSchema = z.object({
  id: zFormString.pipe(
    z
      .string()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9-]+$/, "Usa minúsculas, números y guiones"),
  ),
  venueId: zFormString.pipe(z.string().min(1)),
  name: zFormString.pipe(z.string().min(2).max(120)),
  sport: z.enum(SPORT_VALUES),
  capacity: z.coerce.number().int().min(2).max(30),
  priceCLP: z.coerce.number().int().min(0),
  photoUrl: zFormOptionalString.pipe(z.string().max(500)),
  active: zFormCheckbox,
});

export async function saveCourt(formData: FormData): Promise<void> {
  let admin;
  try {
    admin = await requireAdminPermission("courts_write");
  } catch (error) {
    redirectAdminFormError(
      "/admin/canchas",
      error instanceof Error ? error.message : "No autorizado",
    );
  }

  const parsed = courtFormSchema.safeParse({
    id: formData.get("id"),
    venueId: formData.get("venueId"),
    name: formData.get("name"),
    sport: formData.get("sport"),
    capacity: formData.get("capacity"),
    priceCLP: formData.get("priceCLP"),
    photoUrl: formData.get("photoUrl"),
    active: formData.get("active"),
  });
  if (!parsed.success) {
    redirectAdminFormError("/admin/canchas", parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  const venue = await getVenue(parsed.data.venueId);
  if (!venue) redirectAdminFormError("/admin/canchas", "El complejo no existe");
  try {
    await requireVenueAccess(parsed.data.venueId);
  } catch (error) {
    redirectAdminFormError(
      "/admin/canchas",
      error instanceof Error ? error.message : "Sin acceso al complejo",
    );
  }

  const input = {
    id: parsed.data.id,
    venueId: parsed.data.venueId,
    name: parsed.data.name,
    sport: parsed.data.sport,
    capacity: parsed.data.capacity,
    priceCLP: parsed.data.priceCLP,
    photoUrl: parsed.data.photoUrl ?? "",
    active: parsed.data.active,
  };

  try {
    const { created, before } = await upsertCourt(input);
    await appendAuditEntry({
      adminEmail: admin.email,
      action: created ? "create" : "update",
      entity: "court",
      entityId: input.id,
      before: before ? { ...before } : null,
      after: { ...input },
    });
    revalidateTag(SHEET_TAGS.Canchas);
    revalidateTag(SHEET_TAGS.AdminAudit);
  } catch (error) {
    rethrowNavigationError(error);
    const message = error instanceof Error ? error.message : "No se pudo guardar la cancha";
    redirectAdminFormError("/admin/canchas", message);
  }
  redirect("/admin/canchas?ok=1");
}

export async function deleteCourt(formData: FormData): Promise<void> {
  let admin;
  try {
    admin = await requireAdminPermission("courts_write");
  } catch (error) {
    redirectAdminFormError(
      "/admin/canchas",
      error instanceof Error ? error.message : "No autorizado",
    );
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirectAdminFormError("/admin/canchas", "Falta el id de la cancha");

  const existing = await getCourt(id);
  if (!existing) redirectAdminFormError("/admin/canchas", "Cancha no encontrada");
  try {
    await requireVenueAccess(existing.venueId);
  } catch (error) {
    redirectAdminFormError(
      "/admin/canchas",
      error instanceof Error ? error.message : "Sin acceso al complejo",
    );
  }

  try {
    const before = await deactivateCourt(id);
    if (!before) redirectAdminFormError("/admin/canchas", "Cancha no encontrada");
    await appendAuditEntry({
      adminEmail: admin.email,
      action: "delete",
      entity: "court",
      entityId: id,
      before: { ...before },
      after: { ...before, active: false },
    });
    revalidateTag(SHEET_TAGS.Canchas);
    revalidateTag(SHEET_TAGS.AdminAudit);
  } catch (error) {
    rethrowNavigationError(error);
    const message = error instanceof Error ? error.message : "No se pudo desactivar la cancha";
    redirectAdminFormError("/admin/canchas", message);
  }
  redirect("/admin/canchas?ok=1");
}
