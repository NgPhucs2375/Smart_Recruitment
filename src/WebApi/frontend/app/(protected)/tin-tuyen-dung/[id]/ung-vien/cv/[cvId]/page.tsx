"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CircleAlert, FileText } from "lucide-react";
import {
  AdminPageLayout,
  AdminEmptyState,
  AdminLoadingState,
} from "@/components/admin/admin-page-layout";
import { CvPreview } from "@/components/cv/cv-preview";
import { defaultCvData } from "@/features/tao-cv/constants";
import { manualCvDetailToForm } from "@/features/tao-cv/manual";
import { cvApi } from "@/lib/api/cv-api";
import type { CvFormData } from "@/lib/types";

/**
 * HR xem CV của ứng viên đã nộp đơn vào tin mình phụ trách (read-only).
 * Backend giới hạn phạm vi: chỉ CV có đơn thuộc tin HR đăng / cùng DN.
 */
export default function HrXemCvPage() {
  const params = useParams<{ id: string; cvId: string }>();
  const tinId = Number(params.id);
  const cvId = Number(params.cvId);

  const [data, setData] = useState<CvFormData | null>(null);
  const [tenFile, setTenFile] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    if (!Number.isFinite(cvId) || cvId <= 0) {
      setLoadError("CV không hợp lệ.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError("");
      const detail = await cvApi.getById(cvId);
      const fresh = JSON.parse(JSON.stringify(defaultCvData)) as CvFormData;
      const form = manualCvDetailToForm(detail, fresh);
      setData(form);
      setTenFile(detail.tenFile || `CV #${cvId}`);
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Không tải được CV (có thể bạn không có quyền xem).",
      );
    } finally {
      setLoading(false);
    }
  }, [cvId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <AdminPageLayout>
      <Link
        href={`/tin-tuyen-dung/${tinId}/ung-vien`}
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
              <FileText className="size-3.5 text-primary" /> CV ứng viên (chỉ xem)
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {tenFile}
            </h1>
            {data.thongTinLienHe.hoTen && (
              <p className="mt-1 text-sm text-muted-foreground">{data.thongTinLienHe.hoTen}</p>
            )}
          </div>
          <div className="cv-preview-frame">
            <CvPreview data={data} />
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
