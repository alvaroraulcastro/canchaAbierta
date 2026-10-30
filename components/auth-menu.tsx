import Link from "next/link";
import { signOutUser } from "@/lib/auth/actions";
import { auth } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";

const navLinkClass =
  "rounded-full px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export async function AuthMenu() {
  const session = await auth();
  if (!session?.user) {
    return (
      <Link
        href="/auth/signin"
        className={`${navLinkClass} bg-brand-300 text-sm font-semibold text-brand-950 hover:bg-brand-400`}
      >
        Entrar
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Cuenta">
      {session.user.isAdmin ? (
        <Link href="/admin" className={`${navLinkClass} text-sm font-medium hover:bg-brand-200`}>
          Admin
        </Link>
      ) : null}
      <Link
        href="/cuenta"
        className={`${navLinkClass} max-w-[10rem] truncate text-sm hover:bg-brand-200 sm:max-w-40`}
        title={session.user.name ?? session.user.email ?? undefined}
      >
        {session.user.name ?? session.user.email}
      </Link>
      <form action={signOutUser}>
        <Button type="submit" variant="ghost" size="sm">
          Salir
        </Button>
      </form>
    </div>
  );
}
