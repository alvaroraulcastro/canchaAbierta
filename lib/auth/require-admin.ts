import { auth } from "@/lib/auth/config";

export type AdminSession = {
  email: string;
  name: string | null;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await auth();
  if (!session?.user?.email || !session.user.isAdmin) return null;
  return {
    email: session.user.email,
    name: session.user.name ?? null,
  };
}
