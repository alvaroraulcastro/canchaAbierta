import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SpotsMeter } from "@/components/matches/spots-meter";
import type { MatchView } from "@/lib/catalog";
import { formatCLP, matchStatusLabel, spotsLabel, sportLabel } from "@/lib/format";
import { matchHref } from "@/lib/routes";
import { formatShortDate } from "@/lib/time";

export function MatchCard({ match }: { match: MatchView }) {
  const full = match.currentPlayers >= match.maxPlayers;
  const open = match.status === "open";

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle>
              <Link
                href={matchHref(match.id)}
                className="rounded-sm hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                {match.courtName}
              </Link>
            </CardTitle>
            <p className="text-sm text-muted">{match.venueName}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge>{sportLabel(match.sport)}</Badge>
            <Badge variant={open ? "outline" : "muted"}>{matchStatusLabel(match.status)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-1 pt-3 text-sm">
        <p className="font-medium">{formatShortDate(match.dateTime)}</p>
        <p>{spotsLabel(match.currentPlayers, match.maxPlayers)}</p>
        <SpotsMeter current={match.currentPlayers} max={match.maxPlayers} />
        <p className="mt-2 text-base font-semibold tabular-nums">{formatCLP(match.priceCLP)} por jugador</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {full && match.allowOverbook ? <Badge variant="warning">Cupo extra</Badge> : null}
          {full && !match.allowOverbook ? <Badge variant="muted">Completo</Badge> : null}
        </div>
      </CardContent>
      <CardFooter className="border-t border-line pt-0">
        <Button asChild variant={open && !full ? "default" : "outline"} className="w-full sm:w-auto">
          <Link href={matchHref(match.id)}>{open ? "Ver partido e inscribirme" : "Ver detalle"}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}