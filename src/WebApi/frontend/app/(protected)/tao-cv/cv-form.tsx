"use client";

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
} from "./types";
import { newId } from "./types";
import { maskDateVn, isValidVnDate } from "./types";

interface CvFormProps {
  data: CvFormData;
  onChange: (data: CvFormData) => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div data-slot="card-header">
      <div data-slot="card-title">
        <FileText className="h-5 w-5" />
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
    onChange({ ...data, [key]: list });
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
            <Input value={lh.mucLuongMongMuon} onChange={(e) => setLienHe("mucLuongMongMuon", e.target.value)} placeholder="VD: 15-20 triệu" />
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
            <div className="cv-empty-form"><FileText className="h-4 w-4" /><span>Chưa có kinh nghiệm nào. Nhấn "Thêm" để bắt đầu.</span></div>
          ) : data.kinhNghiemLamViec.map((k) => (
            <div key={k.id} className="cv-repeat-item" style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                <Input placeholder="Công ty *" value={k.congTy} onChange={(e) => updateList("kinhNghiemLamViec", k.id, "congTy", e.target.value)} style={{ flex: 1 }} />
                <Input placeholder="Chức danh *" value={k.chucDanh} onChange={(e) => updateList("kinhNghiemLamViec", k.id, "chucDanh", e.target.value)} style={{ flex: 1 }} />
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFrom("kinhNghiemLamViec", k.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <DateField label="Từ ngày" value={k.tuNgay} onChange={(v) => updateList("kinhNghiemLamViec", k.id, "tuNgay", v)} />
                <DateField label="Đến ngày" value={k.denNgay} disabled={k.isHienTai} onChange={(v) => updateList("kinhNghiemLamViec", k.id, "denNgay", v)} />
              </div>
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
          ))}
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
            <div className="cv-empty-form"><FileText className="h-4 w-4" /><span>Chưa có học vấn nào. Nhấn "Thêm" để bắt đầu.</span></div>
          ) : data.hocVan.map((h) => (
            <div key={h.id} className="cv-repeat-item" style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                <Input placeholder="Trường *" value={h.truong} onChange={(e) => updateList("hocVan", h.id, "truong", e.target.value)} style={{ flex: 1 }} />
                <Input placeholder="Chuyên ngành" value={h.chuyenNganh} onChange={(e) => updateList("hocVan", h.id, "chuyenNganh", e.target.value)} style={{ flex: 1 }} />
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFrom("hocVan", h.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <DateField label="Từ ngày" value={h.tuNgay} onChange={(v) => updateList("hocVan", h.id, "tuNgay", v)} />
                <DateField label="Đến ngày" value={h.denNgay} onChange={(v) => updateList("hocVan", h.id, "denNgay", v)} />
              </div>
              <Textarea placeholder="Mô tả thêm..." value={h.moTa} onChange={(e) => updateList("hocVan", h.id, "moTa", e.target.value)} rows={2} />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Kỹ năng */}
      <div className="cv-form-card">
        <div data-slot="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div data-slot="card-title"><FileText className="h-5 w-5" />Kỹ năng</div>
          <Button variant="outline" size="sm" onClick={() => {
            const item: KyNangItem = { id: newId(), tenKyNang: "", mucDoThanhThao: "", soNamKinhNghiem: "" };
            onChange({ ...data, kyNang: [...data.kyNang, item] });
          }}>
            <Plus className="h-4 w-4 mr-1" />Thêm
          </Button>
        </div>
        <div data-slot="card-content" style={{ padding: "1rem" }}>
          {data.kyNang.length === 0 && (
            <div className="cv-empty-form" style={{ marginBottom: "0.75rem" }}><FileText className="h-4 w-4" /><span>Chưa có kỹ năng nào. Nhấn "Thêm" để bắt đầu.</span></div>
          )}
          {data.kyNang.map((k) => (
            <div key={k.id} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", alignItems: "center" }}>
              <Input placeholder="Tên kỹ năng *" value={k.tenKyNang} onChange={(e) => updateList("kyNang", k.id, "tenKyNang", e.target.value)} style={{ flex: 2 }} />
              <Input placeholder="Mức độ" value={k.mucDoThanhThao} onChange={(e) => updateList("kyNang", k.id, "mucDoThanhThao", e.target.value)} style={{ flex: 1 }} />
              <Input placeholder="Số năm" value={k.soNamKinhNghiem} onChange={(e) => updateList("kyNang", k.id, "soNamKinhNghiem", e.target.value)} style={{ flex: 1 }} />
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
            const item: DuAnItem = { id: newId(), tenDuAn: "", vaiTro: "", congNghe: [], link: "", moTa: "" };
            onChange({ ...data, duAn: [...data.duAn, item] });
          }}>
            <Plus className="h-4 w-4 mr-1" />Thêm
          </Button>
        </div>
        <div data-slot="card-content" style={{ padding: "1rem" }}>
          {data.duAn.length === 0 ? (
            <div className="cv-empty-form"><FileText className="h-4 w-4" /><span>Chưa có dự án nào.</span></div>
          ) : data.duAn.map((d) => (
            <div key={d.id} className="cv-repeat-item" style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                <Input placeholder="Tên dự án *" value={d.tenDuAn} onChange={(e) => updateList("duAn", d.id, "tenDuAn", e.target.value)} style={{ flex: 1 }} />
                <Input placeholder="Vai trò" value={d.vaiTro} onChange={(e) => updateList("duAn", d.id, "vaiTro", e.target.value)} style={{ flex: 1 }} />
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFrom("duAn", d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <ChipInput
                values={d.congNghe}
                onChange={(v) => updateList("duAn", d.id, "congNghe", v)}
                placeholder="Công nghệ — gõ rồi Enter"
              />
              <Input placeholder="Link dự án" value={d.link} onChange={(e) => updateList("duAn", d.id, "link", e.target.value)} style={{ marginBottom: "0.75rem" }} />
              <Textarea placeholder="Mô tả dự án..." value={d.moTa} onChange={(e) => updateList("duAn", d.id, "moTa", e.target.value)} rows={2} />
            </div>
          ))}
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
          ) : data.chungChi.map((c) => (
            <div key={c.id} className="cv-repeat-item" style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                <Input placeholder="Tên chứng chỉ *" value={c.tenChungChi} onChange={(e) => updateList("chungChi", c.id, "tenChungChi", e.target.value)} style={{ flex: 1 }} />
                <Input placeholder="Đơn vị cấp" value={c.donViCap} onChange={(e) => updateList("chungChi", c.id, "donViCap", e.target.value)} style={{ flex: 1 }} />
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFrom("chungChi", c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <DateField label="Ngày cấp" value={c.ngayCap} onChange={(v) => updateList("chungChi", c.id, "ngayCap", v)} />
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem" }}>Mã xác minh</label>
                  <Input placeholder="Mã xác minh" value={c.maXacMinh} onChange={(e) => updateList("chungChi", c.id, "maXacMinh", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
