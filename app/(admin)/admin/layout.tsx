import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { getAdminSession } from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  title: "Administración",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminSession();
  if (!admin) redirect("/auth/signin?callbackUrl=/admin");

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Panel admin</h1>
        <p className="text-sm text-muted">{admin.email}</p>
      </div>
      <AdminNav />
      {children}
    </main>
  );
}
