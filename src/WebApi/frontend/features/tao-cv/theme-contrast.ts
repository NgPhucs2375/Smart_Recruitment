/** WCAG contrast dùng chung cho audit Studio và auto-đảo chữ canvas. */
import { gradientStops } from "./validation";

export function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const rgb = [0, 2, 4].map((i) => {
    const v = Number.parseInt(m[1].slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/** Hòa màu có alpha (#rrggbbaa) lên nền đục rồi trả hex đục. */
export function blendOn(color: string, base: string): string {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(color.trim());
  if (!m) return color;
  const alpha = Number.parseInt(m[2], 16) / 255;
  const b = /^#?([0-9a-f]{6})$/i.exec(base.trim());
  if (!b) return `#${m[1]}`;
  const mix = (f: number, t: number) => Math.round(f * alpha + t * (1 - alpha));
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
}

/** Tương phản WCAG giữa 2 màu (hòa alpha lên nền đục). */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(blendOn(fg, bg));
  const l2 = luminance(blendOn(bg, "#ffffff"));
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Màu đại diện của nền: solid -> 1 màu; linear-gradient -> các stop. */
function backgroundColors(bg: string): string[] {
  const stops = gradientStops(bg);
  return stops.length > 0 ? stops : [bg];
}

/**
 * Nền tối (tương phản trung bình với trắng ≥ 4.5) → chữ nên đảo trắng.
 * Hỗ trợ cả màu đục, rgba trong suốt lẫn linear-gradient (lấy trung bình stop).
 */
export function isDarkBackground(bg: string): boolean {
  if (!bg || bg === "transparent") return false;
  const colors = backgroundColors(bg);
  const lums = colors.map((c) => luminance(blendOn(c, "#ffffff")));
  const avg = lums.reduce((a, b) => a + b, 0) / lums.length;
  // luminance(trắng) = 1 → contrast với trắng = 1.05 / (avg + 0.05)
  return 1.05 / (avg + 0.05) >= 4.5;
}

/** Chọn màu chữ đọc được trên nền bất kỳ (auto đảo trắng/than). */
export function readableTextColor(
  bg: string,
  light = "#ffffff",
  dark = "#0f172a",
): string {
  return isDarkBackground(bg) ? light : dark;
}

/**
 * Tương phản tệ nhất giữa chữ `fg` và nền `bg` (solid hoặc gradient).
 * Với gradient lấy min qua mọi stop để đảm bảo chữ đọc được trên toàn dải.
 */
export function contrastAgainstBackground(fg: string, bg: string): number {
  if (!bg || bg === "transparent") return contrastRatio(fg, "#ffffff");
  const stops = gradientStops(bg);
  const list = stops.length > 0 ? stops : [bg];
  return Math.min(
    ...list.map((c) => contrastRatio(fg, blendOn(c, "#ffffff"))),
  );
}
