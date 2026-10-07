export function callbackPath(value: string | null | undefined, host?: string | null): string {
  if (!value) return "/";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    if (!host || url.host !== host) return "/";
    return `${url.pathname}${url.search}` || "/";
  } catch {
    return "/";
  }
}
