export function pricePerPlayerCLP(courtTotalCLP: number, playerCount: number): number {
  if (!Number.isFinite(courtTotalCLP) || courtTotalCLP < 0) return 0;
  const count = Math.max(1, Math.floor(playerCount));
  return Math.round(courtTotalCLP / count);
}
