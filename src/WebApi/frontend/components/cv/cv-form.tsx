"use client";

<<<<<<< HEAD
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
=======
import { useState, type ReactNode } from "react";
import { Check, Plus, X } from "lucide-react";
>>>>>>> origin/dev-Phuc2
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChipInput } from "./chip-input";
<<<<<<< HEAD
import { CharacterCounter, CV_MAX_LENGTH } from "./character-counter";
=======
import { CvEditorSection, CvSummaryItem, SectionLink } from "./cv-editor-section";
>>>>>>> origin/dev-Phuc2
import type {
  ChungChiItem,
  CvFormData,
  DuAnItem,
  HocVanItem,
  KinhNghiemItem,
  KyNangItem,
  LienHe,
} from "@/lib/types";
import {
  compareCvPartialDates,
  isValidCvPartialDate,
  isValidVnDate,
  maskAutoDate,
  maskDateVn,
  newId,
  normalizeCvPartialDateInput,
  normalizeVnDate,
  parseCvPartialDate,
} from "@/features/tao-cv/cv-data";
import { formatVndInput } from "@/lib/format-vnd";

interface CvFormProps {
  data: CvFormData;
  onChange: (data: CvFormData) => void;
  /** Hook AI backend cho nút "Viết chuẩn Harvard". Không truyền = mockup vô hiệu hóa nhẹ. */
  onAiRewrite?: (text: string, field: string) => void;
}

type ListKey = "hocVan" | "kinhNghiemLamViec" | "duAn" | "kyNang" | "chungChi";
type RepeatSection = "experience" | "education" | "projects" | "certificates";
type OpenSection = "personal" | "summary" | "skills" | null;
type UpdateList = (key: ListKey, id: string, field: string, value: unknown) => void;

function Field({ label, required, children, className = "" }: { label: string; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={`grid gap-1.5 text-sm font-medium text-foreground ${className}`}>
      <span>{label}{required ? <span className="ml-1 text-destructive">*</span> : null}</span>
      {children}
    </label>
  );
}

function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [touched, setTouched] = useState(false);
  const invalid = touched && value.trim() !== "" && !isValidVnDate(value);
  return (
    <div>
      <Input
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(maskDateVn(event.target.value))}
        onBlur={() => {
          setTouched(true);
          onChange(normalizeVnDate(value));
        }}
        aria-invalid={invalid}
      />
      {invalid ? <p className="mt-1 text-xs text-destructive">Ngày không hợp lệ.</p> : null}
    </div>
  );
}

function PartialDateField({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const [touched, setTouched] = useState(false);
  const invalid = touched && value.trim() !== "" && !isValidCvPartialDate(value, "month_year");
  return (
    <div>
      <Input
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(maskAutoDate(event.target.value))}
        onBlur={() => {
          setTouched(true);
          onChange(normalizeCvPartialDateInput(value));
        }}
        aria-invalid={invalid}
      />
      {invalid ? <p className="mt-1 text-xs text-destructive">Nhập ngày, tháng/năm hoặc năm hợp lệ.</p> : null}
    </div>
  );
}

function EditorActions({ onDone, onDelete }: { onDone: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center justify-between border-t border-border/70 pt-4">
      {onDelete ? <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>Xóa mục</Button> : <span />}
      <Button type="button" size="sm" onClick={onDone}><Check className="size-4" /> Xong</Button>
    </div>
  );
}

function InlineEditor({ children }: { children: ReactNode }) {
  return <div className="mt-2 grid gap-4 rounded-lg border border-border bg-background p-4">{children}</div>;
}

function rangeErrorText(from: string, to: string, current?: boolean): string | null {
  if (current || !from.trim() || !to.trim()) return null;
  if (!parseCvPartialDate(from) || !parseCvPartialDate(to)) return null;
  return compareCvPartialDates(from, to) > 0 ? "Thời gian bắt đầu phải trước thời gian kết thúc." : null;
}

function rangeLabel(from: string, to: string, current?: boolean): string {
  if (!from && !to && !current) return "Chưa có thời gian";
  return `${from || "..."} — ${current ? "Hiện tại" : to || "..."}`;
}

function PersonalEditor({ contact, setContact, onDone }: { contact: LienHe; setContact: (field: keyof LienHe, value: string) => void; onDone: () => void }) {
  return (
    <InlineEditor>
      <div>
        <h3 className="text-sm font-semibold">Cơ bản</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Họ và tên" required><Input value={contact.hoTen} onChange={(e) => setContact("hoTen", e.target.value)} /></Field>
          <Field label="Email" required><Input type="email" value={contact.email} onChange={(e) => setContact("email", e.target.value)} /></Field>
          <Field label="Số điện thoại" required>
            <Input inputMode="numeric" maxLength={10} value={contact.sdt} onChange={(e) => setContact("sdt", e.target.value.replace(/\D/g, "").slice(0, 10))} />
          </Field>
          <Field label="Ngày sinh"><DateField value={contact.ngaySinh} onChange={(value) => setContact("ngaySinh", value)} /></Field>
          <Field label="Giới tính"><Input value={contact.gioiTinh} onChange={(e) => setContact("gioiTinh", e.target.value)} /></Field>
          <Field label="Địa chỉ"><Input value={contact.diaChi} onChange={(e) => setContact("diaChi", e.target.value)} /></Field>
        </div>
      </div>
      <div className="border-t border-border/70 pt-4">
        <h3 className="text-sm font-semibold">Nghề nghiệp</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Vị trí ứng tuyển"><Input value={contact.viTriUngTuyen} onChange={(e) => setContact("viTriUngTuyen", e.target.value)} /></Field>
          <Field label="Mức lương mong muốn">
            <Input inputMode="numeric" className="tabular-nums" value={contact.mucLuongMongMuon} onChange={(e) => setContact("mucLuongMongMuon", formatVndInput(e.target.value))} />
          </Field>
        </div>
      </div>
      <div className="border-t border-border/70 pt-4">
        <h3 className="text-sm font-semibold">Liên kết</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="GitHub"><Input value={contact.github} onChange={(e) => setContact("github", e.target.value)} /></Field>
          <Field label="LinkedIn"><Input value={contact.linkedIn} onChange={(e) => setContact("linkedIn", e.target.value)} /></Field>
          <Field label="Portfolio" className="sm:col-span-2"><Input value={contact.portfolio} onChange={(e) => setContact("portfolio", e.target.value)} /></Field>
        </div>
      </div>
      <EditorActions onDone={onDone} />
    </InlineEditor>
  );
}

function ExperienceEditor({ item, update, onDone, onDelete }: { item: KinhNghiemItem; update: UpdateList; onDone: () => void; onDelete: () => void }) {
  const error = rangeErrorText(item.tuNgay, item.denNgay, item.isHienTai);
  return (
    <InlineEditor>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Chức danh" required><Input value={item.chucDanh} onChange={(e) => update("kinhNghiemLamViec", item.id, "chucDanh", e.target.value)} /></Field>
        <Field label="Công ty" required><Input value={item.congTy} onChange={(e) => update("kinhNghiemLamViec", item.id, "congTy", e.target.value)} /></Field>
        <Field label="Bắt đầu"><PartialDateField value={item.tuNgay} onChange={(value) => update("kinhNghiemLamViec", item.id, "tuNgay", value)} /></Field>
        <Field label="Kết thúc"><PartialDateField value={item.denNgay} disabled={item.isHienTai} onChange={(value) => update("kinhNghiemLamViec", item.id, "denNgay", value)} /></Field>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox checked={item.isHienTai} onCheckedChange={(checked) => update("kinhNghiemLamViec", item.id, "isHienTai", checked === true)} /> Đang làm việc tại đây
      </label>
      <Field label="Mô tả"><Textarea rows={4} value={item.moTa} onChange={(e) => update("kinhNghiemLamViec", item.id, "moTa", e.target.value)} /></Field>
      <Field label="Kỹ năng sử dụng"><ChipInput values={item.kyNangSuDung} onChange={(value) => update("kinhNghiemLamViec", item.id, "kyNangSuDung", value)} /></Field>
      <EditorActions onDone={onDone} onDelete={onDelete} />
    </InlineEditor>
  );
}

function EducationEditor({ item, update, onDone, onDelete }: { item: HocVanItem; update: UpdateList; onDone: () => void; onDelete: () => void }) {
  const error = rangeErrorText(item.tuNgay, item.denNgay, item.isHienTai);
  return (
    <InlineEditor>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Trường" required><Input value={item.truong} onChange={(e) => update("hocVan", item.id, "truong", e.target.value)} /></Field>
        <Field label="Chuyên ngành"><Input value={item.chuyenNganh} onChange={(e) => update("hocVan", item.id, "chuyenNganh", e.target.value)} /></Field>
        <Field label="Bằng cấp"><Input value={item.bangCap ?? ""} onChange={(e) => update("hocVan", item.id, "bangCap", e.target.value)} /></Field>
        <span className="hidden sm:block" />
        <Field label="Bắt đầu"><PartialDateField value={item.tuNgay} onChange={(value) => update("hocVan", item.id, "tuNgay", value)} /></Field>
        <Field label="Kết thúc"><PartialDateField value={item.denNgay} disabled={item.isHienTai} onChange={(value) => update("hocVan", item.id, "denNgay", value)} /></Field>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox checked={item.isHienTai === true} onCheckedChange={(checked) => update("hocVan", item.id, "isHienTai", checked === true)} /> Đang học
      </label>
      <Field label="Mô tả"><Textarea rows={3} value={item.moTa} onChange={(e) => update("hocVan", item.id, "moTa", e.target.value)} /></Field>
      <EditorActions onDone={onDone} onDelete={onDelete} />
    </InlineEditor>
  );
}

function ProjectEditor({ item, update, onDone, onDelete }: { item: DuAnItem; update: UpdateList; onDone: () => void; onDelete: () => void }) {
  const error = rangeErrorText(item.tuNgay, item.denNgay, item.isHienTai);
  return (
    <InlineEditor>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tên dự án" required><Input value={item.tenDuAn} onChange={(e) => update("duAn", item.id, "tenDuAn", e.target.value)} /></Field>
        <Field label="Vai trò"><Input value={item.vaiTro} onChange={(e) => update("duAn", item.id, "vaiTro", e.target.value)} /></Field>
        <Field label="Bắt đầu"><PartialDateField value={item.tuNgay} onChange={(value) => update("duAn", item.id, "tuNgay", value)} /></Field>
        <Field label="Kết thúc"><PartialDateField value={item.denNgay} disabled={item.isHienTai} onChange={(value) => update("duAn", item.id, "denNgay", value)} /></Field>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox checked={item.isHienTai === true} onCheckedChange={(checked) => update("duAn", item.id, "isHienTai", checked === true)} /> Đang thực hiện
      </label>
      <Field label="Công nghệ"><ChipInput values={item.congNghe} onChange={(value) => update("duAn", item.id, "congNghe", value)} /></Field>
      <Field label="Liên kết"><Input value={item.link} onChange={(e) => update("duAn", item.id, "link", e.target.value)} /></Field>
      <Field label="Mô tả"><Textarea rows={4} value={item.moTa} onChange={(e) => update("duAn", item.id, "moTa", e.target.value)} /></Field>
      <EditorActions onDone={onDone} onDelete={onDelete} />
    </InlineEditor>
  );
}

function CertificateEditor({ item, update, onDone, onDelete }: { item: ChungChiItem; update: UpdateList; onDone: () => void; onDelete: () => void }) {
  return (
    <InlineEditor>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tên chứng chỉ" required><Input value={item.tenChungChi} onChange={(e) => update("chungChi", item.id, "tenChungChi", e.target.value)} /></Field>
        <Field label="Đơn vị cấp"><Input value={item.donViCap} onChange={(e) => update("chungChi", item.id, "donViCap", e.target.value)} /></Field>
        <Field label="Ngày cấp"><PartialDateField value={item.ngayCap} onChange={(value) => update("chungChi", item.id, "ngayCap", value)} /></Field>
        <Field label="Mã xác minh"><Input value={item.maXacMinh} onChange={(e) => update("chungChi", item.id, "maXacMinh", e.target.value)} /></Field>
      </div>
      <EditorActions onDone={onDone} onDelete={onDelete} />
    </InlineEditor>
  );
}

function SkillsEditor({ items, onChange, onDone }: { items: KyNangItem[]; onChange: (items: KyNangItem[]) => void; onDone: () => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const name = draft.trim();
    if (!name || items.some((item) => item.tenKyNang.toLocaleLowerCase("vi") === name.toLocaleLowerCase("vi"))) return;
    onChange([...items, { id: newId(), tenKyNang: name, mucDoThanhThao: "0", soNamKinhNghiem: "" }]);
    setDraft("");
  };
  const patch = (id: string, field: keyof KyNangItem, value: string) => onChange(items.map((item) => item.id === id ? { ...item, [field]: value } : item));

  return (
    <InlineEditor>
      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} aria-label="Thêm kỹ năng" />
        <Button type="button" variant="outline" onClick={add}><Plus className="size-4" /> Thêm</Button>
      </div>
      <div className="divide-y divide-border/70">
        {items.map((item) => (
          <div key={item.id} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_140px_90px_32px] sm:items-center">
            <Input value={item.tenKyNang} onChange={(e) => patch(item.id, "tenKyNang", e.target.value)} aria-label="Tên kỹ năng" />
            <Select value={item.mucDoThanhThao || "0"} onValueChange={(value) => patch(item.id, "mucDoThanhThao", value ?? "0")}>
              <SelectTrigger aria-label="Mức độ kỹ năng"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Cơ bản</SelectItem><SelectItem value="1">Trung bình</SelectItem><SelectItem value="2">Thành thạo</SelectItem><SelectItem value="3">Chuyên gia</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" min="0" max="100" step="0.5" value={item.soNamKinhNghiem} onChange={(e) => patch(item.id, "soNamKinhNghiem", e.target.value)} aria-label="Số năm kinh nghiệm" />
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Xóa ${item.tenKyNang}`} onClick={() => onChange(items.filter((current) => current.id !== item.id))}><X className="size-4" /></Button>
          </div>
        ))}
      </div>
      <EditorActions onDone={onDone} />
    </InlineEditor>
  );
}

<<<<<<< HEAD
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
      if (typeof section === "string") focusCvSectionInDom(section as CvFocusSection);
    };
    window.addEventListener(getCvFocusEventName(), onFocus);
    return () => window.removeEventListener(getCvFocusEventName(), onFocus);
  }, []);
  const setLienHe = (field: keyof LienHe, value: string) =>
    onChange({ ...data, thongTinLienHe: { ...lh, [field]: value } });
=======
export function CvForm({ data, onChange }: CvFormProps) {
  const [openSection, setOpenSection] = useState<OpenSection>(null);
  const [editing, setEditing] = useState<{ section: RepeatSection; id: string } | null>(null);
  const contact = data.thongTinLienHe;
>>>>>>> origin/dev-Phuc2

  const setContact = (field: keyof LienHe, value: string) => onChange({ ...data, thongTinLienHe: { ...contact, [field]: value } });
  const updateList: UpdateList = (key, id, field, value) => onChange({ ...data, [key]: (data[key] as { id: string }[]).map((item) => item.id === id ? { ...item, [field]: value } : item) } as CvFormData);
  const remove = (key: ListKey, id: string) => {
    onChange({ ...data, [key]: (data[key] as { id: string }[]).filter((item) => item.id !== id) });
    setEditing(null);
  };
  const duplicate = (key: ListKey, id: string) => {
    const source = (data[key] as { id: string }[]).find((item) => item.id === id);
    if (!source) return;
    onChange({ ...data, [key]: [...(data[key] as { id: string }[]), { ...source, id: newId() }] } as CvFormData);
  };
  const addRepeat = (section: RepeatSection) => {
    const id = newId();
    if (section === "experience") onChange({ ...data, kinhNghiemLamViec: [...data.kinhNghiemLamViec, { id, congTy: "", chucDanh: "", tuNgay: "", denNgay: "", isHienTai: false, moTa: "", kyNangSuDung: [] }] });
    if (section === "education") onChange({ ...data, hocVan: [...data.hocVan, { id, truong: "", chuyenNganh: "", tuNgay: "", denNgay: "", moTa: "" }] });
    if (section === "projects") onChange({ ...data, duAn: [...data.duAn, { id, tenDuAn: "", vaiTro: "", congNghe: [], link: "", moTa: "", tuNgay: "", denNgay: "" }] });
    if (section === "certificates") onChange({ ...data, chungChi: [...data.chungChi, { id, tenChungChi: "", donViCap: "", ngayCap: "", maXacMinh: "" }] });
    setEditing({ section, id });
  };

<<<<<<< HEAD
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
    // Kéo section trong form.
    if ((layout.sectionOrder as string[]).includes(a) && (layout.sectionOrder as string[]).includes(o)) {
      const from = layout.sectionOrder.indexOf(a as CvSectionId);
      const to = layout.sectionOrder.indexOf(o as CvSectionId);
      updateLayout(arrayMove(layout.sectionOrder, from, to));
      return;
    }
    // Kéo item trong Kinh nghiệm / Dự án.
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
=======
  const links = [contact.github && "GitHub", contact.linkedIn && "LinkedIn", contact.portfolio && "Portfolio"].filter(Boolean).join(" · ");

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-5 sm:px-6">
      <CvEditorSection title="Thông tin cá nhân">
        <div className="rounded-lg px-2 py-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">{contact.hoTen || "Chưa có họ tên"}</p>
              {contact.viTriUngTuyen ? <p className="mt-0.5 text-sm text-muted-foreground">{contact.viTriUngTuyen}</p> : null}
              <p className="mt-3 text-sm text-muted-foreground">{[contact.email, contact.sdt].filter(Boolean).join(" · ") || "Chưa có thông tin liên hệ"}</p>
              {contact.diaChi ? <p className="mt-1 text-sm text-muted-foreground">{contact.diaChi}</p> : null}
              {links ? <p className="mt-2 text-xs font-medium text-primary">{links}</p> : null}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpenSection(openSection === "personal" ? null : "personal")}>{openSection === "personal" ? "Đóng" : "Sửa"}</Button>
>>>>>>> origin/dev-Phuc2
          </div>
        </div>
        {openSection === "personal" ? <PersonalEditor contact={contact} setContact={setContact} onDone={() => setOpenSection(null)} /> : null}
      </CvEditorSection>

<<<<<<< HEAD
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
=======
      <CvEditorSection title="Nội dung">
        {openSection === "summary" ? (
          <InlineEditor>
            <Field label="Giới thiệu bản thân"><Textarea rows={6} value={contact.gioiThieuBanThan} onChange={(e) => setContact("gioiThieuBanThan", e.target.value)} /></Field>
            <EditorActions onDone={() => setOpenSection(null)} />
          </InlineEditor>
        ) : (
          <SectionLink label={contact.gioiThieuBanThan ? "Giới thiệu" : "Thêm giới thiệu"} onClick={() => setOpenSection("summary")} />
        )}
      </CvEditorSection>

      <CvEditorSection title="Kinh nghiệm" count={data.kinhNghiemLamViec.length} onAdd={() => addRepeat("experience")}>
        {data.kinhNghiemLamViec.length === 0 ? <p className="px-2 py-3 text-sm text-muted-foreground">Chưa có kinh nghiệm.</p> : null}
        {data.kinhNghiemLamViec.map((item) => (
          <div key={item.id}>
            <CvSummaryItem title={item.chucDanh} subtitle={item.congTy} meta={rangeLabel(item.tuNgay, item.denNgay, item.isHienTai)} active={editing?.section === "experience" && editing.id === item.id} onEdit={() => setEditing({ section: "experience", id: item.id })} onDuplicate={() => duplicate("kinhNghiemLamViec", item.id)} onDelete={() => remove("kinhNghiemLamViec", item.id)} />
            {editing?.section === "experience" && editing.id === item.id ? <ExperienceEditor item={item} update={updateList} onDone={() => setEditing(null)} onDelete={() => remove("kinhNghiemLamViec", item.id)} /> : null}
          </div>
        ))}
      </CvEditorSection>

      <CvEditorSection title="Học vấn" count={data.hocVan.length} onAdd={() => addRepeat("education")}>
        {data.hocVan.length === 0 ? <p className="px-2 py-3 text-sm text-muted-foreground">Chưa có học vấn.</p> : null}
        {data.hocVan.map((item) => (
          <div key={item.id}>
            <CvSummaryItem title={item.truong} subtitle={[item.chuyenNganh, item.bangCap].filter(Boolean).join(" · ")} meta={rangeLabel(item.tuNgay, item.denNgay, item.isHienTai)} active={editing?.section === "education" && editing.id === item.id} onEdit={() => setEditing({ section: "education", id: item.id })} onDuplicate={() => duplicate("hocVan", item.id)} onDelete={() => remove("hocVan", item.id)} />
            {editing?.section === "education" && editing.id === item.id ? <EducationEditor item={item} update={updateList} onDone={() => setEditing(null)} onDelete={() => remove("hocVan", item.id)} /> : null}
          </div>
        ))}
      </CvEditorSection>

      <CvEditorSection title="Kỹ năng" count={data.kyNang.length}>
        {openSection === "skills" ? (
          <SkillsEditor items={data.kyNang} onChange={(kyNang) => onChange({ ...data, kyNang })} onDone={() => setOpenSection(null)} />
        ) : (
          <button type="button" className="flex w-full flex-wrap gap-2 rounded-lg px-2 py-3 text-left hover:bg-muted/60" onClick={() => setOpenSection("skills")}>
            {data.kyNang.length > 0 ? data.kyNang.map((item) => <span key={item.id} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">{item.tenKyNang || "Kỹ năng"}</span>) : <span className="text-sm text-muted-foreground">Thêm kỹ năng</span>}
          </button>
        )}
      </CvEditorSection>

      <CvEditorSection title="Dự án" count={data.duAn.length} onAdd={() => addRepeat("projects")}>
        {data.duAn.length === 0 ? <p className="px-2 py-3 text-sm text-muted-foreground">Chưa có dự án.</p> : null}
        {data.duAn.map((item) => (
          <div key={item.id}>
            <CvSummaryItem title={item.tenDuAn} subtitle={item.vaiTro} meta={rangeLabel(item.tuNgay, item.denNgay, item.isHienTai)} active={editing?.section === "projects" && editing.id === item.id} onEdit={() => setEditing({ section: "projects", id: item.id })} onDuplicate={() => duplicate("duAn", item.id)} onDelete={() => remove("duAn", item.id)} />
            {editing?.section === "projects" && editing.id === item.id ? <ProjectEditor item={item} update={updateList} onDone={() => setEditing(null)} onDelete={() => remove("duAn", item.id)} /> : null}
          </div>
        ))}
      </CvEditorSection>

      <CvEditorSection title="Chứng chỉ" count={data.chungChi.length} onAdd={() => addRepeat("certificates")}>
        {data.chungChi.length === 0 ? <p className="px-2 py-3 text-sm text-muted-foreground">Chưa có chứng chỉ.</p> : null}
        {data.chungChi.map((item) => (
          <div key={item.id}>
            <CvSummaryItem title={item.tenChungChi} subtitle={item.donViCap} meta={item.ngayCap} active={editing?.section === "certificates" && editing.id === item.id} onEdit={() => setEditing({ section: "certificates", id: item.id })} onDuplicate={() => duplicate("chungChi", item.id)} onDelete={() => remove("chungChi", item.id)} />
            {editing?.section === "certificates" && editing.id === item.id ? <CertificateEditor item={item} update={updateList} onDone={() => setEditing(null)} onDelete={() => remove("chungChi", item.id)} /> : null}
          </div>
        ))}
      </CvEditorSection>
>>>>>>> origin/dev-Phuc2
    </div>
      </SortableContext>
    </DndContext>
  );
}
