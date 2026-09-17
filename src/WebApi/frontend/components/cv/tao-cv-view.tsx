"use client";

// Màn hình biên tập CV: chỉ giữ một tài liệu CV trong DOM cho mọi kích thước màn hình.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Save, Eye, Plus, Trash2, Printer, Check, ListChecks, Sparkles, Upload, LayoutTemplate, UserRound, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CvForm } from "./cv-form";
import { CvDocument } from "./cv-document";
import { TemplateSelector } from "./template-selector";
import { CvImportDialog } from "./cv-import-dialog";
import { defaultCvData } from "@/features/tao-cv/constants";
import { resolveTemplateId, TEMPLATE_REGISTRY } from "@/features/tao-cv/template-registry";
import type { CvFormData, CvVersionVm, CvVm, HoSoVm } from "@/lib/types";
import {
  isoToVnDate,
  normalizeCvPartialDate,
} from "@/features/tao-cv/cv-data";
import {
  createManualCvPayload,
  createManualCvPdfBlob,
  exportManualCvPdf,
  manualCvDetailToForm,
  manualCvPdfFileName,
  validateManualCv,
} from "@/features/tao-cv/manual";
import { cvApi } from "@/lib/api/cv-api";
import { cvDataToJsonResume } from "@/features/tao-cv/json-resume";
import { useCvAssistant } from "@/hooks/use-cv-assistant";

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
  const searchParams = useSearchParams();
  const [cvData, setCvData] = useState<CvFormData>(defaultCvData);
  const [hoSo, setHoSo] = useState<HoSoVm | null>(null);
  const [cvList, setCvList] = useState<CvVm[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importSessionId, setImportSessionId] = useState<string | null>(null);
  const [versions, setVersions] = useState<CvVersionVm[]>([]);
  const documentRef = useRef<HTMLDivElement>(null);

  // Adam (CopilotKit agent): đọc snapshot form + ghi qua frontend tool,
  // preview realtime, mỗi lần ghi có toast Hoàn tác.
  useCvAssistant({ data: cvData, onChange: setCvData, ready: !loading });

  // Scroll to the first VISIBLE templates/AI block (mobile tabs + desktop
  // column both render them; hidden ones are skipped).
  const scrollToSection = (target: string) => {
    const els = Array.from(document.querySelectorAll(`[data-scroll-target="${target}"]`));
    const visible = els.find((el) => (el as HTMLElement).offsetParent !== null) as HTMLElement | undefined;
    visible?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const hs = await cvApi.getMyHoSo();
      setHoSo(hs);
      const list = await cvApi.listCvs(hs.id);
      setCvList(list);
      // Existing supported mechanism: read the selected template + target CV
      // safely from the frontend query (?template= / ?cv= / ?import=). Never
      // rewrites a saved CV's template unless the user explicitly picks one:
      // ?template= starts a NEW working copy; ?cv= selects a saved CV.
      const cvParam = searchParams.get("cv");
      const rawTemplate = searchParams.get("template");
      if (!cvParam && rawTemplate && TEMPLATE_REGISTRY[resolveTemplateId(rawTemplate)]) {
        setSelectedId(null);
        setCvData({
          ...(JSON.parse(JSON.stringify(defaultCvData)) as CvFormData),
          templateId: resolveTemplateId(rawTemplate),
        });
      } else {
        const requested = cvParam ? list.find((c) => c.id === Number(cvParam)) : undefined;
        const current = requested ?? list.find((c) => c.isDefault) ?? list[0];
        if (current) {
          const detail = await cvApi.getById(current.id);
          setSelectedId(current.id);
          setCvData((prev) => manualCvDetailToForm(detail, prev));
          setVersions(await cvApi.getVersions(current.id));
        }
      }
      if (searchParams.get("import") === "1") setImportOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được dữ liệu CV");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAll]);

  const handleSave = async () => {
    if (!hoSo) {
      toast.error("Bạn chưa có hồ sơ ứng viên nên chưa thể lưu CV");
      return;
    }
    const validationError = validateManualCv(cvData);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSaving(true);
    try {
      const preview = documentRef.current;
      if (!preview) throw new Error("Không tìm thấy bản xem trước để lưu PDF.");

      const basePayload = createManualCvPayload(hoSo.id, cvData, true);
      const fileName = manualCvPdfFileName(cvData.tenFile, cvData.thongTinLienHe.hoTen);
      const pdf = await createManualCvPdfBlob(preview);
      const result = await cvApi.saveVersion({
        ...basePayload,
        cvUngVienId: selectedId,
        importSessionId,
        phuongThucTao: importSessionId ? 2 : basePayload.phuongThucTao,
      }, pdf, fileName);
      setSelectedId(result.cvUngVienId);
      setImportSessionId(null);
      setVersions(await cvApi.getVersions(result.cvUngVienId));
      toast.success(`Đã lưu phiên bản ${result.soPhienBan} của CV`);
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
    setImportSessionId(null);
    setVersions([]);
    setCvData(JSON.parse(JSON.stringify(defaultCvData)) as CvFormData);
  };

  const handleSelect = async (id: number) => {
    const cv = cvList.find((c) => c.id === id);
    if (!cv) return;
    try {
      const detail = await cvApi.getById(id);
      setSelectedId(id);
      setImportSessionId(null);
      setCvData((prev) => manualCvDetailToForm(detail, prev));
      setVersions(await cvApi.getVersions(id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được chi tiết CV");
    }
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

  const handleExportJsonResume = () => {
    const blob = new Blob([JSON.stringify(cvDataToJsonResume(cvData), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${cvData.tenFile.trim() || "resume"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadStoredFile = async (versionId?: number, original = false) => {
    if (!selectedId) return;
    try {
      const file = await cvApi.getDownloadUrl(selectedId, versionId, original);
      window.open(file.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải file CV.");
    }
  };

  const handleExportPdf = async () => {
    const preview = documentRef.current;
    if (!preview) {
      toast.error("Không tìm thấy bản xem trước để xuất PDF.");
      return;
    }
    setExportingPdf(true);
    try {
      await exportManualCvPdf(
        preview,
        manualCvPdfFileName(cvData.tenFile, cvData.thongTinLienHe.hoTen),
      );
      toast.success("Đã xuất file PDF.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xuất file PDF.");
    } finally {
      setExportingPdf(false);
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
  // Imported dates are normalized to MM/YYYY|YYYY so the partial inputs
  // and preview render correctly regardless of source format.
  const handleImported = (partial: Partial<CvFormData>, sessionId: string) => {
    const normRange = (it: { tuNgay?: unknown; denNgay?: unknown }) => ({
      tuNgay: normalizeCvPartialDate(typeof it.tuNgay === "string" ? it.tuNgay : ""),
      denNgay: normalizeCvPartialDate(typeof it.denNgay === "string" ? it.denNgay : ""),
    });
    setCvData((prev) => ({
      ...prev,
      thongTinLienHe: { ...prev.thongTinLienHe, ...(partial.thongTinLienHe ?? {}) },
      hocVan: (partial.hocVan ?? prev.hocVan).map((h) => ({ ...h, ...normRange(h as { tuNgay?: unknown; denNgay?: unknown }) })),
      kinhNghiemLamViec: (partial.kinhNghiemLamViec ?? prev.kinhNghiemLamViec).map((k) => ({
        ...k,
        ...normRange(k as { tuNgay?: unknown; denNgay?: unknown }),
      })),
      duAn: (partial.duAn ?? prev.duAn).map((d) => ({
        ...d,
        ...normRange(d as { tuNgay?: unknown; denNgay?: unknown }),
      })),
      kyNang: partial.kyNang ?? prev.kyNang,
      chungChi: (partial.chungChi ?? prev.chungChi).map((c) => ({
        ...c,
        ngayCap: normalizeCvPartialDate(typeof c.ngayCap === "string" ? c.ngayCap : ""),
      })),
    }));
    setImportSessionId(sessionId);
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
            Tạo CV <span className="text-marine">chuyên nghiệp</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-charcoal/60">
            Nhập thông tin từng mục, chọn mẫu yêu thích và xem trước trực tiếp.
            Lưu về tài khoản của bạn bất cứ lúc nào, in PDF khi sẵn sàng.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => scrollToSection("templates")}
              className="inline-flex items-center gap-1 font-medium text-marine hover:text-navy hover:underline"
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              Chọn mẫu CV
            </button>
            <span aria-hidden="true" className="text-linen">•</span>
            <button
              type="button"
              onClick={fillFromHoSo}
              disabled={!hoSo}
              className="inline-flex items-center gap-1 font-medium text-marine hover:text-navy hover:underline disabled:opacity-50"
            >
              <UserRound className="h-3.5 w-3.5" />
              Tạo từ hồ sơ
            </button>
          </div>
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
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => void handleExportPdf()}
            disabled={exportingPdf || loading}
          >
            <Printer className="h-4 w-4 mr-1.5" />
            {exportingPdf ? "Đang xuất..." : "Xuất PDF"}
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleExportJsonResume}>
            <FileText className="h-4 w-4 mr-1.5" />
            JSON Resume
          </Button>
        </div>
      </div>

      <CvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        hoSoUngVienId={hoSo?.id ?? null}
        onImported={handleImported}
      />

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

      {selectedId && versions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-linen bg-card px-4 py-3 shadow-sm">
          <span className="mr-1 text-sm font-medium text-charcoal/60">Lịch sử:</span>
          {versions.map((version) => (
            <Button
              key={version.id}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => void handleDownloadStoredFile(version.id)}
            >
              <Download className="mr-1.5 size-3.5" />
              Bản {version.soPhienBan}
            </Button>
          ))}
          {versions.some((version) => version.hasOriginal) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => void handleDownloadStoredFile(undefined, true)}
            >
              <Upload className="mr-1.5 size-3.5" /> File gốc
            </Button>
          )}
        </div>
      )}

      {/* Quality feedback */}
      <QualityCard
        progress={progress}
        label={quality.label}
        note={selectedId ? `Đang sửa CV #${selectedId}` : "CV mới chưa lưu — hoàn thành checklist để đạt 100%"}
      />

      {/* Chỉ render một editor và một tài liệu CV; responsive chỉ đổi thứ tự bằng CSS. */}
      <div className="cv-builder-layout">
        <section className="cv-editor-panel min-w-0">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-charcoal">Thông tin CV</h2>
            <span className="flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-navy">
              <FileText className="size-3 text-teal" />
              6 mục
            </span>
          </div>
          <div className="space-y-4">
            <ChecklistCard items={quality.items} doneCount={quality.doneCount} />
            <div data-scroll-target="templates">
              <TemplateSelector
                selectedId={cvData.templateId}
                onSelect={(id) => setCvData({ ...cvData, templateId: id })}
              />
            </div>
            <CvForm data={cvData} onChange={setCvData} />
          </div>
        </section>

        <section className="cv-preview-panel min-w-0">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-charcoal">Xem trước</h2>
            <span className="flex items-center gap-1.5 rounded-full bg-navy px-2.5 py-1 text-xs font-semibold text-white">
              <Eye className="size-3" />
              Thời gian thực
            </span>
          </div>
          <div className="cv-preview-frame">
            <CvDocument data={cvData} documentRef={documentRef} />
            <div className="cv-preview-hint">
              <Sparkles className="size-3.5 text-teal" />
              <span>Gợi ý: hoàn thành checklist bên trái để CV đạt 100%</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
