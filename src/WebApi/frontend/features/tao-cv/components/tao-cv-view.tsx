"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Save, Eye, Pencil, Plus, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CvForm } from "./cv-form";
import { CvPreview } from "./cv-preview";
import { TemplateSelector } from "./template-selector";
import { AiAgent } from "./ai-agent";
import { defaultCvData } from "../constants";
import type { CvFormData } from "../types";
import { cvDataFromJson, toCvPayload, isoToVnDate } from "../types";
import { cvApi, type CvVm, type HoSoVm } from "@/lib/cv-api";

export function TaoCvView() {
  const [cvData, setCvData] = useState<CvFormData>(defaultCvData);
  const [hoSo, setHoSo] = useState<HoSoVm | null>(null);
  const [cvList, setCvList] = useState<CvVm[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const hs = await cvApi.getMyHoSo();
      setHoSo(hs);
      const list = await cvApi.listCvs(hs.id);
      setCvList(list);
      const current = list.find((c) => c.isDefault) ?? list[0];
      if (current) {
        setSelectedId(current.id);
        setCvData((prev) => ({
          ...cvDataFromJson(current.noiDungJson, prev),
          templateId: current.templateId || prev.templateId,
          tenFile: current.tenFile || "",
        }));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được dữ liệu CV");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadAll();
      if (cancelled) return;
      // Nhận JSON từ trang /tao-cv/tai-len (Gemini OCR) qua localStorage,
      // áp dụng SAU khi đã nạp CV từ server để không bị ghi đè.
      try {
        const raw = localStorage.getItem("tao-cv-import");
        if (raw) {
          const parsed = JSON.parse(raw) as { data?: unknown; fileName?: string };
          if (parsed?.data && typeof parsed.data === "object") {
            setSelectedId(null);
            setCvData((prev) => ({
              ...cvDataFromJson(JSON.stringify(parsed.data), prev),
              tenFile: typeof parsed.fileName === "string" && parsed.fileName
                ? parsed.fileName.replace(/\.[^.]+$/, "")
                : prev.tenFile,
            }));
            toast.success("Đã đổ dữ liệu CV từ file tải lên");
          }
          localStorage.removeItem("tao-cv-import");
        }
      } catch {
        /* bỏ qua import lỗi */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  const handleSave = async () => {
    if (!hoSo) {
      toast.error("Bạn chưa có hồ sơ ứng viên nên chưa thể lưu CV");
      return;
    }
    if (!cvData.thongTinLienHe.hoTen.trim() || !cvData.thongTinLienHe.email.trim() || !cvData.thongTinLienHe.sdt.trim()) {
      toast.error("Vui lòng nhập họ tên, email và SĐT");
      return;
    }
    if (cvData.kinhNghiemLamViec.length + cvData.hocVan.length === 0) {
      toast.error("CV cần ít nhất một mục kinh nghiệm hoặc học vấn");
      return;
    }
    setSaving(true);
    try {
      if (selectedId) {
        await cvApi.updateCv(selectedId, {
          id: selectedId,
          ...(toCvPayload(hoSo.id, cvData, true) as unknown as Record<string, unknown>),
        });
        toast.success("Đã cập nhật CV");
      } else {
        const id = await cvApi.createCv(toCvPayload(hoSo.id, cvData, true) as unknown as Record<string, unknown>);
        setSelectedId(id);
        toast.success("Đã tạo CV mới");
      }
      const list = await cvApi.listCvs(hoSo.id);
      setCvList(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lưu CV thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setCvData(JSON.parse(JSON.stringify(defaultCvData)) as CvFormData);
  };

  const handleSelect = (id: number) => {
    const cv = cvList.find((c) => c.id === id);
    if (!cv) return;
    setSelectedId(id);
    setCvData((prev) => ({
      ...cvDataFromJson(cv.noiDungJson, prev),
      templateId: cv.templateId || prev.templateId,
      tenFile: cv.tenFile || "",
    }));
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!window.confirm("Xóa CV đang chọn?")) return;
    try {
      await cvApi.deleteCv(selectedId);
      toast.success("Đã xóa CV");
      handleNew();
      if (hoSo) setCvList(await cvApi.listCvs(hoSo.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xóa CV thất bại");
    }
  };

  const fillFromHoSo = () => {
    if (!hoSo) return;
    setCvData((prev) => ({
      ...prev,
      thongTinLienHe: {
        ...prev.thongTinLienHe,
        hoTen: prev.thongTinLienHe.hoTen || hoSo.hoTen || "",
        sdt: prev.thongTinLienHe.sdt || hoSo.sdt || "",
        diaChi: prev.thongTinLienHe.diaChi || hoSo.diaChi || "",
        gioiTinh: prev.thongTinLienHe.gioiTinh || hoSo.gioiTinh || "",
        ngaySinh: prev.thongTinLienHe.ngaySinh || isoToVnDate(hoSo.ngaySinh),
      },
    }));
    toast.success("Đã đổ thông tin từ hồ sơ");
  };

  const progress = useMemo(() => {
    const lh = cvData.thongTinLienHe;
    let done = 0;
    const total = 6;
    if (lh.hoTen && lh.email && lh.sdt) done += 1;
    if (lh.gioiThieuBanThan) done += 1;
    if (cvData.kinhNghiemLamViec.length > 0) done += 1;
    if (cvData.hocVan.length > 0) done += 1;
    if (cvData.kyNang.length > 0) done += 1;
    if (cvData.duAn.length > 0 || cvData.chungChi.length > 0) done += 1;
    return Math.round((done / total) * 100);
  }, [cvData]);

  return (
    <div className="cv-builder-shell">
      {/* Top line with breadcrumb and save state */}
      <div className="cv-builder-topline">
        <div className="cv-breadcrumb">
          <span>
            <FileText className="inline h-3.5 w-3.5 mr-1" />
            Tạo CV
          </span>
          <strong>/</strong>
          <span>{selectedId ? "Chỉnh sửa CV" : "CV mới"}</span>
        </div>
        <div className="cv-save-state">
          <div className="cv-live-dot"></div>
          <span>{loading ? "Đang tải..." : selectedId ? `CV #${selectedId}` : "Đang soạn"}</span>
        </div>
      </div>

      {/* Header section */}
      <div className="cv-builder-header">
        <div>
          <p className="cv-eyebrow">Bước 1: Nhập liệu</p>
          <h1>Xây dựng CV <em>chuyên nghiệp</em></h1>
          <p className="cv-builder-subtitle">
            Nhập thông tin, lưu về server và xem trước kết quả ngay lập tức.
          </p>
        </div>
        <div className="cv-header-actions">
          <Button variant="outline" size="sm" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            CV mới
          </Button>
          <Button variant="outline" size="sm" onClick={fillFromHoSo} disabled={!hoSo}>
            Đổ từ hồ sơ
          </Button>
          {selectedId && (
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving || loading}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Đang lưu..." : "Lưu CV"}
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            In / PDF
          </Button>
        </div>
      </div>

      {/* CV selector */}
      {cvList.length > 0 && (
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <span className="text-sm text-muted-foreground">CV của tôi ({cvList.length}):</span>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {cvList.map((c) => (
              <Button
                key={c.id}
                variant={c.id === selectedId ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelect(c.id)}
              >
                {c.tenFile || `CV #${c.id}`}
                {c.isDefault ? " ★" : ""}
              </Button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span className="text-sm text-muted-foreground">Tên file:</span>
            <Input
              value={cvData.tenFile}
              onChange={(e) => setCvData({ ...cvData, tenFile: e.target.value })}
              placeholder="CV-Backend-2026"
              style={{ width: "220px" }}
            />
          </div>
        </div>
      )}

      {/* Progress row */}
      <div className="cv-progress-row">
        <div className="cv-progress-label">
          <span>Tiến độ</span>
          <strong>{progress}%</strong>
        </div>
        <div className="cv-progress-track">
          <div style={{ width: `${progress}%` }}></div>
        </div>
        <div className="cv-progress-note">{selectedId ? `Đang sửa CV #${selectedId}` : "CV mới chưa lưu"}</div>
      </div>

      {/* Mobile/tablet: Tabs layout */}
      <div className="xl:hidden">
        <Tabs defaultValue="form" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form" className="gap-2">
              <Pencil className="h-4 w-4" />
              Nhập liệu
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Xem trước
            </TabsTrigger>
          </TabsList>
          <TabsContent value="form" className="mt-4 space-y-4">
            <TemplateSelector
              selectedId={cvData.templateId}
              onSelect={(id) => setCvData({ ...cvData, templateId: id })}
            />
            <CvForm data={cvData} onChange={setCvData} />
            <AiAgent data={cvData} onUpdate={setCvData} />
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <div className="sticky top-20">
              <CvPreview data={cvData} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: 2-column layout */}
      <div className="hidden xl:block">
        <div className="cv-builder-grid" style={{ display: "grid" }}>
          {/* Editor column */}
          <div className="cv-editor-column">
            <div className="cv-section-heading">
              <h2>Thông tin CV</h2>
              <span>
                <FileText className="inline h-3 w-3 mr-1" />
                6 mục
              </span>
            </div>
            <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 280px)" }}>
              <TemplateSelector
                selectedId={cvData.templateId}
                onSelect={(id) => setCvData({ ...cvData, templateId: id })}
              />
              <CvForm data={cvData} onChange={setCvData} />
              <AiAgent data={cvData} onUpdate={setCvData} />
            </div>
          </div>

          {/* Preview column */}
          <div className="cv-preview-column">
            <div className="cv-preview-toolbar">
              <h2>Xem trước</h2>
              <div className="cv-preview-status">
                <Eye className="h-3 w-3" />
                Thời gian thực
              </div>
            </div>
            <div className="cv-preview-frame">
              <CvPreview data={cvData} />
              <div className="cv-preview-hint">
                <span>💡 Gợi ý: Điều chỉnh thông tin bên trái để cập nhật xem trước</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}