import { isAdminEmail } from "@/lib/auth/admins";
import { adminUserVenueIds, getAdminUser } from "@/lib/sheets/repos/admin-users";
import type { AdminRole } from "@/lib/sheets/schemas";

export type ResolvedAdmin = {
  email: string;
  role: AdminRole;
  venueIds: string[];
  active: true;
};

export async function resolveAdmin(email: string | null | undefined): Promise<ResolvedAdmin | null> {
  if (!email?.trim()) return null;
  const normalized = email.trim().toLowerCase();

  try {
    const row = await getAdminUser(normalized);
    if (row?.active) {
      return {
        email: normalized,
        role: row.role,
        venueIds: adminUserVenueIds(row),
        active: true,
      };
    }
  } catch {
    if (isAdminEmail(normalized)) {
      return {
        email: normalized,
        role: "super_admin",
        venueIds: [],
        active: true,
      };
    }
    return null;
  }

  if (isAdminEmail(normalized)) {
    return {
      email: normalized,
      role: "super_admin",
      venueIds: [],
      active: true,
    };
  }
  return null;
}
