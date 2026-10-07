import { listCourts } from "@/lib/sheets/repos/courts";
import { listMatches } from "@/lib/sheets/repos/matches";
import { listVenues } from "@/lib/sheets/repos/venues";
import type { Court, Match, Venue } from "@/lib/sheets/schemas";
import type { Sport } from "@/lib/time";

export type CourtView = Court & {
  venueName: string;
  venueAddress: string;
};

export type MatchView = Match & {
  courtName: string;
  sport: Sport;
  venueName: string;
  venueAddress: string;
  priceCLP: number;
  photoUrl: string;
};

export async function listCourtViews(): Promise<CourtView[]> {
  const [venues, courts] = await Promise.all([listVenues(), listCourts()]);
  const venueById = new Map(venues.map((venue) => [venue.id, venue]));
  return courts.map((court) => toCourtView(court, venueById.get(court.venueId)));
}

export async function getCourtView(id: string): Promise<CourtView | null> {
  const views = await listCourtViews();
  return views.find((court) => court.id === id) ?? null;
}

export async function listMatchViews(): Promise<MatchView[]> {
  const [venues, courts, matches] = await Promise.all([listVenues(), listCourts(), listMatches()]);
  const venueById = new Map(venues.map((venue) => [venue.id, venue]));
  const courtById = new Map(courts.map((court) => [court.id, court]));
  return matches
    .map((match) => toMatchView(match, courtById.get(match.courtId), venueById))
    .filter((match): match is MatchView => match !== null)
    .sort((a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime));
}

export async function getMatchView(id: string): Promise<MatchView | null> {
  const views = await listMatchViews();
  return views.find((match) => match.id === id) ?? null;
}

export async function listMatchViewsByCourt(courtId: string): Promise<MatchView[]> {
  const views = await listMatchViews();
  return views.filter((match) => match.courtId === courtId);
}

function toCourtView(court: Court, venue: Venue | undefined): CourtView {
  return {
    ...court,
    venueName: venue?.name ?? "Complejo sin nombre",
    venueAddress: venue?.address ?? "",
  };
}

function toMatchView(
  match: Match,
  court: Court | undefined,
  venueById: Map<string, Venue>,
): MatchView | null {
  if (!court) return null;
  const venue = venueById.get(court.venueId);
  return {
    ...match,
    courtName: court.name,
    sport: court.sport,
    venueName: venue?.name ?? "Complejo sin nombre",
    venueAddress: venue?.address ?? "",
    priceCLP: court.priceCLP,
    photoUrl: court.photoUrl,
  };
}
