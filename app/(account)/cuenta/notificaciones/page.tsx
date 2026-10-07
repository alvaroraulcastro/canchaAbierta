import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listNotificationsByEmail } from "@/lib/sheets/repos/notifications";
import { formatShortDate } from "@/lib/time";

export const metadata: Metadata = {
  title: "Notificaciones",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/cuenta/notificaciones");

  const notifications = await listNotificationsByEmail(session.user.email);
  const sorted = [...notifications].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <p className="text-sm">
        <Link href="/cuenta" className="text-link hover:underline">
          Tu cuenta
        </Link>
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Notificaciones</h1>
      {sorted.length === 0 ? (
        <p className="text-muted">No tienes notificaciones todavía.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((notification) => (
            <li
              key={notification.id}
              className="rounded-2xl border border-line bg-card p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold">{notification.title}</h2>
                <time className="text-xs text-muted">
                  {formatShortDate(notification.createdAt)}
                </time>
              </div>
              {notification.body ? (
                <p className="mt-1 text-sm text-muted">{notification.body}</p>
              ) : null}
              {notification.link ? (
                <Link href={notification.link} className="mt-2 inline-block text-sm text-link hover:underline">
                  Ver detalle
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
