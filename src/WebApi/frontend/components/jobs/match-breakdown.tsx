"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export type MatchBreakdownData = {
  diemPhuHop: number;
  diemKyNang?: number;
  bonusViTri?: number;
  bonusLuong?: number;
  bonusDiaDiem?: number;
  bonusKinhNghiem?: number;
  /** Số điểm đã bị hạ vì thiếu kỹ năng bắt buộc; đã nằm trong diemPhuHop. */
  phatBatBuoc?: number;
  kyNangThoa?: string[];
  kyNangThieu?: string[];
  kyNangBatBuocThieu?: string[];
};

const pct = (v: number) => `${Math.round(v * 100)}%`;
const bonus = (v: number) => {
  const p = Math.round(v * 1000) / 10;
  if (p === 0) return "0%";
  return `${p > 0 ? "+" : "−"}${Math.abs(p)}%`;
};

export function hasBreakdown(d: MatchBreakdownData): boolean {
  return d.diemKyNang !== undefined;
}

export function MatchBreakdown({ data, defaultOpen = false, showSkills = true }: { data: MatchBreakdownData; defaultOpen?: boolean; showSkills?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!hasBreakdown(data)) return null;

  const rows: { label: string; hint: string; value: number; isSkill?: boolean }[] = [
    { label: "Kỹ năng", hint: "trọng số bắt buộc/ưu tiên · độ hiếm IDF · trình độ", value: data.diemKyNang ?? 0, isSkill: true },
    { label: "Vị trí", hint: "tên công việc trùng vị trí ứng tuyển", value: data.bonusViTri ?? 0 },
    { label: "Lương", hint: "dải lương đáp ứng kỳ vọng", value: data.bonusLuong ?? 0 },
    { label: "Địa điểm", hint: "cùng quận 5% · cùng thành phố 2.5%", value: data.bonusDiaDiem ?? 0 },
    { label: "Kinh nghiệm", hint: "đủ số năm +5% · thiếu bị trừ tối đa 5%", value: data.bonusKinhNghiem ?? 0 },
  ];
  // Chỉ hiện khi thực sự bị phạt: CV đủ mọi kỹ năng bắt buộc thì dòng này vô nghĩa.
  if (data.phatBatBuoc && data.phatBatBuoc > 0)
    rows.push({ label: "Thiếu bắt buộc", hint: "trần 60% rồi trừ 5% mỗi kỹ năng bắt buộc chưa có bằng chứng", value: -data.phatBatBuoc });

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        aria-expanded={open}
      >
        Vì sao {pct(data.diemPhuHop)}?
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-2 text-xs">
              <span className="w-24 shrink-0 font-medium text-foreground" title={row.hint}>{row.label}</span>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${row.isSkill ? "bg-primary" : row.value < 0 ? "bg-red-400" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, Math.abs(row.value) * (row.isSkill ? 100 : 1000))}%` }}
                />
              </div>
              <span className={`w-12 shrink-0 text-right tabular-nums ${row.value < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                {row.isSkill ? pct(row.value) : bonus(row.value)}
              </span>
            </div>
          ))}
          {showSkills && (data.kyNangThoa?.length || data.kyNangThieu?.length) ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {data.kyNangThoa?.map((s) => <span key={s} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700">{s}</span>)}
              {data.kyNangBatBuocThieu?.map((s) => <span key={s} className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700">Thiếu bắt buộc: {s}</span>)}
              {data.kyNangThieu?.filter((s) => !data.kyNangBatBuocThieu?.includes(s)).map((s) => <span key={s} className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">Thiếu: {s}</span>)}
            </div>
          ) : null}
          <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
            Tổng = điểm kỹ năng + các ưu đãi (trần 100%). Thiếu kỹ năng bắt buộc thì điểm bị chặn trần 60% và trừ 5% mỗi kỹ năng, nên tin chưa đủ yêu cầu không bao giờ xếp mức Cao.
          </p>
        </div>
      )}
    </div>
  );
}