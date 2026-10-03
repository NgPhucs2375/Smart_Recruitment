"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { Eye, Pencil, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CvForm } from "./cv-form";
import { CvPreview } from "./cv-preview";
import { TemplatePicker } from "./template-selector";
import { CvImportDialog } from "./cv-import-dialog";
import { CvBuilderToolbar } from "./cv-builder-toolbar";
import { CvCompletion } from "./cv-completion";
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

function formatClock(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

type DraftPayload = {
  savedAt: string;
  cvData: CvFormData;
  /** CV đang soạn lúc autosave; null = bản mới chưa lưu. Draft cũ thiếu field này sẽ bị loại. */
  selectedId: number | null;
};

/** Draft lạ shape (lưu từ bản cũ) thì bỏ — tránh crash `.map` khi đổ vào form/preview. */
function isDraftCvData(v: unknown): v is CvFormData {
  if (!v || typeof v !== "object") return false;
  const d = v as Record<string, unknown>;
  return (
    !!d.thongTinLienHe &&
    typeof d.thongTinLienHe === "object" &&
    Array.isArray(d.hocVan) &&
    Array.isArray(d.kinhNghiemLamViec) &&
    Array.isArray(d.duAn) &&
    Array.isArray(d.kyNang) &&
    Array.isArray(d.chungChi) &&
    typeof d.templateId === "string" &&
    typeof d.tenFile === "string"
  );
}

/** true khi bản soạn không có gì ngoài mặc định (bỏ qua templateId). */
function isBlankWorkingCopy(d: CvFormData): boolean {
  const a = { ...d, templateId: "" };
  const b = {
    ...(JSON.parse(JSON.stringify(defaultCvData)) as CvFormData),
    templateId: "",
  };
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Quick actions pinned at the top of the A4 preview pane so the user
 * never has to scroll back to the page header to save or export.
 * Mirrors the header buttons — same handlers, no duplicated logic.
 */
export function PreviewActionBar({
  pageCount,
  zoom,
  onZoom,
  disabled,
  fitMode,
  onToggleFit,
  displayZoom,
}: {
  pageCount: number;
  zoom: number;
  onZoom: (next: number) => void;
  disabled: boolean;
  fitMode?: boolean;
  onToggleFit?: () => void;
  displayZoom?: number;
}) {
  return (
    <div className="cv-preview-bar">
      <p className="text-xs font-medium text-muted-foreground" aria-live="polite">{pageCount} trang</p>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="flex items-center rounded-md border border-border bg-card" role="group" aria-label="Phóng to preview">
          <button
            type="button"
            onClick={() => onZoom(Math.max(70, zoom - 10))}
            disabled={disabled || zoom <= 70}
            aria-label="Thu nhỏ preview"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted disabled:opacity-40"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <span className="min-w-10 text-center font-mono text-[11px] font-semibold text-muted-foreground" aria-live="polite">
            {displayZoom ?? zoom}%
          </span>
          <button
            type="button"
            onClick={() => onZoom(Math.min(130, zoom + 10))}
            disabled={disabled || zoom >= 130}
            aria-label="Phóng to preview"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted disabled:opacity-40"
          >
            <ZoomIn className="size-3.5" />
          </button>
        </div>
        {onToggleFit ? (
          <button type="button" onClick={onToggleFit} disabled={disabled} aria-pressed={fitMode} className="h-8 rounded-md px-2 text-xs font-semibold text-muted-foreground hover:bg-muted">
            {fitMode ? "100%" : "Fit"}
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Mở xem trước toàn màn hình"
          disabled={disabled}
          onClick={(event) => void event.currentTarget.closest(".cv-preview-frame")?.requestFullscreen?.()}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function CvBuilderSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[44fr_56fr]" aria-label="Đang tải trình tạo CV" aria-busy="true">
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        {[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-14 animate-pulse rounded-lg bg-muted" />)}
      </div>
      <div className="animate-pulse rounded-xl border border-border bg-muted p-6">
        <div className="mx-auto aspect-[210/297] w-full max-w-md rounded-md bg-card" />
      </div>
    </div>
  );
}

function CvPreviewPanel({ data, pageCount, onPageCount, zoom, onZoom, disabled }: {
  data: CvFormData;
  pageCount: number;
  onPageCount: (count: number) => void;
  zoom: number;
  onZoom: (zoom: number) => void;
  disabled: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [fitMode, setFitMode] = useState(true);
  const [fitScale, setFitScale] = useState(1);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      if (frame.clientWidth === 0) return;
      const style = getComputedStyle(frame);
      const width = frame.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const next = Math.min(width / 794, 1);
      setFitScale((previous) => Math.abs(next - previous) > 0.005 ? next : previous);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  const effectiveZoom = fitMode ? Math.max(10, Math.round(zoom * fitScale)) : zoom;
  return (
    <div ref={frameRef} className="cv-preview-frame">
      <PreviewActionBar pageCount={pageCount} zoom={zoom} displayZoom={effectiveZoom} onZoom={onZoom} disabled={disabled} fitMode={fitMode} onToggleFit={() => setFitMode((current) => !current)} />
      <div data-manual-cv-pdf style={{ zoom: `${effectiveZoom}%` } as CSSProperties}>
        <CvPreview data={data} onPageCount={onPageCount} />
      </div>
      {pageCount > 2 ? <p className="mt-3 border-t border-border px-3 pt-3 text-center text-xs text-amber-700 dark:text-amber-300">CV dài hơn 2 trang. Cân nhắc rút gọn nội dung.</p> : null}
    </div>
  );
}

export function TaoCvView() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryString = searchParams.toString();
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
  const [pendingDraft, setPendingDraft] = useState<DraftPayload | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const draftOfferedRef = useRef(false);
  // Chống race: chọn CV khác trong lúc request cũ còn bay → bỏ kết quả cũ.
  const selectReqRef = useRef(0);
  // Mọi tương tác (CV mới / chọn CV) đều làm loadAll đang bay thành stale.
  const loadSeqRef = useRef(0);
  // Mirror mới nhất của form để loadAll phân biệt "trang trắng" với
  // "form đã có dữ liệu" khi navigation đổi query (?template=).
  const cvDataRef = useRef(cvData);
  useEffect(() => {
    cvDataRef.current = cvData;
  }, [cvData]);
  // Preview render theo bản deferred: gõ phím không bị render 2-3 trang A4
  // chặn luồng chính, preview tự bắt kịp ngay sau đó (vẫn realtime).
  const deferredCvData = useDeferredValue(cvData);

  // Adam (CopilotKit agent v2): đọc snapshot form + ghi qua frontend tool,
  // preview realtime, mỗi lần ghi có toast Hoàn tác.
  // selectCv truyền hàm vì handleSelect (const) khai báo sau dòng này.
  useCvAssistant({
    data: cvData,
    onChange: setCvData,
    ready: !loading,
    selectCv: (id) => handleSelect(id),
  });

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

  // Giữ ?cv= đồng bộ với CV đang soạn bằng history.replaceState (giống
  // selectTemplate): reload/share mở đúng CV mà KHÔNG trigger loadAll chạy lại.
  const syncCvParam = useCallback(
    (id: number | null) => {
      const params = new URLSearchParams(queryString);
      if (id == null) params.delete("cv");
      else params.set("cv", String(id));
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, queryString],
  );

  const loadAll = useCallback(async () => {
    const seq = loadSeqRef.current;
    const stale = () => seq !== loadSeqRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const hs = await cvApi.getMyHoSo();
      if (stale()) return;
      setHoSo(hs);
      const list = await cvApi.listCvs(hs.id);
      if (stale()) return;
      setCvList(list);
      // Đọc CV/mẫu an toàn từ query (?template= / ?cv= / ?import=). Nguyên tắc:
      // ĐỔI TEMPLATE KHÔNG BAO GIỜ XÓA NỘI DUNG — ?template= chỉ đổi mẫu,
      // dữ liệu đang soạn (hoặc draft autosave) luôn được giữ lại.
      const params = new URLSearchParams(queryString);
      const cvParam = params.get("cv");
      const rawTemplate = params.get("template");
      const tid =
        rawTemplate && isKnownTemplateId(rawTemplate) ? resolveTemplateId(rawTemplate) : null;
      const blankOf = (templateId: string) =>
        ({
          ...(JSON.parse(JSON.stringify(defaultCvData)) as CvFormData),
          templateId,
        }) as CvFormData;

      if (cvParam) {
        // Mở CV đã lưu; nếu kèm ?template= thì đổi mẫu trên cùng nội dung đó.
        const requested = list.find((c) => c.id === Number(cvParam));
        const current = requested ?? list.find((c) => c.isDefault) ?? list[0];
        if (current) {
          const [detail, vers] = await Promise.all([
            cvApi.getById(current.id),
            cvApi.getVersions(current.id),
          ]);
          if (stale()) return;
          // Fallback = form trắng mặc định (không dùng form hiện tại) để
          // nội dung đang soạn dở tuyệt đối không lẫn sang CV vừa tải.
          const next = manualCvDetailToForm(
            detail,
            blankOf(tid ?? (defaultCvData as CvFormData).templateId),
          );
          if (tid) next.templateId = tid;
          lastSavedRef.current = JSON.stringify(next);
          setSelectedId(current.id);
          setCvData(next);
          syncCvParam(current.id);
          setVersions(vers);
          if (tid) toast.success("Đã đổi mẫu CV — nội dung được giữ nguyên.");
        }
      } else if (tid) {
        // ?template= nhưng không có ?cv=: ĐỔI MẪU — tuyệt đối không reset form.
        if (lastSavedRef.current === null) {
          // Mở trang mới (từ gallery / reload / share link): cứu dữ liệu từ
          // draft autosave nếu có, thay vì mở bản trắng mất hết nội dung.
          let rescued: CvFormData | null = null;
          let rescuedOwner: number | null = null;
          try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (raw) {
              const p = JSON.parse(raw) as Partial<DraftPayload>;
              if (isDraftCvData(p.cvData) && "selectedId" in (p as object)) {
                rescued = p.cvData;
                rescuedOwner = (p.selectedId ?? null) as number | null;
              }
            }
          } catch {
            // ignore
          }
          const ownerTarget =
            rescuedOwner != null ? list.find((c) => c.id === rescuedOwner) : undefined;
          if (ownerTarget) {
            // Draft thuộc CV đã lưu: tải CV đó rồi áp mẫu mới; effect khôi
            // phục nháp sẽ offer lại sửa đổi chưa lưu (khớp selectedId).
            const [detail, vers] = await Promise.all([
              cvApi.getById(ownerTarget.id),
              cvApi.getVersions(ownerTarget.id),
            ]);
            if (stale()) return;
            const next = manualCvDetailToForm(detail, blankOf(tid));
            next.templateId = tid;
            lastSavedRef.current = JSON.stringify(next);
            setSelectedId(ownerTarget.id);
            setCvData(next);
            syncCvParam(ownerTarget.id);
            setVersions(vers);
            toast.success("Đã đổi mẫu CV — nội dung được giữ nguyên.");
          } else {
            // Draft của bản mới chưa lưu (hoặc không có draft): dựng form từ
            // draft + mẫu mới; baseline là bản trắng để dirty tracking đúng.
            const next = rescued ? { ...rescued, templateId: tid } : blankOf(tid);
            lastSavedRef.current = JSON.stringify(blankOf(tid));
            draftOfferedRef.current = true; // đã dựng từ draft, không offer lại
            if (rescued) {
              try {
                localStorage.removeItem(DRAFT_KEY);
              } catch {
                // ignore
              }
              toast.success("Đã đổi mẫu CV — nội dung đã nhập được giữ nguyên.");
            }
            setSelectedId(null);
            setCvData(next);
            syncCvParam(null);
            setVersions([]);
          }
        } else {
          // Navigation nội bộ khi form đã có dữ liệu: chỉ đổi templateId.
          setCvData((prev) => (prev.templateId === tid ? prev : { ...prev, templateId: tid }));
          if (!isBlankWorkingCopy(cvDataRef.current)) {
            toast.success("Đã đổi mẫu CV — nội dung đã nhập được giữ nguyên.");
          }
        }
      } else {
        // Mở /tao-cv không có ?cv= là tạo CV mới. Không tự chọn CV mặc định
        // hoặc CV đầu tiên; người dùng phải bấm chọn rõ ràng trong danh sách.
        setSelectedId(null);
        setVersions([]);
        setCvData(blankOf(tid ?? (defaultCvData as CvFormData).templateId));
        lastSavedRef.current = null;
      }
      if (stale()) return;
      if (params.get("import") === "1") setImportOpen(true);
    } catch (e) {
      if (stale()) return;
      const message = e instanceof Error ? e.message : "Không tải được dữ liệu CV";
      setLoadError(message);
      toast.error(message);
    } finally {
      if (!stale()) setLoading(false);
    }
  }, [queryString, syncCvParam]);

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
  // Draft luôn gắn selectedId của CV đang soạn để lần mở sau chỉ offer
  // đúng CV đó — draft của CV khác không bao giờ được đè lên form hiện tại.
  useEffect(() => {
    if (loading || saving || !dirty) return;
    if (validateManualCv(cvData)) return;
    const ownerId = selectedId;
    const timer = window.setTimeout(() => {
      try {
        const payload: DraftPayload = {
          savedAt: new Date().toISOString(),
          cvData,
          selectedId: ownerId,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        setDraftAt(new Date());
      } catch {
        // Storage blocked/full — stay silent, manual save still works.
      }
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [cvData, dirty, loading, saving, selectedId]);

  // Offer to restore a local draft once, right after the initial load.
  // Chỉ offer khi draft thuộc đúng CV đang mở (so khớp selectedId) và đúng
  // shape; draft lạ/của CV khác thì bỏ qua (draft cũ thiếu selectedId bị xóa
  // một lần cho sạch) để nội dung CV cũ không bao giờ đè lên form hiện tại.
  useEffect(() => {
    if (loading || loadError || draftOfferedRef.current) return;
    draftOfferedRef.current = true;
    let parsed: Partial<DraftPayload> | null = null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) parsed = JSON.parse(raw) as Partial<DraftPayload>;
    } catch {
      parsed = null;
    }
    const drop = () => {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
    };
    if (!parsed || !isDraftCvData(parsed.cvData)) {
      if (parsed) drop();
      return;
    }
    if (!("selectedId" in (parsed as object))) {
      drop();
      return;
    }
    const draftOwner = (parsed.selectedId ?? null) as number | null;
    if (draftOwner !== selectedId) return;
    if (JSON.stringify(parsed.cvData) === JSON.stringify(cvData)) return;
    const timer = window.setTimeout(() => {
      setPendingDraft({
        savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
        cvData: parsed.cvData!,
        selectedId: draftOwner,
      });
      if (typeof parsed.savedAt === "string" && parsed.savedAt) {
        const t = new Date(parsed.savedAt);
        if (!Number.isNaN(t.getTime())) setDraftAt(t);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loading, loadError, cvData, selectedId]);

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
      // Lưu xong là đang sửa CV vừa lưu — sync URL để reload mở đúng nó.
      syncCvParam(result.cvUngVienId);
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
    // Vô hiệu loadAll đang bay (nếu có) để nó không đè CV cũ lên form trắng.
    loadSeqRef.current += 1;
    selectReqRef.current += 1;
    setSelectedId(null);
    setImportSessionId(null);
    setVersions([]);
    const fresh = JSON.parse(JSON.stringify(defaultCvData)) as CvFormData;
    // Giữ mẫu từ ?template= (flow chọn mẫu ở gallery) khi tạo bản mới.
    const rawTemplate = searchParams.get("template");
    if (rawTemplate && isKnownTemplateId(rawTemplate)) {
      fresh.templateId = resolveTemplateId(rawTemplate);
    }
    setCvData(fresh);
    lastSavedRef.current = JSON.stringify(fresh);
    setDirty(false);
    setLastSavedAt(null);
    // Chỉ xóa nháp của "bản mới chưa lưu"; nháp của CV đã lưu (selectedId số)
    // được giữ lại để lần mở CV đó vẫn offer được.
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      let drop = true;
      if (raw) {
        try {
          const p = JSON.parse(raw) as Partial<DraftPayload>;
          if (isDraftCvData(p.cvData) && "selectedId" in (p as object) && typeof p.selectedId === "number") {
            drop = false;
          }
        } catch {
          // draft hỏng → xóa
        }
      }
      if (drop) localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setPendingDraft(null);
    setDraftAt(null);
    syncCvParam(null);
  };

  const handleSelect = async (id: number): Promise<boolean> => {
    const req = ++selectReqRef.current;
    loadSeqRef.current += 1;
    // Ẩn ngay banner nháp của CV trước đó — nó không được bám theo sang CV này.
    setPendingDraft(null);
    try {
      const detail = await cvApi.getById(id);
      // Bỏ kết quả cũ nếu user đã bấm sang CV khác trong lúc chờ.
      if (req !== selectReqRef.current) return false;
      // Fallback = form trắng mặc định (không dùng form hiện tại) để nội
      // dung CV trước đó tuyệt đối không lẫn sang CV vừa chọn. Không có
      // side-effect trong updater (StrictMode gọi updater 2 lần).
      const fresh = JSON.parse(JSON.stringify(defaultCvData)) as CvFormData;
      const next = manualCvDetailToForm(detail, fresh);
      lastSavedRef.current = JSON.stringify(next);
      setSelectedId(id);
      setImportSessionId(null);
      setCvData(next);
      setDirty(false);
      setLastSavedAt(null);
      syncCvParam(id);
      if (req !== selectReqRef.current) return false;
      setVersions(await cvApi.getVersions(id));
      return req === selectReqRef.current;
    } catch (error) {
      if (req !== selectReqRef.current) return false;
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

  const handleSetDefault = async (id: number) => {
    try {
      await cvApi.setDefault(id);
      if (hoSo) setCvList(await cvApi.listCvs(hoSo.id));
      toast.success("Đã đặt CV làm mặc định cho gợi ý việc làm.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đặt CV mặc định");
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

  const handleManualImported = (sessionId: string, fileName: string) => {
    setImportSessionId(sessionId);
    const baseName = fileName.replace(/\.(pdf|docx|json)$/i, "").trim();
    if (baseName) {
      setCvData((prev) => (prev.tenFile.trim() ? prev : { ...prev, tenFile: baseName }));
    }
    toast.success("Đã lưu file CV gốc", {
      description: "AI đang bận nên bạn nhập nội dung thủ công, file gốc vẫn được đính kèm khi lưu.",
    });
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

  const saveLabel = loading
    ? "Đang tải..."
    : saving
      ? "Đang lưu..."
      : dirty
        ? draftAt ? `Bản nháp lúc ${formatClock(draftAt)} · Chưa lưu` : "Chưa lưu thay đổi"
        : lastSavedAt ? `Đã lưu lúc ${formatClock(lastSavedAt)}` : selectedId ? "Đã lưu" : "CV mới";

  const preview = (
    <CvPreviewPanel data={deferredCvData} pageCount={pageCount} onPageCount={setPageCount} zoom={zoom} onZoom={setZoom} disabled={loading} />
  );

  return (
    <div className="cv-builder-print-host mx-auto min-h-dvh w-full max-w-[1440px] px-4 pb-8 sm:px-6">
      <CvBuilderToolbar
        title={cvData.tenFile}
        onTitleChange={(tenFile) => setCvData((current) => ({ ...current, tenFile }))}
        status={saveLabel}
        cvList={cvList}
        selectedId={selectedId}
        templateId={cvData.templateId}
        versions={versions}
        onSelectCv={(id) => void handleSelect(id)}
        onSelectTemplate={selectTemplate}
        onSetDefault={(id) => void handleSetDefault(id)}
        onNew={handleNew}
        onImport={() => setImportOpen(true)}
        onFillProfile={fillFromHoSo}
        onExportJson={handleExportJsonResume}
        onDownloadVersion={(id) => void handleDownloadStoredFile(id)}
        onDownloadOriginal={() => void handleDownloadStoredFile(undefined, true)}
        onDelete={() => void handleDelete()}
        onExportPdf={() => void handleExportPdf()}
        onSave={() => void handleSave()}
        saving={saving}
        disabled={loading || exportingPdf}
      />

      <CvImportDialog open={importOpen} onOpenChange={setImportOpen} hoSoUngVienId={hoSo?.id ?? null} onImported={handleImported} onManualImported={handleManualImported} />

      {!loading && !loadError && pendingDraft ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3" role="status">
          <p className="text-sm text-foreground">Có bản nháp tự lưu lúc {formatClock(new Date(pendingDraft.savedAt))}.</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={discardDraft}>Bỏ qua</Button>
            <Button type="button" size="sm" onClick={applyDraft}>Khôi phục</Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="pt-6"><CvBuilderSkeleton /></div>
      ) : loadError ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-card px-6 py-14 text-center" role="alert">
          <p className="text-sm font-semibold text-foreground">Không tải được dữ liệu CV</p>
          <p className="max-w-sm text-sm text-muted-foreground">{loadError}</p>
          <Button type="button" variant="outline" onClick={() => void loadAll()}>Thử lại</Button>
        </div>
      ) : (
        <>
          <div className="mt-4 md:hidden"><TemplatePicker selectedId={cvData.templateId} onSelect={selectTemplate} cvId={selectedId} compact /></div>

          <div className="mt-5 xl:hidden">
            <Tabs defaultValue="form" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="form" className="gap-2"><Pencil className="size-4" /> Nội dung</TabsTrigger>
                <TabsTrigger value="preview" className="gap-2"><Eye className="size-4" /> Xem trước</TabsTrigger>
              </TabsList>
              <TabsContent value="form" className="mt-4 space-y-3">
                <CvCompletion progress={progress} items={quality.items} />
                <CvForm data={cvData} onChange={setCvData} />
              </TabsContent>
              <TabsContent value="preview" className="mt-4">{preview}</TabsContent>
            </Tabs>
          </div>

          <main className="mt-6 hidden grid-cols-[minmax(0,44fr)_minmax(0,56fr)] gap-6 xl:grid">
            <section className="min-w-0" aria-label="Nội dung CV">
              <div className="mb-3 flex items-center justify-between">
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Nội dung CV</h1>
              </div>
              <div className="mb-3"><CvCompletion progress={progress} items={quality.items} /></div>
              <CvForm data={cvData} onChange={setCvData} />
            </section>
            <aside className="min-w-0" aria-label="Xem trước CV">
              <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">Xem trước</h2>
              <div className="sticky top-20">{preview}</div>
            </aside>
          </main>
        </>
      )}

      {!loading && !loadError ? <div className="cv-print-root" data-cv-print-root aria-hidden="true"><CvPreview data={deferredCvData} /></div> : null}
    </div>
  );
}
