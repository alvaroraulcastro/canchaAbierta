import { signIn } from "@/lib/auth/config";
import { isE2eMockEnabled } from "@/lib/e2e/env";
import { sheetsConfigured } from "@/lib/sheets/client";
import { upsertPlayerProfile } from "@/lib/sheets/repos/players";

export async function GET(request: Request) {
  if (!isE2eMockEnabled()) {
    return new Response(null, { status: 404 });
  }

  const url = new URL(request.url);
  const email = (url.searchParams.get("email") ?? "e2e-player@test.local").trim().toLowerCase();
  const callbackUrl = url.searchParams.get("callbackUrl") ?? "/partidos";

  if (sheetsConfigured()) {
    await upsertPlayerProfile({
      email,
      name: "E2E Jugador",
      phone: "+56900000000",
      level: null,
      preferredPosition: "",
    });
  }

  await signIn("e2e", { email, redirectTo: callbackUrl });
}
