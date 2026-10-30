"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  CircleAlert,
  Compass,
  FileText,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
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
      {text.split(/\n+/).filter((line) => line.trim()).map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
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
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
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
              Trích xuất & tóm tắt CV
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Kết quả được tự động cập nhật mỗi lần bạn lưu CV. Dùng để kiểm tra nhanh
              kỹ năng, kinh nghiệm và học vấn trước khi ứng tuyển.
            </p>
          </div>
          <span
            className={
              hoanThanh
                ? "shrink-0 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
                : "shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
            }
          >
            {hoanThanh ? "✨ Phân tích hoàn tất • AI Model v2" : "⏳ Đang chờ phân tích"}
          </span>
        </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      )}
    </main>
  );
}
