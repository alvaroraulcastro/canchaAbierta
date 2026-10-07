"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/require-admin";
import { appendAuditEntry } from "@/lib/sheets/repos/audit";
import { deactivateCourt, upsertCourt } from "@/lib/sheets/repos/courts";
import { getVenue } from "@/lib/sheets/repos/venues";
import { SPORT_VALUES } from "@/lib/sheets/schemas";
import { SHEET_TAGS } from "@/lib/sheets/tags";

const courtFormSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Usa minúsculas, números y guiones"),
  venueId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(120),
  sport: z.enum(SPORT_VALUES),
  capacity: z.coerce.number().int().min(2).max(30),
  priceCLP: z.coerce.number().int().min(0),
  photoUrl: z.string().trim().max(500).optional(),
  active: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional(),
});

function boolFromForm(value: string | undefined): boolean {
  return value === "on" || value === "true";
}

export async function saveCourt(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) throw new Error("No autorizado");

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
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  const venue = await getVenue(parsed.data.venueId);
  if (!venue) throw new Error("El complejo no existe");

  const input = {
    id: parsed.data.id,
    venueId: parsed.data.venueId,
    name: parsed.data.name,
    sport: parsed.data.sport,
    capacity: parsed.data.capacity,
    priceCLP: parsed.data.priceCLP,
    photoUrl: parsed.data.photoUrl ?? "",
    active: boolFromForm(parsed.data.active),
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
    redirect("/admin/canchas?ok=1");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la cancha";
    throw new Error(message);
  }
}

export async function deleteCourt(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) throw new Error("No autorizado");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Falta el id de la cancha");

  try {
    const before = await deactivateCourt(id);
    if (!before) throw new Error("Cancha no encontrada");
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
    redirect("/admin/canchas?ok=1");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo desactivar la cancha";
    throw new Error(message);
  }
}
