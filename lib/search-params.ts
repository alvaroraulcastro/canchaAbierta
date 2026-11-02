import { z } from "zod";
import { SPORT_VALUES } from "@/lib/sheets/schemas";

export type SearchParams = Record<string, string | string[] | undefined>;

export function readSearchParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

const sportSchema = z.enum(SPORT_VALUES);
const querySchema = z.string().trim().max(80);
const whenSchema = z.enum(["proximos", "todos"]);

export type CourtsFilters = {
  sport?: (typeof SPORT_VALUES)[number];
  q?: string;
};

export type MatchesFilters = {
  sport?: (typeof SPORT_VALUES)[number];
  cuando: "proximos" | "todos";
};

export function parseCourtsFilters(params: SearchParams): CourtsFilters {
  const sport = sportSchema.safeParse(readSearchParam(params.sport));
  const q = querySchema.safeParse(readSearchParam(params.q) ?? "");
  return {
    sport: sport.success ? sport.data : undefined,
    q: q.success && q.data.length > 0 ? q.data : undefined,
  };
}

export function parseMatchesFilters(params: SearchParams): MatchesFilters {
  const sport = sportSchema.safeParse(readSearchParam(params.sport));
  const cuando = whenSchema.safeParse(readSearchParam(params.cuando));
  return {
    sport: sport.success ? sport.data : undefined,
    cuando: cuando.success ? cuando.data : "proximos",
  };
}

const matchErrorSchema = z.enum(["cupo", "partido", "inscripcion"]);

export type MatchErrorSearchParams = {
  error?: "cupo" | "partido" | "inscripcion";
};

export function parseMatchErrorSearchParams(params: SearchParams): MatchErrorSearchParams {
  const error = matchErrorSchema.safeParse(readSearchParam(params.error));
  return { error: error.success ? error.data : undefined };
}

const routeIdSchema = z.string().trim().min(1).max(200);

export type RouteIdParams = {
  id: string;
};

export function parseRouteIdParams(params: { id?: unknown }): RouteIdParams | null {
  const parsed = routeIdSchema.safeParse(params.id);
  return parsed.success ? { id: parsed.data } : null;
}

const adminFlagSchema = z.string().trim().max(10).optional();

export type AdminOkSearchParams = {
  ok?: string;
};

export function parseAdminOkSearchParams(params: SearchParams): AdminOkSearchParams {
  const ok = adminFlagSchema.safeParse(readSearchParam(params.ok));
  return { ok: ok.success ? ok.data : undefined };
}

export type AdminCourtsSearchParams = {
  edit?: string;
  ok?: string;
  error?: string;
};

export function parseAdminCourtsSearchParams(params: SearchParams): AdminCourtsSearchParams {
  const edit = z.string().trim().max(200).optional().safeParse(readSearchParam(params.edit));
  const ok = adminFlagSchema.safeParse(readSearchParam(params.ok));
  const error = z.string().trim().max(200).optional().safeParse(readSearchParam(params.error));
  return {
    edit: edit.success ? edit.data : undefined,
    ok: ok.success ? ok.data : undefined,
    error: error.success ? error.data : undefined,
  };
}

const attendanceSchema = z.object({
  inscriptionId: z.string().trim().min(1),
  matchId: z.string().trim().min(1),
});

export type AttendanceFormData = z.infer<typeof attendanceSchema>;

export function parseAttendanceFormData(formData: FormData): AttendanceFormData | null {
  const parsed = attendanceSchema.safeParse({
    inscriptionId: formData.get("inscriptionId"),
    matchId: formData.get("matchId"),
  });
  return parsed.success ? parsed.data : null;
}

export type InscriptionsSearchParams = {
  showPendingNotice: boolean;
  showCancelledNotice: boolean;
  cancelError: string | null;
};

export function parseInscriptionsSearchParams(params: SearchParams): InscriptionsSearchParams {
  const estado = readSearchParam(params.estado);
  const cancelada = readSearchParam(params.cancelada);
  const error = readSearchParam(params.error);
  let cancelError: string | null = null;
  if (error === "cancelacion") {
    cancelError = "No se pudo cancelar la inscripción.";
  } else if (error) {
    cancelError = error;
  }
  return {
    showPendingNotice: estado === "pending",
    showCancelledNotice: cancelada === "1",
    cancelError,
  };
}

export type IntegracionesSearchParams = {
  connectedNotice: boolean;
  disconnectedNotice: boolean;
};

export function parseIntegracionesSearchParams(params: SearchParams): IntegracionesSearchParams {
  return {
    connectedNotice: readSearchParam(params.connected) === "1",
    disconnectedNotice: readSearchParam(params.disconnected) === "1",
  };
}

const isoDaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
  .optional();

export type ReportsSearchParams = {
  venueId: string | null;
  from: string;
  to: string;
};

export function parseReportsSearchParams(params: SearchParams): ReportsSearchParams {
  const fromParsed = isoDaySchema.safeParse(readSearchParam(params.from));
  const toParsed = isoDaySchema.safeParse(readSearchParam(params.to));
  const now = new Date();
  const defaultTo = now.toISOString().slice(0, 10);
  const defaultFromDate = new Date(now);
  defaultFromDate.setDate(defaultFromDate.getDate() - 30);
  const defaultFrom = defaultFromDate.toISOString().slice(0, 10);
  return {
    venueId: readSearchParam(params.venueId) ?? null,
    from: fromParsed.success && fromParsed.data ? fromParsed.data : defaultFrom,
    to: toParsed.success && toParsed.data ? toParsed.data : defaultTo,
  };
}

export function reportsRangeMs(from: string, to: string): { fromMs: number; toMs: number } {
  const fromMs = Date.parse(`${from}T00:00:00-03:00`);
  const toMs = Date.parse(`${to}T23:59:59-03:00`);
  return { fromMs, toMs };
}
