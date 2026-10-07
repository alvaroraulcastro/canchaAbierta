import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAdminEmail } from "@/lib/auth/admins";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Google],
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
    jwt({ token, user }) {
      const email = user?.email ?? (typeof token.email === "string" ? token.email : undefined);
      if (email) {
        token.email = email;
        token.isAdmin = isAdminEmail(email);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
});
