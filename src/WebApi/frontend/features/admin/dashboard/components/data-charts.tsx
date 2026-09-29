import type { NamedValue, SalaryItem, SkillDemand } from "../types/dashboard";

export function HorizontalBars({ data, valueSuffix = "", empty = "Chưa có dữ liệu." }: { data: NamedValue[]; valueSuffix?: string; empty?: string }) {
  const max = Math.max(1, ...data.map((item) => item.Value));
  if (data.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">{empty}</p>;
  return <div className="space-y-4">
    {data.map((item) => <div key={item.Name}>
      <div className="mb-1.5 flex items-center justify-between gap-4 text-sm"><span className="truncate text-foreground">{item.Name}</span><strong className="tabular-nums">{item.Value.toLocaleString("vi-VN")}{valueSuffix}</strong></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, item.Value * 100 / max)}%` }} /></div>
    </div>)}
  </div>;
}

export function SkillBars({ data }: { data: SkillDemand[] }) {
  const max = Math.max(1, ...data.map((item) => item.Demand));
  if (data.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">Chưa có kỹ năng trong các tin đang tuyển.</p>;
  return <div className="space-y-4">
    {data.map((item) => <div key={item.Name}>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate">{item.Name}</span><span className="text-xs tabular-nums text-muted-foreground">Cầu {item.Demand} · Cung {item.Supply} · Thiếu {item.Gap}</span></div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted"><div className="absolute inset-y-0 left-0 rounded-full bg-primary/35" style={{ width: `${item.Demand * 100 / max}%` }} /><div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${Math.min(item.Supply, item.Demand) * 100 / max}%` }} /></div>
    </div>)}
  </div>;
}

export function SalaryBars({ data }: { data: SalaryItem[] }) {
  return <HorizontalBars data={data.map((item) => ({ Name: item.Name, Value: Math.round(item.Average) }))} valueSuffix="" empty="Chưa có tin tuyển dụng khai báo mức lương." />;
}

const donutClasses = [
  { stroke: "stroke-primary", dot: "bg-primary" },
  { stroke: "stroke-emerald-500", dot: "bg-emerald-500" },
  { stroke: "stroke-amber-500", dot: "bg-amber-500" },
  { stroke: "stroke-violet-500", dot: "bg-violet-500" },
  { stroke: "stroke-sky-500", dot: "bg-sky-500" },
  { stroke: "stroke-rose-500", dot: "bg-rose-500" },
  { stroke: "stroke-lime-500", dot: "bg-lime-500" },
  { stroke: "stroke-orange-500", dot: "bg-orange-500" },
];

export function DonutChart({ data, centerLabel }: { data: NamedValue[]; centerLabel: string }) {
  const total = data.reduce((sum, item) => sum + item.Value, 0);
  return <div className="grid gap-5 sm:grid-cols-[150px_1fr] sm:items-center">
    <div className="relative mx-auto size-36">
      <svg viewBox="0 0 42 42" className="size-full -rotate-90" role="img" aria-label={`${centerLabel}: ${total.toLocaleString("vi-VN")}`}>
        <circle cx="21" cy="21" r="15.9155" fill="none" strokeWidth="5" className="stroke-muted" />
        {data.map((item, index) => {
          const percentage = total ? item.Value * 100 / total : 0;
          const offset = data.slice(0, index).reduce((sum, previous) => sum + (total ? previous.Value * 100 / total : 0), 0);
          return <circle key={item.Name} cx="21" cy="21" r="15.9155" fill="none" strokeWidth="5" strokeDasharray={`${percentage} ${100 - percentage}`} strokeDashoffset={-offset} className={donutClasses[index % donutClasses.length].stroke} />;
        })}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center"><strong className="text-xl tabular-nums">{total.toLocaleString("vi-VN")}</strong><span className="text-[10px] uppercase tracking-wider text-muted-foreground">{centerLabel}</span></div>
    </div>
    <div className="space-y-2.5">{data.map((item, index) => <div key={item.Name} className="flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2"><span className={`size-2 shrink-0 rounded-full ${donutClasses[index % donutClasses.length].dot}`} /><span className="truncate text-muted-foreground">{item.Name}</span></span><strong className="tabular-nums">{item.Value.toLocaleString("vi-VN")}</strong></div>)}</div>
  </div>;
}
