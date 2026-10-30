export function isE2eMockEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.E2E_MOCK === "1";
}
