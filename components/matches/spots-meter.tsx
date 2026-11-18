type SpotsMeterProps = {
  current: number;
  max: number;
};

export function SpotsMeter({ current, max }: SpotsMeterProps) {
  if (max <= 0) return null;
  const safeCurrent = Math.min(Math.max(0, current), max);
  const pct = Math.round((safeCurrent / max) * 100);
  const full = safeCurrent >= max;

  return (
    <div className="mt-3">
      <div
        className="h-2 overflow-hidden rounded-full bg-brand-100"
        role="progressbar"
        aria-valuenow={safeCurrent}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Cupos ocupados ${safeCurrent} de ${max}`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${full ? "bg-amber-500" : "bg-brand-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}