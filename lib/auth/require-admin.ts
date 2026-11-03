import { auth } from "@/lib/auth/config";
import {
  assertAdminPermission,
  assertVenueAccess,
  hasAdminPermission,
  type AdminPermission,
} from "@/lib/auth/permissions";
import type { ResolvedAdmin } from "@/lib/auth/resolve-admin";

export type AdminSession = ResolvedAdmin & {
  name: string | null;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await auth();
  if (!session?.user?.email || !session.user.isAdmin) return null;

  if (session.user.adminRole) {
    return {
      email: session.user.email,
      name: session.user.name ?? null,
      role: session.user.adminRole,
      venueIds: session.user.adminVenueIds ?? [],
      active: true,
    };
  }

  const { resolveAdmin } = await import("@/lib/auth/resolve-admin");
  const resolved = await resolveAdmin(session.user.email);
  if (!resolved) return null;
  return {
    email: session.user.email,
    name: session.user.name ?? null,
    role: resolved.role,
    venueIds: resolved.venueIds,
    active: true,
  };
}

export async function requireAdminSession(): Promise<AdminSession> {
  const admin = await getAdminSession();
  if (!admin) throw new Error("No autorizado");
  return admin;
}

export async function requireAdminPermission(permission: AdminPermission): Promise<AdminSession> {
  const admin = await requireAdminSession();
  assertAdminPermission(admin, permission);
  return admin;
}

export async function requireVenueAccess(venueId: string): Promise<AdminSession> {
  const admin = await requireAdminSession();
  assertVenueAccess(admin, venueId);
  return admin;
}

export { hasAdminPermission, assertVenueAccess };
