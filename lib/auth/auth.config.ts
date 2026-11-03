import type { NextAuthConfig } from "next-auth";
import { applyAdminSessionFromToken } from "@/lib/auth/session-from-token";

export const authConfig = {
  trustHost: true,
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin")) return Boolean(session?.user?.isAdmin);
      if (pathname.startsWith("/cuenta")) return Boolean(session?.user);
      return true;
    },
    session({ session, token }) {
      return applyAdminSessionFromToken(session, token);
    },
  },
} satisfies NextAuthConfig;
