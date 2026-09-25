import type { NamedValue } from "../types/dashboard";

const preferredOrder = ["Khởi tạo", "Chờ xử lý", "Đã xem", "Phù hợp", "Từ chối"];

export function RecruitmentFunnel({ data }: { data: NamedValue[] }) {
  const sorted = [...data].sort((a, b) => preferredOrder.indexOf(a.Name) - preferredOrder.indexOf(b.Name));
  const max = Math.max(1, ...sorted.map((item) => item.Value));
  return <div className="space-y-4">
    {sorted.map((item) => <div key={item.Name}>
      <div className="mb-1.5 flex justify-between gap-4 text-sm"><span>{item.Name}</span><span className="tabular-nums text-muted-foreground">{item.Value.toLocaleString("vi-VN")} · {Math.round(item.Value * 100 / max)}%</span></div>
      <div className="h-3 overflow-hidden rounded-r-full bg-muted"><div className="h-full rounded-r-full bg-primary" style={{ width: `${Math.max(2, item.Value * 100 / max)}%` }} /></div>
    </div>)}
  </div>;
}
