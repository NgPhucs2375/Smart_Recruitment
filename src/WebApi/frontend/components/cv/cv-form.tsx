"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChipInput } from "./chip-input";
import type {
  CvFormData,
  LienHe,
  HocVanItem,
  KinhNghiemItem,
  KyNangItem,
  DuAnItem,
  ChungChiItem,
  CvDatePrecision,
} from "@/lib/types";
import { newId, maskDateVn, isValidVnDate } from "@/features/tao-cv/cv-data";
import { formatVndInput } from "@/lib/format-vnd";
import {
  compareCvPartialDates,
  isValidCvPartialDate,
  maskMonthYear,
  maskYearOnly,
  parseCvPartialDate,
} from "@/features/tao-cv/cv-data";

interface CvFormProps {
  data: CvFormData;
  onChange: (data: CvFormData) => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div data-slot="card-header">
      <div data-slot="card-title">
        <span className="flex size-8 items-center justify-center rounded-lg bg-frost text-marine [&>svg]:size-4">
          <FileText className="h-4 w-4" />
        </span>
        {children}
      </div>
    </div>
  );
}

function DateField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const invalid = !isValidVnDate(value);
  return (
    <div>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>{label}</label>
      <Input
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(maskDateVn(e.target.value))}
        className={invalid ? "border-destructive" : ""}
      />
      {invalid && <p className="text-xs text-destructive mt-1">Ngày không hợp lệ (dd/mm/yyyy)</p>}
    </div>
  );
}

/** Month/year-or-year-only input. Precision comes from the item-level toggle. */
function PartialDateField({ label, value, precision, onChange, disabled }: {
  label: string;
  value: string;
  precision: CvDatePrecision;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const invalid = !isValidCvPartialDate(value, precision);
  const hint = precision === "year_only" ? "YYYY" : "MM/YYYY";
  return (
    <div>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>{label}</label>
      <Input
        inputMode="numeric"
        placeholder={hint}
        value={value}
        disabled={disabled}
        onChange={(e) =>
          onChange(precision === "year_only" ? maskYearOnly(e.target.value) : maskMonthYear(e.target.value))
        }
        className={invalid ? "border-destructive" : ""}
      />
      {invalid && <p className="text-xs text-destructive mt-1">Ngày không hợp lệ ({hint})</p>}
    </div>
  );
}

/** Per-item date format selector: "Tháng/Năm" | "Năm". Compact segmented control. */
function PrecisionToggle({ mode, onSwitch }: { mode: CvDatePrecision; onSwitch: (m: CvDatePrecision) => void }) {
  const renderBtn = (m: CvDatePrecision, label: string) => {
    const active = mode === m;
    return (
      <button
        key={m}
        type="button"
        aria-pressed={active}
        onClick={() => onSwitch(m)}
        className={
          active
            ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm"
            : "rounded-full px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground"
        }
      >
        {label}
      </button>
    );
  };
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <span style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Định dạng thời gian</span>
      <div
        role="group"
        aria-label="Định dạng thời gian"
        className="inline-flex rounded-full border border-input bg-muted/60 p-0.5"
      >
        {renderBtn("month_year", "Tháng/Năm")}
        {renderBtn("year_only", "Năm")}
      </div>
    </div>
  );
}

/** "Thời gian bắt đầu phải không sau thời gian kết thúc." or null. Skipped when empty/unparseable/end disabled. */
function rangeErrorText(tu: string, den: string, endDisabled?: boolean): string | null {
  if (endDisabled) return null;
  if (!tu.trim() || !den.trim()) return null;
  if (!parseCvPartialDate(tu) || !parseCvPartialDate(den)) return null;
  return compareCvPartialDates(tu, den) > 0 ? "Thời gian bắt đầu phải không sau thời gian kết thúc." : null;
}

export function CvForm({ data, onChange }: CvFormProps) {
  const lh = data.thongTinLienHe;
  const setLienHe = (field: keyof LienHe, value: string) =>
    onChange({ ...data, thongTinLienHe: { ...lh, [field]: value } });

  type ListKey = "hocVan" | "kinhNghiemLamViec" | "duAn" | "kyNang" | "chungChi";

  const updateList = (key: ListKey, id: string, field: string, value: unknown) => {
    const list = (data[key] as { id: string }[]).map((it) =>
      it.id === id ? { ...it, [field]: value } : it,
    );
    onChange({ ...data, [key]: list } as CvFormData);
  };

  const removeFrom = (key: ListKey, id: string) => {
    const list = (data[key] as { id: string }[]).filter((it) => it.id !== id);
    setDateMode((m) => {
      if (!(id in m)) return m;
      const next = { ...m };
      delete next[id];
      return next;
    });
    onChange({ ...data, [key]: list });
  };

  // Per-item date format (id -> mode). Defaults are section-specific
  // (see callers); explicit toggles are remembered per item.
  // monthStash keeps the month form for lossless toggling back from year.
  const [dateMode, setDateMode] = useState<Record<string, CvDatePrecision>>({});
  const monthStash = useRef<Record<string, string>>({});

  const modeFor = (
    id: string,
    tu: string,
    den: string,
    defaultMode: CvDatePrecision = "month_year"
  ): CvDatePrecision => {
    const override = dateMode[id];
    if (override) return override;
    const t = (tu || "").trim();
    const d = (den || "").trim();
    if (/^\d{4}$/.test(t) && (d === "" || /^\d{4}$/.test(d))) return "year_only";
    return defaultMode;
  };

  const convertForPrecision = (id: string, field: string, v: string, next: CvDatePrecision): string => {
    const key = `${id}:${field}`;
    const t = (v || "").trim();
    if (next === "year_only") {
      const d = parseCvPartialDate(t);
      if (!d) return t === "" ? "" : v;
      if (!/^\d{4}$/.test(t)) monthStash.current[key] = v;
      return String(d.year);
    }
    if (/^\d{4}$/.test(t)) {
      const stashed = monthStash.current[key];
      if (stashed && parseCvPartialDate(stashed)?.year === Number(t)) return stashed;
      return "";
    }
    return v;
  };

  const switchRangePrecision = (
    key: ListKey,
    id: string,
    tuField: string,
    denField: string | null,
    next: CvDatePrecision,
  ) => {
    // Single onChange so both fields update atomically.
    const converted = (data[key] as Record<string, unknown>[]).map((it) => {
      if ((it as { id: string }).id !== id) return it;
      const copy = { ...it } as Record<string, unknown>;
      copy[tuField] = convertForPrecision(id, tuField, String(it[tuField] ?? ""), next);
      if (denField) copy[denField] = convertForPrecision(id, denField, String(it[denField] ?? ""), next);
      return copy;
    });
    setDateMode((m) => ({ ...m, [id]: next }));
    onChange({ ...data, [key]: converted } as CvFormData);
  };

  return (
    <div className="cv-form-stack">
      {/* 1. Thông tin liên hệ */}
      <div className="cv-form-card">
        <SectionTitle>Thông tin liên hệ</SectionTitle>
        <div data-slot="card-content" style={{ padding: "1rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Họ và tên <span className="cv-required">*</span></label>
            <Input value={lh.hoTen} onChange={(e) => setLienHe("hoTen", e.target.value)} placeholder="Nguyễn Văn An" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Email <span className="cv-required">*</span></label>
              <Input type="email" value={lh.email} onChange={(e) => setLienHe("email", e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Số điện thoại <span className="cv-required">*</span></label>
              <Input value={lh.sdt} onChange={(e) => setLienHe("sdt", e.target.value)} placeholder="090 123 4567" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <DateField label="Ngày sinh" value={lh.ngaySinh} onChange={(v) => setLienHe("ngaySinh", v)} />
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Giới tính</label>
              <Input value={lh.gioiTinh} onChange={(e) => setLienHe("gioiTinh", e.target.value)} placeholder="Nam / Nữ" />
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Địa chỉ</label>
            <Input value={lh.diaChi} onChange={(e) => setLienHe("diaChi", e.target.value)} placeholder="Hà Nội, Việt Nam" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>GitHub</label>
              <Input value={lh.github} onChange={(e) => setLienHe("github", e.target.value)} placeholder="https://github.com/..." />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>LinkedIn</label>
              <Input value={lh.linkedIn} onChange={(e) => setLienHe("linkedIn", e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Portfolio</label>
              <Input value={lh.portfolio} onChange={(e) => setLienHe("portfolio", e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Vị trí ứng tuyển</label>
              <Input value={lh.viTriUngTuyen} onChange={(e) => setLienHe("viTriUngTuyen", e.target.value)} placeholder="VD: Backend .NET" />
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Mức lương mong muốn</label>
            <Input
              inputMode="numeric"
              value={lh.mucLuongMongMuon}
              onChange={(e) => setLienHe("mucLuongMongMuon", formatVndInput(e.target.value))}
              placeholder="VD: 15.000.000"
              className="tabular-nums"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Giới thiệu bản thân</label>
            <Textarea value={lh.gioiThieuBanThan} onChange={(e) => setLienHe("gioiThieuBanThan", e.target.value)} placeholder="Tóm tắt mục tiêu nghề nghiệp và điểm mạnh..." rows={4} />
          </div>
        </div>
      </div>

      {/* 2. Kinh nghiệm làm việc */}
      <div className="cv-form-card">
        <div data-slot="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div data-slot="card-title"><FileText className="h-5 w-5" />Kinh nghiệm làm việc</div>
          <Button variant="outline" size="sm" onClick={() => {
            const item: KinhNghiemItem = { id: newId(), congTy: "", chucDanh: "", tuNgay: "", denNgay: "", isHienTai: false, moTa: "", kyNangSuDung: [] };
            onChange({ ...data, kinhNghiemLamViec: [...data.kinhNghiemLamViec, item] });
          }}>
            <Plus className="h-4 w-4 mr-1" />Thêm
          </Button>
        </div>
        <div data-slot="card-content" style={{ padding: "1rem" }}>
          {data.kinhNghiemLamViec.length === 0 ? (
            <div className="cv-empty-form"><FileText className="h-4 w-4" /><span>Chưa có kinh nghiệm nào. Nhấn &quot;Thêm&quot; để bắt đầu.</span></div>
          ) : data.kinhNghiemLamViec.map((k) => {
            const mode = modeFor(k.id, k.tuNgay, k.denNgay);
            const err = rangeErrorText(k.tuNgay, k.denNgay, k.isHienTai);
            return (
            <div key={k.id} className="cv-repeat-item" style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                <Input placeholder="Công ty *" value={k.congTy} onChange={(e) => updateList("kinhNghiemLamViec", k.id, "congTy", e.target.value)} style={{ flex: 1 }} />
                <Input placeholder="Chức danh *" value={k.chucDanh} onChange={(e) => updateList("kinhNghiemLamViec", k.id, "chucDanh", e.target.value)} style={{ flex: 1 }} />
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFrom("kinhNghiemLamViec", k.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <PrecisionToggle mode={mode} onSwitch={(m) => switchRangePrecision("kinhNghiemLamViec", k.id, "tuNgay", "denNgay", m)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: err ? "0.25rem" : "0.75rem" }}>
                <PartialDateField label="Thời gian bắt đầu" precision={mode} value={k.tuNgay} onChange={(v) => updateList("kinhNghiemLamViec", k.id, "tuNgay", v)} />
                <PartialDateField label="Thời gian kết thúc" precision={mode} value={k.denNgay} disabled={k.isHienTai} onChange={(v) => updateList("kinhNghiemLamViec", k.id, "denNgay", v)} />
              </div>
              {err && <p className="text-xs text-destructive mt-1" style={{ marginBottom: "0.75rem" }}>{err}</p>}
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                <Checkbox checked={k.isHienTai} onCheckedChange={(v) => updateList("kinhNghiemLamViec", k.id, "isHienTai", v === true)} />
                Đang làm việc tại đây
              </label>
              <Textarea placeholder="Mô tả công việc, thành tựu..." value={k.moTa} onChange={(e) => updateList("kinhNghiemLamViec", k.id, "moTa", e.target.value)} rows={3} style={{ marginBottom: "0.75rem" }} />
              <ChipInput
                values={k.kyNangSuDung}
                onChange={(v) => updateList("kinhNghiemLamViec", k.id, "kyNangSuDung", v)}
                placeholder="Kỹ năng sử dụng — gõ rồi Enter"
              />
            </div>
            );
          })}
        </div>
      </div>

      {/* 3. Học vấn */}
      <div className="cv-form-card">
        <div data-slot="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div data-slot="card-title"><FileText className="h-5 w-5" />Học vấn</div>
          <Button variant="outline" size="sm" onClick={() => {
            const item: HocVanItem = { id: newId(), truong: "", chuyenNganh: "", tuNgay: "", denNgay: "", moTa: "" };
            onChange({ ...data, hocVan: [...data.hocVan, item] });
          }}>
            <Plus className="h-4 w-4 mr-1" />Thêm
          </Button>
        </div>
        <div data-slot="card-content" style={{ padding: "1rem" }}>
          {data.hocVan.length === 0 ? (
            <div className="cv-empty-form"><FileText className="h-4 w-4" /><span>Chưa có học vấn nào. Nhấn &quot;Thêm&quot; để bắt đầu.</span></div>
          ) : data.hocVan.map((h) => {
            const mode = modeFor(h.id, h.tuNgay, h.denNgay, "year_only");
            const err = rangeErrorText(h.tuNgay, h.denNgay, h.isHienTai);
            return (
            <div key={h.id} className="cv-repeat-item" style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                <Input placeholder="Trường *" value={h.truong} onChange={(e) => updateList("hocVan", h.id, "truong", e.target.value)} style={{ flex: 1 }} />
                <Input placeholder="Chuyên ngành" value={h.chuyenNganh} onChange={(e) => updateList("hocVan", h.id, "chuyenNganh", e.target.value)} style={{ flex: 1 }} />
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFrom("hocVan", h.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <PrecisionToggle mode={mode} onSwitch={(m) => switchRangePrecision("hocVan", h.id, "tuNgay", "denNgay", m)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: err ? "0.25rem" : "0.75rem" }}>
                <PartialDateField label="Thời gian bắt đầu" precision={mode} value={h.tuNgay} onChange={(v) => updateList("hocVan", h.id, "tuNgay", v)} />
                <PartialDateField label="Thời gian kết thúc" precision={mode} value={h.denNgay} disabled={h.isHienTai} onChange={(v) => updateList("hocVan", h.id, "denNgay", v)} />
              </div>
              {err && <p className="text-xs text-destructive mt-1" style={{ marginBottom: "0.75rem" }}>{err}</p>}
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                <Checkbox checked={h.isHienTai === true} onCheckedChange={(v) => updateList("hocVan", h.id, "isHienTai", v === true)} />
                Đang học
              </label>
              <Textarea placeholder="Mô tả thêm..." value={h.moTa} onChange={(e) => updateList("hocVan", h.id, "moTa", e.target.value)} rows={2} />
            </div>
            );
          })}
        </div>
      </div>

      {/* 4. Kỹ năng */}
      <div className="cv-form-card">
        <div data-slot="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div data-slot="card-title"><FileText className="h-5 w-5" />Kỹ năng</div>
          <Button variant="outline" size="sm" onClick={() => {
            const item: KyNangItem = { id: newId(), tenKyNang: "", mucDoThanhThao: "0", soNamKinhNghiem: "" };
            onChange({ ...data, kyNang: [...data.kyNang, item] });
          }}>
            <Plus className="h-4 w-4 mr-1" />Thêm
          </Button>
        </div>
        <div data-slot="card-content" style={{ padding: "1rem" }}>
          {data.kyNang.length === 0 && (
            <div className="cv-empty-form" style={{ marginBottom: "0.75rem" }}><FileText className="h-4 w-4" /><span>Chưa có kỹ năng nào. Nhấn &quot;Thêm&quot; để bắt đầu.</span></div>
          )}
          {data.kyNang.map((k) => (
            <div key={k.id} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", alignItems: "center" }}>
              <Input placeholder="Tên kỹ năng *" value={k.tenKyNang} onChange={(e) => updateList("kyNang", k.id, "tenKyNang", e.target.value)} style={{ flex: 2 }} />
               <select
                 aria-label="Mức độ thành thạo"
                 value={k.mucDoThanhThao || "0"}
                 onChange={(e) => updateList("kyNang", k.id, "mucDoThanhThao", e.target.value)}
                 className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
               >
                 <option value="0">Cơ bản</option>
                 <option value="1">Trung bình</option>
                 <option value="2">Thành thạo</option>
                 <option value="3">Chuyên gia</option>
               </select>
               <Input type="number" min="0" max="100" step="0.5" placeholder="Số năm" value={k.soNamKinhNghiem} onChange={(e) => updateList("kyNang", k.id, "soNamKinhNghiem", e.target.value)} style={{ flex: 1 }} />
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFrom("kyNang", k.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {data.kyNang.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {data.kyNang.map((k) => (
                <Badge key={k.id} variant="secondary">{k.tenKyNang || "(trống)"}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Dự án */}
      <div className="cv-form-card">
        <div data-slot="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div data-slot="card-title"><FileText className="h-5 w-5" />Dự án</div>
          <Button variant="outline" size="sm" onClick={() => {
            const item: DuAnItem = { id: newId(), tenDuAn: "", vaiTro: "", congNghe: [], link: "", moTa: "", tuNgay: "", denNgay: "" };
            onChange({ ...data, duAn: [...data.duAn, item] });
          }}>
            <Plus className="h-4 w-4 mr-1" />Thêm
          </Button>
        </div>
        <div data-slot="card-content" style={{ padding: "1rem" }}>
          {data.duAn.length === 0 ? (
            <div className="cv-empty-form"><FileText className="h-4 w-4" /><span>Chưa có dự án nào.</span></div>
          ) : data.duAn.map((d) => {
            const mode = modeFor(d.id, d.tuNgay, d.denNgay);
            const err = rangeErrorText(d.tuNgay, d.denNgay, d.isHienTai);
            return (
            <div key={d.id} className="cv-repeat-item" style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                <Input placeholder="Tên dự án *" value={d.tenDuAn} onChange={(e) => updateList("duAn", d.id, "tenDuAn", e.target.value)} style={{ flex: 1 }} />
                <Input placeholder="Vai trò" value={d.vaiTro} onChange={(e) => updateList("duAn", d.id, "vaiTro", e.target.value)} style={{ flex: 1 }} />
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFrom("duAn", d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <PrecisionToggle mode={mode} onSwitch={(m) => switchRangePrecision("duAn", d.id, "tuNgay", "denNgay", m)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: err ? "0.25rem" : "0.75rem" }}>
                <PartialDateField label="Thời gian bắt đầu" precision={mode} value={d.tuNgay} onChange={(v) => updateList("duAn", d.id, "tuNgay", v)} />
                <PartialDateField label="Thời gian kết thúc" precision={mode} value={d.denNgay} disabled={d.isHienTai} onChange={(v) => updateList("duAn", d.id, "denNgay", v)} />
              </div>
              {err && <p className="text-xs text-destructive mt-1" style={{ marginBottom: "0.75rem" }}>{err}</p>}
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                <Checkbox checked={d.isHienTai === true} onCheckedChange={(v) => updateList("duAn", d.id, "isHienTai", v === true)} />
                Đang thực hiện
              </label>
              <ChipInput
                values={d.congNghe}
                onChange={(v) => updateList("duAn", d.id, "congNghe", v)}
                placeholder="Công nghệ — gõ rồi Enter"
              />
              <Input placeholder="Link dự án" value={d.link} onChange={(e) => updateList("duAn", d.id, "link", e.target.value)} style={{ marginBottom: "0.75rem" }} />
              <Textarea placeholder="Mô tả dự án..." value={d.moTa} onChange={(e) => updateList("duAn", d.id, "moTa", e.target.value)} rows={2} />
            </div>
            );
          })}
        </div>
      </div>

      {/* 6. Chứng chỉ */}
      <div className="cv-form-card">
        <div data-slot="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div data-slot="card-title"><FileText className="h-5 w-5" />Chứng chỉ</div>
          <Button variant="outline" size="sm" onClick={() => {
            const item: ChungChiItem = { id: newId(), tenChungChi: "", donViCap: "", ngayCap: "", maXacMinh: "" };
            onChange({ ...data, chungChi: [...data.chungChi, item] });
          }}>
            <Plus className="h-4 w-4 mr-1" />Thêm
          </Button>
        </div>
        <div data-slot="card-content" style={{ padding: "1rem" }}>
          {data.chungChi.length === 0 ? (
            <div className="cv-empty-form"><FileText className="h-4 w-4" /><span>Chưa có chứng chỉ nào.</span></div>
          ) : data.chungChi.map((c) => {
            const mode = modeFor(c.id, c.ngayCap, "");
            return (
            <div key={c.id} className="cv-repeat-item" style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                <Input placeholder="Tên chứng chỉ *" value={c.tenChungChi} onChange={(e) => updateList("chungChi", c.id, "tenChungChi", e.target.value)} style={{ flex: 1 }} />
                <Input placeholder="Đơn vị cấp" value={c.donViCap} onChange={(e) => updateList("chungChi", c.id, "donViCap", e.target.value)} style={{ flex: 1 }} />
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFrom("chungChi", c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <PrecisionToggle mode={mode} onSwitch={(m) => switchRangePrecision("chungChi", c.id, "ngayCap", null, m)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <PartialDateField label="Ngày cấp" precision={mode} value={c.ngayCap} onChange={(v) => updateList("chungChi", c.id, "ngayCap", v)} />
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem" }}>Mã xác minh</label>
                  <Input placeholder="Mã xác minh" value={c.maXacMinh} onChange={(e) => updateList("chungChi", c.id, "maXacMinh", e.target.value)} />
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
