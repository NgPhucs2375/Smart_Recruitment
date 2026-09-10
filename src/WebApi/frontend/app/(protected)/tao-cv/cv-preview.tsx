"use client";

import { Mail, Phone, MapPin, Linkedin, Github, Globe } from "lucide-react";
import { cvTemplates } from "./constants";
import type { CvFormData } from "./types";
import { toDateInput } from "./types";

interface CvPreviewProps {
  data: CvFormData;
}

function SectionH({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
      style={{ color }}
    >
      {children}
    </h2>
  );
}

const fmtDate = (v: string) => {
  const d = toDateInput(v);
  if (!d) return "";
  const [y, m] = d.split("-");
  return `${m}/${y}`;
};

const timeRange = (tu: string, den: string, hienTai: boolean) => {
  const from = fmtDate(tu);
  const to = hienTai ? "Nay" : fmtDate(den);
  if (!from && !to) return "";
  return `${from || "?"} - ${to || "?"}`;
};

export function CvPreview({ data }: CvPreviewProps) {
  const template = cvTemplates.find((t) => t.id === data.templateId) ?? cvTemplates[0];
  const lh = data.thongTinLienHe;
  const hasContent =
    lh.hoTen || data.kinhNghiemLamViec.length > 0 || data.hocVan.length > 0 ||
    data.kyNang.length > 0 || data.duAn.length > 0 || data.chungChi.length > 0;

  return (
    <div className="rounded-xl border border-border bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 text-white" style={{ backgroundColor: template.color }}>
        <h1 className="text-2xl font-bold">{lh.hoTen || "Họ và tên"}</h1>
        {lh.viTriUngTuyen && <p className="mt-1 text-sm text-white/85">{lh.viTriUngTuyen}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-white/80">
          {lh.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{lh.email}</span>}
          {lh.sdt && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{lh.sdt}</span>}
          {lh.diaChi && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{lh.diaChi}</span>}
          {lh.linkedIn && <span className="flex items-center gap-1.5"><Linkedin className="h-3.5 w-3.5" />{lh.linkedIn}</span>}
          {lh.github && <span className="flex items-center gap-1.5"><Github className="h-3.5 w-3.5" />{lh.github}</span>}
          {lh.portfolio && <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />{lh.portfolio}</span>}
        </div>
      </div>

      <div className="px-8 py-6 space-y-6 text-sm">
        {lh.gioiThieuBanThan && (
          <section>
            <SectionH color={template.color}>Giới thiệu</SectionH>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{lh.gioiThieuBanThan}</p>
          </section>
        )}

        {data.kinhNghiemLamViec.length > 0 && (
          <section>
            <SectionH color={template.color}>Kinh nghiệm làm việc</SectionH>
            <div className="space-y-4">
              {data.kinhNghiemLamViec.map((k) => (
                <div key={k.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{k.chucDanh || "Chức danh"}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{timeRange(k.tuNgay, k.denNgay, k.isHienTai)}</span>
                  </div>
                  <p className="text-muted-foreground">{k.congTy}</p>
                  {k.moTa && <p className="mt-1 text-muted-foreground whitespace-pre-line">{k.moTa}</p>}
                  {k.kyNangSuDung.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">Kỹ năng: {k.kyNangSuDung.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.hocVan.length > 0 && (
          <section>
            <SectionH color={template.color}>Học vấn</SectionH>
            <div className="space-y-3">
              {data.hocVan.map((h) => (
                <div key={h.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{h.truong || "Trường"}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{timeRange(h.tuNgay, h.denNgay, false)}</span>
                  </div>
                  <p className="text-muted-foreground">{h.chuyenNganh}</p>
                  {h.moTa && <p className="mt-1 text-muted-foreground whitespace-pre-line">{h.moTa}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.kyNang.length > 0 && (
          <section>
            <SectionH color={template.color}>Kỹ năng</SectionH>
            <div className="flex flex-wrap gap-1.5">
              {data.kyNang.map((k) => (
                <span
                  key={k.id}
                  className="inline-block px-2.5 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: `${template.color}15`, color: template.color }}
                >
                  {k.tenKyNang}{k.soNamKinhNghiem ? ` · ${k.soNamKinhNghiem}` : ""}{k.mucDoThanhThao ? ` · ${k.mucDoThanhThao}` : ""}
                </span>
              ))}
            </div>
          </section>
        )}

        {data.duAn.length > 0 && (
          <section>
            <SectionH color={template.color}>Dự án</SectionH>
            <div className="space-y-4">
              {data.duAn.map((d) => (
                <div key={d.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{d.tenDuAn || "Dự án"}</h3>
                    {d.link && <span className="text-xs text-muted-foreground whitespace-nowrap">{d.link}</span>}
                  </div>
                  {d.vaiTro && <p className="text-muted-foreground">{d.vaiTro}</p>}
                  {d.moTa && <p className="mt-1 text-muted-foreground whitespace-pre-line">{d.moTa}</p>}
                  {d.congNghe.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">Công nghệ: {d.congNghe.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.chungChi.length > 0 && (
          <section>
            <SectionH color={template.color}>Chứng chỉ</SectionH>
            <div className="space-y-3">
              {data.chungChi.map((c) => (
                <div key={c.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{c.tenChungChi || "Chứng chỉ"}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(c.ngayCap)}</span>
                  </div>
                  <p className="text-muted-foreground">{[c.donViCap, c.maXacMinh].filter(Boolean).join(" · ")}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {!hasContent && (
          <div className="py-12 text-center text-muted-foreground">
            <p>Bắt đầu điền thông tin bên trái để xem trước CV</p>
          </div>
        )}
      </div>
    </div>
  );
}
