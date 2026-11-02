export const CHECKIN_HOURS_BEFORE = 2;
export const CHECKIN_HOURS_AFTER = 3;

export function isCheckInWindowOpen(
  dateTimeIso: string,
  durationMin: number,
  nowMs = Date.now(),
): boolean {
  const start = Date.parse(dateTimeIso);
  if (Number.isNaN(start)) return false;
  const end = start + durationMin * 60_000;
  const openFrom = start - CHECKIN_HOURS_BEFORE * 60 * 60 * 1000;
  const openUntil = end + CHECKIN_HOURS_AFTER * 60 * 60 * 1000;
  return nowMs >= openFrom && nowMs <= openUntil;
}

export function canShowPlayerCheckInQr(
  paymentStatus: string,
  checkedInAt: string,
  dateTimeIso: string,
  durationMin: number,
): boolean {
  if (paymentStatus !== "paid") return false;
  if (checkedInAt.trim().length > 0) return false;
  return isCheckInWindowOpen(dateTimeIso, durationMin);
}
