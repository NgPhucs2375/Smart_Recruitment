"use client";

import Link from "next/link";
import { 
  FileText, 
  Eye, 
  Send, 
  Bookmark, 
  ArrowUpRight, 
  Sparkles, 
  Building2, 
  Calendar, 
  Clock, 
  ChevronRight,
  TrendingUp
} from "lucide-react";

export default function CandidateDashboardPage() {
  // Dữ liệu mẫu (sau này bind từ api/donungtuyens, api/hosoungviens)
  const stats = [
    { label: "CV đã tạo", value: "2", icon: FileText, sub: "1 CV mặc định" },
    { label: "Nhà tuyển dụng xem hồ sơ", value: "18", icon: Eye, sub: "+4 tuần này", highlight: true },
    { label: "Việc đã ứng tuyển", value: "6", icon: Send, sub: "1 phỏng vấn mới" },
    { label: "Việc làm đã lưu", value: "12", icon: Bookmark, sub: "3 tin sắp hết hạn" },
  ];

  const recentApplications = [
    {
      company: "Nexora SaaS",
      role: "Senior Frontend Engineer",
      appliedAt: "2 ngày trước",
      status: "Đã xem hồ sơ",
      statusColor: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      company: "Cloudly",
      role: "Cloud & DevOps Engineer",
      appliedAt: "5 ngày trước",
      status: "Mời phỏng vấn",
      statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      company: "DataNest",
      role: "Machine Learning Engineer",
      appliedAt: "1 tuần trước",
      status: "Đang xét duyệt",
      statusColor: "text-zinc-600 bg-zinc-100 border-zinc-200",
    },
  ];

  const suggestedJobs = [
    {
      company: "PixelForge",
      role: "Lead Full-stack Developer",
      salary: "$2,000 - $3,000",
      location: "Hà Nội / Hybrid",
      matchRate: "95%",
    },
    {
      company: "KMS Tech",
      role: "Software Architect (C# / React)",
      salary: "Thỏa thuận",
      location: "TP. Hồ Chí Minh",
      matchRate: "90%",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f3] px-6 py-10 text-[#151515] sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header chào mừng & profile tóm tắt */}
        <div className="flex flex-col justify-between gap-6 rounded-3xl border border-[#151515]/10 bg-white p-8 shadow-sm md:flex-row md:items-center">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#65756d]">Candidate Hub</span>
            <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
              Chào mừng trở lại, Andreas!
            </h1>
            <p className="mt-2 text-sm text-[#65756d]">
              Hồ sơ của bạn đang ở trạng thái <span className="font-medium text-emerald-600">Sẵn sàng nhận việc</span>. AI Matching đạt độ chuẩn xác 92%.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/CV"
              className="flex items-center gap-2 rounded-2xl bg-[#151515] px-5 py-3 text-sm font-medium text-white transition hover:bg-black"
            >
              <FileText className="size-4" /> Quản lý CV / Tạo mới
            </Link>
            <Link
              href="/jobs"
              className="flex items-center gap-2 rounded-2xl border border-[#151515]/15 bg-[#f5f5f3] px-5 py-3 text-sm font-medium text-[#151515] transition hover:border-[#151515]/40"
            >
              Tìm việc ngay <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* 4 thẻ chỉ số nhanh */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group rounded-3xl border border-[#151515]/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#151515]/30"
              >
                <div className="flex items-center justify-between text-[#65756d]">
                  <span className="text-xs uppercase tracking-wider">{stat.label}</span>
                  <Icon className="size-5" />
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight">{stat.value}</span>
                </div>
                <p className="mt-2 text-xs text-[#65756d]">{stat.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Layout 2 cột: Đơn nộp gần đây vs Gợi ý việc làm & Điểm AI */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          {/* Cột trái: Đơn ứng tuyển gần đây */}
          <div className="rounded-3xl border border-[#151515]/10 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-[#151515]/10 pb-5">
              <div>
                <h2 className="text-xl font-medium tracking-tight">Đơn ứng tuyển gần đây</h2>
                <p className="mt-1 text-xs text-[#65756d]">Theo dõi tiến độ duyệt hồ sơ và lịch phỏng vấn</p>
              </div>
              <Link
                href="/dashboard/applications"
                className="text-xs font-medium text-[#151515] underline underline-offset-4 hover:opacity-70"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="mt-6 divide-y divide-[#151515]/10">
              {recentApplications.map((app) => (
                <div key={app.role} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-medium">{app.role}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#65756d]">
                      <span className="flex items-center gap-1"><Building2 className="size-3.5" /> {app.company}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3.5" /> {app.appliedAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${app.statusColor}`}>
                      {app.status}
                    </span>
                    <button className="rounded-full p-2 text-[#65756d] transition hover:bg-[#f5f5f3] hover:text-[#151515]">
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: AI Matching & Đề xuất công việc */}
          <div className="space-y-6">
            {/* Box AI Matching */}
            <div className="rounded-3xl border border-white/20 bg-[#151515] p-6 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/60">
                  <Sparkles className="size-3.5 text-white" /> AI Smart Match
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px]">Cập nhật hôm nay</span>
              </div>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-5xl font-semibold tracking-tighter">92%</span>
                <span className="text-xs text-white/65">Độ khớp CV hiện tại với thị trường Full-stack</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/60">
                Bổ sung các chứng chỉ về AWS / CI-CD pipeline để nâng điểm cạnh tranh lên mức 98%.
              </p>
              <Link
                href="/CV"
                className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-xs font-medium text-[#151515] transition hover:bg-white/90"
              >
                Cập nhật CV ngay
              </Link>
            </div>

            {/* Việc làm đề xuất */}
            <div className="rounded-3xl border border-[#151515]/10 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium tracking-tight">Việc làm phù hợp</h3>
                <Link href="/jobs" className="text-xs text-[#65756d] hover:text-[#151515]">
                  Xem thêm
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {suggestedJobs.map((job) => (
                  <div
                    key={job.role}
                    className="group rounded-2xl border border-[#151515]/10 bg-[#f5f5f3] p-4 transition hover:border-[#151515]/40"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium">{job.role}</h4>
                        <p className="mt-1 text-xs text-[#65756d]">{job.company} · {job.location}</p>
                      </div>
                      <span className="rounded-md bg-[#151515] px-2 py-0.5 font-mono text-[10px] text-white">
                        {job.matchRate} Match
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-[#151515]/10 pt-2 text-xs">
                      <span className="font-medium text-emerald-600">{job.salary}</span>
                      <span className="flex items-center gap-1 text-[#65756d] group-hover:text-[#151515]">
                        Ứng tuyển <ArrowUpRight className="size-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}