/** WCAG contrast dùng chung cho audit Studio và auto-đảo chữ canvas. */

export function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const rgb = [0, 2, 4].map((i) => {
    const v = Number.parseInt(m[1].slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/** Hòa rgba (kể cả #rrggbbaa) lên nền đục rồi tính tương phản. */
export function contrastRatio(fg: string, bg: string): number {
  const blend = (c: string, base: string): string => {
    const m = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(c.trim());
    if (!m) return c;
    const alpha = Number.parseInt(m[2], 16) / 255;
    const b = /^#?([0-9a-f]{6})$/i.exec(base.trim());
    if (!b) return `#${m[1]}`;
    const mix = (f: number, t: number) =>
      Math.round(f * alpha + t * (1 - alpha));
    const hex = [0, 2, 4]
      .map((i) =>
        mix(
          Number.parseInt(m[1].slice(i, i + 2), 16),
          Number.parseInt(b[1].slice(i, i + 2), 16),
        )
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
    return `#${hex}`;
  };
  const l1 = luminance(blend(fg, bg));
  const l2 = luminance(blend(bg, "#ffffff"));
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Nền tối (tương phản với trắng ≥ 4.5) → chữ nên đảo trắng. */
export function isDarkBackground(bg: string): boolean {
  if (!bg || bg === "transparent") return false;
  return contrastRatio("#ffffff", bg) >= 4.5;
}
