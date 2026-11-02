"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPermission } from "@/lib/auth/require-admin";
import { rethrowNavigationError } from "@/lib/rethrow-navigation";
import { appendAuditEntry } from "@/lib/sheets/repos/audit";
import { adminUserVenueIds, getAdminUser, listAdminUsers, upsertAdminUserRow } from "@/lib/sheets/repos/admin-users";
import { ADMIN_ROLE_VALUES } from "@/lib/sheets/schemas";
import { SHEET_TAGS } from "@/lib/sheets/tags";
import { zFormCheckbox, zFormString } from "@/lib/form-data";

const userFormSchema = z.object({
  email: zFormString.pipe(z.string().email()),
  role: z.enum(ADMIN_ROLE_VALUES),
  venueIds: zFormString,
  active: zFormCheckbox,
});

export async function saveAdminUser(formData: FormData): Promise<void> {
  const admin = await requireAdminPermission("admin_users");

  const parsed = userFormSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    venueIds: formData.get("venueIds"),
    active: formData.get("active"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  const venueIds =
    parsed.data.role === "super_admin"
      ? []
      : parsed.data.venueIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);

  if (parsed.data.role === "venue_admin" && venueIds.length === 0) {
    throw new Error("Indica al menos un complejo para venue-admin");
  }

  const email = parsed.data.email.trim().toLowerCase();
  const before = await getAdminUser(email);

  try {
    await upsertAdminUserRow({
      email,
      role: parsed.data.role,
      venueIds,
      active: parsed.data.active,
    });
    await appendAuditEntry({
      adminEmail: admin.email,
      action: before ? "update" : "create",
      entity: "admin_user",
      entityId: email,
      before: before ? { role: before.role, venueIds: before.venueIds, active: before.active } : null,
      after: { role: parsed.data.role, venueIds: venueIds.join(","), active: parsed.data.active },
    });
    revalidateTag(SHEET_TAGS.AdminUsers);
    revalidateTag(SHEET_TAGS.AdminAudit);
  } catch (error) {
    rethrowNavigationError(error);
    throw new Error(error instanceof Error ? error.message : "No se pudo guardar el usuario");
  }
  redirect("/admin/usuarios?ok=1");
}

export async function deactivateAdminUser(formData: FormData): Promise<void> {
  const admin = await requireAdminPermission("admin_users");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) throw new Error("Falta el email");
  if (email === admin.email) throw new Error("No puedes desactivarte a ti mismo");

  const before = await getAdminUser(email);
  if (!before) throw new Error("Usuario admin no encontrado");

  await upsertAdminUserRow({
    email,
    role: before.role,
    venueIds: adminUserVenueIds(before),
    active: false,
  });
  await appendAuditEntry({
    adminEmail: admin.email,
    action: "update",
    entity: "admin_user",
    entityId: email,
    before: { active: before.active },
    after: { active: false },
  });
  revalidateTag(SHEET_TAGS.AdminUsers);
  revalidateTag(SHEET_TAGS.AdminAudit);
  redirect("/admin/usuarios?ok=1");
}

export async function listAdminUsersForPanel() {
  await requireAdminPermission("admin_users");
  return listAdminUsers();
}
