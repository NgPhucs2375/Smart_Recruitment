"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  CircleAlert,
  FileText,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AdminPageLayout,
  AdminCard,
  AdminEmptyState,
  AdminLoadingState,
} from "@/components/admin/admin-page-layout";

type PhanTichCv = {
  id: number;
  cvUngVienId: number;
  noiDungTrichXuat: string;
  kyNangTrichXuat: string;
  kinhNghiemTrichXuat: string;
  hocVanTrichXuat: string;
  phanTich: string;
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

function Section({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  if (!body.trim()) return null;
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">{body}</p>
    </section>
  );
}

export default function CvPhanTichPage() {
  const params = useParams<{ cvId: string }>();
  const cvId = Number(params.cvId);

  const [result, setResult] = useState<PhanTichCv | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!Number.isFinite(cvId) || cvId <= 0) {
      setErr("CV không hợp lệ.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErr("");
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}?CVUngVienId=${cvId}&_start=0&_end=1`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
      setResult({
        id: Number(r.id ?? r.Id ?? 0),
        cvUngVienId: Number(r.cvUngVienId ?? r.CVUngVienId ?? cvId),
        noiDungTrichXuat: `${r.noiDungTrichXuat ?? r.NoiDungTrichXuat ?? ""}`,
        kyNangTrichXuat: `${r.kyNangTrichXuat ?? r.KyNangTrichXuat ?? ""}`,
        kinhNghiemTrichXuat: `${r.kinhNghiemTrichXuat ?? r.KinhNghiemTrichXuat ?? ""}`,
        hocVanTrichXuat: `${r.hocVanTrichXuat ?? r.HocVanTrichXuat ?? ""}`,
        phanTich: `${r.phanTich ?? r.PhanTich ?? ""}`,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [cvId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const hoanThanh =
    result != null && (result.phanTich === "HoanThanh" || result.phanTich === "1");

  return (
    <AdminPageLayout>
      <Link
        href="/ho-so"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Về hồ sơ của tôi
      </Link>

      <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" /> Phân tích CV bằng AI — CV #{cvId}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Trích xuất & tóm tắt CV
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Kết quả được tự động cập nhật mỗi lần bạn lưu CV. Dùng để kiểm tra nhanh
          kỹ năng, kinh nghiệm và học vấn trước khi ứng tuyển.
        </p>
      </div>

      {err && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      )}

      {loading ? (
        <AdminLoadingState />
      ) : !result ? (
        !err && (
          <AdminEmptyState
            icon={FileText}
            title="Chưa có kết quả phân tích"
            description="Lưu CV một lần để hệ thống trích xuất và phân tích nội dung."
            action={
              <Link href={`/tao-cv?cv=${cvId}`}>
                <Button size="sm">Mở CV để lưu</Button>
              </Link>
            }
          />
        )
      ) : (
        <div className="space-y-5">
          {!hoanThanh && (
            <p className="flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
              <CircleAlert className="size-4 shrink-0" />
              Phân tích chưa hoàn tất — hãy lưu lại CV để làm mới kết quả.
            </p>
          )}
          <Section
            icon={<FileText className="size-4 text-primary" />}
            title="Tóm tắt"
            body={result.noiDungTrichXuat}
          />
          <Section
            icon={<Wrench className="size-4 text-primary" />}
            title="Kỹ năng trích xuất"
            body={result.kyNangTrichXuat}
          />
          <Section
            icon={<Briefcase className="size-4 text-primary" />}
            title="Kinh nghiệm trích xuất"
            body={result.kinhNghiemTrichXuat}
          />
          <Section
            icon={<BookOpen className="size-4 text-primary" />}
            title="Học vấn trích xuất"
            body={result.hocVanTrichXuat}
          />
          <AdminCard>
            <div className="flex items-center gap-3 p-5">
              <Award className="size-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Dùng bản tóm tắt này để đối chiếu với yêu cầu tin tuyển dụng trước khi nộp đơn.
              </p>
              <Link href="/viec-lam/phu-hop" className="ml-auto shrink-0 text-xs font-semibold text-primary hover:underline">
                Việc phù hợp
              </Link>
            </div>
          </AdminCard>
        </div>
      )}
    </AdminPageLayout>
  );
}
