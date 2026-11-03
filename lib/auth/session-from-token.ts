import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { AdminRole } from "@/lib/sheets/schemas";

export function applyAdminSessionFromToken(session: Session, token: JWT): Session {
  if (session.user) {
    session.user.isAdmin = Boolean(token.isAdmin);
    session.user.adminRole = (token.adminRole as AdminRole | null | undefined) ?? null;
    session.user.adminVenueIds = Array.isArray(token.adminVenueIds) ? token.adminVenueIds : [];
  }
  return session;
}

export function sessionCanAccessCallback(session: Session, callbackUrl: string): boolean {
  if (callbackUrl === "/admin" || callbackUrl.startsWith("/admin/")) {
    return Boolean(session.user?.isAdmin);
  }
  if (callbackUrl === "/cuenta" || callbackUrl.startsWith("/cuenta/")) {
    return Boolean(session.user);
  }
  return true;
}
