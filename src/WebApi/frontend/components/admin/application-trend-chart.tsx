"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { TrendingUp } from "lucide-react";
import { AdminEmptyState } from "@/components/admin/admin-page-layout";
import { barHeightPercent, dateTickIndexes, keepPointVisible, niceScale, pointerIndexFromPlot, trendSummary, type TrendPoint } from "@/features/admin/chart-utils";

const formatNumber = (value: number) => value.toLocaleString("vi-VN");
const dateLabel = (date: string) => new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

export function ApplicationTrendChart({ points }: { points: TrendPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const summary = trendSummary(points);
  const scale = niceScale(points.map(point => point.SoLuong));
  const contentMinWidth = Math.max(560, points.length * 14);
  const active = activeIndex !== null && activeIndex < points.length ? points[activeIndex] : null;

  const revealIndex = (index: number) => {
    const viewport = chartRef.current;
    const content = contentRef.current;
    const plot = plotRef.current;
    if (!viewport || !content || !plot) return;
    const contentBounds = content.getBoundingClientRect();
    const plotBounds = plot.getBoundingClientRect();
    const pointOffset = plotBounds.left - contentBounds.left + (index + 0.5) / points.length * plotBounds.width;
    viewport.scrollLeft = keepPointVisible({
      pointOffset,
      viewportWidth: viewport.clientWidth,
      contentWidth: contentBounds.width,
      scrollLeft: viewport.scrollLeft,
    });
  };

  const selectFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = plotRef.current?.getBoundingClientRect();
    if (!bounds || points.length === 0) return;
    const index = pointerIndexFromPlot(event.clientX, bounds.left, bounds.width, points.length, "centers");
    setActiveIndex(index);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (points.length === 0) return;
    const current = activeIndex ?? 0;
    let next: number | null;
    if (event.key === "ArrowRight") next = Math.min(points.length - 1, current + 1);
    else if (event.key === "ArrowLeft") next = Math.max(0, current - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = points.length - 1;
    else if (event.key === "Escape") next = null;
    else return;
    event.preventDefault();
    if (next === null) setActiveIndex(null);
    else {
      revealIndex(next);
      setActiveIndex(next);
    }
  };

  if (points.length === 0) return <AdminEmptyState icon={TrendingUp} title="Chưa có số liệu thống kê" description="Biểu đồ xu hướng sẽ tự động cập nhật khi có đơn ứng tuyển trong kỳ." />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/50 p-3 sm:p-4"><p className="text-xs text-muted-foreground">Tổng lượt nộp</p><p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{formatNumber(summary.total)}</p></div>
        <div className="rounded-xl bg-muted/50 p-3 sm:p-4"><p className="text-xs text-muted-foreground">Trung bình / ngày</p><p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{formatNumber(summary.average)}</p></div>
        <div className="rounded-xl bg-primary/10 p-3 sm:p-4"><p className="text-xs text-muted-foreground">Ngày đỉnh</p><p className="mt-1 text-xl font-bold tabular-nums text-primary sm:text-2xl">{formatNumber(summary.peak?.value ?? 0)}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{summary.peak ? dateLabel(summary.peak.date) : "—"}</p></div>
      </div>
      <div className="relative">
        <div
          ref={chartRef}
          data-chart="applications"
          className="overflow-x-auto rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          tabIndex={0}
          role="group"
          aria-label={`Biểu đồ lượt nộp theo ngày, tổng ${summary.total} lượt, ngày đỉnh ${summary.peak?.value ?? 0} lượt. Dùng phím mũi tên để xem chi tiết.`}
          onPointerMove={selectFromPointer}
          onPointerLeave={() => setActiveIndex(null)}
          onFocus={() => setActiveIndex(current => current ?? 0)}
          onBlur={() => setActiveIndex(null)}
          onKeyDown={handleKeyDown}
        >
          <div ref={contentRef} data-chart-content="applications" className="relative rounded-xl bg-muted/20 pb-7 pl-11 pr-2 pt-3" style={{ minWidth: `${contentMinWidth}px` }}>
            <div className="pointer-events-none absolute bottom-7 left-2 right-2 top-3" aria-hidden="true">
              {scale.ticks.map(tick => <div key={tick} className="absolute left-0 right-0 border-t border-border border-dashed" style={{ bottom: `${tick / scale.max * 100}%` }}><span className="absolute -left-9 top-0 w-8 -translate-y-1/2 text-right text-[11px] tabular-nums text-muted-foreground">{formatNumber(tick)}</span></div>)}
            </div>
            <div ref={plotRef} data-chart-plot="applications" className="relative flex h-52 items-end gap-1">
              {points.map((point, index) => {
                const peak = summary.peak?.date === point.Ngay && point.SoLuong > 0;
                return (
                  <div key={point.Ngay} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
                    <div
                      className={`w-full max-w-10 rounded-t-md transition-colors ${peak ? "bg-primary" : index === activeIndex ? "bg-primary" : "bg-primary/65 group-hover:bg-primary/85"}`}
                      style={{ height: `${barHeightPercent(point.SoLuong, scale.max)}%` }}
                    />
                    {point.SoLuong === 0 && <span className="absolute bottom-0 h-px w-full bg-primary/50" title="0 lượt" />}
                  </div>
                );
              })}
              {active && activeIndex !== null && <div className="pointer-events-none absolute left-0 right-0 border-x border-foreground/20 bg-foreground/[0.03]" style={{ marginLeft: `${activeIndex / points.length * 100}%`, width: `${100 / points.length}%`, top: 0, bottom: 0 }} />}
            </div>
            <div className="pointer-events-none absolute bottom-1 left-11 right-2 h-5" aria-hidden="true">
              {dateTickIndexes(points.length, 6).map(index => <span key={points[index].Ngay} className="absolute text-[11px] text-muted-foreground" style={{ left: `${(index + 0.5) / points.length * 100}%`, transform: "translateX(-50%)" }}>{dateLabel(points[index].Ngay)}</span>)}
            </div>
          </div>
        </div>
        {active && activeIndex !== null && (
          <div role="status" aria-live="polite" className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-3 py-2 text-xs font-medium text-popover-foreground shadow-lg">
            {dateLabel(active.Ngay)} · {formatNumber(active.SoLuong)} lượt
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">Cột cao biểu thị số lượt nộp; ngày không có đơn hiển thị đúng 0. Di chuột hoặc dùng phím ← → để xem chi tiết.</p>
    </div>
  );
}
