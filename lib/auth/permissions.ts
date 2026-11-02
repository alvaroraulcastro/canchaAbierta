import type { ResolvedAdmin } from "@/lib/auth/resolve-admin";
import type { AdminRole } from "@/lib/sheets/schemas";

export type AdminPermission =
  | "admin_users"
  | "courts_write"
  | "matches_write"
  | "overbook_decide"
  | "check_in"
  | "reports"
  | "audit_read";

const MATRIX: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  super_admin: new Set([
    "admin_users",
    "courts_write",
    "matches_write",
    "overbook_decide",
    "check_in",
    "reports",
    "audit_read",
  ]),
  venue_admin: new Set([
    "courts_write",
    "matches_write",
    "overbook_decide",
    "check_in",
    "reports",
  ]),
  support: new Set(["check_in", "reports"]),
};

export function hasAdminPermission(admin: ResolvedAdmin, permission: AdminPermission): boolean {
  return MATRIX[admin.role].has(permission);
}

export function assertAdminPermission(admin: ResolvedAdmin, permission: AdminPermission): void {
  if (!hasAdminPermission(admin, permission)) {
    throw new Error("No tienes permiso para esta acción");
  }
}

export function canAccessVenue(admin: ResolvedAdmin, venueId: string): boolean {
  if (admin.role === "super_admin") return true;
  if (admin.role === "support") return true;
  return admin.venueIds.includes(venueId);
}

export function assertVenueAccess(admin: ResolvedAdmin, venueId: string): void {
  if (!canAccessVenue(admin, venueId)) {
    throw new Error("No tienes acceso a este complejo");
  }
}

export function filterVenueIdsForAdmin(admin: ResolvedAdmin, venueIds: string[]): string[] {
  if (admin.role === "super_admin" || admin.role === "support") return venueIds;
  const allowed = new Set(admin.venueIds);
  return venueIds.filter((id) => allowed.has(id));
}
