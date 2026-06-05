/** Compact display for values with 4+ digits (e.g. 1500 → 1.5K). */
export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs < 1000) {
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
  }
  if (abs < 1_000_000) {
    const k = value / 1000;
    const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : String(rounded);
    return `${text}K`;
  }
  const m = value / 1_000_000;
  const rounded = m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return `${text}M`;
}
