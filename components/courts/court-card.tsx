import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourtView } from "@/lib/catalog";
import { formatCLP, sportLabel } from "@/lib/format";
import { courtHref } from "@/lib/routes";

function safePhoto(url: string): string | undefined {
  if (!/^https?:\/\//.test(url)) return undefined;
  if (/["'()]/.test(url)) return undefined;
  return url;
}

export function CourtCard({ court }: { court: CourtView }) {
  return (
    <Card className="overflow-hidden">
      <div
        className="bg-brand-100 dark:bg-brand-900 h-36 bg-cover bg-center"
        style={
          safePhoto(court.photoUrl)
            ? { backgroundImage: `url("${safePhoto(court.photoUrl)}")` }
            : undefined
        }
        role={safePhoto(court.photoUrl) ? "img" : undefined}
        aria-label={safePhoto(court.photoUrl) ? court.name : undefined}
      />
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>
            <Link href={courtHref(court.id)} className="hover:text-brand-700">
              {court.name}
            </Link>
          </CardTitle>
          <Badge>{sportLabel(court.sport)}</Badge>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{court.venueName}</p>
      </CardHeader>
      <CardContent className="pt-3">
        <p className="text-sm">{formatCLP(court.priceCLP)} por jugador</p>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {court.capacity} jugadores
        </p>
      </CardContent>
    </Card>
  );
}
