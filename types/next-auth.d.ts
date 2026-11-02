import type { DefaultSession } from "next-auth";
import type { AdminRole } from "@/lib/sheets/schemas";

declare module "next-auth" {
  interface Session {
    user: {
      isAdmin: boolean;
      adminRole: AdminRole | null;
      adminVenueIds: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean;
    adminRole?: AdminRole | null;
    adminVenueIds?: string[];
  }
}
