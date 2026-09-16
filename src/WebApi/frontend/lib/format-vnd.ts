/** Single reusable VND formatter — display uses "." thousands separator. */
export function formatVndInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (digits === "") return "";
  const normalized = digits.replace(/^0+$/, "0");
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "15.000.000" -> 15000000. Empty/invalid -> 0 (backend expects a number). */
export function parseVndInput(formatted: string): number {
  const digits = formatted.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (digits === "") return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}
