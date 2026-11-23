"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Building2, CircleAlert, FileText, Loader2, MapPin, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cvApi } from "@/lib/api/cv-api";
import { backendData, backendFetch, backendMessage, backendSucceeded } from "@/lib/api/backend";
import type { CvVm } from "@/lib/types";
import { emitApplied, registerApplyModal, type AdamApplyIntent } from "./adam-apply-intent";
import { CvPicker } from "./cv-picker";

type JobSummary = {
  id: number;
  tieuDe: string;
  tenDoanhNghiep: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
  trangThai: string;
  ngayHetHan: string;
};

function fmtMoney(min: number, max: number) {
  if (!min && !max) return "Thỏa thuận";
  const f = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " đ";
  if (min && max && min !== max) return `${f(min)} – ${f(max)}`;
  return f(max || min);
}

function normalizeJob(raw: Record<string, unknown>, fallbackId: number): JobSummary {
  const pick = <T,>(camel: string, pascal: string): T =>
    (raw[camel] ?? raw[pascal]) as T;
  return {
    id: Number(pick("id", "Id") ?? fallbackId),
    tieuDe: `${pick("tieuDe", "TieuDe") ?? ""}`,
    tenDoanhNghiep: `${pick("tenDoanhNghiep", "TenDoanhNghiep") ?? ""}`.trim(),
    diaDiemLamViec: `${pick("diaDiemLamViec", "DiaDiemLamViec") ?? ""}`,
    luongToiThieu: Number(pick("luongToiThieu", "LuongToiThieu") ?? 0),
    luongToiDa: Number(pick("luongToiDa", "LuongToiDa") ?? 0),
    trangThai: `${pick("trangThai", "TrangThai") ?? ""}`,
    ngayHetHan: `${pick("ngayHetHan", "NgayHetHan") ?? ""}`,
  };
}

function isExpired(ngayHetHan: string) {
  if (!ngayHetHan) return false;
  const t = new Date(ngayHetHan).getTime();
  return !Number.isNaN(t) && t < Date.now();
}

/** "HTTP 400" trần = tầng edge trả lỗi không có body dùng được (vd. ngay sau redeploy);
 *  không phải nghiệp vụ — mọi lỗi nghiệp vụ đều kèm Message tiếng Việt. */
const OPAQUE_HTTP_ERROR = /^HTTP \d{3}$/;

function isTransientLoadError(message: string) {
  return OPAQUE_HTTP_ERROR.test(message) || /failed to fetch|fetch failed|network|load failed/i.test(message);
}

function jobLoadMessage(message: string) {
  return isTransientLoadError(message)
    ? "Không tải được tin tuyển dụng do lỗi kết nối tạm thời. Bấm “Thử lại” để tiếp tục."
    : message;
}

function submitMessage(message: string) {
  return OPAQUE_HTTP_ERROR.test(message)
    ? "Nộp đơn chưa thành công do lỗi kết nối tạm thời. Bấm “Xác nhận nộp đơn” để thử lại."
    : message;
}

/**
 * Bảng xác nhận nộp đơn toàn cục: Adam mở đúng tin/CV, user bấm
 * "Xác nhận nộp đơn" — đây là đường ghi duy nhất của luồng agent.
 */
export function ApplyConfirmModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<AdamApplyIntent | null>(null);
  const [job, setJob] = useState<JobSummary | null>(null);
  const [loadingJob, setLoadingJob] = useState(false);
  const [jobError, setJobError] = useState("");
  const [daNop, setDaNop] = useState(false);
  const [cvs, setCvs] = useState<CvVm[]>([]);
  const [loadingCvs, setLoadingCvs] = useState(false);
  const [cvError, setCvError] = useState("");
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => registerApplyModal((next) => {
    setIntent(next);
    setOpen(true);
  }), []);

  const load = useCallback(async () => {
    if (!intent) return;
    const tinId = intent.tinTuyenDungId;
    const preferredCvId = intent.cvId;

    setJob(null);
    setJobError("");
    setDaNop(false);
    setCvs([]);
    setCvError("");
    setSelectedCvId(null);
    setSubmitError("");
    setLoadingJob(true);
    setLoadingCvs(true);

    try {
      const fetchJob = async (): Promise<JobSummary> => {
        for (let attempt = 0; ; attempt++) {
          try {
            const res = await backendFetch(`/api/dotnet/tintuyendungs/show/${tinId}`);
            if (!backendSucceeded(res)) throw new Error(backendMessage(res) || "Không tải được tin tuyển dụng.");
            return normalizeJob((backendData<Record<string, unknown>>(res) ?? {}) as Record<string, unknown>, tinId);
          } catch (e) {
            const message = e instanceof Error ? e.message : "Không tải được tin tuyển dụng.";
            if (attempt === 0 && isTransientLoadError(message)) {
              await new Promise((resolve) => setTimeout(resolve, 600));
              continue;
            }
            throw new Error(jobLoadMessage(message));
          }
        }
      };
      setJob(await fetchJob());
    } catch (e) {
      setJobError(e instanceof Error ? e.message : "Không tải được tin tuyển dụng.");
    } finally {
      setLoadingJob(false);
    }

    try {
      const hoSo = await cvApi.getMyHoSo();
      const list = await cvApi.listCvs(hoSo.id);
      setCvs(list);
      if (preferredCvId && list.some((cv) => cv.id === preferredCvId)) setSelectedCvId(preferredCvId);
      else if (list.length === 1) setSelectedCvId(list[0].id);
    } catch (e) {
      setCvError(e instanceof Error ? e.message : "Không tải được danh sách CV.");
    } finally {
      setLoadingCvs(false);
    }

    try {
      const res = await backendFetch(`/api/dotnet/donungtuyens?TinTuyenDungId=${tinId}&_start=0&_end=5`);
      const rows = backendData<unknown>(res);
      setDaNop(Array.isArray(rows) && rows.length > 0);
    } catch {
      setDaNop(false);
    }
  }, [intent]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [open, load]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSubmitError("");
  };

  const hetHan = job ? isExpired(job.ngayHetHan) : false;
  const conNhanHoSo = !!job && (job.trangThai === "DangTuyen" || job.trangThai === "3") && !hetHan;
  const daDong = job?.trangThai === "DaDong" || job?.trangThai === "6";
  const trangThaiHetHan = job?.trangThai === "HetHan" || job?.trangThai === "5";
  const lyDoKhoa = !job
    ? ""
    : hetHan || trangThaiHetHan
      ? "Tin đã hết hạn nhận hồ sơ."
      : daDong
        ? "Tin tuyển dụng đã đóng."
        : !conNhanHoSo
          ? "Tin hiện không ở trạng thái đang tuyển."
          : "";

  const confirmApply = async () => {
    if (!job || !selectedCvId || submitting) return;
    try {
      setSubmitting(true);
      setSubmitError("");
      const res = await backendFetch<number>("/api/dotnet/donungtuyens", {
        method: "POST",
        body: JSON.stringify({ TinTuyenDungId: job.id, CVUngVienId: selectedCvId }),
        headers: { "X-Nguon": "adam" },
      });
      if (!backendSucceeded(res)) throw new Error(backendMessage(res) || "Nộp đơn không thành công.");
      const donUngTuyenId = Number(backendData(res) ?? 0);
      emitApplied({
        donUngTuyenId: Number.isFinite(donUngTuyenId) && donUngTuyenId > 0 ? donUngTuyenId : 0,
        tinTuyenDungId: job.id,
      });
      toast.success(backendMessage(res) || "Nộp đơn ứng tuyển thành công.");
      setOpen(false);
    } catch (e) {
      setSubmitError(submitMessage(e instanceof Error ? e.message : "Nộp đơn không thành công."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPrimitive.Popup className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-xl outline-none">
            <DialogPrimitive.Title className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
              <FileText className="size-5 text-primary" /> Xác nhận nộp đơn
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-muted-foreground">
              Adam đã chuẩn bị đơn cho tin này. Bạn kiểm tra CV rồi tự bấm xác nhận — Adam không tự nộp.
            </DialogPrimitive.Description>

            {loadingJob ? (
              <p className="mt-4 flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Đang tải tin tuyển dụng...
              </p>
            ) : jobError ? (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <CircleAlert className="size-4 shrink-0 text-destructive" /> {jobError}
                </span>
                <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => void load()}>
                  <RefreshCw className="mr-1.5 size-3.5" /> Thử lại
                </Button>
              </div>
            ) : job ? (
              <div className="mt-4 rounded-2xl border border-border bg-muted/40 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{job.tieuDe || `Tin #${job.id}`}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3.5" /> {job.tenDoanhNghiep || "Nhà tuyển dụng"}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {job.diaDiemLamViec || "Chưa có địa điểm"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="size-3.5" /> {fmtMoney(job.luongToiThieu, job.luongToiDa)}
                  </span>
                </div>
              </div>
            ) : null}

            {job && daNop && (
              <p className="mt-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
                Bạn đã nộp đơn cho tin này.
              </p>
            )}
            {job && !daNop && lyDoKhoa && (
              <p className="mt-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
                {lyDoKhoa}
              </p>
            )}

            <div className="mt-4">
              <CvPicker
                cvs={cvs}
                loading={loadingCvs}
                error={cvError}
                selectedCvId={selectedCvId}
                onSelect={setSelectedCvId}
                onRetry={() => void load()}
                onCreateCv={() => {
                  setOpen(false);
                  router.push("/tao-cv");
                }}
              />
            </div>

            {submitError && (
              <p className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <DialogPrimitive.Close className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                Huỷ
              </DialogPrimitive.Close>
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                disabled={
                  !job || !selectedCvId || submitting || loadingCvs || loadingJob || daNop || !conNhanHoSo
                }
                onClick={() => void confirmApply()}
              >
                {submitting && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                {submitting ? "Đang nộp..." : "Xác nhận nộp đơn"}
              </Button>
            </div>
          </DialogPrimitive.Popup>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
