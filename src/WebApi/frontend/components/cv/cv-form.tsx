"use client";

import { useState, type ReactNode } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChipInput } from "./chip-input";
import { CvEditorSection, CvSummaryItem, SectionLink } from "./cv-editor-section";
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

export function CvForm({ data, onChange }: CvFormProps) {
  const [openSection, setOpenSection] = useState<OpenSection>(null);
  const [editing, setEditing] = useState<{ section: RepeatSection; id: string } | null>(null);
  const contact = data.thongTinLienHe;

  const setContact = (field: keyof LienHe, value: string) => onChange({ ...data, thongTinLienHe: { ...contact, [field]: value } });
  const updateList: UpdateList = (key, id, field, value) => onChange({ ...data, [key]: (data[key] as { id: string }[]).map((item) => item.id === id ? { ...item, [field]: value, ...(field === "isHienTai" && value === true ? { denNgay: "" } : {}) } : item) } as CvFormData);
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
          </div>
        </div>
        {openSection === "personal" ? <PersonalEditor contact={contact} setContact={setContact} onDone={() => setOpenSection(null)} /> : null}
      </CvEditorSection>

      <CvEditorSection title="Nội dung">
        {openSection === "summary" ? (
          <InlineEditor>
            <Field label="Tiêu đề hiển thị trên CV"><Input value={data.tieuDeHienThi ?? ""} onChange={(e) => onChange({ ...data, tieuDeHienThi: e.target.value })} placeholder="Để trống dùng mặc định của mẫu" /></Field>
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
    </div>
  );
}
