import type { NextAuthConfig } from "next-auth";

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
  },
} satisfies NextAuthConfig;
