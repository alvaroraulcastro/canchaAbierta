"use server";

import { callbackPath } from "@/lib/auth/callback-path";
import { signIn, signOut } from "@/lib/auth/config";

export async function signInWithGoogle(formData: FormData) {
  const raw = formData.get("callbackUrl");
  await signIn("google", { redirectTo: callbackPath(typeof raw === "string" ? raw : null) });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/" });
}
