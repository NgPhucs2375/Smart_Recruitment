export type TrendPoint = { Ngay: string; SoLuong: number };

export function barHeightPercent(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

export function niceScale(values: number[], intervals = 4) {
  const count = Math.max(2, Math.min(8, Math.round(intervals)));
  const highest = Math.max(0, ...values.filter(Number.isFinite));
  const roughStep = highest / count;
  const magnitude = roughStep > 0 ? 10 ** Math.floor(Math.log10(roughStep)) : 1;
  const normalized = roughStep / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 3 ? 3 : normalized <= 5 ? 5 : normalized <= 7 ? 7 : 10;
  const step = magnitude * factor;
  const max = Math.max(count, Math.ceil(roughStep / step) * step * count);
  return { max, ticks: Array.from({ length: count + 1 }, (_, index) => index * (max / count)) };
}

export function dateTickIndexes(length: number, limit = 5) {
  if (length <= 0) return [];
  if (length <= limit) return Array.from({ length }, (_, index) => index);
  return [...new Set(Array.from({ length: limit }, (_, index) => Math.round(index * (length - 1) / (limit - 1))))];
}

export function trendSummary(points: TrendPoint[]) {
  const total = points.reduce((sum, point) => sum + (Number.isFinite(point.SoLuong) ? Math.max(0, point.SoLuong) : 0), 0);
  let peak: { date: string; value: number } | null = null;
  for (const point of points) {
    const value = Number.isFinite(point.SoLuong) ? Math.max(0, point.SoLuong) : 0;
    if (!peak || value > peak.value) peak = { date: point.Ngay, value };
  }
  return { total, average: points.length ? Math.round((total / points.length) * 10) / 10 : 0, peak };
}

export function pointerIndexFromPlot(
  clientX: number,
  plotLeft: number,
  plotWidth: number,
  count: number,
  align: "edges" | "centers" = "edges",
): number | null {
  if (count <= 0 || plotWidth <= 0) return null;
  const ratio = (clientX - plotLeft) / plotWidth;
  if (ratio < 0 || ratio > 1) return null;
  const index = align === "centers" ? Math.floor(ratio * count) : Math.round(ratio * (count - 1));
  return Math.max(0, Math.min(count - 1, index));
}

export function keepPointVisible({
  pointOffset,
  viewportWidth,
  contentWidth,
  scrollLeft,
  margin = 24,
}: {
  pointOffset: number;
  viewportWidth: number;
  contentWidth: number;
  scrollLeft: number;
  margin?: number;
}): number {
  const maxScroll = Math.max(0, contentWidth - viewportWidth);
  if (pointOffset < scrollLeft + margin) return Math.round(Math.max(0, pointOffset - margin));
  if (pointOffset > scrollLeft + viewportWidth - margin) return Math.round(Math.min(maxScroll, pointOffset - viewportWidth + margin));
  return Math.round(scrollLeft);
}

export function tooltipCenter({
  pointOffset,
  viewportWidth,
  scrollLeft,
  tooltipWidth,
  margin = 8,
}: {
  pointOffset: number;
  viewportWidth: number;
  scrollLeft: number;
  tooltipWidth: number;
  margin?: number;
}): number {
  if (viewportWidth <= tooltipWidth + margin * 2) return scrollLeft + viewportWidth / 2;
  const half = tooltipWidth / 2;
  return Math.max(scrollLeft + margin + half,
    Math.min(scrollLeft + viewportWidth - margin - half, pointOffset));
}
