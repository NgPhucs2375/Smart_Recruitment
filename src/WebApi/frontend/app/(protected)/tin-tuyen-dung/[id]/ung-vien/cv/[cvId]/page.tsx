"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCheck,
  CircleAlert,
  FileText,
  History,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AdminPageLayout,
  AdminEmptyState,
  AdminLoadingState,
} from "@/components/admin/admin-page-layout";
import { CvPreview } from "@/components/cv/cv-preview";
import StatusHistoryTimeline from "@/features/ung-tuyen/status-history-timeline";
import { defaultCvData } from "@/features/tao-cv/constants";
import { manualCvDetailToForm } from "@/features/tao-cv/manual";
import { cvApi, normalizeCvDetail } from "@/lib/api/cv-api";
import { getValidToken } from "@/lib/auth-provider";
import { sanitizeNext } from "@/lib/portal-roles";
import type { CvFormData } from "@/lib/types";

type ApplicationResponse = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

const APPLICATION_STATUS = { ChoXuLy: 2, DaXem: 3, PhuHop: 5 } as const;

function normalizeApplicationStatus(value: unknown): number | null {
  if (typeof value === "number") return value;
  const normalized = `${value ?? ""}`.toLowerCase().replace(/[\s_-]/g, "");
  return normalized === "choxuly"
    ? APPLICATION_STATUS.ChoXuLy
    : normalized === "daxem"
      ? APPLICATION_STATUS.DaXem
      : normalized === "phuhop"
        ? APPLICATION_STATUS.PhuHop
        : null;
}

/**
 * HR xem CV của ứng viên đã nộp đơn vào tin mình phụ trách (read-only).
 * Backend giới hạn phạm vi: chỉ CV có đơn thuộc tin HR đăng / cùng DN.
 */
export default function HrXemCvPage() {
  const params = useParams<{ id: string; cvId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tinId = Number(params.id);
  const cvId = Number(params.cvId);
  const donId = Number(searchParams.get("donId"));
  const requestedReturnTo = searchParams.get("returnTo");
  const returnTo =
    sanitizeNext(requestedReturnTo) ?? `/tin-tuyen-dung/${tinId}/ung-vien`;

  const [data, setData] = useState<CvFormData | null>(null);
  const [tenFile, setTenFile] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [approving, setApproving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [applicationStatus, setApplicationStatus] = useState<number | null>(
    null,
  );

  const markApplicationViewed = useCallback(async (): Promise<
    number | null
  > => {
    if (!Number.isFinite(donId) || donId <= 0) return null;

    const token = await getValidToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const detailResponse = await fetch(
      `/api/dotnet/donungtuyens/show/${donId}`,
      {
        cache: "no-store",
        headers,
      },
    );
    const detail = (await detailResponse
      .json()
      .catch(() => null)) as ApplicationResponse | null;
    if (
      !detailResponse.ok ||
      !(detail?.Succeeded ?? detail?.succeeded ?? detailResponse.ok)
    ) {
      throw new Error(
        detail?.Message ??
          detail?.message ??
          "Không đọc được trạng thái đơn ứng tuyển.",
      );
    }

    const safeDetail = detail ?? {};
    const application = safeDetail.Data ?? safeDetail.data ?? {};
    const status = normalizeApplicationStatus(
      application.trangThai ?? application.TrangThai,
    );
    if (status !== APPLICATION_STATUS.ChoXuLy) return status;

    const updateResponse = await fetch(`/api/dotnet/donungtuyens/${donId}`, {
      method: "PUT",
      cache: "no-store",
      headers,
      body: JSON.stringify({ id: donId, trigger: 5, ghiChu: "" }),
    });
    const update = (await updateResponse
      .json()
      .catch(() => null)) as ApplicationResponse | null;
    if (
      !updateResponse.ok ||
      !(update?.Succeeded ?? update?.succeeded ?? updateResponse.ok)
    ) {
      throw new Error(
        update?.Message ??
          update?.message ??
          "Không thể ghi nhận đã xem hồ sơ.",
      );
    }
    return APPLICATION_STATUS.DaXem;
  }, [donId]);

  async function approveApplication() {
    if (!Number.isFinite(donId) || donId <= 0 || approving) return;

    const token = await getValidToken();
    try {
      setApproving(true);
      setActionError("");
      // Duyệt chỉ hợp lệ sau khi đơn đã đi qua trạng thái Đã xem.
      await markApplicationViewed();
      const response = await fetch(`/api/dotnet/donungtuyens/${donId}`, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: donId, trigger: 6, ghiChu: "" }),
      });
      const body = (await response.json().catch(() => null)) as {
        Succeeded?: boolean;
        succeeded?: boolean;
        Message?: string;
        message?: string;
      } | null;
      const succeeded = body?.Succeeded ?? body?.succeeded ?? response.ok;
      if (!response.ok || !succeeded) {
        throw new Error(
          body?.Message ?? body?.message ?? "Không thể duyệt đơn ứng tuyển.",
        );
      }
      router.push(returnTo);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Không thể duyệt đơn ứng tuyển.",
      );
    } finally {
      setApproving(false);
    }
  }

  const load = useCallback(async () => {
    if (!Number.isFinite(cvId) || cvId <= 0) {
      setLoadError("CV không hợp lệ.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError("");
      // Bảo đảm mọi đường dẫn mở CV đều ghi nhận XemDon trên server.
      const status = await markApplicationViewed();
      setApplicationStatus(status);
      let submitted: unknown;
      if (donId > 0) {
        const token = await getValidToken();
        const response = await fetch(`/api/dotnet/donungtuyens/show/${donId}`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
          cache: "no-store",
        });
        const body = await response.json();
        if (!response.ok || !(body.Succeeded ?? body.succeeded))
          throw new Error(
            body.Message ?? body.message ?? "Không đọc được hồ sơ đã nộp.",
          );
        const application = body.Data ?? body.data;
        if (
          Number(application.CVUngVienId ?? application.cvUngVienId) !== cvId ||
          Number(application.TinTuyenDungId ?? application.tinTuyenDungId) !==
            tinId
        )
          throw new Error("CV không khớp với đơn ứng tuyển.");
        submitted = application.CvDaNop ?? application.cvDaNop;
      }
      const detail = submitted
        ? normalizeCvDetail(submitted)
        : await cvApi.getById(cvId, tinId);
      const fresh = JSON.parse(JSON.stringify(defaultCvData)) as CvFormData;
      const form = manualCvDetailToForm(detail, fresh);
      setData(form);
      setTenFile(detail.tenFile || `CV #${cvId}`);
    } catch (e) {
      setLoadError(
        e instanceof Error
          ? e.message
          : "Không tải được CV (có thể bạn không có quyền xem).",
      );
    } finally {
      setLoading(false);
    }
  }, [cvId, donId, tinId, markApplicationViewed]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <AdminPageLayout>
      <Link
        href={returnTo}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Về danh sách ứng viên
      </Link>

      {loading ? (
        <AdminLoadingState />
      ) : loadError || !data ? (
        <AdminEmptyState
          icon={CircleAlert}
          title="Không xem được CV"
          description={loadError || "CV không tồn tại."}
        />
      ) : (
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
            <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="size-3.5 text-primary" /> CV ứng viên (chỉ
              xem)
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {tenFile}
                </h1>
                {data.thongTinLienHe.hoTen && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.thongTinLienHe.hoTen}
                  </p>
                )}
              </div>
              {applicationStatus === APPLICATION_STATUS.DaXem && (
                <Button
                  onClick={() => void approveApplication()}
                  disabled={approving}
                  className="shrink-0"
                >
                  {approving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCheck className="size-4" />
                  )}
                  {approving ? "Đang duyệt..." : "Duyệt phù hợp"}
                </Button>
              )}
              {applicationStatus === APPLICATION_STATUS.PhuHop && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  <CheckCheck className="size-4" /> Đã duyệt phù hợp
                </span>
              )}
            </div>
            {actionError && (
              <p className="mt-3 text-sm text-destructive">{actionError}</p>
            )}
          </div>
          {Number.isFinite(donId) && donId > 0 && (
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
              <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <History className="size-3.5 text-primary" /> Lịch sử xử lý đơn #
                {donId}
              </p>
              <div className="mt-4">
                <StatusHistoryTimeline
                  key={`${donId}-${applicationStatus ?? "na"}`}
                  donId={donId}
                />
              </div>
            </div>
          )}
          <div className="cv-preview-frame">
            <CvPreview data={data} />
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
