"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Eye, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { getValidToken, refreshSession } from "@/lib/auth-provider";

type ApiResponse<T> = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: T;
  data?: T;
};

type JobOption = {
  id: number;
  title: string;
  status: string;
  deadline: string;
  location: string;
};

type SuggestedCandidate = {
  hoSoUngVienId: number;
  cvUngVienId: number;
  hoTen: string;
  viTriUngTuyen: string;
  diemPhuHop: number;
  phanLoai: string;
  kyNangThoa: string[];
  kyNangThieu: string[];
  kyNangBatBuocThieu: string[];
  soNamKinhNghiem: number;
  lyDoGoiY?: string;
};

function responseMessage(body: ApiResponse<unknown> | null, fallback: string) {
  return body?.Message ?? body?.message ?? fallback;
}

function responseData<T>(body: ApiResponse<T>) {
  return body.Data ?? body.data;
}

function responseOk(body: ApiResponse<unknown>) {
  return body.Succeeded ?? body.succeeded ?? true;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function asString(value: unknown) {
  return `${value ?? ""}`.trim();
}

function asNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(asString).filter(Boolean) : [];
}

function parseRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const data = asRecord(value);
  return Array.isArray(data.items) ? data.items : Array.isArray(data.Items) ? data.Items : [];
}

function isOpenJob(deadline: string) {
  if (!deadline) return true;
  const timestamp = new Date(deadline).getTime();
  return Number.isNaN(timestamp) || timestamp > Date.now();
}

function formatDate(value: string) {
  if (!value) return "Không giới hạn";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
}

function scorePercent(score: number) {
  return Math.round(score <= 1 ? score * 100 : score);
}

async function authorizedFetch(url: string, signal?: AbortSignal) {
  let token = await getValidToken();
  const send = () => fetch(url, {
    cache: "no-store",
    signal,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let response = await send();
  if (response.status === 401 && await refreshSession()) {
    token = await getValidToken();
    response = await send();
  }

  const body = await response.json().catch(() => null) as ApiResponse<unknown> | null;
  if (!response.ok) {
    const error = new Error(responseMessage(body, `HTTP ${response.status}`)) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  if (body && !responseOk(body)) throw new Error(responseMessage(body, "Không tải được dữ liệu."));
  return body;
}

function normalizeJob(value: unknown): JobOption | null {
  const row = asRecord(value);
  const id = asNumber(row.id ?? row.Id);
  const deadline = asString(row.ngayHetHan ?? row.NgayHetHan);
  if (!id) return null;
  return {
    id,
    title: asString(row.tieuDe ?? row.TieuDe) || `Tin tuyển dụng #${id}`,
    status: asString(row.trangThai ?? row.TrangThai),
    deadline,
    location: asString(row.diaDiemLamViec ?? row.DiaDiemLamViec),
  };
}

function normalizeCandidate(value: unknown): SuggestedCandidate | null {
  const row = asRecord(value);
  const profileId = asNumber(row.hoSoUngVienId ?? row.HoSoUngVienId);
  if (!profileId) return null;
  return {
    hoSoUngVienId: profileId,
    cvUngVienId: asNumber(row.cvUngVienId ?? row.CvUngVienId ?? row.CVUngVienId),
    hoTen: asString(row.hoTen ?? row.HoTen) || "Ứng viên",
    viTriUngTuyen: asString(row.viTriUngTuyen ?? row.ViTriUngTuyen) || "Chưa cập nhật vị trí",
    diemPhuHop: asNumber(row.diemPhuHop ?? row.DiemPhuHop),
    phanLoai: asString(row.phanLoai ?? row.PhanLoai),
    kyNangThoa: asStringArray(row.kyNangThoa ?? row.KyNangThoa),
    kyNangThieu: asStringArray(row.kyNangThieu ?? row.KyNangThieu),
    kyNangBatBuocThieu: asStringArray(row.kyNangBatBuocThieu ?? row.KyNangBatBuocThieu),
    soNamKinhNghiem: asNumber(row.soNamKinhNghiem ?? row.SoNamKinhNghiem),
    lyDoGoiY: asString(row.lyDoGoiY ?? row.LyDoGoiY),
  };
}

export function SuggestedCandidatesPanel({
  initialJobId = "",
  onJobChange,
}: {
  initialJobId?: string;
  onJobChange?: (jobId: string) => void;
}) {
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [candidates, setCandidates] = useState<SuggestedCandidate[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState("");

  const loadJobs = useCallback(async (signal: AbortSignal) => {
    try {
      setLoadingJobs(true);
      setError("");
      const response = await authorizedFetch("/api/dotnet/tintuyendungs?_start=0&_end=100&TrangThai=3", signal) as ApiResponse<unknown>;
      const activeJobs = parseRows(responseData(response))
        .map(normalizeJob)
        .filter((job): job is JobOption => Boolean(job && isOpenJob(job.deadline)));
      if (signal.aborted) return;
      setJobs(activeJobs);
    } catch (reason) {
      if (signal.aborted) return;
      setJobs([]);
      setError(reason instanceof Error ? reason.message : "Không tải được danh sách tin tuyển dụng.");
    } finally {
      if (!signal.aborted) setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadJobs(controller.signal);
    return () => controller.abort();
  }, [loadJobs]);

  useEffect(() => {
    setSelectedJobId(initialJobId);
  }, [initialJobId]);

  useEffect(() => {
    if (!selectedJobId) {
      setCandidates([]);
      setLoadingCandidates(false);
      return;
    }

    const controller = new AbortController();
    const loadCandidates = async () => {
      try {
        setCandidates([]);
        setLoadingCandidates(true);
        setError("");
        const response = await authorizedFetch(
          `/api/dotnet/ketquaphuhops/candidates?tinTuyenDungId=${encodeURIComponent(selectedJobId)}&topN=20`,
          controller.signal,
        ) as ApiResponse<unknown>;
        if (controller.signal.aborted) return;
        setCandidates(parseRows(responseData(response)).map(normalizeCandidate).filter((candidate): candidate is SuggestedCandidate => Boolean(candidate)));
      } catch (reason) {
        if (controller.signal.aborted) return;
        setCandidates([]);
        setError(reason instanceof Error ? reason.message : "Không tải được ứng viên gợi ý.");
      } finally {
        if (!controller.signal.aborted) setLoadingCandidates(false);
      }
    };

    void loadCandidates();
    return () => controller.abort();
  }, [selectedJobId]);

  const selectedJob = jobs.find((job) => String(job.id) === selectedJobId);

  return (
    <div className="space-y-4">
      <AdminCard>
        <AdminCardHeader
          title="Ứng viên gợi ý"
          description="Chọn một tin tuyển dụng để xem kết quả matching từ hồ sơ ứng viên."
          action={<Sparkles className="size-5 text-primary" aria-hidden="true" />}
        />
        <div className="p-5">
          <label htmlFor="suggested-candidate-job" className="text-sm font-medium text-foreground">
            Ứng viên phù hợp với
          </label>
          {loadingJobs ? (
            <div className="mt-2 h-10 animate-pulse rounded-lg bg-muted" aria-label="Đang tải tin tuyển dụng" />
          ) : jobs.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Bạn chưa có tin tuyển dụng đang mở để tìm ứng viên phù hợp.</p>
          ) : (
            <Select value={selectedJobId} onValueChange={(value) => {
              const nextJobId = value ?? "";
              setSelectedJobId(nextJobId);
              onJobChange?.(nextJobId);
            }}>
              <SelectTrigger id="suggested-candidate-job" className="mt-2 w-full sm:max-w-xl">
                <SelectValue placeholder="Chọn tin tuyển dụng" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={String(job.id)}>
                    {job.title} · Hạn {formatDate(job.deadline)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedJob && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BriefcaseBusiness className="size-3.5" /> {selectedJob.location || "Địa điểm linh hoạt"}
            </p>
          )}
        </div>
      </AdminCard>

      {error ? (
        <AdminCard>
          <AdminEmptyState icon={Target} title="Không tải được ứng viên gợi ý" description={error} />
        </AdminCard>
      ) : !loadingJobs && jobs.length === 0 ? (
        <AdminCard>
          <AdminEmptyState icon={BriefcaseBusiness} title="Chưa có tin tuyển dụng đang mở" description="Bạn chưa có tin tuyển dụng đang mở để tìm ứng viên phù hợp." />
        </AdminCard>
      ) : !selectedJobId ? (
        <AdminCard>
          <AdminEmptyState icon={Target} title="Chưa chọn tin tuyển dụng" description="Chọn một tin tuyển dụng để xem các ứng viên phù hợp." />
        </AdminCard>
      ) : loadingCandidates ? (
        <AdminCard><AdminLoadingState /></AdminCard>
      ) : candidates.length === 0 ? (
        <AdminCard>
          <AdminEmptyState icon={Target} title="Chưa tìm thấy ứng viên phù hợp với tin tuyển dụng này" description="Hãy thử lại sau khi có thêm hồ sơ ứng viên hoặc cập nhật yêu cầu tuyển dụng." />
        </AdminCard>
      ) : (
        <AdminCard>
          <AdminCardHeader title={`${candidates.length} ứng viên được gợi ý`} description={`Kết quả cho ${selectedJob?.title ?? "tin tuyển dụng đã chọn"}`} />
          <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
            {candidates.map((candidate) => {
              const score = scorePercent(candidate.diemPhuHop);
              return (
                <article key={candidate.hoSoUngVienId} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {candidate.hoTen.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-foreground">{candidate.hoTen}</h3>
                          <p className="mt-0.5 text-sm text-muted-foreground">{candidate.viTriUngTuyen}</p>
                        </div>
                        <Badge className="shrink-0 border-0 bg-primary/10 text-primary">{score}% phù hợp</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {candidate.soNamKinhNghiem > 0 ? `${candidate.soNamKinhNghiem} năm kinh nghiệm` : "Chưa có dữ liệu kinh nghiệm"}
                        {candidate.phanLoai ? ` · ${candidate.phanLoai}` : ""}
                      </p>
                      {candidate.lyDoGoiY && (
                        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" /> {candidate.lyDoGoiY}
                        </p>
                      )}
                    </div>
                  </div>
                  {candidate.kyNangThoa.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-foreground">Kỹ năng phù hợp</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {candidate.kyNangThoa.map((skill) => <Badge key={skill} variant="outline" className="border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300">{skill}</Badge>)}
                      </div>
                    </div>
                  )}
                  {candidate.kyNangThieu.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-foreground">
                        {candidate.kyNangBatBuocThieu.length > 0
                          ? `Chưa đạt ${candidate.kyNangBatBuocThieu.length} kỹ năng bắt buộc`
                          : "Có thể cần bổ sung"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {candidate.kyNangThieu.map((skill) => <Badge key={skill} variant="outline" className={candidate.kyNangBatBuocThieu.includes(skill) ? "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300" : "border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300"}>{skill}</Badge>)}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex justify-end border-t border-border pt-3">
                    <Link
                      href={`/tin-tuyen-dung/${selectedJobId}/ung-vien/cv/${candidate.cvUngVienId}?source=suggested&returnTo=${encodeURIComponent(`/ung-vien?view=suggested&suggestedJobId=${selectedJobId}`)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <Eye className="size-3.5" /> Xem CV
                    </Link>
                  </div>
                  <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                    Kết quả này chỉ là gợi ý matching. Chưa tạo hoặc thay đổi đơn ứng tuyển của ứng viên.
                  </p>
                </article>
              );
            })}
          </div>
        </AdminCard>
      )}
    </div>
  );
}
