"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CircleAlert,
  Compass,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AdminEmptyState,
  AdminLoadingState,
} from "@/components/admin/admin-page-layout";
import { getValidToken } from "@/lib/auth-provider";

type PhanTichCv = {
  id: number;
  cvUngVienId: number;
  noiDungTrichXuat: string;
  kyNangTrichXuat: string;
  kinhNghiemTrichXuat: string;
  hocVanTrichXuat: string;
  phanTich: string;
  diemTongQuan: number | null;
  diemPhuHop: number | null;
  matchingVersion: string;
  tinTuyenDungId: number | null;
  nhanXet: string;
  diemManh: string;
  diemYeu: string;
  goiY: string;
  danhGiaLuc: string | null;
  daDanhGiaBangAi: boolean;
};

type JobOption = {
  id: number;
  title: string;
  company: string;
  score: number | null;
  source: "applied" | "suggested";
};

type ApiResponse<T> = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: T;
  data?: T;
};

const API = "/api/dotnet/ketquaphantichcvs";
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

// API trả camelCase nhưng một số endpoint cũ vẫn PascalCase — đọc cả hai.
const field = (row: Record<string, unknown>, key: string): unknown =>
  row[key] ?? row[key.charAt(0).toUpperCase() + key.slice(1)];

const SECTION_LABEL: Record<string, string> = {
  "ky-nang": "Kỹ năng",
  "kinh-nghiem": "Kinh nghiệm",
  "hoc-van": "Học vấn",
  "du-an": "Dự án",
  "tong-the": "Tổng thể",
};

const lines = (text: string): string[] => text.split(/\n+/).map((s) => s.trim()).filter(Boolean);

function CardShell({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Paragraph({ text }: { text: string }) {
  if (!text.trim()) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        Chưa trích xuất nội dung này — hãy lưu lại CV để làm mới kết quả.
      </p>
    );
  }
  return (
    <div className="space-y-2 text-sm leading-6 text-muted-foreground">
      {lines(text).map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

function BulletList({ text, empty }: { text: string; empty: string }) {
  const items = lines(text);
  if (items.length === 0) {
    return <p className="text-sm leading-6 text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="space-y-2 text-sm leading-6">
      {items.map((line) => (
        <li key={line} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-current opacity-40" />
          <span className="text-muted-foreground">{line}</span>
        </li>
      ))}
    </ul>
  );
}

function matchBadge(score: number): { label: string; className: string } {
  if (score >= 66) return { label: "Phù hợp cao", className: "bg-teal-50 text-teal-700" };
  if (score >= 33) return { label: "Phù hợp trung bình", className: "bg-amber-50 text-amber-700" };
  return { label: "Phù hợp thấp", className: "bg-rose-50 text-rose-700" };
}

export default function CvPhanTichPage() {
  const params = useParams<{ cvId: string }>();
  const searchParams = useSearchParams();
  const cvId = Number(params.cvId);
  const deepLinkJobId = useMemo(() => {
    const id = Number(searchParams.get("tinTuyenDungId"));
    return Number.isFinite(id) && id > 0 ? id : null;
  }, [searchParams]);

  const [result, setResult] = useState<PhanTichCv | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState("");

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getValidToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const refreshReview = useCallback(async () => {
    if (!Number.isFinite(cvId) || cvId <= 0) return;
    const res = await fetch(`${API}?CVUngVienId=${cvId}&_start=0&_end=1`, {
      headers: await authHeaders(),
    });
    const body = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;
    if (!res.ok) throw new Error(body ? msg(body) : `HTTP ${res.status}`);
    if (!body || !ok(body)) throw new Error(body ? msg(body) : "Không tải được kết quả phân tích.");
    const d = extractData(body);
    const arr = Array.isArray(d) ? d : [];
    if (arr.length === 0) {
      setResult(null);
      return;
    }
    const r = arr[0] as Record<string, unknown>;
    const num = (key: string): number | null => {
      const v = field(r, key);
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    };
    const text = (key: string): string => `${field(r, key) ?? ""}`;
    setResult({
      id: Number(field(r, "id") ?? 0),
      cvUngVienId: Number(field(r, "cvUngVienId") ?? cvId),
      noiDungTrichXuat: text("noiDungTrichXuat"),
      kyNangTrichXuat: text("kyNangTrichXuat"),
      kinhNghiemTrichXuat: text("kinhNghiemTrichXuat"),
      hocVanTrichXuat: text("hocVanTrichXuat"),
      phanTich: text("phanTich"),
      diemTongQuan: num("diemTongQuan"),
      diemPhuHop: num("diemPhuHop"),
      matchingVersion: text("matchingVersion"),
      tinTuyenDungId: num("tinTuyenDungId"),
      nhanXet: text("nhanXet"),
      diemManh: text("diemManh"),
      diemYeu: text("diemYeu"),
      goiY: text("goiY"),
      danhGiaLuc: text("danhGiaLuc") || null,
      daDanhGiaBangAi: Boolean(field(r, "daDanhGiaBangAi")),
    });
  }, [authHeaders, cvId]);

  const loadJobs = useCallback(async () => {
    if (!Number.isFinite(cvId) || cvId <= 0) return;
    try {
      setJobsLoading(true);
      const headers = await authHeaders();
      const applied = await fetch(`/api/dotnet/donungtuyens?CVUngVienId=${cvId}&_start=0&_end=20`, { headers });
      const appliedBody = (await applied.json().catch(() => null)) as ApiResponse<unknown> | null;
      const appliedRows = applied.ok && appliedBody && ok(appliedBody) && Array.isArray(extractData(appliedBody))
        ? (extractData(appliedBody) as Record<string, unknown>[])
        : [];

      const seen = new Set<number>();
      const options: JobOption[] = [];
      for (const row of appliedRows) {
        const id = Number(field(row, "tinTuyenDungId") ?? 0);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        options.push({
          id,
          title: `${field(row, "tieuDe") ?? ""}` || `Tin #${id}`,
          company: `${field(row, "tenDoanhNghiep") ?? ""}`,
          score: null,
          source: "applied",
        });
      }

      if (options.length === 0) {
        // CV chưa ứng tuyển tin nào → dùng danh sách gợi ý (CV mặc định của ứng viên).
        const rec = await fetch("/api/dotnet/ketquaphuhops/recommendations?topN=10", { headers });
        const recBody = (await rec.json().catch(() => null)) as ApiResponse<unknown> | null;
        const recRows = rec.ok && recBody && ok(recBody) && Array.isArray(extractData(recBody))
          ? (extractData(recBody) as Record<string, unknown>[])
          : [];
        for (const row of recRows) {
          const id = Number(field(row, "tinTuyenDungId") ?? 0);
          if (!id || seen.has(id)) continue;
          seen.add(id);
          const score = field(row, "diemPhuHop");
          options.push({
            id,
            title: `${field(row, "tieuDe") ?? ""}` || `Tin #${id}`,
            company: `${field(row, "tenDoanhNghiep") ?? ""}`,
            score: typeof score === "number" ? score : null,
            source: "suggested",
          });
        }
      }

      setJobs(options);
    } catch {
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  }, [authHeaders, cvId]);

  const load = useCallback(async () => {
    if (!Number.isFinite(cvId) || cvId <= 0) {
      setErr("CV không hợp lệ.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErr("");
      await refreshReview();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [cvId, refreshReview]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    void loadJobs();
  }, [load, loadJobs]);

  // Chưa chọn tay → mặc định theo tin đã chấm lần trước, rồi deep link, rồi tin đầu danh sách.
  const defaultJobId = useMemo(() => {
    if (jobs.length === 0) return "";
    const preferred = deepLinkJobId ?? result?.tinTuyenDungId ?? jobs[0].id;
    return String((jobs.find((j) => j.id === preferred) ?? jobs[0]).id);
  }, [jobs, deepLinkJobId, result?.tinTuyenDungId]);
  const activeJobId = selectedJobId || defaultJobId;

  const handleAnalyze = async () => {
    const jobId = Number(activeJobId);
    if (!jobId) return;
    setAnalyzing(true);
    setAnalyzeMsg("");
    try {
      const res = await fetch(`${API}/danh-gia`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ cvUngVienId: cvId, tinTuyenDungId: jobId }),
      });
      const body = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;
      if (!res.ok || !body || !ok(body)) {
        throw new Error(body ? msg(body) : `HTTP ${res.status}`);
      }
      await refreshReview();
      setAnalyzeMsg(msg(body) || "Đã cập nhật đánh giá.");
    } catch (e) {
      setAnalyzeMsg(e instanceof Error ? e.message : "Không đánh giá được CV lúc này.");
    } finally {
      setAnalyzing(false);
    }
  };

  const hoanThanh =
    result != null && (result.phanTich === "HoanThanh" || result.phanTich === "1");
  const hasReview = result != null && result.diemTongQuan != null;
  const matchPercent = result?.diemPhuHop != null ? Math.round(result.diemPhuHop * 100) : null;
  const badge = matchPercent != null ? matchBadge(matchPercent) : null;
  const selectedJob = jobs.find((j) => String(j.id) === activeJobId) ?? null;
  // Kết quả đã lưu thuộc về tin nào, không phải tin đang chọn trong ô select.
  const reviewedJobId = result?.tinTuyenDungId ?? null;
  const reviewedJob =
    reviewedJobId != null ? jobs.find((j) => j.id === reviewedJobId) ?? null : null;
  const reviewIsForOtherJob =
    reviewedJobId != null && activeJobId !== "" && activeJobId !== String(reviewedJobId);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <Link
        href="/ho-so"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Về hồ sơ của tôi
      </Link>

      <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Phân tích CV bằng AI — CV #{cvId}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Đánh giá CV theo tin tuyển dụng
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Agent đọc CV và tin tuyển dụng bạn chọn, chấm điểm phù hợp bằng bộ chấm tất định
              rồi viết nhận xét mạnh–yếu. Kết quả được lưu để trợ lý Adam dùng lại.
            </p>
          </div>
          <span
            className={
              hoanThanh
                ? "shrink-0 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
                : "shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
            }
          >
            {hoanThanh ? "✨ Phân tích hoàn tất" : "⏳ Đang chờ phân tích"}
          </span>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tin tuyển dụng để chấm
            </label>
            {jobsLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">Đang tải danh sách tin…</p>
            ) : jobs.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Chưa có tin nào để chấm. Hãy ứng tuyển một tin hoặc xem{" "}
                <Link href="/viec-lam/phu-hop" className="underline">
                  việc làm phù hợp
                </Link>
                .
              </p>
            ) : (
              <Select
                value={activeJobId}
                onValueChange={(value) => {
                  if (value !== null) setSelectedJobId(value);
                }}
              >
                <SelectTrigger className="mt-2 h-10 w-full rounded-xl" disabled={analyzing}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={String(job.id)}>
                      {job.title}
                      {job.company ? ` — ${job.company}` : ""}
                      {job.source === "suggested" ? " (gợi ý)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={analyzing || !activeJobId || jobs.length === 0}
            className="shrink-0 rounded-xl"
          >
            {analyzing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
            {analyzing ? "AI đang đánh giá…" : "Đánh giá bằng AI"}
          </Button>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {analyzing
            ? "Agent đang đọc CV, tin tuyển dụng và tính điểm phù hợp — có thể mất 30–60 giây."
            : "Chạy theo yêu cầu, không tự chạy khi lưu CV. Mỗi lượt dùng 1 hạn mức trong ngày."}
        </p>
        {analyzeMsg && (
          <p className="mt-2 text-xs leading-5 text-foreground/80">{analyzeMsg}</p>
        )}
      </section>

      {loading ? (
        <AdminLoadingState />
      ) : (
        <div className="space-y-5">
          {!result && !err && (
            <AdminEmptyState
              icon={FileText}
              title="Chưa có kết quả đánh giá"
              description={
                selectedJob
                  ? `Chọn "Đánh giá bằng AI" để chấm CV #${cvId} với tin "${selectedJob.title}".`
                  : "Ứng tuyển một tin tuyển dụng rồi bấm “Đánh giá bằng AI”."
              }
              action={
                <Link href={`/tao-cv?cv=${cvId}`}>
                  <Button size="sm" variant="outline">Mở CV để lưu</Button>
                </Link>
              }
            />
          )}

          {result && !hoanThanh && (
            <p className="flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
              <CircleAlert className="size-4 shrink-0" />
              {result.phanTich === "DangPhanTich" || result.phanTich === "0"
                ? "Agent đang xử lý đánh giá — tải lại trang sau ít phút."
                : "Đánh giá chưa hoàn tất — hãy bấm “Đánh giá bằng AI” để chạy lại."}
            </p>
          )}

          {hasReview && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-gradient-to-br from-[#355C8C] to-[#26456c] p-5 text-white shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                    Điểm chất lượng CV
                  </p>
                  <p className="mt-2 flex items-end gap-1">
                    <span className="text-5xl font-semibold leading-none">{result.diemTongQuan}</span>
                    <span className="mb-1 text-sm text-white/70">/ 100</span>
                  </p>
                  <p className="mt-3 text-xs leading-5 text-white/75">
                    Do AI viết nhận xét, dựa trên nội dung CV thật của bạn.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Target className="size-3.5 text-primary" /> Mức phù hợp với tin
                  </p>
                  <p className="mt-2 flex items-center gap-3">
                    <span className="text-5xl font-semibold leading-none text-foreground">
                      {matchPercent != null ? `${matchPercent}%` : "—"}
                    </span>
                    {badge && (
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {reviewedJob
                      ? `${reviewedJob.title}${reviewedJob.company ? ` — ${reviewedJob.company}` : ""}`
                      : reviewedJobId
                        ? `Tin #${reviewedJobId}`
                        : "Chưa rõ tin tuyển dụng"}
                  </p>
                  {reviewIsForOtherJob && (
                    <p className="mt-2 text-[11px] leading-5 text-amber-700">
                      Ô chọn đang là tin khác — kết quả trên là của tin đã đánh giá. Bấm
                      “Đánh giá bằng AI” để chấm tin đang chọn.
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-muted-foreground/80">
                    {result.danhGiaLuc
                      ? `Đánh giá lúc ${new Date(result.danhGiaLuc).toLocaleString("vi-VN")}`
                      : "Chưa có thời điểm đánh giá"}
                    {result.matchingVersion ? ` • Bộ chấm ${result.matchingVersion}` : ""}
                  </p>
                </div>
              </div>

              {!result.daDanhGiaBangAi && (
                <p className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  <CircleAlert className="size-4 shrink-0" />
                  Đánh giá nhanh: AI chưa phản hồi kịp nên hệ thống dùng bộ chấm tất định để tạo
                  kết quả. Bấm “Đánh giá bằng AI” để thử lại nhận xét đầy đủ.
                </p>
              )}

              <CardShell icon={<Compass className="size-4 text-primary" />} title="Nhận xét của AI">
                {result.nhanXet ? (
                  <p className="text-sm leading-6 text-muted-foreground">{result.nhanXet}</p>
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Chưa có nhận xét — hãy chạy lại đánh giá bằng AI.
                  </p>
                )}
              </CardShell>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <CardShell icon={<CheckCircle2 className="size-4 text-teal-600" />} title="Điểm mạnh">
                  <BulletList text={result.diemManh} empty="Chưa có nhận xét điểm mạnh." />
                </CardShell>
                <CardShell icon={<Wrench className="size-4 text-amber-600" />} title="Điểm cần cải thiện">
                  <BulletList text={result.diemYeu} empty="Chưa có nhận xét điểm yếu." />
                </CardShell>
              </div>

              <CardShell icon={<Lightbulb className="size-4 text-primary" />} title="Gợi ý cải thiện">
                {lines(result.goiY).length === 0 ? (
                  <p className="text-sm leading-6 text-muted-foreground">Chưa có gợi ý.</p>
                ) : (
                  <ul className="space-y-2 text-sm leading-6">
                    {lines(result.goiY).map((line) => {
                      const [rawPart, ...rest] = line.split("|");
                      const part = SECTION_LABEL[rawPart.trim()] ?? SECTION_LABEL["tong-the"];
                      const viec = rest.join("|").trim() || rawPart.trim();
                      return (
                        <li key={line} className="flex flex-wrap items-start gap-2">
                          <span className="mt-0.5 shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {part}
                          </span>
                          <span className="text-muted-foreground">{viec}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardShell>
            </>
          )}

          {result && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-6">
                  <CardShell icon={<FileText className="size-4 text-primary" />} title="Tóm tắt hồ sơ">
                    <Paragraph text={result.noiDungTrichXuat} />
                  </CardShell>

                  <CardShell icon={<BookOpen className="size-4 text-primary" />} title="Học vấn trích xuất">
                    <Paragraph text={result.hocVanTrichXuat} />
                  </CardShell>
                </div>

                <div className="space-y-6">
                  <CardShell icon={<Wrench className="size-4 text-primary" />} title="Kỹ năng trích xuất">
                    <Paragraph text={result.kyNangTrichXuat} />
                  </CardShell>

                  <CardShell icon={<Briefcase className="size-4 text-primary" />} title="Kinh nghiệm trích xuất">
                    <Paragraph text={result.kinhNghiemTrichXuat} />
                  </CardShell>
                </div>
              </div>

              <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Compass className="size-5 text-[#355C8C]" />
                  </span>
                  <p className="text-sm leading-6 text-slate-600">
                    Dùng bản tóm tắt này để đối chiếu với yêu cầu tin tuyển dụng trước khi nộp đơn.
                  </p>
                </div>
                <Link
                  href="/viec-lam/phu-hop"
                  className="shrink-0 rounded-xl bg-[#355C8C] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#28466c]"
                >
                  Xem việc phù hợp ➔
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
