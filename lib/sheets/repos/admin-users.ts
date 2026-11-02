import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  adminUserSchema,
  parseRows,
  parseVenueIdsCsv,
  type AdminRole,
  type AdminUser,
} from "@/lib/sheets/schemas";
import { appendSheetRow, findSheetRowByColumn, updateSheetRow } from "@/lib/sheets/mutate";
import { readSheet } from "@/lib/sheets/read";
import { CACHE_REVALIDATE_SECONDS, SHEET_TAGS } from "@/lib/sheets/tags";

async function loadAdminUsers(): Promise<AdminUser[]> {
  const rows = await readSheet("AdminUsers");
  return parseRows("AdminUsers", rows, adminUserSchema);
}

const readAdminUsers = unstable_cache(loadAdminUsers, ["sheet:admin-users"], {
  tags: [SHEET_TAGS.AdminUsers],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

export const listAdminUsers = cache(async (): Promise<AdminUser[]> => readAdminUsers());

export const getAdminUser = cache(async (email: string): Promise<AdminUser | null> => {
  const users = await listAdminUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((user) => user.email.toLowerCase() === normalized) ?? null;
});

export type AdminUserWriteInput = {
  email: string;
  role: AdminRole;
  venueIds: string[];
  active: boolean;
};

export async function upsertAdminUserRow(input: AdminUserWriteInput): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const venueIds = input.role === "super_admin" ? "" : input.venueIds.join(",");
  const row = await findSheetRowByColumn("AdminUsers", "email", email);
  const values = {
    role: input.role,
    venueIds,
    active: input.active ? "TRUE" : "FALSE",
    updatedAt: now,
  };
  if (row) {
    await updateSheetRow("AdminUsers", row.rowNumber, row.headers, values);
    return;
  }
  await appendSheetRow("AdminUsers", [email, values.role, values.venueIds, values.active, now]);
}

export function adminUserVenueIds(user: AdminUser): string[] {
  if (user.role === "super_admin") return [];
  return parseVenueIdsCsv(user.venueIds);
}
