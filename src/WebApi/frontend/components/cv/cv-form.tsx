"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, FileText, Briefcase, GraduationCap, Wrench, FolderGit2, Award } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableSectionCard } from "./dnd/sortable-section-card";
import { SortableItem } from "./dnd/sortable-item";
import { normalizeLayoutConfig, type CvSectionId } from "@/features/tao-cv/resume-data";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChipInput } from "./chip-input";
import { CharacterCounter, CV_MAX_LENGTH } from "./character-counter";
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
import { focusCvSectionsInDom, getCvFocusEventName, type CvFocusSection } from "@/features/ai-cv/cv-focus";

interface CvFormProps {
  data: CvFormData;
  onChange: (data: CvFormData) => void;
  /** Hook AI backend cho nút "Viết chuẩn Harvard". Không truyền = mockup vô hiệu hóa nhẹ. */
  onAiRewrite?: (text: string, field: string) => void;
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

/** Upzi: checklist Do's & Don'ts thu nhỏ dưới mỗi card section lớn. */
function WritingTips({ items }: { items: string[] }) {
  return (
    <ul className="mb-3 space-y-1 rounded-lg border border-dashed border-input bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
      {items.map((tip) => (
        <li key={tip} className="flex gap-1.5">
          <span aria-hidden="true" className="text-teal">✓</span>
          <span>{tip}</span>
        </li>
      ))}
    </ul>
  );
}

/** Upzi: thanh công cụ mini dưới textarea mô tả. */
function QuickActionBar({
  value,
  maxLength,
  field,
  onApply,
  onAiRewrite,
}: {
  value: string;
  maxLength: number;
  field: string;
  onApply: (next: string) => void;
  onAiRewrite?: (text: string, field: string) => void;
}) {
  const overSafe = value.length > maxLength;
  const shorten = () => {
    const cut = value.slice(0, maxLength);
    const lastSpace = cut.lastIndexOf(" ");
    onApply(lastSpace > maxLength * 0.5 ? cut.slice(0, lastSpace) : cut);
  };
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {overSafe && (
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={shorten}>
          ⚡ Rút gọn câu
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-xs"
        data-hook="harvard-rewrite"
        title="Chuẩn bị kết nối API AI backend"
        onClick={() => onAiRewrite?.(value, field)}
      >
        Viết chuẩn Harvard
      </Button>
    </div>
  );
}

export function CvForm({ data, onChange, onAiRewrite }: CvFormProps) {
  const lh = data.thongTinLienHe;
  // UI-only: id of the repeat item added most recently, so only it plays
  // the enter animation (no mount cascade on pre-filled data).
  const [freshId, setFreshId] = useState<string | null>(null);
  // Item mới append cuối list (giữ đúng thứ tự nhập) + rAF đưa view tới
  // card vừa thêm rồi focus ô đầu để gõ ngay, khỏi lướt tay tìm.
  useEffect(() => {
    if (!freshId) return;
    const raf = requestAnimationFrame(() => {
      const card = document.querySelector(`[data-cv-item-id="${freshId}"]`);
      card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      card?.querySelector<HTMLElement>("input:not([disabled]), textarea:not([disabled])")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [freshId]);
  useEffect(() => {
    const onFocus = (event: Event) => {
      const section = (event as CustomEvent<{ section?: unknown }>).detail?.section;
      if (typeof section === "string") focusCvSectionsInDom([section as CvFocusSection]);
    };
    window.addEventListener(getCvFocusEventName(), onFocus);
    return () => window.removeEventListener(getCvFocusEventName(), onFocus);
  }, []);
  const setLienHe = (field: keyof LienHe, value: string) =>
    onChange({ ...data, thongTinLienHe: { ...lh, [field]: value } });

  type ListKey = "hocVan" | "kinhNghiemLamViec" | "duAn" | "kyNang" | "chungChi";

  const updateList = (key: ListKey, id: string, field: string, value: unknown) => {
    const list = (data[key] as { id: string }[]).map((it) =>
      it.id === id ? { ...it, [field]: value } : it,
    );
    onChange({ ...data, [key]: list } as CvFormData);
  };

  /** Upzi isCurrent: tích chọn -> disable + xóa ngày kết thúc, bỏ chọn -> nhập lại. */
  const setCurrentFlag = (
    key: "hocVan" | "kinhNghiemLamViec" | "duAn",
    id: string,
    value: boolean,
  ) => {
    const list = (data[key] as { id: string }[]).map((it) =>
      it.id === id ? { ...it, isHienTai: value, ...(value ? { denNgay: "" } : {}) } : it,
    );
    onChange({ ...data, [key]: list } as CvFormData);
  };

  // Modular layout: thứ tự + ẩn/hiện section (kéo thả ở form, render ở template).
  const layout = normalizeLayoutConfig(data.layoutConfig);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const updateLayout = (sectionOrder: CvSectionId[], isVisible?: Partial<Record<CvSectionId, boolean>>) => {
    const sections = { ...layout.sections };
    if (isVisible) {
      for (const [id, v] of Object.entries(isVisible)) {
        const key = id as CvSectionId;
        sections[key] = { ...sections[key], isVisible: v ?? true };
      }
    }
    onChange({ ...data, layoutConfig: { sectionOrder, sections } });
  };
  const toggleSection = (id: CvSectionId) => {
    const s = layout.sections[id];
    updateLayout(layout.sectionOrder, { [id]: !s.isVisible });
  };
  const isSectionVisible = (id: CvSectionId): boolean => layout.sections[id]?.isVisible !== false;
  const orderOf = (id: CvSectionId): number => layout.sectionOrder.indexOf(id) + 1;
  const countLabel = (n: number, unit: string): string | undefined => (n > 0 ? `${n} ${unit}` : undefined);

  const handleFormDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const a = String(active.id);
    const o = String(over.id);
    if ((layout.sectionOrder as string[]).includes(a) && (layout.sectionOrder as string[]).includes(o)) {
      const from = layout.sectionOrder.indexOf(a as CvSectionId);
      const to = layout.sectionOrder.indexOf(o as CvSectionId);
      updateLayout(arrayMove(layout.sectionOrder, from, to));
      return;
    }
    for (const key of ["kinhNghiemLamViec", "duAn"] as const) {
      const ids = (data[key] as { id: string }[]).map((it) => it.id);
      const from = ids.indexOf(a);
      const to = ids.indexOf(o);
      if (from >= 0 && to >= 0) {
        const list = arrayMove(data[key] as { id: string }[], from, to);
        onChange({ ...data, [key]: list } as CvFormData);
        return;
      }
    }
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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFormDragEnd}>
      <SortableContext
        items={layout.sectionOrder.filter((id) => id !== "summary")}
        strategy={verticalListSortingStrategy}
      >
    <div className="cv-form-stack">
      {/* 1. Thông tin liên hệ */}
      <div id="cv-section-contact" data-cv-section="contact" className="cv-form-card">
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
              <Input value={lh.viTriUngTuyen} maxLength={CV_MAX_LENGTH.shortTitle} onChange={(e) => setLienHe("viTriUngTuyen", e.target.value)} placeholder="VD: Backend .NET" />
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Tiêu đề hiển thị trên CV</label>
            <Input
              value={data.tieuDeHienThi ?? ""}
              maxLength={CV_MAX_LENGTH.shortTitle}
              onChange={(e) => onChange({ ...data, tieuDeHienThi: e.target.value })}
              placeholder="VD: Hồ sơ ứng viên — để trống dùng mặc định của mẫu"
            />
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
            <WritingTips
              items={["2–3 câu nêu bật thế mạnh, không dùng đại từ nhân xưng"]}
            />
            <div className="relative">
              <Textarea
                value={lh.gioiThieuBanThan}
                maxLength={CV_MAX_LENGTH.summary}
                onChange={(e) => setLienHe("gioiThieuBanThan", e.target.value)}
                placeholder="Tóm tắt mục tiêu nghề nghiệp và điểm mạnh..."
                rows={4}
                className="pb-5"
              />
              <CharacterCounter currentLength={lh.gioiThieuBanThan.length} maxLength={CV_MAX_LENGTH.summary} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Kinh nghiệm làm việc */}
      <SortableSectionCard
        id="experience"
        anchorId="cv-section-experience"
        sectionKey="experience"
        order={orderOf("experience")}
        title="Kinh nghiệm làm việc"
        icon={<Briefcase className="h-5 w-5" />}
        countLabel={countLabel(data.kinhNghiemLamViec.length, "kinh nghiệm")}
        visible={isSectionVisible("experience")}
        onToggleVisibility={() => toggleSection("experience")}
        actions={
          <Button variant="outline" size="sm" onClick={() => {
            const item: KinhNghiemItem = { id: newId(), congTy: "", chucDanh: "", tuNgay: "", denNgay: "", isHienTai: false, moTa: "", kyNangSuDung: [] };
            onChange({ ...data, kinhNghiemLamViec: [...data.kinhNghiemLamViec, item] });
            setFreshId(item.id);
          }}>
            <Plus className="h-4 w-4 mr-1" />Thêm
          </Button>
        }
      >

        <div data-slot="card-content" style={{ padding: "1rem" }}>
          <WritingTips
            items={["Bắt đầu bằng động từ hành động, nêu rõ kết quả định lượng"]}
          />
          {data.kinhNghiemLamViec.length === 0 ? (
            <div className="cv-empty-form"><FileText className="h-4 w-4" /><span>Chưa có kinh nghiệm nào. Nhấn &quot;Thêm&quot; để bắt đầu.</span></div>
          ) : (
            <SortableContext items={data.kinhNghiemLamViec.map((it) => it.id)} strategy={verticalListSortingStrategy}>
              {data.kinhNghiemLamViec.map((k) => {
            const mode = modeFor(k.id, k.tuNgay, k.denNgay);
            const err = rangeErrorText(k.tuNgay, k.denNgay, k.isHienTai);
            return (
            <SortableItem key={k.id} id={k.id}>
            <div data-cv-item-id={k.id} className={`cv-repeat-item${freshId === k.id ? " cv-repeat-enter" : ""}`} onAnimationEnd={() => setFreshId((f) => (f === k.id ? null : f))} style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                <Input placeholder="Công ty *" maxLength={CV_MAX_LENGTH.shortTitle} value={k.congTy} onChange={(e) => updateList("kinhNghiemLamViec", k.id, "congTy", e.target.value)} style={{ flex: 1 }} />
                <Input placeholder="Chức danh *" value={k.chucDanh} onChange={(e) => updateList("kinhNghiemLamViec", k.id, "chucDanh", e.target.value)} style={{ flex: 1 }} />
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFrom("kinhNghiemLamViec", k.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <PrecisionToggle mode={mode} onSwitch={(m) => switchRangePrecision("kinhNghiemLamViec", k.id, "tuNgay", "denNgay", m)} />
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2" style={{ marginBottom: err ? "0.25rem" : "0.75rem" }}>
                <div className="grid min-w-60 flex-1" style={{ gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <PartialDateField label="Thời gian bắt đầu" precision={mode} value={k.tuNgay} onChange={(v) => updateList("kinhNghiemLamViec", k.id, "tuNgay", v)} />
                  <PartialDateField label="Thời gian kết thúc" precision={mode} value={k.denNgay} disabled={k.isHienTai} onChange={(v) => updateList("kinhNghiemLamViec", k.id, "denNgay", v)} />
                </div>
                <label className="inline-flex items-center gap-2 text-sm" style={{ paddingBottom: "0.6rem" }}>
                  <Checkbox checked={k.isHienTai} onCheckedChange={(v) => setCurrentFlag("kinhNghiemLamViec", k.id, v === true)} />
                  Tôi hiện vẫn đang làm việc ở đây
                </label>
              </div>
              {err && <p className="text-xs text-destructive mt-1" style={{ marginBottom: "0.75rem" }}>{err}</p>}
              <div className="relative" style={{ marginBottom: "0.25rem" }}>
                <Textarea
                  placeholder="Mô tả công việc, thành tựu..."
                  value={k.moTa}
                  maxLength={CV_MAX_LENGTH.bullet}
                  onChange={(e) => updateList("kinhNghiemLamViec", k.id, "moTa", e.target.value)}
                  rows={3}
                  className="pb-5"
                  style={{ marginBottom: "0" }}
                />
                <CharacterCounter currentLength={k.moTa.length} maxLength={CV_MAX_LENGTH.bullet} />
              </div>
              <QuickActionBar
                value={k.moTa}
                maxLength={CV_MAX_LENGTH.bullet}
                field={`kinhNghiem:${k.id}`}
                onApply={(next) => updateList("kinhNghiemLamViec", k.id, "moTa", next)}
                onAiRewrite={onAiRewrite}
              />
              <div style={{ marginTop: "0.75rem" }}>
              <ChipInput
                values={k.kyNangSuDung}
                onChange={(v) => updateList("kinhNghiemLamViec", k.id, "kyNangSuDung", v)}
                placeholder="Kỹ năng sử dụng — gõ rồi Enter"
                maxLength={CV_MAX_LENGTH.skillTag}
              />
              </div>
            </div>
            </SortableItem>
            );
          })}
            </SortableContext>
          )}
        </div>
      </SortableSectionCard>

      {/* 3. Học vấn */}
      <SortableSectionCard
        id="education"
        anchorId="cv-section-education"
        sectionKey="education"
        order={orderOf("education")}
        title="Học vấn"
        icon={<GraduationCap className="h-5 w-5" />}
        countLabel={countLabel(data.hocVan.length, "học vấn")}
        visible={isSectionVisible("education")}
        onToggleVisibility={() => toggleSection("education")}
        actions={
          <Button variant="outline" size="sm" onClick={() => {
            const item: HocVanItem = { id: newId(), truong: "", chuyenNganh: "", tuNgay: "", denNgay: "", moTa: "" };
            onChange({ ...data, hocVan: [...data.hocVan, item] });
            setFreshId(item.id);
          }}>
            <Plus className="h-4 w-4 mr-1" />Thêm
          </Button>
        }
      >

        <div data-slot="card-content" style={{ padding: "1rem" }}>
          <WritingTips
            items={["Ghi rõ niên khóa, chuyên ngành và thành tích nổi bật nếu có"]}
          />
          {data.hocVan.length === 0 ? (
            <div className="cv-empty-form"><FileText className="h-4 w-4" /><span>Chưa có học vấn nào. Nhấn &quot;Thêm&quot; để bắt đầu.</span></div>
          ) : data.hocVan.map((h) => {
            const mode = modeFor(h.id, h.tuNgay, h.denNgay, "year_only");
            const err = rangeErrorText(h.tuNgay, h.denNgay, h.isHienTai);
            return (
            <div key={h.id} data-cv-item-id={h.id} className={`cv-repeat-item${freshId === h.id ? " cv-repeat-enter" : ""}`} onAnimationEnd={() => setFreshId((f) => (f === h.id ? null : f))} style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                <Input placeholder="Trường *" value={h.truong} onChange={(e) => updateList("hocVan", h.id, "truong", e.target.value)} style={{ flex: 1 }} />
                <Input placeholder="Chuyên ngành" value={h.chuyenNganh} onChange={(e) => updateList("hocVan", h.id, "chuyenNganh", e.target.value)} style={{ flex: 1 }} />
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFrom("hocVan", h.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <PrecisionToggle mode={mode} onSwitch={(m) => switchRangePrecision("hocVan", h.id, "tuNgay", "denNgay", m)} />
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2" style={{ marginBottom: err ? "0.25rem" : "0.75rem" }}>
                <div className="grid min-w-60 flex-1" style={{ gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <PartialDateField label="Thời gian bắt đầu" precision={mode} value={h.tuNgay} onChange={(v) => updateList("hocVan", h.id, "tuNgay", v)} />
                  <PartialDateField label="Thời gian kết thúc" precision={mode} value={h.denNgay} disabled={h.isHienTai} onChange={(v) => updateList("hocVan", h.id, "denNgay", v)} />
                </div>
                <label className="inline-flex items-center gap-2 text-sm" style={{ paddingBottom: "0.6rem" }}>
                  <Checkbox checked={h.isHienTai === true} onCheckedChange={(v) => setCurrentFlag("hocVan", h.id, v === true)} />
                  Tôi hiện vẫn đang học tập ở đây
                </label>
              </div>
              {err && <p className="text-xs text-destructive mt-1" style={{ marginBottom: "0.75rem" }}>{err}</p>}
              <Textarea placeholder="Mô tả thêm..." value={h.moTa} onChange={(e) => updateList("hocVan", h.id, "moTa", e.target.value)} rows={2} />
            </div>
            );
          })}
        </div>
      </SortableSectionCard>

      {/* 4. Kỹ năng */}
      <SortableSectionCard
        id="skills"
        anchorId="cv-section-skills"
        sectionKey="skills"
        order={orderOf("skills")}
        title="Kỹ năng"
        icon={<Wrench className="h-5 w-5" />}
        countLabel={countLabel(data.kyNang.length, "kỹ năng")}
        visible={isSectionVisible("skills")}
        onToggleVisibility={() => toggleSection("skills")}
        actions={
          <Button variant="outline" size="sm" onClick={() => {
            const item: KyNangItem = { id: newId(), tenKyNang: "", mucDoThanhThao: "0", soNamKinhNghiem: "" };
            onChange({ ...data, kyNang: [...data.kyNang, item] });
            setFreshId(item.id);
          }}>
            <Plus className="h-4 w-4 mr-1" />Thêm
          </Button>
        }
      >

        <div data-slot="card-content" style={{ padding: "1rem" }}>
          {data.kyNang.length === 0 && (
            <div className="cv-empty-form" style={{ marginBottom: "0.75rem" }}><FileText className="h-4 w-4" /><span>Chưa có kỹ năng nào. Nhấn &quot;Thêm&quot; để bắt đầu.</span></div>
          )}
          {data.kyNang.map((k) => (
            <div key={k.id} data-cv-item-id={k.id} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", alignItems: "center" }}>
              <Input placeholder="Tên kỹ năng *" maxLength={CV_MAX_LENGTH.skillTag} value={k.tenKyNang} onChange={(e) => updateList("kyNang", k.id, "tenKyNang", e.target.value)} style={{ flex: 2 }} />
                <Select value={k.mucDoThanhThao || "0"} onValueChange={(value) => updateList("kyNang", k.id, "mucDoThanhThao", value)}>
                  <SelectTrigger className="h-9 flex-1" aria-label="Mức độ thành thạo"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Cơ bản</SelectItem>
                    <SelectItem value="1">Trung bình</SelectItem>
                    <SelectItem value="2">Thành thạo</SelectItem>
                    <SelectItem value="3">Chuyên gia</SelectItem>
                  </SelectContent>
                </Select>
               <Input type="number" min="0" max="100" step="0.5" placeholder="Số năm" value={k.soNamKinhNghiem} onChange={(e) => updateList("kyNang", k.id, "soNamKinhNghiem", e.target.value)} style={{ flex: 1 }} />
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFrom("kyNang", k.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </SortableSectionCard>

      {/* 5. Dự án */}
      <SortableSectionCard
        id="projects"
        anchorId="cv-section-projects"
        sectionKey="projects"
        order={orderOf("projects")}
        title="Dự án"
        icon={<FolderGit2 className="h-5 w-5" />}
        countLabel={countLabel(data.duAn.length, "dự án")}
        visible={isSectionVisible("projects")}
        onToggleVisibility={() => toggleSection("projects")}
        actions={
          <Button variant="outline" size="sm" onClick={() => {
            const item: DuAnItem = { id: newId(), tenDuAn: "", vaiTro: "", congNghe: [], link: "", moTa: "", tuNgay: "", denNgay: "" };
            onChange({ ...data, duAn: [...data.duAn, item] });
            setFreshId(item.id);
          }}>
            <Plus className="h-4 w-4 mr-1" />Thêm
          </Button>
        }
      >

        <div data-slot="card-content" style={{ padding: "1rem" }}>
          {data.duAn.length === 0 ? (
            <div className="cv-empty-form"><FileText className="h-4 w-4" /><span>Chưa có dự án nào.</span></div>
          ) : (
            <SortableContext items={data.duAn.map((it) => it.id)} strategy={verticalListSortingStrategy}>
              {data.duAn.map((d) => {
            const mode = modeFor(d.id, d.tuNgay, d.denNgay);
            const err = rangeErrorText(d.tuNgay, d.denNgay, d.isHienTai);
            return (
            <SortableItem key={d.id} id={d.id}>
            <div data-cv-item-id={d.id} className={`cv-repeat-item${freshId === d.id ? " cv-repeat-enter" : ""}`} onAnimationEnd={() => setFreshId((f) => (f === d.id ? null : f))} style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                <Input placeholder="Tên dự án *" maxLength={CV_MAX_LENGTH.shortTitle} value={d.tenDuAn} onChange={(e) => updateList("duAn", d.id, "tenDuAn", e.target.value)} style={{ flex: 1 }} />
                <Input placeholder="Vai trò" value={d.vaiTro} onChange={(e) => updateList("duAn", d.id, "vaiTro", e.target.value)} style={{ flex: 1 }} />
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFrom("duAn", d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <PrecisionToggle mode={mode} onSwitch={(m) => switchRangePrecision("duAn", d.id, "tuNgay", "denNgay", m)} />
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2" style={{ marginBottom: err ? "0.25rem" : "0.75rem" }}>
                <div className="grid min-w-60 flex-1" style={{ gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <PartialDateField label="Thời gian bắt đầu" precision={mode} value={d.tuNgay} onChange={(v) => updateList("duAn", d.id, "tuNgay", v)} />
                  <PartialDateField label="Thời gian kết thúc" precision={mode} value={d.denNgay} disabled={d.isHienTai} onChange={(v) => updateList("duAn", d.id, "denNgay", v)} />
                </div>
                <label className="inline-flex items-center gap-2 text-sm" style={{ paddingBottom: "0.6rem" }}>
                  <Checkbox checked={d.isHienTai === true} onCheckedChange={(v) => setCurrentFlag("duAn", d.id, v === true)} />
                  Đang thực hiện
                </label>
              </div>
              {err && <p className="text-xs text-destructive mt-1" style={{ marginBottom: "0.75rem" }}>{err}</p>}
              <ChipInput
                values={d.congNghe}
                onChange={(v) => updateList("duAn", d.id, "congNghe", v)}
                placeholder="Công nghệ — gõ rồi Enter"
                maxLength={CV_MAX_LENGTH.skillTag}
              />
              <Input placeholder="Link dự án" value={d.link} onChange={(e) => updateList("duAn", d.id, "link", e.target.value)} style={{ marginBottom: "0.75rem" }} />
              <div className="relative" style={{ marginBottom: "0.25rem" }}>
                <Textarea
                  placeholder="Mô tả dự án..."
                  value={d.moTa}
                  maxLength={CV_MAX_LENGTH.bullet}
                  onChange={(e) => updateList("duAn", d.id, "moTa", e.target.value)}
                  rows={2}
                  className="pb-5"
                  style={{ marginBottom: "0" }}
                />
                <CharacterCounter currentLength={d.moTa.length} maxLength={CV_MAX_LENGTH.bullet} />
              </div>
              <QuickActionBar
                value={d.moTa}
                maxLength={CV_MAX_LENGTH.bullet}
                field={`duAn:${d.id}`}
                onApply={(next) => updateList("duAn", d.id, "moTa", next)}
                onAiRewrite={onAiRewrite}
              />
            </div>
            </SortableItem>
            );
          })}
            </SortableContext>
          )}
        </div>
      </SortableSectionCard>

      {/* 6. Chứng chỉ */}
      <SortableSectionCard
        id="certificates"
        anchorId="cv-section-certificates"
        sectionKey="certificates"
        order={orderOf("certificates")}
        title="Chứng chỉ"
        icon={<Award className="h-5 w-5" />}
        countLabel={countLabel(data.chungChi.length, "chứng chỉ")}
        visible={isSectionVisible("certificates")}
        onToggleVisibility={() => toggleSection("certificates")}
        actions={
          <Button variant="outline" size="sm" onClick={() => {
            const item: ChungChiItem = { id: newId(), tenChungChi: "", donViCap: "", ngayCap: "", maXacMinh: "" };
            onChange({ ...data, chungChi: [...data.chungChi, item] });
            setFreshId(item.id);
          }}>
            <Plus className="h-4 w-4 mr-1" />Thêm
          </Button>
        }
      >

        <div data-slot="card-content" style={{ padding: "1rem" }}>
          {data.chungChi.length === 0 ? (
            <div className="cv-empty-form"><FileText className="h-4 w-4" /><span>Chưa có chứng chỉ nào.</span></div>
          ) : data.chungChi.map((c) => {
            const mode = modeFor(c.id, c.ngayCap, "");
            return (
            <div key={c.id} data-cv-item-id={c.id} className={`cv-repeat-item${freshId === c.id ? " cv-repeat-enter" : ""}`} onAnimationEnd={() => setFreshId((f) => (f === c.id ? null : f))} style={{ marginBottom: "0.75rem" }}>
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
      </SortableSectionCard>
    </div>
      </SortableContext>
    </DndContext>
  );
}
