import type { Route } from "next";

export function courtHref(id: string): Route {
  return `/canchas/${encodeURIComponent(id)}` as Route;
}

export function matchHref(id: string): Route {
  return `/partidos/${encodeURIComponent(id)}` as Route;
}
