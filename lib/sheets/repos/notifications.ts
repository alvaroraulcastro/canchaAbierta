import { cache } from "react";
import { unstable_cache } from "next/cache";
import { notificationSchema, parseRows, type Notification } from "@/lib/sheets/schemas";
import { readSheet } from "@/lib/sheets/read";
import { CACHE_REVALIDATE_SECONDS, SHEET_TAGS } from "@/lib/sheets/tags";

async function loadNotifications(): Promise<Notification[]> {
  const rows = await readSheet("Notificaciones");
  return parseRows("Notificaciones", rows, notificationSchema);
}

const readNotifications = unstable_cache(loadNotifications, ["sheet:notifications"], {
  tags: [SHEET_TAGS.Notificaciones],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

export const listNotifications = cache(async (): Promise<Notification[]> => readNotifications());

export const listNotificationsByEmail = cache(async (email: string): Promise<Notification[]> => {
  const notifications = await listNotifications();
  const normalized = email.trim().toLowerCase();
  return notifications.filter(
    (notification) => notification.recipientEmail.toLowerCase() === normalized,
  );
});
