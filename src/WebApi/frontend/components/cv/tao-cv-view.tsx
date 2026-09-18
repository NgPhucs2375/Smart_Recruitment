"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { FileText, Save, Eye, Pencil, Plus, Trash2, Printer, Check, ListChecks, Sparkles, Upload, LayoutTemplate, UserRound, Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CvForm } from "./cv-form";
import { CvPreview } from "./cv-preview";
import { TemplatePicker } from "./template-selector";
import { CvImportDialog } from "./cv-import-dialog";
import { defaultCvData } from "@/features/tao-cv/constants";
import { resolveTemplateId, isKnownTemplateId } from "@/features/tao-cv/template-registry";
import type { CvFormData, CvVersionVm, CvVm, HoSoVm } from "@/lib/types";
import {
  isoToVnDate,
  normalizeCvPartialDate,
} from "@/features/tao-cv/cv-data";
import {
  createManualCvPayload,
  manualCvDetailToForm,
  validateManualCv,
} from "@/features/tao-cv/manual";
import { cvApi } from "@/lib/api/cv-api";
import { cvDataToJsonResume } from "@/features/tao-cv/json-resume";
import { useCvAssistant } from "@/hooks/use-cv-assistant";

const DRAFT_KEY = "hireai:manual-cv-draft";
const AUTOSAVE_DELAY_MS = 1500;

type SaveStatus = "saving" | "dirty" | "saved";

function formatClock(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Quick actions pinned at the top of the A4 preview pane so the user
 * never has to scroll back to the page header to save or export.
 * Mirrors the header buttons — same handlers, no duplicated logic.
 */
export function PreviewActionBar({
  status,
  savedAt,
  draftAt,
  zoom,
  onZoom,
  onSave,
  onExport,
  saving,
  exportingPdf,
  disabled,
}: {
  status: SaveStatus;
  savedAt: Date | null;
  draftAt: Date | null;
  zoom: number;
  onZoom: (next: number) => void;
  onSave: () => void;
  onExport: () => void;
  saving: boolean;
  exportingPdf: boolean;
  disabled: boolean;
}) {
  const dot =
    status === "saving" ? "bg-primary" : status === "dirty" ? "bg-bronze" : "bg-teal";
  const label =
    status === "saving"
      ? "Đang lưu..."
      : status === "dirty"
        ? draftAt
          ? `Chưa lưu • Nháp ${formatClock(draftAt)}`
          : "Chưa lưu"
        : savedAt
          ? `Đã lưu ${formatClock(savedAt)}`
          : "Đã lưu";
  return (
    <div className="cv-preview-bar">
      <p className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground" aria-live="polite">
        <span className={`size-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="flex items-center rounded-full border border-border bg-card" role="group" aria-label="Phóng to preview">
          <button
            type="button"
            onClick={() => onZoom(Math.max(70, zoom - 10))}
            disabled={disabled || zoom <= 70}
            aria-label="Thu nhỏ preview"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted disabled:opacity-40"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <span className="min-w-10 text-center font-mono text-[11px] font-semibold text-muted-foreground" aria-live="polite">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => onZoom(Math.min(130, zoom + 10))}
            disabled={disabled || zoom >= 130}
            aria-label="Phóng to preview"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted disabled:opacity-40"
          >
            <ZoomIn className="size-3.5" />
          </button>
        </div>
        <Button type="button" variant="outline" size="sm" className="h-8 rounded-full text-xs" onClick={onExport} disabled={disabled || exportingPdf}>
          <Printer className="mr-1 size-3.5" />
          {exportingPdf ? "Đang xuất..." : "Xuất PDF"}
        </Button>
        <Button type="button" size="sm" className="h-8 rounded-full text-xs" onClick={onSave} disabled={disabled || saving}>
          <Save className="mr-1 size-3.5" />
          {saving ? "Đang lưu..." : "Lưu nháp"}
        </Button>
      </div>
    </div>
  );
}

export function ChecklistCard({ items, doneCount }: { items: { label: string; done: boolean }[]; doneCount: number }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ListChecks className="size-4 text-primary" /> Checklist hoàn thiện
        </p>
        <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-bold text-primary">
          {doneCount}/{items.length}
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5 text-sm">
            <span
              className={`cv-check-dot flex size-5 shrink-0 items-center justify-center rounded-full border transition ${
                item.done ? "border-teal bg-teal text-white" : "border-border bg-muted text-transparent"
              }`}
              data-done={item.done}
            >
              <Check className="size-3" />
            </span>
            <span className={item.done ? "font-medium text-foreground" : "text-muted-foreground"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QualityCard({ progress, label, note }: { progress: number; label: string; note: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="size-4 text-teal" /> Chất lượng CV
          <strong className="font-mono text-primary">{progress}%</strong>
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">
          <span className="size-1.5 rounded-full bg-teal" /> {label}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-teal transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2.5 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

export function TaoCvView() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [cvData, setCvData] = useState<CvFormData>(defaultCvData);
  const [hoSo, setHoSo] = useState<HoSoVm | null>(null);
  const [cvList, setCvList] = useState<CvVm[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // exportingPdf giữ để tương thích UI hiện tại; xuất PDF giờ dùng window.print() nên không cần loading async.
  const [exportingPdf] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importSessionId, setImportSessionId] = useState<string | null>(null);
  const [versions, setVersions] = useState<CvVersionVm[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [draftAt, setDraftAt] = useState<Date | null>(null);
  const [pendingDraft, setPendingDraft] = useState<{ savedAt: string; cvData: CvFormData } | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const draftOfferedRef = useRef(false);

  // Adam (CopilotKit agent v2): đọc snapshot form + ghi qua frontend tool,
  // preview realtime, mỗi lần ghi có toast Hoàn tác.
  // selectCv truyền hàm vì handleSelect (const) khai báo sau dòng này.
  useCvAssistant({
    data: cvData,
    onChange: setCvData,
    ready: !loading,
    selectCv: (id) => handleSelect(id),
  });

function CvBuilderSkeleton() {
  return (
    <div className="grid gap-8 xl:grid-cols-[46fr_54fr]" aria-label="Đang tải trình tạo CV" aria-busy="true">
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-3xl border border-border bg-card p-5">
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="mt-3 space-y-2">
              <div className="h-9 rounded-xl bg-muted" />
              <div className="h-9 rounded-xl bg-muted" />
            </div>
          </div>
        ))}
      </div>
      <div className="animate-pulse rounded-3xl border border-border bg-card p-6">
        <div className="mx-auto aspect-[210/297] w-full max-w-md rounded-lg bg-muted" />
      </div>
    </div>
  );
}

  // Pick a template without touching form content, and sync the choice
  // into ?template= so refresh/share keeps the selection (?cv= preserved).
  // Uses history.replaceState (not router.replace) so the URL updates
  // WITHOUT re-running loadAll: router navigation would flip `loading`,
  // flash the skeleton, refetch the CV and remount the preview + picker
  // (the list jump / repeated-click bug).
  const selectTemplate = (id: string) => {
    setCvData((prev) => ({ ...prev, templateId: id }));
    const params = new URLSearchParams(searchParams.toString());
    params.set("template", id);
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  };

  // Scroll to the first VISIBLE templates/AI block (mobile tabs + desktop
  // column both render them; hidden ones are skipped).
  const scrollToSection = (target: string) => {
    const els = Array.from(document.querySelectorAll(`[data-scroll-target="${target}"]`));
    const visible = els.find((el) => (el as HTMLElement).offsetParent !== null) as HTMLElement | undefined;
    visible?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
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
      if (!cvParam && rawTemplate && isKnownTemplateId(rawTemplate)) {
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
      const message = e instanceof Error ? e.message : "Không tải được dữ liệu CV";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAll]);

  // Dirty tracking: compare working copy against the last saved snapshot.
  useEffect(() => {
    if (loading) return;
    const snap = JSON.stringify(cvData);
    if (lastSavedRef.current === null) {
      lastSavedRef.current = snap;
      setDirty(false);
      return;
    }
    setDirty(snap !== lastSavedRef.current);
  }, [cvData, loading]);

  // Autosave a local draft 1.5s after the user stops typing. Local only:
  // no PDF render, no API call, no version bump. Skipped silently while
  // a server save is in flight or the form fails validation.
  useEffect(() => {
    if (loading || saving || !dirty) return;
    if (validateManualCv(cvData)) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: new Date().toISOString(), cvData }));
        setDraftAt(new Date());
      } catch {
        // Storage blocked/full — stay silent, manual save still works.
      }
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [cvData, dirty, loading, saving]);

  // Offer to restore a local draft once, right after the initial load.
  useEffect(() => {
    if (loading || loadError || draftOfferedRef.current) return;
    draftOfferedRef.current = true;
    let parsed: { savedAt: string; cvData: CvFormData } | null = null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) parsed = JSON.parse(raw) as { savedAt: string; cvData: CvFormData };
    } catch {
      parsed = null;
    }
    if (!parsed || typeof parsed.cvData !== "object" || !parsed.cvData) return;
    if (JSON.stringify(parsed.cvData) === JSON.stringify(cvData)) return;
    setPendingDraft(parsed);
    if (parsed.savedAt) setDraftAt(new Date(parsed.savedAt));
  }, [loading, loadError, cvData]);

  const applyDraft = () => {
    if (!pendingDraft) return;
    setCvData(pendingDraft.cvData);
    setPendingDraft(null);
    toast.success("Đã khôi phục bản nháp tự lưu");
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setPendingDraft(null);
    setDraftAt(null);
  };

  const markSaved = (data: CvFormData) => {
    lastSavedRef.current = JSON.stringify(data);
    setDirty(false);
    setLastSavedAt(new Date());
    setDraftAt(null);
    setPendingDraft(null);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  };

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
      // Lưu CV: chỉ JSON + templateId/templateVersion, KHÔNG chụp màn hình.
      const basePayload = createManualCvPayload(hoSo.id, cvData, true);
      const result = await cvApi.saveVersion({
        ...basePayload,
        cvUngVienId: selectedId,
        importSessionId,
        phuongThucTao: importSessionId ? 2 : basePayload.phuongThucTao,
      });
      setSelectedId(result.cvUngVienId);
      setImportSessionId(null);
      setVersions(await cvApi.getVersions(result.cvUngVienId));
      markSaved(cvData);
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
    const fresh = JSON.parse(JSON.stringify(defaultCvData)) as CvFormData;
    setCvData(fresh);
    lastSavedRef.current = JSON.stringify(fresh);
    setDirty(false);
    setLastSavedAt(null);
    discardDraft();
  };

  const handleSelect = async (id: number): Promise<boolean> => {
    try {
      const detail = await cvApi.getById(id);
      setSelectedId(id);
      setImportSessionId(null);
      setCvData((prev) => {
        const next = manualCvDetailToForm(detail, prev);
        lastSavedRef.current = JSON.stringify(next);
        return next;
      });
      setDirty(false);
      setLastSavedAt(null);
      setVersions(await cvApi.getVersions(id));
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được chi tiết CV");
      return false;
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
    // Xuất PDF: dùng window.print() + CSS @media print (chữ thật, nét, @page A4).
    // Fallback cách cũ (image PDF) giữ trong manual-cv-pdf.ts cho trường hợp cần.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    window.print();
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

  const saveStatus: SaveStatus = saving ? "saving" : dirty ? "dirty" : "saved";

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb + save state */}
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <FileText className="size-3.5 text-primary" />
          Tạo CV <span className="text-muted-foreground">/</span> {selectedId ? "Chỉnh sửa CV" : "CV mới"}
        </p>
        <p className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-medium">
          <span className="size-1.5 rounded-full bg-teal" />
          {loading ? "Đang tải..." : selectedId ? `CV #${selectedId}` : "Đang soạn"}
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-5 rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <span className="size-1.5 rounded-full bg-teal" /> Tạo CV thông minh
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Tạo CV <span className="text-primary">chuyên nghiệp</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Nhập thông tin từng mục, chọn mẫu yêu thích và xem trước trực tiếp.
            Lưu về tài khoản của bạn bất cứ lúc nào, in PDF khi sẵn sàng.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => scrollToSection("templates")}
              className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary hover:underline"
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              Chọn mẫu CV
            </button>
            <span aria-hidden="true" className="text-muted-foreground">•</span>
            <button
              type="button"
              onClick={fillFromHoSo}
              disabled={!hoSo}
              className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary hover:underline disabled:opacity-50"
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
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-card px-4 py-3.5 shadow-sm">
          <span className="text-sm font-medium text-muted-foreground">CV của tôi ({cvList.length}):</span>
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
            <span className="text-sm text-muted-foreground">Tên file:</span>
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
        <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-border bg-card px-4 py-3 shadow-sm">
          <span className="mr-1 text-sm font-medium text-muted-foreground">Lịch sử:</span>
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

      {!loading && !loadError && pendingDraft && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-marine/30 bg-muted px-4 py-3.5" role="status">
          <p className="text-sm text-foreground">
            Đã tìm thấy bản nháp tự lưu
            {pendingDraft.savedAt ? ` lúc ${formatClock(new Date(pendingDraft.savedAt))}` : ""}. Khôi phục nội dung nháp?
          </p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={discardDraft}>
              Bỏ qua
            </Button>
            <Button type="button" size="sm" className="rounded-full" onClick={applyDraft}>
              Khôi phục nháp
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <CvBuilderSkeleton />
      ) : loadError ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-destructive/30 bg-card px-6 py-14 text-center" role="alert">
          <p className="text-sm font-semibold text-foreground">Không tải được dữ liệu CV</p>
          <p className="max-w-sm text-sm text-muted-foreground">{loadError}</p>
          <Button type="button" variant="outline" className="mt-1 rounded-full" onClick={() => void loadAll()}>
            Thử lại
          </Button>
        </div>
      ) : (
      <>
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
            <div data-scroll-target="templates">
              <TemplatePicker selectedId={cvData.templateId} onSelect={selectTemplate} />
            </div>
            <CvForm data={cvData} onChange={setCvData} />
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <div className="sticky top-20 rounded-[1.35rem] border border-border bg-muted p-3">
              <PreviewActionBar
                status={saveStatus}
                savedAt={lastSavedAt}
                draftAt={draftAt}
                zoom={zoom}
                onZoom={setZoom}
                onSave={() => void handleSave()}
                onExport={() => void handleExportPdf()}
                saving={saving}
                exportingPdf={exportingPdf}
                disabled={loading}
              />
              <div data-manual-cv-pdf style={{ zoom: `${zoom}%` } as CSSProperties}>
                <CvPreview data={cvData} onPageCount={setPageCount} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: 2-column layout — page scrolls naturally, no nested
          scroll container; preview stays sticky without trapping scroll. */}
      <div className="hidden xl:block">
        <div className="grid gap-8" style={{ gridTemplateColumns: "minmax(0, 46fr) minmax(0, 54fr)" }}>
          {/* Editor column */}
          <div className="min-w-0">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Thông tin CV</h2>
              <span className="flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <FileText className="size-3 text-teal" />
                6 mục
              </span>
            </div>
            <div className="space-y-4">
              <ChecklistCard items={quality.items} doneCount={quality.doneCount} />
              <div data-scroll-target="templates">
                <TemplatePicker selectedId={cvData.templateId} onSelect={selectTemplate} />
              </div>
              <CvForm data={cvData} onChange={setCvData} />
            </div>
          </div>

          {/* Preview column */}
          <div className="min-w-0">
            <div className="mb-4 flex items-end justify-between gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Xem trước</h2>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full border border-border bg-card px-2.5 py-1 font-mono text-xs font-semibold text-muted-foreground"
                  aria-live="polite"
                  title="Số trang A4 của bản xem trước"
                >
                  {pageCount} trang
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-navy px-2.5 py-1 text-xs font-semibold text-white">
                  <Eye className="size-3" />
                  Thời gian thực
                </span>
              </div>
            </div>
            <div className="cv-preview-frame">
              <PreviewActionBar
                status={saveStatus}
                savedAt={lastSavedAt}
                draftAt={draftAt}
                zoom={zoom}
                onZoom={setZoom}
                onSave={() => void handleSave()}
                onExport={() => void handleExportPdf()}
                saving={saving}
                exportingPdf={exportingPdf}
                disabled={loading}
              />
              <div data-manual-cv-pdf style={{ zoom: `${zoom}%` } as CSSProperties}>
                <CvPreview data={cvData} onPageCount={setPageCount} />
              </div>
              {pageCount > 2 && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs leading-5 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                  CV đang dài hơn 2 trang. Hãy rút gọn nội dung để dễ đọc hơn.
                </p>
              )}
              <div className="cv-preview-hint">
                <Sparkles className="size-3.5 text-teal" />
                <span>Gợi ý: hoàn thành checklist bên trái để CV đạt 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
