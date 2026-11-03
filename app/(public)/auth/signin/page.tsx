import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signInWithGoogle, signOutUser } from "@/lib/auth/actions";
import { callbackPath } from "@/lib/auth/callback-path";
import { sessionCanAccessCallback } from "@/lib/auth/session-from-token";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Inicia sesión con Google para inscribirte a partidos.",
};

const ERRORS: Record<string, string> = {
  Configuration:
    "Falta la configuración de Google OAuth. Revisa AUTH_GOOGLE_ID y AUTH_GOOGLE_SECRET en el entorno.",
  AccessDenied: "Google no autorizó el acceso. Prueba otra cuenta o vuelve a intentar.",
  OAuthAccountNotLinked:
    "Ese email ya está asociado a otra cuenta. Entra con el proveedor que usaste la primera vez.",
  Verification: "El enlace de verificación expiró o no es válido. Solicita uno nuevo.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const callbackUrl = callbackPath(params.callbackUrl, host);
  const session = await auth();
  if (session?.user && sessionCanAccessCallback(session, callbackUrl)) {
    redirect(callbackUrl);
  }

  const adminDenied =
    session?.user && !sessionCanAccessCallback(session, callbackUrl) && callbackUrl.startsWith("/admin");

  const error = params.error
    ? (ERRORS[params.error] ?? "No se pudo iniciar sesión.")
    : adminDenied
      ? "Tu cuenta no tiene permisos de administrador. Revisa AdminUsers o ALLOWED_ADMIN_EMAILS en el entorno, cierra sesión y vuelve a entrar."
      : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-muted">
          Usa tu cuenta de Google. Después de autorizar, Google vuelve a esta app.
        </p>
      </header>
      {error ? (
        <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {session?.user && adminDenied ? (
        <form action={signOutUser} className="flex flex-col gap-3">
          <Button type="submit" variant="outline">
            Cerrar sesión e intentar con otra cuenta
          </Button>
        </form>
      ) : (
        <form action={signInWithGoogle} className="flex flex-col gap-3">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit">{session?.user ? "Reautorizar con Google" : "Entrar con Google"}</Button>
        </form>
      )}
    </main>
  );
}
