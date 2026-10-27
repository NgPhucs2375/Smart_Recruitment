"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Briefcase,
  Building2,
  CalendarClock,
  CircleAlert,
  Eye,
  FileText,
  Home,
  Laptop,
  Loader2,
  MapPin,
  RefreshCw,
  Send,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminEmptyState,
  AdminLoadingState,
} from "@/components/admin/admin-page-layout";
import { cvApi } from "@/lib/api/cv-api";
import type { CvDetailVm, CvVm } from "@/lib/types";

type TinChiTiet = {
  id: number;
  tieuDe: string;
  moTaCongViec: string;
  kinhNghiemYeuCau: string;
  yeuCauCongViec: string;
  quyenLoi: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
  trangThai: string;
  ngayHetHan: string;
  doanhNghiepId: number;
  tenDoanhNghiep: string;
  kyNangs: string[];
  workMode: string;
  level: string;
  employmentType: string;
  soLuongUngVien: number;
};

type ApiResponse<T> = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: T;
  data?: T;
};

const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

function fmtMoney(min: number, max: number) {
  if (!min && !max) return "Thỏa thuận";
  const f = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " đ";
  if (min && max && min !== max) return `${f(min)} – ${f(max)}`;
  return f(max || min);
}

function fmtDate(d: string) {
  if (!d) return "—";
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString("vi-VN");
}

function isExpired(ngayHetHan: string) {
  if (!ngayHetHan) return false;
  const t = new Date(ngayHetHan).getTime();
  return !Number.isNaN(t) && t < Date.now();
}

function Section({ title, body }: { title: string; body: string }) {
  if (!body?.trim()) return null;
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <section className="py-6 first:pt-0 last:pb-0">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      <ul className="mt-3 space-y-2">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ViecLamChiTietPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tinId = Number(params.id);

  const [tin, setTin] = useState<TinChiTiet | null>(null);
  const [tenDoanhNghiep, setTenDoanhNghiep] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [daUngTuyen, setDaUngTuyen] = useState(false);
  const [saved, setSaved] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [cvs, setCvs] = useState<CvVm[]>([]);
  const [loadingCvs, setLoadingCvs] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewCvId, setPreviewCvId] = useState<number | null>(null);
  const [previewDetail, setPreviewDetail] = useState<CvDetailVm | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const apiFetch = useCallback(async (url: string, opts?: RequestInit) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts?.headers,
      },
    });
    const body = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;
    if (!res.ok) throw new Error(body ? msg(body) : `HTTP ${res.status}`);
    return body;
  }, []);

  const load = useCallback(async () => {
    if (!Number.isFinite(tinId) || tinId <= 0) {
      setLoadError("Tin tuyển dụng không hợp lệ.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError("");
      const res = await apiFetch(`/api/dotnet/tintuyendungs/show/${tinId}`);
      if (!res || !ok(res)) throw new Error(res ? msg(res) : "Không tải được tin tuyển dụng.");
      const d = (extractData(res) ?? {}) as Record<string, unknown>;
      const rawSkills: unknown = d.kyNangs ?? d.KyNangs;
      const detail: TinChiTiet = {
        id: Number(d.id ?? d.Id ?? tinId),
        tieuDe: `${d.tieuDe ?? d.TieuDe ?? ""}`,
        moTaCongViec: `${d.moTaCongViec ?? d.MoTaCongViec ?? ""}`,
        kinhNghiemYeuCau: `${d.kinhNghiemYeuCau ?? d.KinhNghiemYeuCau ?? ""}`,
        yeuCauCongViec: `${d.yeuCauCongViec ?? d.YeuCauCongViec ?? ""}`,
        quyenLoi: `${d.quyenLoi ?? d.QuyenLoi ?? ""}`,
        diaDiemLamViec: `${d.diaDiemLamViec ?? d.DiaDiemLamViec ?? ""}`,
        luongToiThieu: Number(d.luongToiThieu ?? d.LuongToiThieu ?? 0),
        luongToiDa: Number(d.luongToiDa ?? d.LuongToiDa ?? 0),
        trangThai: `${d.trangThai ?? d.TrangThai ?? ""}`,
        ngayHetHan: `${d.ngayHetHan ?? d.NgayHetHan ?? ""}`,
        doanhNghiepId: Number(d.doanhNghiepId ?? d.DoanhNghiepId ?? 0),
        tenDoanhNghiep: `${d.tenDoanhNghiep ?? d.TenDoanhNghiep ?? ""}`.trim(),
        kyNangs: Array.isArray(rawSkills) ? rawSkills.map(String).filter(Boolean) : [],
        workMode: `${d.workMode ?? d.WorkMode ?? ""}`.trim(),
        level: `${d.level ?? d.Level ?? ""}`.trim(),
        employmentType: `${d.employmentType ?? d.EmploymentType ?? ""}`.trim(),
        soLuongUngVien: Number(d.soLuongUngVien ?? d.SoLuongUngVien ?? 0),
      };
      setTin(detail);
      if (detail.tenDoanhNghiep) setTenDoanhNghiep(detail.tenDoanhNghiep);

      // Fallback tên doanh nghiệp (tùy quyền show): lỗi thì bỏ qua, vẫn hiện tin.
      if (!detail.tenDoanhNghiep && detail.doanhNghiepId > 0) {
        try {
          const cRes = await apiFetch(`/api/dotnet/doanhnghieps/show/${detail.doanhNghiepId}`);
          const c = (extractData(cRes ?? {}) ?? {}) as Record<string, unknown>;
          const name = `${c.tenDoanhNghiep ?? c.TenDoanhNghiep ?? ""}`.trim();
          if (name) setTenDoanhNghiep(name);
        } catch {
          // bỏ qua
        }
      }

      // Đã nộp đơn này chưa? (BE lọc theo chính user + TinTuyenDungId)
      try {
        const donRes = await apiFetch(`/api/dotnet/donungtuyens?TinTuyenDungId=${detail.id}&_start=0&_end=5`);
        const arr = extractData<unknown>(donRes ?? {});
        if (Array.isArray(arr) && arr.length > 0) setDaUngTuyen(true);
      } catch {
        // bỏ qua — nút Ứng tuyển vẫn hiện để thử
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Không tải được tin tuyển dụng.");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, tinId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const openPicker = async () => {
    setPickerOpen(true);
    setSelectedCvId(null);
    setPreviewCvId(null);
    setPreviewDetail(null);
    try {
      setLoadingCvs(true);
      const hoSo = await cvApi.getMyHoSo();
      const list = await cvApi.listCvs(hoSo.id);
      setCvs(list);
      if (list.length === 1) setSelectedCvId(list[0].id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh sách CV.");
      setPickerOpen(false);
    } finally {
      setLoadingCvs(false);
    }
  };

  const togglePreview = async (cv: CvVm) => {
    if (previewCvId === cv.id) {
      setPreviewCvId(null);
      return;
    }
    setPreviewCvId(cv.id);
    setPreviewDetail(null);
    try {
      setLoadingPreview(true);
      const detail = await cvApi.getById(cv.id);
      setPreviewDetail(detail);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được preview CV.");
      setPreviewCvId(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleApply = async () => {
    if (!tin || !selectedCvId || submitting) return;
    try {
      setSubmitting(true);
      const res = await apiFetch("/api/dotnet/donungtuyens", {
        method: "POST",
        body: JSON.stringify({ TinTuyenDungId: tin.id, CVUngVienId: selectedCvId }),
      });
      if (!res || !ok(res)) throw new Error(res ? msg(res) : "Nộp đơn không thành công.");
      setPickerOpen(false);
      setDaUngTuyen(true);
      toast.success(res ? msg(res) || "Nộp đơn ứng tuyển thành công." : "Nộp đơn ứng tuyển thành công.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nộp đơn không thành công.");
    } finally {
      setSubmitting(false);
    }
  };

  const hetHan = tin ? isExpired(tin.ngayHetHan) : false;
  const conNhanHoSo = !!tin && (tin.trangThai === "DangTuyen" || tin.trangThai === "3") && !hetHan;
  const lyDoKhoa = !tin
    ? ""
    : daUngTuyen
      ? "Bạn đã nộp đơn cho tin này."
      : tin.trangThai !== "DangTuyen" && tin.trangThai !== "3"
        ? "Tin hiện không ở trạng thái đang tuyển."
        : hetHan
          ? "Tin đã hết hạn nhận hồ sơ."
          : "";

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Link
        href="/viec-lam"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Về tìm việc làm
      </Link>

      {loading ? (
        <AdminLoadingState />
      ) : loadError || !tin ? (
        <AdminEmptyState
          icon={CircleAlert}
          title="Không tải được tin tuyển dụng"
          description={loadError || "Tin không tồn tại."}
          action={loadError ? (
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="size-4" /> Thử lại
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted">
                <Building2 className="size-6 text-primary" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {tin.tieuDe || `Tin tuyển dụng #${tin.id}`}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tenDoanhNghiep || (tin.doanhNghiepId > 0 ? `Doanh nghiệp #${tin.doanhNghiepId}` : "Nhà tuyển dụng")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/15 px-3 py-1.5 font-bold text-primary">
                    <Wallet className="size-3.5" /> {fmtMoney(tin.luongToiThieu, tin.luongToiDa)}
                  </span>
                  {tin.diaDiemLamViec && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 font-medium text-muted-foreground">
                      <MapPin className="size-3.5" /> {tin.diaDiemLamViec}
                    </span>
                  )}
                  {tin.workMode && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 font-medium text-primary">
                      {tin.workMode === "Remote" ? <Home className="size-3.5" /> : tin.workMode === "Hybrid" ? <Laptop className="size-3.5" /> : <Building2 className="size-3.5" />}
                      {tin.workMode}
                    </span>
                  )}
                  {tin.ngayHetHan && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 font-medium text-muted-foreground">
                      <CalendarClock className="size-3.5" /> Hạn nộp: {fmtDate(tin.ngayHetHan)}
                    </span>
                  )}
                  {tin.soLuongUngVien > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 font-medium text-muted-foreground">
                      <Users className="size-3.5" /> {tin.soLuongUngVien} ứng viên
                    </span>
                  )}
                </div>
                {(tin.level || tin.employmentType || tin.workMode || tin.kyNangs.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tin.level && <Badge className="border-0 text-xs font-semibold">{tin.level}</Badge>}
                    {tin.employmentType && (
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        {tin.employmentType}
                      </Badge>
                    )}
                    {tin.workMode && (
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        {tin.workMode}
                      </Badge>
                    )}
                    {tin.kyNangs.slice(0, 6).map((s) => (
                      <Badge key={s} variant="outline" className="text-xs border-border text-muted-foreground">
                        {s}
                      </Badge>
                    ))}
                    {tin.kyNangs.length > 6 && (
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        +{tin.kyNangs.length - 6}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-5">
              {daUngTuyen ? (
                <p className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-4 py-2 text-sm font-semibold text-primary">
                  <BadgeCheck className="size-4" /> Bạn đã ứng tuyển tin này
                </p>
              ) : (
                <Button
                  type="button"
                  className="rounded-full"
                  disabled={!conNhanHoSo}
                  onClick={() => void openPicker()}
                >
                  <Send className="mr-1.5 size-4" /> Ứng tuyển ngay
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className={`rounded-full ${saved ? "border-primary/40 bg-primary/5 text-primary" : ""}`}
                aria-pressed={saved}
                onClick={() => {
                  setSaved((v) => !v);
                  toast.success(saved ? "Đã bỏ lưu việc làm." : "Đã lưu việc làm vào danh sách.");
                }}
              >
                <Bookmark className={`size-4 ${saved ? "fill-current" : ""}`} /> {saved ? "Đã lưu" : "Lưu việc làm"}
              </Button>
              {!conNhanHoSo && !daUngTuyen && lyDoKhoa && (
                <span className="text-xs text-muted-foreground">{lyDoKhoa}</span>
              )}
              <Link href="/viec-lam/da-ung-tuyen" className="ml-auto text-xs font-semibold text-primary hover:underline">
                Xem việc đã ứng tuyển
                </Link>
            </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div className="min-w-0 rounded-[2rem] border border-border bg-card px-6 shadow-sm sm:px-8">
                <Section title="Mô tả công việc" body={tin.moTaCongViec} />
                <div className="border-t border-border" />
                <Section title="Yêu cầu công việc" body={tin.yeuCauCongViec} />
                <div className="border-t border-border" />
                <Section title="Kinh nghiệm yêu cầu" body={tin.kinhNghiemYeuCau} />
                <div className="border-t border-border" />
                <Section title="Quyền lợi" body={tin.quyenLoi} />
              </div>
            </div>

            <aside className="lg:col-span-4 space-y-6">
              <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tổng quan</h2>
                <div className="mt-4 divide-y divide-border">
                  <div className="flex items-start justify-between gap-4 py-3 first:pt-0">
                    <span className="text-sm text-muted-foreground">Mức lương</span>
                    <span className="text-right text-sm font-semibold text-foreground">{fmtMoney(tin.luongToiThieu, tin.luongToiDa)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-sm text-muted-foreground">Địa điểm</span>
                    <span className="text-right text-sm font-semibold text-foreground">{tin.diaDiemLamViec || "Không nêu"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-sm text-muted-foreground">Phương thức</span>
                    <span className="text-right text-sm font-semibold text-foreground">{tin.workMode || "Onsite"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-sm text-muted-foreground">Hạn nộp</span>
                    <span className="text-right text-sm font-semibold text-foreground">{tin.ngayHetHan ? fmtDate(tin.ngayHetHan) : "Không giới hạn"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-3 last:pb-0">
                    <span className="text-sm text-muted-foreground">Ứng viên</span>
                    <span className="text-right text-sm font-semibold text-foreground">{tin.soLuongUngVien}</span>
                  </div>
                </div>
              </section>

              <section className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <Sparkles className="size-4 text-[#355C8C]" /> Đánh giá AI matching
                </h2>
                <div>
                  <span className="mb-1 block text-xs font-medium text-slate-500">Độ khớp với CV của bạn</span>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold text-[#355C8C]">95%</span>
                    <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Phù hợp rất cao
                    </span>
                  </div>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label="Độ khớp với CV"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={95}
                >
                  <div className="h-full w-[95%] rounded-full bg-emerald-500"></div>
                </div>
                <div>
                  <span className="flex items-center mb-2 rounded-lg border border-emerald-100/80 bg-emerald-50/60 p-2 text-xs text-emerald-900">✓ Python (Khớp hồ sơ)</span>
                  <span className="flex items-center mb-2 rounded-lg border border-emerald-100/80 bg-emerald-50/60 p-2 text-xs text-emerald-900">✓ SQL (Khớp hồ sơ)</span>
                  <span className="flex items-center mb-2 rounded-lg border border-emerald-100/80 bg-emerald-50/60 p-2 text-xs text-emerald-900">✓ Mid-level (Khớp hồ sơ)</span>
                  <span className="flex items-center mb-2 rounded-lg border border-amber-100/80 bg-amber-50/60 p-2 text-xs text-amber-900">⚠ Power BI (Điểm cộng, chưa có trong CV)</span>
                </div>
              </section>

              {tin.kyNangs.length > 0 && (
                <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Kỹ năng cần có</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tin.kyNangs.map((skill) => (
                      <Badge key={skill} variant="outline" className="border-primary/20 bg-primary/5 text-foreground">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Doanh nghiệp</h2>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {(tenDoanhNghiep || "NT").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{tenDoanhNghiep || "Nhà tuyển dụng"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Đang tuyển dụng trên HIREAI</p>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      )}

      <DialogPrimitive.Root open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <DialogPrimitive.Popup className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-xl outline-none">
              <DialogPrimitive.Title className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                <FileText className="size-5 text-primary" /> Chọn CV để ứng tuyển
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                Đơn sẽ đính kèm bản mới nhất của CV bạn chọn. Mỗi hồ sơ chỉ nộp 1 đơn cho mỗi tin.
              </DialogPrimitive.Description>

              <div className="mt-4 space-y-2">
                {loadingCvs ? (
                  <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Đang tải danh sách CV...
                  </p>
                ) : cvs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
                    <Briefcase className="mx-auto size-6 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium text-foreground">Bạn chưa có CV nào</p>
                    <p className="mt-1 text-xs text-muted-foreground">Tạo CV trước rồi quay lại nộp đơn.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 rounded-full"
                      onClick={() => router.push("/tao-cv")}
                    >
                      Tạo CV ngay
                    </Button>
                  </div>
                ) : (
                  cvs.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-2xl border transition ${
                        selectedCvId === c.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex w-full items-center gap-3 p-3">
                        <button
                          type="button"
                          onClick={() => setSelectedCvId(c.id)}
                          aria-pressed={selectedCvId === c.id}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <FileText className="size-4 shrink-0 text-primary" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-foreground">
                              {c.tenFile || `CV #${c.id}`}
                            </span>
                            {c.viTriUngTuyen && (
                              <span className="block truncate text-xs text-muted-foreground">{c.viTriUngTuyen}</span>
                            )}
                          </span>
                          {c.isDefault && (
                            <span className="shrink-0 rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold text-white">
                              Mặc định
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void togglePreview(c)}
                          aria-expanded={previewCvId === c.id}
                          aria-label={previewCvId === c.id ? "Ẩn preview" : "Xem trước CV"}
                          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                        >
                          {loadingPreview && previewCvId === c.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                      {previewCvId === c.id && (
                        <div className="border-t border-border px-4 py-3">
                          {loadingPreview && !previewDetail ? (
                            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="size-3.5 animate-spin" /> Đang tải preview...
                            </p>
                          ) : previewDetail ? (
                            <div className="space-y-2 text-xs leading-5">
                              <p className="font-semibold text-foreground">
                                {previewDetail.noiDung.thongTinLienHe.hoTen || c.hoTen || c.tenFile}
                                {previewDetail.noiDung.thongTinLienHe.viTriUngTuyen && (
                                  <span className="ml-2 font-normal text-muted-foreground">
                                    • {previewDetail.noiDung.thongTinLienHe.viTriUngTuyen}
                                  </span>
                                )}
                              </p>
                              {previewDetail.noiDung.thongTinLienHe.gioiThieuBanThan && (
                                <p className="text-muted-foreground line-clamp-2">
                                  {previewDetail.noiDung.thongTinLienHe.gioiThieuBanThan}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                                <span>Kinh nghiệm: {previewDetail.noiDung.kinhNghiemLamViec.length}</span>
                                <span>Kỹ năng: {previewDetail.noiDung.kyNang.length}</span>
                                <span>Dự án: {previewDetail.noiDung.duAn.length}</span>
                              </div>
                              {previewDetail.noiDung.kyNang.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {previewDetail.noiDung.kyNang.slice(0, 6).map((k) => (
                                    <span
                                      key={k.tenKyNang}
                                      className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground"
                                    >
                                      {k.tenKyNang}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Không tải được preview.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <DialogPrimitive.Close className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  Huỷ
                </DialogPrimitive.Close>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  disabled={!selectedCvId || submitting || loadingCvs}
                  onClick={() => void handleApply()}
                >
                  {submitting && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                  {submitting ? "Đang nộp..." : "Xác nhận nộp đơn"}
                </Button>
              </div>
            </DialogPrimitive.Popup>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </main>
  );
}
