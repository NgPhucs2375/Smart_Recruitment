"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export type MatchComponent = {
  key: string;
  nhan: string;
  diem: number;
  /** dat | khongKhop | biTru | thieuDuLieu | khongApDung */
  trangThai: string;
  ghiChu: string;
};

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
  /** Trạng thái thật của 4 ưu đãi phụ (có khi gọi /ketquaphuhops/match). */
  thanhPhan?: MatchComponent[];
};

const pct = (v: number) => `${Math.round(v * 100)}%`;
const bonus = (v: number) => {
  const p = Math.round(v * 1000) / 10;
  if (p === 0) return "—";
  return `${p > 0 ? "+" : "−"}${Math.abs(p)}%`;
};
const missingData = new Set(["thieuDuLieu", "khongApDung"]);

export function hasBreakdown(d: MatchBreakdownData): boolean {
  return d.diemKyNang !== undefined;
}

type Row = {
  key: string;
  label: string;
  hint: string;
  value: number;
  isSkill?: boolean;
  status?: string;
  note?: string;
};

export function MatchBreakdown({ data, defaultOpen = false, showSkills = true }: { data: MatchBreakdownData; defaultOpen?: boolean; showSkills?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!hasBreakdown(data)) return null;

  const fallbackRows: Row[] = [
    { key: "viTri", label: "Vị trí", hint: "tên công việc trùng vị trí ứng tuyển", value: data.bonusViTri ?? 0 },
    { key: "luong", label: "Lương", hint: "dải lương đáp ứng kỳ vọng", value: data.bonusLuong ?? 0 },
    { key: "diaDiem", label: "Địa điểm", hint: "cùng quận 5% · cùng thành phố 2.5%", value: data.bonusDiaDiem ?? 0 },
    { key: "kinhNghiem", label: "Kinh nghiệm", hint: "đủ số năm +5% · thiếu bị trừ tối đa 5%", value: data.bonusKinhNghiem ?? 0 },
  ];
  const rows: Row[] = data.thanhPhan?.length
    ? data.thanhPhan.map((c) => ({
      key: c.key,
      label: c.nhan,
      hint: c.ghiChu,
      value: c.diem,
      status: c.trangThai,
      note: c.ghiChu,
    }))
    : fallbackRows;
  // Chỉ hiện khi thực sự bị phạt: CV đủ mọi kỹ năng bắt buộc thì dòng này vô nghĩa.
  if (data.phatBatBuoc && data.phatBatBuoc > 0)
    rows.push({ key: "phat", label: "Thiếu bắt buộc", hint: "trần 60% rồi trừ 5% mỗi kỹ năng bắt buộc chưa có bằng chứng", value: -data.phatBatBuoc });

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
          <div className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 font-medium text-foreground" title="trọng số bắt buộc/ưu tiên · độ hiếm IDF · trình độ">Kỹ năng</span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (data.diemKyNang ?? 0) * 100)}%` }} />
            </div>
            <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">{pct(data.diemKyNang ?? 0)}</span>
          </div>
          <p className="pb-1 text-[11px] text-muted-foreground">Tiêu chí chính. Bốn mục dưới là ưu đãi cộng thêm, không phải điều kiện bắt buộc.</p>
          {rows.map((row) => {
            const noData = row.status ? missingData.has(row.status) : false;
            const muted = noData || (!row.isSkill && row.value === 0);
            return (
              <div key={row.key}>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-24 shrink-0 ${muted ? "text-muted-foreground" : "font-medium text-foreground"}`} title={row.hint}>{row.label}</span>
                  <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                    {row.value !== 0 && (
                      <div
                        className={`h-full rounded-full ${row.value < 0 ? "bg-red-400" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(100, Math.abs(row.value) * 1000)}%` }}
                      />
                    )}
                  </div>
                  <span className={`w-12 shrink-0 text-right tabular-nums ${row.value < 0 ? "text-red-600" : row.value === 0 ? "text-muted-foreground" : "text-emerald-700"}`}>
                    {row.isSkill ? pct(row.value) : bonus(row.value)}
                  </span>
                </div>
                {row.note && row.status !== "dat" && (
                  <p className="mt-0.5 pl-[6.5rem] text-[11px] leading-snug text-muted-foreground">{row.note}</p>
                )}
              </div>
            );
          })}
          {showSkills && (data.kyNangThoa?.length || data.kyNangThieu?.length) ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {data.kyNangThoa?.map((s) => <span key={s} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700">{s}</span>)}
              {data.kyNangBatBuocThieu?.map((s) => <span key={s} className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700">Thiếu bắt buộc: {s}</span>)}
              {data.kyNangThieu?.filter((s) => !data.kyNangBatBuocThieu?.includes(s)).map((s) => <span key={s} className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">Thiếu: {s}</span>)}
            </div>
          ) : null}
          <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
            Điểm = điểm kỹ năng + ưu đãi (trần 100%). Dấu “—” nghĩa là không áp dụng hoặc hai bên chưa có dữ liệu để so. Thiếu kỹ năng bắt buộc thì điểm bị chặn trần 60% và trừ 5% mỗi kỹ năng.
          </p>
        </div>
      )}
    </div>
  );
}
