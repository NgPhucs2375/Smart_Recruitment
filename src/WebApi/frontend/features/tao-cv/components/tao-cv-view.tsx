"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Save, Eye, Pencil, Plus, Trash2, Printer, Check, ListChecks, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CvForm } from "./cv-form";
import { CvPreview } from "./cv-preview";
import { TemplateSelector } from "./template-selector";
import { AiAgent } from "./ai-agent";
import { CvImportDialog } from "./cv-import-dialog";
import { defaultCvData } from "../constants";
import type { CvFormData } from "../types";
import { cvDataFromJson, toCvPayload, isoToVnDate } from "../types";
import { cvApi, type CvVm, type HoSoVm } from "@/lib/cv-api";

export function ChecklistCard({ items, doneCount }: { items: { label: string; done: boolean }[]; doneCount: number }) {
  return (
    <div className="rounded-3xl border border-linen bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-charcoal">
          <ListChecks className="size-4 text-marine" /> Checklist hoàn thiện
        </p>
        <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-bold text-navy">
          {doneCount}/{items.length}
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5 text-sm">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition ${
                item.done ? "border-teal bg-teal text-white" : "border-linen bg-ivory text-transparent"
              }`}
            >
              <Check className="size-3" />
            </span>
            <span className={item.done ? "font-medium text-charcoal" : "text-charcoal/55"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QualityCard({ progress, label, note }: { progress: number; label: string; note: string }) {
  return (
    <div className="rounded-3xl border border-linen bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-charcoal">
          <Sparkles className="size-4 text-teal" /> Chất lượng CV
          <strong className="font-mono text-navy">{progress}%</strong>
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">
          <span className="size-1.5 rounded-full bg-teal" /> {label}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-frost">
        <div className="h-full rounded-full bg-teal transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2.5 text-xs text-charcoal/55">{note}</p>
    </div>
  );
}

export function TaoCvView() {
  const [cvData, setCvData] = useState<CvFormData>(defaultCvData);
  const [hoSo, setHoSo] = useState<HoSoVm | null>(null);
  const [cvList, setCvList] = useState<CvVm[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

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
    void loadAll();
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

  // Merge imported content into the working copy. Only content fields are
  // taken; templateId/tenFile/selectedId stay untouched so the visual
  // template choice and save target never change implicitly.
  const handleImported = (partial: Partial<CvFormData>) => {
    setCvData((prev) => ({
      ...prev,
      thongTinLienHe: { ...prev.thongTinLienHe, ...(partial.thongTinLienHe ?? {}) },
      hocVan: partial.hocVan ?? prev.hocVan,
      kinhNghiemLamViec: partial.kinhNghiemLamViec ?? prev.kinhNghiemLamViec,
      duAn: partial.duAn ?? prev.duAn,
      kyNang: partial.kyNang ?? prev.kyNang,
      chungChi: partial.chungChi ?? prev.chungChi,
    }));
    toast.success("Đã nhập CV", { description: "Kiểm tra lại các trường rồi bấm Lưu CV." });
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

  const quality = useMemo(() => {
    const lh = cvData.thongTinLienHe;
    const items = [
      { label: "Thông tin liên hệ (tên, email, SĐT)", done: Boolean(lh.hoTen && lh.email && lh.sdt) },
      { label: "Giới thiệu bản thân", done: Boolean(lh.gioiThieuBanThan) },
      { label: "Kinh nghiệm làm việc", done: cvData.kinhNghiemLamViec.length > 0 },
      { label: "Học vấn", done: cvData.hocVan.length > 0 },
      { label: "Kỹ năng", done: cvData.kyNang.length > 0 },
      { label: "Dự án hoặc chứng chỉ", done: cvData.duAn.length > 0 || cvData.chungChi.length > 0 },
    ];
    const doneCount = items.filter((i) => i.done).length;
    const label =
      progress >= 100 ? "Xuất sắc" : progress >= 70 ? "Gần xong rồi" : progress >= 40 ? "Đang hoàn thiện" : "Mới bắt đầu";
    return { items, doneCount, label };
  }, [cvData, progress]);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb + save state */}
      <div className="flex items-center justify-between gap-3 text-xs text-charcoal/55">
        <p className="flex items-center gap-1.5">
          <FileText className="size-3.5 text-marine" />
          Tạo CV <span className="text-linen">/</span> {selectedId ? "Chỉnh sửa CV" : "CV mới"}
        </p>
        <p className="flex items-center gap-1.5 rounded-full border border-linen bg-card px-3 py-1 font-medium">
          <span className="size-1.5 rounded-full bg-teal" />
          {loading ? "Đang tải..." : selectedId ? `CV #${selectedId}` : "Đang soạn"}
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-5 rounded-[2rem] border border-linen bg-card p-6 shadow-sm sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy">
            <span className="size-1.5 rounded-full bg-teal" /> Tạo CV thông minh
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
            Xây dựng CV <span className="text-marine">chuyên nghiệp</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-charcoal/60">
            Nhập thông tin, lưu về server và xem trước kết quả ngay lập tức. Checklist bên dưới giúp bạn không bỏ sót mục nào.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1.5" />
            CV mới
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={fillFromHoSo} disabled={!hoSo}>
            Đổ từ hồ sơ
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1.5" />
            Tải CV lên
          </Button>
          {selectedId && (
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Xóa
            </Button>
          )}
          <Button size="sm" className="rounded-full" onClick={handleSave} disabled={saving || loading}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? "Đang lưu..." : "Lưu CV"}
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" />
            In / PDF
          </Button>
        </div>
      </div>

      <CvImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={handleImported} />

      {/* CV selector */}
      {cvList.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-linen bg-card px-4 py-3.5 shadow-sm">
          <span className="text-sm font-medium text-charcoal/60">CV của tôi ({cvList.length}):</span>
          <div className="flex flex-wrap gap-2">
            {cvList.map((c) => (
              <Button
                key={c.id}
                variant={c.id === selectedId ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => handleSelect(c.id)}
              >
                {c.tenFile || `CV #${c.id}`}
                {c.isDefault ? " ★" : ""}
              </Button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-charcoal/60">Tên file:</span>
            <Input
              value={cvData.tenFile}
              onChange={(e) => setCvData({ ...cvData, tenFile: e.target.value })}
              placeholder="CV-Backend-2026"
              className="w-[200px] rounded-full"
            />
          </div>
        </div>
      )}

      {/* Quality feedback */}
      <QualityCard
        progress={progress}
        label={quality.label}
        note={selectedId ? `Đang sửa CV #${selectedId}` : "CV mới chưa lưu — hoàn thành checklist để đạt 100%"}
      />

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
            <ChecklistCard items={quality.items} doneCount={quality.doneCount} />
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
        <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0, 5fr) minmax(420px, 7fr)" }}>
          {/* Editor column */}
          <div className="min-w-0">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-charcoal">Thông tin CV</h2>
              <span className="flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-navy">
                <FileText className="size-3 text-teal" />
                6 mục
              </span>
            </div>
            <div className="space-y-4" style={{ overflowY: "auto", maxHeight: "calc(100vh - 280px)" }}>
              <ChecklistCard items={quality.items} doneCount={quality.doneCount} />
              <TemplateSelector
                selectedId={cvData.templateId}
                onSelect={(id) => setCvData({ ...cvData, templateId: id })}
              />
              <CvForm data={cvData} onChange={setCvData} />
              <AiAgent data={cvData} onUpdate={setCvData} />
            </div>
          </div>

          {/* Preview column */}
          <div className="min-w-0">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-charcoal">Xem trước</h2>
              <span className="flex items-center gap-1.5 rounded-full bg-navy px-2.5 py-1 text-xs font-semibold text-white">
                <Eye className="size-3" />
                Thời gian thực
              </span>
            </div>
            <div className="cv-preview-frame">
              <CvPreview data={cvData} />
              <div className="cv-preview-hint">
                <Sparkles className="size-3.5 text-teal" />
                <span>Gợi ý: hoàn thành checklist bên trái để CV đạt 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}