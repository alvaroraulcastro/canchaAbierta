import Link from "next/link";
import { signOutUser } from "@/lib/auth/actions";
import { auth } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";

export async function AuthMenu() {
  const session = await auth();
  if (!session?.user) {
    return (
      <Link
        href="/auth/signin"
        className="rounded-full bg-brand-300 px-3 py-1.5 text-sm font-semibold text-brand-950 hover:bg-brand-400"
      >
        Entrar
      </Link>
    );
  }

  return (
    <nav aria-label="Cuenta" className="flex items-center gap-2">
      {session.user.isAdmin ? (
        <Link href="/admin" className="rounded-full px-3 py-1.5 text-sm font-medium hover:bg-brand-200">
          Admin
        </Link>
      ) : null}
      <Link
        href="/cuenta"
        className="max-w-40 truncate rounded-full px-3 py-1.5 text-sm hover:bg-brand-200"
        aria-label={`Mi cuenta: ${session.user.name ?? session.user.email}`}
      >
        {session.user.name ?? session.user.email}
      </Link>
      <form action={signOutUser}>
        <Button type="submit" variant="ghost" size="sm">
          Salir
        </Button>
      </form>
    </nav>
  );
}
