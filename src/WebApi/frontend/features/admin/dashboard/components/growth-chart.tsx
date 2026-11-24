"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { dateTickIndexes, keepPointVisible, niceScale, pointerIndexFromPlot, tooltipCenter } from "../../chart-utils";
import type { GrowthPoint } from "../types/dashboard";

const series = [
  { key: "Users", label: "Người dùng", stroke: "stroke-primary", dot: "bg-primary", dash: "" },
  { key: "Jobs", label: "Tin tuyển dụng", stroke: "stroke-emerald-500", dot: "bg-emerald-500", dash: "7 5" },
  { key: "Applications", label: "Ứng tuyển", stroke: "stroke-amber-500", dot: "bg-amber-500", dash: "2 4" },
  { key: "Cvs", label: "CV", stroke: "stroke-violet-500", dot: "bg-violet-500", dash: "10 3 2 3" },
] as const;

const formatNumber = (value: number) => value.toLocaleString("vi-VN");

export function GrowthChart({ points, periodDays }: { points: GrowthPoint[]; periodDays: number }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipLeft, setTooltipLeft] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tooltipWidth = 224;
  const width = 760;
  const height = 280;
  const left = 48;
  const right = 20;
  const top = 20;
  const bottom = 44;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const bucketLabel = periodDays <= 30 ? "Ngày" : periodDays <= 90 ? "Tuần" : "Tháng";
  const scale = niceScale(points.flatMap(point => series.map(item => point[item.key])));
  const xFor = (index: number) => points.length === 1 ? left + plotWidth / 2 : left + index * plotWidth / (points.length - 1);
  const yFor = (value: number) => top + plotHeight - Math.max(0, value) / scale.max * plotHeight;
  const pathFor = (key: typeof series[number]["key"]) => points.map((point, index) =>
    `${index === 0 ? "M" : "L"}${xFor(index).toFixed(1)},${yFor(point[key]).toFixed(1)}`).join(" ");
  const dateLabel = (date: string) => new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("vi-VN", bucketLabel === "Tháng"
    ? { month: "2-digit", year: "numeric" }
    : { day: "2-digit", month: "2-digit" });
  const active = activeIndex !== null && activeIndex < points.length ? points[activeIndex] : null;

  const revealIndex = (index: number) => {
    const viewport = chartRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const contentWidth = content.getBoundingClientRect().width;
    const pointOffset = xFor(index) / width * contentWidth;
    viewport.scrollLeft = keepPointVisible({
      pointOffset,
      viewportWidth: viewport.clientWidth,
      contentWidth,
      scrollLeft: viewport.scrollLeft,
    });
  };

  const positionTooltip = (index: number) => {
    const viewport = chartRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const contentWidth = content.getBoundingClientRect().width;
    setTooltipLeft(tooltipCenter({
      pointOffset: xFor(index) / width * contentWidth,
      viewportWidth: viewport.clientWidth,
      scrollLeft: viewport.scrollLeft,
      tooltipWidth,
    }));
  };

  const selectIndex = (index: number) => {
    setActiveIndex(index);
    positionTooltip(index);
  };

  const selectFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = contentRef.current?.getBoundingClientRect();
    if (!bounds || points.length === 0) return;
    const plotLeft = bounds.left + left / width * bounds.width;
    const renderedPlotWidth = plotWidth / width * bounds.width;
    const index = pointerIndexFromPlot(event.clientX, plotLeft, renderedPlotWidth, points.length);
    if (index === null) setActiveIndex(null);
    else selectIndex(index);
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
      selectIndex(next);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <h2 className="font-semibold text-foreground">Tăng trưởng hệ thống</h2>
        <p className="mt-1 text-sm text-muted-foreground">Số bản ghi mới theo {bucketLabel.toLowerCase()} · tổng {formatNumber(points.length)} kỳ</p>
      </div>
      <div className="p-4 sm:p-5">
        {points.length === 0 ? <p className="py-20 text-center text-sm text-muted-foreground">Chưa có dữ liệu trong kỳ.</p> : <>
          <div
            ref={chartRef}
            data-chart="growth"
            className="relative overflow-x-auto rounded-xl bg-muted/20 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            tabIndex={0}
            role="group"
            aria-label={`Biểu đồ tăng trưởng theo ${bucketLabel.toLowerCase()}. Dùng phím mũi tên trái, phải để xem từng mốc.`}
            onPointerMove={selectFromPointer}
            onPointerLeave={() => setActiveIndex(null)}
            onFocus={() => selectIndex(0)}
            onBlur={() => setActiveIndex(null)}
            onKeyDown={handleKeyDown}
            onScroll={() => { if (activeIndex !== null) positionTooltip(activeIndex); }}
          >
            <div ref={contentRef} data-chart-content="growth" className="relative min-w-[640px]">
              <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" aria-hidden="true">
                {scale.ticks.map(tick => (
                  <g key={tick}>
                    <line x1={left} x2={width - right} y1={yFor(tick)} y2={yFor(tick)} className="stroke-border" strokeDasharray={tick === 0 ? undefined : "4 5"} />
                    <text x={left - 10} y={yFor(tick) + 4} textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">{formatNumber(tick)}</text>
                  </g>
                ))}
                {dateTickIndexes(points.length, 6).map(index => (
                  <text key={points[index].Date} x={xFor(index)} y={height - 14} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} className="fill-muted-foreground text-[11px]">{dateLabel(points[index].Date)}</text>
                ))}
                {active && activeIndex !== null && <line x1={xFor(activeIndex)} x2={xFor(activeIndex)} y1={top} y2={top + plotHeight} className="stroke-foreground/30" strokeDasharray="3 4" />}
                {series.map(item => <path key={item.key} d={pathFor(item.key)} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={item.dash || undefined} className={item.stroke} />)}
                {series.map(item => points.map((point, index) => <circle key={`${item.key}-${point.Date}`} cx={xFor(index)} cy={yFor(point[item.key])} r={index === activeIndex ? 4.5 : 2} className={`${item.stroke} fill-card`} strokeWidth={index === activeIndex ? 2.5 : 1.5} />))}
                {series.map(item => {
                  const last = points[points.length - 1];
                  return <circle key={`end-${item.key}`} cx={xFor(points.length - 1)} cy={yFor(last[item.key])} r="4.5" className={`${item.stroke} fill-card`} strokeWidth="2.5" />;
                })}
              </svg>
              {active && activeIndex !== null && (
                <div role="status" aria-live="polite" className="pointer-events-none absolute top-3 z-10 w-56 -translate-x-1/2 rounded-xl border border-border bg-popover p-3 text-xs shadow-lg" style={{ left: `${tooltipLeft}px` }}>
                  <p className="mb-2 font-semibold text-popover-foreground">{bucketLabel} · {dateLabel(active.Date)}</p>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {series.map(item => <div key={item.key} className="flex items-center justify-between gap-2"><dt className="flex items-center gap-1.5 text-muted-foreground"><span className={`size-2 rounded-full ${item.dot}`} />{item.label}</dt><dd className="font-semibold tabular-nums">{formatNumber(active[item.key])}</dd></div>)}
                  </dl>
                </div>
              )}
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Di chuột hoặc dùng phím ← → để xem chi tiết từng mốc.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {series.map(item => <div key={item.key} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs"><span className="flex items-center gap-2 text-muted-foreground"><svg width="22" height="8" aria-hidden="true"><line x1="1" x2="21" y1="4" y2="4" strokeWidth="2.5" strokeDasharray={item.dash || undefined} className={item.stroke} /></svg>{item.label}</span><strong className="tabular-nums">{formatNumber(points.reduce((sum, point) => sum + point[item.key], 0))}</strong></div>)}
          </div>
        </>}
      </div>
    </section>
  );
}
