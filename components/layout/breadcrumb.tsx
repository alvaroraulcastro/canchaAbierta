import Link from "next/link";
import type { Route } from "next";

type BreadcrumbProps = {
  href: Route;
  label: string;
};

export function Breadcrumb({ href, label }: BreadcrumbProps) {
  return (
    <p className="text-sm">
      <Link
        href={href}
        className="inline-flex min-h-10 items-center text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm"
      >
        ← {label}
      </Link>
    </p>
  );
}