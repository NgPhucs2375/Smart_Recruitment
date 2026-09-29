import type { GrowthPoint } from "../types/dashboard";

const series = [
  { key: "Users", label: "Người dùng", stroke: "stroke-primary", dot: "bg-primary" },
  { key: "Jobs", label: "Tin tuyển dụng", stroke: "stroke-emerald-500", dot: "bg-emerald-500" },
  { key: "Applications", label: "Ứng tuyển", stroke: "stroke-amber-500", dot: "bg-amber-500" },
  { key: "Cvs", label: "CV", stroke: "stroke-violet-500", dot: "bg-violet-500" },
] as const;

export function GrowthChart({ points }: { points: GrowthPoint[] }) {
  const width = 760;
  const height = 250;
  const padding = 24;
  const max = Math.max(1, ...points.flatMap((point) => series.map((item) => point[item.key])));
  const pathFor = (key: typeof series[number]["key"]) => points.map((point, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, points.length - 1);
    const y = height - padding - (point[key] / max) * (height - padding * 2);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <h2 className="font-semibold text-foreground">Tăng trưởng hệ thống</h2>
        <p className="mt-1 text-sm text-muted-foreground">Số bản ghi mới theo từng khoảng thời gian</p>
      </div>
      <div className="p-4 sm:p-5">
        {points.length === 0 ? <p className="py-20 text-center text-sm text-muted-foreground">Chưa có dữ liệu trong kỳ.</p> : (
          <>
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px]" role="img" aria-label="Biểu đồ tăng trưởng người dùng, tin tuyển dụng, ứng tuyển và CV">
                {[0.25, 0.5, 0.75, 1].map((ratio) => (
                  <line key={ratio} x1={padding} x2={width - padding} y1={height - padding - ratio * (height - padding * 2)} y2={height - padding - ratio * (height - padding * 2)} className="stroke-border" strokeDasharray="4 5" />
                ))}
                {series.map((item) => <path key={item.key} d={pathFor(item.key)} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={item.stroke} />)}
              </svg>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {series.map((item) => <span key={item.key} className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`h-0.5 w-5 ${item.dot}`} />{item.label}</span>)}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
