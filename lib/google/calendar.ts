import { google } from "googleapis";
import { getMatchView } from "@/lib/catalog";
import { unsealSecret } from "@/lib/crypto/seal";
import { createLogger } from "@/lib/logger";
import { getPlayer } from "@/lib/sheets/repos/players";

const logger = createLogger("google/calendar");

function oauthClient(refreshToken: string) {
  const id = process.env.AUTH_GOOGLE_ID;
  const secret = process.env.AUTH_GOOGLE_SECRET;
  if (!id || !secret) throw new Error("Faltan credenciales OAuth de Google");
  const client = new google.auth.OAuth2(id, secret);
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export async function createMatchCalendarEvent(input: {
  playerEmail: string;
  inscriptionId: string;
  matchId: string;
}): Promise<string | null> {
  const player = await getPlayer(input.playerEmail);
  if (!player?.calendarRefreshTokenEnc) return null;

  let refreshToken: string;
  try {
    refreshToken = unsealSecret(player.calendarRefreshTokenEnc);
  } catch (error) {
    logger.error("No se pudo descifrar refresh token de Calendar", error, {
      email: input.playerEmail,
    });
    return null;
  }

  const match = await getMatchView(input.matchId);
  if (!match) return null;

  const auth = oauthClient(refreshToken);
  const calendar = google.calendar({ version: "v3", auth });
  const start = new Date(match.dateTime);
  const end = new Date(start.getTime() + match.durationMin * 60_000);

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `${match.courtName} · canchaAbierta`,
      description: `Inscripción ${input.inscriptionId}`,
      location: match.venueAddress || match.venueName,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    },
  });

  return response.data.id ?? null;
}

export async function deleteMatchCalendarEvent(
  playerEmail: string,
  eventId: string,
): Promise<void> {
  const player = await getPlayer(playerEmail);
  if (!player?.calendarRefreshTokenEnc) return;

  const refreshToken = unsealSecret(player.calendarRefreshTokenEnc);
  const auth = oauthClient(refreshToken);
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: "primary", eventId });
}
