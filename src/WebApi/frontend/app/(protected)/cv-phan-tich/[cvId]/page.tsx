"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CircleAlert,
  Compass,
  FileText,
  GraduationCap,
  Sparkles,
  UserCheck,
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

const MOCK_PROFILE = {
  hoTen: "Vũ Thiên Trường",
  chucDanh: "Software Engineer / Backend Developer",
  bio: "Kỹ sư phần mềm định hướng phát triển Backend với nền tảng vững chắc về Java Spring Boot, C# .NET và kiến trúc hệ thống phân tán. Có kinh nghiệm xây dựng các dịch vụ RESTful API, tối ưu hóa cơ sở dữ liệu và tích hợp giải pháp AI Agent.",
  hocVan: {
    truong: "Trường Đại học Công Thương TP.HCM (HUIT)",
    chuyenNganh: "Công nghệ phần mềm / Công nghệ thông tin",
    nienKhoa: "2022 – 2026",
    trangThai: "Sinh viên năm 4 (Tốt nghiệp loại Khá - Giỏi)",
  },
  kyNang: [
    { nhom: "Backend & Ngôn ngữ", items: ["Java", "Spring Boot", "C#", ".NET WebApi", "Python"] },
    { nhom: "Hệ thống & Database", items: ["Docker", "SQL Server", "PostgreSQL", "Redis"] },
    { nhom: "Frontend & Mobile", items: ["Next.js", "React Native", "Tailwind CSS"] },
    { nhom: "Khác", items: ["RESTful API", "Git", "AI Integration"] },
  ],
  ats: "92/100",
  doChiTiet: "Rất tốt",
  khuyenNghi: "Hồ sơ có cấu trúc công nghệ rõ ràng, từ khóa kỹ thuật khớp tốt với các vị trí Backend / Software Engineer.",
  viecPhuHop: 12,
};

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
          <span className="shrink-0 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
            ✨ Phân tích hoàn tất • AI Model v2
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

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-6">
              <CardShell icon={<UserCheck className="size-4 text-primary" />} title="Tóm tắt hồ sơ">
                <p className="text-lg font-bold text-foreground">{MOCK_PROFILE.hoTen}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{MOCK_PROFILE.chucDanh}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{MOCK_PROFILE.bio}</p>
              </CardShell>

              <CardShell icon={<GraduationCap className="size-4 text-primary" />} title="Học vấn & trình độ">
                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-muted-foreground">Cơ sở đào tạo</span>
                    <span className="font-medium text-foreground">{MOCK_PROFILE.hocVan.truong}</span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-muted-foreground">Chuyên ngành</span>
                    <span className="font-medium text-foreground">{MOCK_PROFILE.hocVan.chuyenNganh}</span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-muted-foreground">Niên khóa</span>
                    <span className="font-medium text-foreground">{MOCK_PROFILE.hocVan.nienKhoa}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-muted-foreground">Trạng thái</span>
                    <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                      {MOCK_PROFILE.hocVan.trangThai}
                    </span>
                  </div>
                </div>
              </CardShell>
            </div>

            <div className="md:col-span-5 space-y-6">
              <CardShell icon={<Wrench className="size-4 text-primary" />} title="Kỹ năng trích xuất">
                <div className="space-y-3">
                  {MOCK_PROFILE.kyNang.map((nhom) => (
                    <div key={nhom.nhom}>
                      <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{nhom.nhom}</p>
                      {nhom.items.map((skill) => (
                        <span
                          key={skill}
                          className="mr-1.5 mb-1.5 inline-block rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-accent"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </CardShell>

              <CardShell icon={<BarChart3 className="size-4 text-primary" />} title="Chỉ số đánh giá CV">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Điểm chuẩn ATS</span>
                    <span className="text-2xl font-extrabold tabular-nums text-primary">{MOCK_PROFILE.ats}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Độ chi tiết thông tin</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {MOCK_PROFILE.doChiTiet}
                    </span>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Khuyến nghị AI</p>
                    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{MOCK_PROFILE.khuyenNghi}</p>
                  </div>
                </div>
              </CardShell>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted shadow-sm">
                <Compass className="size-5 text-primary" />
              </span>
              <p className="text-sm leading-6 text-muted-foreground">
                Hệ thống đã tìm thấy <span className="font-semibold text-primary">{MOCK_PROFILE.viecPhuHop} việc làm</span> phù hợp cao với hồ sơ trích xuất này.
              </p>
            </div>
            <Link
              href="/viec-lam/phu-hop"
              className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Xem {MOCK_PROFILE.viecPhuHop} việc phù hợp ➔
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
