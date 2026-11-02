import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { revalidateTag } from "next/cache";
import { sealSecret } from "@/lib/crypto/seal";
import { resolveAdmin } from "@/lib/auth/resolve-admin";
import { isE2eMockEnabled } from "@/lib/e2e/env";
import { setPlayerCalendarTokens } from "@/lib/sheets/repos/players";
import { SHEET_TAGS } from "@/lib/sheets/tags";
import type { AdminRole } from "@/lib/sheets/schemas";

const googleCalendar = Google({
  id: "google-calendar",
  name: "Google Calendar",
  authorization: {
    params: {
      scope: "openid email profile https://www.googleapis.com/auth/calendar.events",
      access_type: "offline",
      prompt: "consent",
    },
  },
});

const e2eProvider = Credentials({
  id: "e2e",
  name: "E2E",
  credentials: {
    email: { label: "Email", type: "text" },
  },
  authorize(credentials) {
    const email =
      typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
    if (!email) return null;
    return { id: email, email, name: "E2E Jugador" };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: isE2eMockEnabled() ? [Google, e2eProvider] : [Google, googleCalendar],
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
    async jwt({ token, user, account }) {
      const email = user?.email ?? (typeof token.email === "string" ? token.email : undefined);
      if (email) {
        token.email = email;
        const admin = await resolveAdmin(email);
        if (admin) {
          token.isAdmin = true;
          token.adminRole = admin.role;
          token.adminVenueIds = admin.venueIds;
        } else {
          token.isAdmin = false;
          token.adminRole = null;
          token.adminVenueIds = [];
        }
      }

      if (
        account?.provider === "google-calendar" &&
        typeof account.refresh_token === "string" &&
        typeof token.email === "string"
      ) {
        await setPlayerCalendarTokens({
          email: token.email,
          refreshTokenEnc: sealSecret(account.refresh_token),
        });
        revalidateTag(SHEET_TAGS.Jugadores);
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = Boolean(token.isAdmin);
        const role = token.adminRole as AdminRole | null | undefined;
        session.user.adminRole = role ?? null;
        session.user.adminVenueIds = Array.isArray(token.adminVenueIds)
          ? token.adminVenueIds
          : [];
      }
      return session;
    },
  },
});
