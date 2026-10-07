import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth/actions";
import { callbackPath } from "@/lib/auth/callback-path";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Inicia sesión con Google para inscribirte a partidos.",
};

const ERRORS: Record<string, string> = {
  Configuration: "Falta la configuración de Google OAuth.",
  AccessDenied: "Google no autorizó el acceso.",
  OAuthAccountNotLinked: "Ese email ya está asociado a otra cuenta.",
  Verification: "El enlace de verificación no es válido.",
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
  if (session?.user) redirect(callbackUrl);

  const error = params.error ? (ERRORS[params.error] ?? "No se pudo iniciar sesión.") : null;

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
      <form action={signInWithGoogle} className="flex flex-col gap-3">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Button type="submit">Continuar con Google</Button>
      </form>
    </main>
  );
}
