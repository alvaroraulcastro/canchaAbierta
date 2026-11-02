"use server";

import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth/config";
import { clearPlayerCalendarTokens } from "@/lib/sheets/repos/players";
import { revalidateTag } from "next/cache";
import { SHEET_TAGS } from "@/lib/sheets/tags";

export async function connectGoogleCalendar(): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/cuenta/integraciones");
  }
  await signIn("google-calendar", { redirectTo: "/cuenta/integraciones?connected=1" });
}

export async function disconnectGoogleCalendar(): Promise<void> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/auth/signin?callbackUrl=/cuenta/integraciones");
  await clearPlayerCalendarTokens(email);
  revalidateTag(SHEET_TAGS.Jugadores);
  redirect("/cuenta/integraciones?disconnected=1");
}
