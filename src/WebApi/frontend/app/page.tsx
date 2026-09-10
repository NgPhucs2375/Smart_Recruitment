"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@refinedev/core";
import { ArrowUpRight, Bookmark, Building2, Check, ChevronRight, Clock, Code2, FileText, Flame, Home, Laptop, Layers, Loader2, Lock, Mail, MapPin, Phone, Search, Shield, Sparkles, Users, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { toast } from "sonner";

const capabilities = [
  {
    number: "01",
    title: "Đọc hiểu CV",
    description: "NLP trích xuất kỹ năng, kinh nghiệm và các tín hiệu quan trọng từ hồ sơ.",
  },
  {
    number: "02",
    title: "So khớp năng lực",
    description: "Đối chiếu chính xác năng lực với yêu cầu vị trí để tìm ra những lựa chọn phù hợp.",
  },
  {
    number: "03",
    title: "Đánh giá phù hợp",
    description: "Điểm phù hợp từ AI giúp ưu tiên các cuộc trò chuyện và quyết định giá trị.",
  },
];

const techTracks = [
  ["01", "Phát triển phần mềm", "Frontend · Backend · Full-stack"],
  ["02", "Dữ liệu & Trí tuệ nhân tạo", "Data Analyst · ML Engineer · AI Research"],
  ["03", "Hạ tầng & Cloud", "DevOps · SRE · Cloud Engineer"],
  ["04", "Sản phẩm & Chất lượng", "Product Manager · UI/UX · QA Engineer"],
];

const techCompanies = [
  ["NEXORA", "SaaS / Product", "12 vị trí đang tuyển"],
  ["CLOUDLY", "Cloud Infrastructure", "8 vị trí đang tuyển"],
  ["DATANEST", "Data & AI", "6 vị trí đang tuyển"],
  ["PIXELFORGE", "Digital Studio", "10 vị trí đang tuyển"],
];

const sections = [
  { id: "overview", label: "Tổng quan" },
  { id: "jobs", label: "Việc IT" },
  { id: "tracks", label: "Lĩnh vực" },
  { id: "companies", label: "Công ty IT" },
  { id: "candidates", label: "Ứng viên" },
  { id: "employers", label: "Doanh nghiệp" },
  { id: "intelligence", label: "AI matching" },
  { id: "workflow", label: "Quy trình" },
];

const popularTechTags = [".NET Core", "React", "Python", "AWS", "Node.js", "Next.js", "Java", "Golang", "TypeScript", "Docker", "Kubernetes", "AI/ML"];

const landingLocations = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Remote"] as const;
const landingLevels = ["Fresher", "Junior", "Mid", "Senior", "Lead", "Manager"] as const;

const workModeMeta: Record<string, { label: string; icon: typeof Building2 }> = {
  Remote: { label: "Remote", icon: Home },
  Hybrid: { label: "Hybrid", icon: Laptop },
  Onsite: { label: "Onsite", icon: Building2 },
};

const landingFeaturedJobs = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "NEXORA Technologies",
    logo: "NX",
    salary: "25 - 40 triệu",
    location: "Hà Nội",
    workMode: "Hybrid" as const,
    level: "Senior",
    skills: ["React", "TypeScript", "Next.js"],
    postedAt: "2 ngày trước",
    applicants: 24,
    isHot: true,
  },
  {
    id: "5",
    title: "DevOps Engineer",
    company: "CLOUDLY Infrastructure",
    logo: "CL",
    salary: "30 - 50 triệu",
    location: "Remote",
    workMode: "Remote" as const,
    level: "Senior",
    skills: ["Kubernetes", "Terraform", "Azure"],
    postedAt: "1 ngày trước",
    applicants: 12,
    isHot: true,
  },
  {
    id: "2",
    title: "Backend Engineer (Node.js)",
    company: "CLOUDLY Infrastructure",
    logo: "CL",
    salary: "20 - 35 triệu",
    location: "Hồ Chí Minh",
    workMode: "Onsite" as const,
    level: "Mid",
    skills: ["Node.js", "PostgreSQL", "AWS"],
    postedAt: "1 ngày trước",
    applicants: 18,
    isHot: true,
  },
  {
    id: "10",
    title: "AI/ML Engineer",
    company: "DATANEST AI",
    logo: "DN",
    salary: "35 - 60 triệu",
    location: "Hà Nội",
    workMode: "Onsite" as const,
    level: "Senior",
    skills: ["Python", "TensorFlow", "MLOps"],
    postedAt: "1 ngày trước",
    applicants: 8,
    isHot: true,
  },
  {
    id: "3",
    title: "Junior React Developer",
    company: "PIXELFORGE Studio",
    logo: "PF",
    salary: "12 - 18 triệu",
    location: "Đà Nẵng",
    workMode: "Hybrid" as const,
    level: "Junior",
    skills: ["React", "JavaScript", "CSS"],
    postedAt: "3 ngày trước",
    applicants: 42,
    isHot: false,
  },
  {
    id: "12",
    title: "Full-stack Developer",
    company: "PIXELFORGE Studio",
    logo: "PF",
    salary: "20 - 35 triệu",
    location: "Đà Nẵng",
    workMode: "Hybrid" as const,
    level: "Mid",
    skills: ["React", "Node.js", "MongoDB"],
    postedAt: "2 ngày trước",
    applicants: 33,
    isHot: false,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("overview");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const { mutateAsync: login, isPending: loginPending } = useLogin();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchLevel, setSearchLevel] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0.05, 0.25, 0.5] },
    );

    sections.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleJobSearch(e?: FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim());
    if (searchLocation) params.set("location", searchLocation);
    if (searchLevel) params.set("level", searchLevel);
    const qs = params.toString();
    router.push(qs ? `/viec-lam?${qs}` : "/viec-lam");
  }

  function handleTagClick(tag: string) {
    setSearchKeyword(tag);
    searchInputRef.current?.focus();
  }

  function clearAllFilters() {
    setSearchKeyword("");
    setSearchLocation("");
    setSearchLevel("");
  }

  const hasActiveSearch = searchKeyword.trim() !== "" || searchLocation !== "" || searchLevel !== "";

  const { isBookmarked, toggle: toggleBookmark, count: bookmarkCount } = useBookmarks();

  function handleToggleBookmark(e: React.MouseEvent, job: (typeof landingFeaturedJobs)[number]) {
    e.preventDefault();
    e.stopPropagation();
    const was = isBookmarked(job.id);
    toggleBookmark(job.id);
    if (was) toast.success("Đã bỏ lưu", { description: job.title });
    else toast.success("Đã lưu việc làm", { description: `${job.title} • Xem lại ở Việc làm đã lưu` });
  }

  async function handleLandingLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);
    try {
      const result = await login({ email: loginEmail, password: loginPassword });
      if (!result.success) {
        setLoginError(result.error?.message ?? "Email hoặc mật khẩu không đúng");
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Không thể kết nối máy chủ");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f5f3] text-[#151515]">
      <section className="relative bg-[#151515] pt-14 text-[#f5f5f3]">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="animate-pulse-soft pointer-events-none absolute -right-32 top-24 size-[34rem] rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-6 sm:px-10 lg:px-16">
          <header className="flex items-center justify-between border-b border-white/15 pb-5">
            <Link href="/" className="text-lg font-semibold tracking-[-0.04em]">
              HIRE<span className="text-white">AI</span>
            </Link>
            <nav className="hidden items-center gap-8 text-sm text-white/65 md:flex">
              <Link className="transition hover:text-white" href="#candidates">Ứng viên</Link>
              <Link className="transition hover:text-white" href="#employers">Doanh nghiệp</Link>
              <Link className="transition hover:text-white" href="/login">Đăng nhập</Link>
            </nav>
            <Link href="/register" className="rounded-full border border-white/25 px-4 py-2 text-xs transition hover:bg-white hover:text-[#151515]">
              Bắt đầu ngay
            </Link>
          </header>
          <nav aria-label="Điều hướng landing page" className="fixed inset-x-0 top-0 z-50 overflow-x-auto border-b border-white/10 bg-[#151515]/95 px-6 py-3 backdrop-blur-md sm:px-10 lg:px-16">
            <div className="mx-auto flex min-w-max max-w-7xl items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`rounded-full px-3 py-1.5 text-xs transition ${
                      activeSection === section.id
                        ? "bg-white font-medium text-[#151515]"
                        : "text-white/55 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {section.label}
                  </a>
                ))}
              </div>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-white/35 md:block">TExt</span>
            </div>
          </nav>

          <div id="overview" className="scroll-mt-24 grid gap-14 pb-10 pt-20 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:pt-28">
            <div className="animate-slide-in">
              <p className="mb-6 text-xs uppercase tracking-[0.28em] text-white/70">Tuyển dụng thông minh</p>
              <h1 className="max-w-3xl text-5xl font-medium leading-[0.98] tracking-[-0.065em] sm:text-7xl">
                Đúng người.
                <br />
                Đúng việc.
                <br />
                <span className="text-white">Đúng thời điểm.</span>
              </h1>
              <p className="mt-8 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
                Nền tảng tuyển dụng chuyên sâu cho ngành công nghệ — kết nối đúng kỹ năng, đúng đội ngũ và đúng cơ hội phát triển.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/register" className="group flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-medium text-[#151515] transition hover:bg-white/80">
                  Tìm việc phù hợp <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link href="/register" className="flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm transition hover:border-white hover:bg-white/10">
                  Đăng tuyển nhân sự <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>

            <div className="relative lg:pb-3">
              <div className="animate-float relative rounded-[2rem] border border-white/15 bg-white/[0.07] p-6 shadow-2xl shadow-black/30 backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1 sm:p-8">
                <div className="flex items-center justify-between border-b border-white/15 pb-5">
                  <span className="text-xs uppercase tracking-[0.22em] text-white/50">AI match engine</span>
                  <Sparkles className="size-4 text-white" />
                </div>
                <div className="py-8">
                  <div className="flex items-end gap-3">
                    <span className="text-7xl font-medium tracking-[-0.08em] text-white">92%</span>
                    <span className="mb-2 max-w-32 text-xs leading-5 text-white/55">Mức độ phù hợp cho vị trí Product Designer</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {["Nghiên cứu người dùng", "Figma & Design Systems", "Tư duy sản phẩm"].map((skill) => (
                    <div key={skill} className="flex items-center justify-between rounded-xl bg-white/[0.08] px-4 py-3 text-sm">
                      <span>{skill}</span>
                      <span className="flex items-center gap-1 text-xs text-white/75"><Check className="size-3" /> Khớp cao</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="animate-slide-in absolute -right-4 -top-7 hidden w-44 rotate-3 rounded-2xl border border-white/40 bg-white p-4 text-[#151515] shadow-xl sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-60">Live signal</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">+38%</p>
                <p className="mt-1 text-[11px] opacity-70">Tín hiệu phù hợp tuần này</p>
              </div>
              <div className="absolute -bottom-7 -left-5 hidden size-24 rounded-full border border-white/30 bg-white/10 sm:block" />

              <form onSubmit={handleLandingLogin} className="mt-8 rounded-[1.5rem] border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm transition-colors hover:border-white/30">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Đã có tài khoản?</p>
                    <p className="mt-1 text-xs text-white/50">Đăng nhập để tiếp tục hành trình</p>
                  </div>
                  <Lock className="size-4 text-white/50" />
                </div>
                {loginError && <p className="mb-3 rounded-lg border border-red-300/30 bg-red-300/10 px-3 py-2 text-xs text-red-100">{loginError}</p>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="relative">
                    <Mail className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/40" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      placeholder="Email"
                      className="h-10 w-full rounded-lg border border-white/15 bg-black/20 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/60"
                    />
                  </label>
                  <label className="relative">
                    <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/40" />
                    <input
                      type="password"
                      autoComplete="current-password"
                      required
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      placeholder="Mật khẩu"
                      className="h-10 w-full rounded-lg border border-white/15 bg-black/20 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/60"
                    />
                  </label>
                </div>
                <button type="submit" disabled={loginPending} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-medium text-[#151515] transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60">
                  {loginPending && <Loader2 className="size-4 animate-spin" />}
                  {loginPending ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
                <Link href="/register" className="mt-3 block text-center text-xs text-white/50 transition hover:text-white">Chưa có tài khoản? Đăng ký ngay</Link>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section id="jobs" className="scroll-mt-24 border-b border-[#151515]/10 bg-white px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#65756d]">Cơ hội công nghệ</p>
              <h2 className="mt-5 max-w-2xl text-4xl font-medium leading-[1.05] tracking-[-0.06em] sm:text-6xl">Cơ hội tốt cho người làm công nghệ.</h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-[#65756d]">Chỉ tập trung vào các vai trò và kỹ năng đang tạo nên sản phẩm số.</p>
          </div>
          {/* === #1.2 Thanh tìm kiếm đa chiều === */}
          <form
            onSubmit={handleJobSearch}
            className="mt-10 rounded-[1.75rem] border border-[#151515]/15 bg-[#f5f5f3] p-3 shadow-[0_18px_50px_rgba(21,21,21,.06)]"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* Từ khóa / Tech Stack */}
              <label className="relative flex flex-1 items-center">
                <Search className="pointer-events-none absolute left-4 size-4 text-[#65756d]" />
                <input
                  ref={searchInputRef}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Từ khóa / Tech Stack: React, .NET Core, Python..."
                  className="h-12 w-full rounded-xl border border-[#151515]/10 bg-white py-2 pl-11 pr-10 text-sm outline-none transition placeholder:text-[#65756d]/70 focus:border-[#151515]/50 focus:ring-2 focus:ring-[#151515]/10"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword("")}
                    className="absolute right-2 flex size-7 items-center justify-center rounded-full bg-[#151515]/5 text-[#65756d] transition hover:bg-[#151515]/10 hover:text-[#151515]"
                    aria-label="Xóa từ khóa"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </label>

              <div className="hidden h-8 w-px shrink-0 bg-[#151515]/10 lg:block" />

              {/* Địa điểm */}
              <div className="flex gap-3 lg:w-[340px]">
                <div className="relative flex-1">
                  <Select value={searchLocation} onValueChange={(v) => setSearchLocation(!v || v === "__ALL__" ? "" : v)}>
                    <SelectTrigger className="h-12 w-full justify-between rounded-xl border-[#151515]/10 bg-white px-3 py-2 text-sm font-normal shadow-none focus:ring-2 focus:ring-[#151515]/10 data-[placeholder]:text-[#65756d]/70 [&_svg]:text-[#65756d]">
                      <span className="flex items-center gap-2 truncate">
                        <MapPin className="size-4 shrink-0 text-[#65756d]" />
                        <SelectValue placeholder="Địa điểm" />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL__">Tất cả địa điểm</SelectItem>
                      {landingLocations.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cấp bậc */}
                <div className="relative flex-1">
                  <Select value={searchLevel} onValueChange={(v) => setSearchLevel(!v || v === "__ALL__" ? "" : v)}>
                    <SelectTrigger className="h-12 w-full justify-between rounded-xl border-[#151515]/10 bg-white px-3 py-2 text-sm font-normal shadow-none focus:ring-2 focus:ring-[#151515]/10 data-[placeholder]:text-[#65756d]/70 [&_svg]:text-[#65756d]">
                      <span className="flex items-center gap-2 truncate">
                        <Layers className="size-4 shrink-0 text-[#65756d]" />
                        <SelectValue placeholder="Cấp bậc" />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL__">Tất cả cấp bậc</SelectItem>
                      {landingLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#151515] px-7 text-sm font-medium text-white shadow-[0_8px_24px_rgba(21,21,21,.18)] transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151515]/30"
              >
                <Search className="size-4" />
                Tìm việc IT
              </button>
            </div>

            {/* Dòng phụ: hint + active filters */}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs text-[#65756d]">
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#151515]/10 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">
                  <span className="flex size-4 items-center justify-center rounded bg-[#151515] text-[10px] font-bold text-white">/</span> để tìm nhanh
                </span>
                <span className="hidden sm:inline text-[#151515]/20">•</span>
                <span>1.200+ việc làm đang mở</span>
              </p>
              {hasActiveSearch && (
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs text-[#65756d] sm:inline">
                    {[
                      searchKeyword ? `"${searchKeyword}"` : null,
                      searchLocation,
                      searchLevel,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </span>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#151515]/10 bg-white px-3 py-1.5 text-xs font-medium text-[#39443f] transition hover:border-[#151515]/20 hover:bg-[#151515] hover:text-white"
                  >
                    <X className="size-3" /> Xóa lọc
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Bộ sưu tập Tag phổ biến — 1-click */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-[0.14em] text-[#65756d]">Hot:</span>
            {popularTechTags.map((tag) => {
              const active = searchKeyword.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-[#151515] bg-[#151515] text-white shadow-sm"
                      : "border-[#151515]/15 bg-white text-[#39443f] hover:border-[#151515]/40 hover:bg-[#f5f5f3]"
                  }`}
                  aria-pressed={active}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Danh mục nghề nghiệp chuyên sâu — pills vai trò */}
          <div className="mt-3 flex flex-wrap gap-2">
            {["Frontend Developer", "Backend Engineer", "Mobile Developer", "Data & AI", "DevOps / Cloud", "QA Engineer", "Product Tech"].map((role) => {
              const active = searchKeyword.toLowerCase() === role.toLowerCase();
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleTagClick(role)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-[#151515] bg-[#151515] text-white"
                      : "border-[#151515]/15 bg-white text-[#39443f] hover:border-[#151515]/50 hover:bg-[#f5f5f3]"
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>
          {/* === #1.5 Danh sách công việc nổi bật — Job Card tiêu chuẩn + Bookmark === */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {landingFeaturedJobs.map((job) => {
              const bookmarked = isBookmarked(job.id);
              const wm = workModeMeta[job.workMode];
              const WIcon = wm.icon;
              return (
                <article
                  key={job.id}
                  onClick={() => router.push(`/viec-lam?${new URLSearchParams({ keyword: job.title }).toString()}`)}
                  className="group relative flex cursor-pointer flex-col rounded-2xl border border-[#151515]/15 bg-[#f5f5f3] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-[#151515]/30 hover:bg-white hover:shadow-[0_18px_45px_rgba(21,21,21,.10)]"
                >
                  {job.isHot && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#ff3b30] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm">
                      <Flame className="size-3" /> Hot
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#151515] font-mono text-xs font-bold text-white shadow-sm">
                        {job.logo}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[#65756d]">{job.company}</p>
                        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.02em] text-[#151515] transition group-hover:text-black">
                          {job.title}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleBookmark(e, job)}
                      aria-label={bookmarked ? "Bỏ lưu việc làm" : "Lưu việc làm"}
                      aria-pressed={bookmarked}
                      className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151515]/20 ${
                        bookmarked
                          ? "border-[#151515] bg-[#151515] text-white shadow-md"
                          : "border-[#151515]/15 bg-white text-[#65756d] hover:border-[#151515]/30 hover:text-[#151515]"
                      } ${job.isHot ? "mt-6" : ""}`}
                      title={bookmarked ? "Đã lưu — bấm để bỏ lưu" : "Lưu việc làm để xem lại sau"}
                    >
                      <Bookmark className={`size-4 ${bookmarked ? "fill-white" : ""}`} />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1 text-[#65756d]">
                      <MapPin className="size-3" /> {job.location}
                    </span>
                    <span className="text-[#151515]/20">•</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#151515]/10 bg-white px-2 py-1 text-[11px] font-medium text-[#39443f]">
                      <WIcon className="size-3" /> {wm.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[#151515] px-2.5 py-1 text-[11px] font-medium text-white">{job.level}</span>
                    {job.skills.map((skill) => (
                      <span key={skill} className="rounded-full border border-[#151515]/12 bg-white px-2.5 py-1 text-[11px] font-medium text-[#39443f]">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#151515]/10 pt-3 text-xs text-[#65756d]">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {job.postedAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3" /> {job.applicants} ứng viên
                    </span>
                  </div>

                  <div className="pointer-events-none mt-3 flex items-center gap-1 text-xs font-medium text-[#151515]/70 opacity-0 transition group-hover:opacity-100">
                    Xem chi tiết <ArrowUpRight className="size-3" />
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-[#65756d]">
              Hiển thị <span className="font-semibold text-[#151515]">6</span> việc nổi bật •{" "}
              {bookmarkCount > 0 ? (
                <span className="font-medium text-[#151515]">
                  Đã lưu {bookmarkCount} việc <Bookmark className="mb-0.5 inline size-3 fill-[#151515]" />
                </span>
              ) : (
                <span>Bấm bookmark để lưu mà không cần mở chi tiết</span>
              )}
            </p>
            <Link
              href="/viec-lam"
              className="inline-flex items-center gap-2 rounded-full border border-[#151515]/15 bg-white px-5 py-2.5 text-sm font-medium text-[#151515] transition hover:border-[#151515] hover:bg-[#151515] hover:text-white"
            >
              Xem tất cả việc làm <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* === #1.4 Trust Bar monochrome + #1.8 Social Proof === */}
      <section aria-label="Đối tác và số liệu tin cậy" className="border-y border-[#151515]/10 bg-[#f5f5f3]">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          {/* Logo strip monochrome */}
          <div className="flex flex-col gap-4 border-b border-[#151515]/10 py-6 md:flex-row md:items-center md:justify-between">
            <p className="shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-[#65756d]">
              Được tin tưởng bởi <span className="font-bold text-[#151515]">500+</span> công ty công nghệ
            </p>
            <div className="hidden items-center gap-1.5 text-xs text-[#65756d]/60 md:flex">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> Dữ liệu thực • Cập nhật 04/09/2026
            </div>
          </div>

          <div className="relative overflow-hidden py-6">
            {/* Marquee monochrome logos — 7 unique x2 for seamless loop */}
            <div className="flex w-max animate-[marquee_28s_linear_infinite] items-center gap-10 whitespace-nowrap will-change-transform hover:[animation-play-state:paused] sm:gap-14">
              {[
                "NEXORA",
                "CLOUDLY",
                "DATANEST",
                "PIXELFORGE",
                "FPT SOFTWARE",
                "VNG",
                "TIKI",
                "BE GROUP",
                "MOMO",
                "VNPAY",
                "NEXORA",
                "CLOUDLY",
                "DATANEST",
                "PIXELFORGE",
                "FPT SOFTWARE",
                "VNG",
                "TIKI",
                "BE GROUP",
                "MOMO",
                "VNPAY",
              ].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="font-mono text-sm font-bold tracking-[0.18em] text-[#151515]/35 grayscale transition hover:text-[#151515]/70 sm:text-base"
                  style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                >
                  {name}
                </span>
              ))}
            </div>
            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#f5f5f3] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#f5f5f3] to-transparent" />
          </div>

          {/* Social proof stats */}
          <div className="grid grid-cols-2 gap-6 border-t border-[#151515]/10 py-8 md:grid-cols-4">
            <div className="space-y-1">
              <p className="font-mono text-3xl font-medium tracking-[-0.04em] text-[#151515] sm:text-4xl">
                1.200<span className="text-[#65756d]">+</span>
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#65756d]">Việc làm đang mở</p>
              <p className="text-xs text-[#65756d]/70">Cập nhật mỗi giờ</p>
            </div>
            <div className="space-y-1 border-l border-[#151515]/10 pl-6">
              <p className="font-mono text-3xl font-medium tracking-[-0.04em] text-[#151515] sm:text-4xl">
                8.500<span className="text-[#65756d]">+</span>
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#65756d]">Kết nối thành công</p>
              <p className="text-xs text-emerald-600">↑ 18% tháng này</p>
            </div>
            <div className="space-y-1 border-l border-[#151515]/10 pl-6">
              <p className="font-mono text-3xl font-medium tracking-[-0.04em] text-[#151515] sm:text-4xl">
                &lt;48<span className="text-lg text-[#65756d]">h</span>
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#65756d]">Phản hồi trung bình</p>
              <p className="text-xs text-[#65756d]/70">Từ nhà tuyển dụng</p>
            </div>
            <div className="space-y-1 border-l border-[#151515]/10 pl-6">
              <p className="font-mono text-3xl font-medium tracking-[-0.04em] text-[#151515] sm:text-4xl">
                92<span className="text-lg text-[#65756d]">%</span>
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#65756d]">Độ khớp AI trung bình</p>
              <p className="text-xs text-emerald-600">Đo trên 12k CV thực</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#151515]/10 py-4 text-xs text-[#65756d]/60 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2">
              <span className="rounded-full border border-[#151515]/10 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">Đã kiểm duyệt</span>
              Mọi tin tuyển dụng được xác thực trước khi hiển thị
            </p>
            <Link href="/quy-che" className="inline-flex items-center gap-1 font-medium text-[#151515]/70 underline decoration-[#151515]/20 underline-offset-4 transition hover:text-[#151515]">
              Xem quy chế kiểm duyệt <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </section>

      <section id="tracks" className="scroll-mt-24 bg-[#e9e9e6] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 border-b border-[#151515]/15 pb-10 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#65756d]">Theo dõi công nghệ</p>
              <h2 className="mt-5 max-w-3xl text-4xl font-medium leading-[1.05] tracking-[-0.06em] sm:text-6xl">Chọn đúng hướng đi trong ngành IT.</h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-[#65756d]">Khám phá cơ hội theo chuyên môn thay vì những danh mục nghề nghiệp chung chung.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {techTracks.map(([number, title, roles]) => (
              <Link href="/register" key={title} className="group flex items-end justify-between rounded-2xl border border-[#151515]/15 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:bg-[#151515] hover:text-white">
                <div>
                  <p className="font-mono text-xs text-[#65756d] group-hover:text-white/50">{number}</p>
                  <h3 className="mt-10 text-xl font-medium">{title}</h3>
                  <p className="mt-2 text-sm text-[#65756d] group-hover:text-white/60">{roles}</p>
                </div>
                <ArrowUpRight className="size-5 text-[#65756d] transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="companies" className="scroll-mt-24 bg-white px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#65756d]">Các công ty đang tuyển dụng ...</p>
              <h2 className="mt-5 text-4xl font-medium tracking-[-0.06em] sm:text-6xl">Nơi những sản phẩm mới được tạo ra.</h2>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">Xem tất cả công ty <ArrowUpRight className="size-4" /></Link>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {techCompanies.map(([name, field, openings]) => (
              <Link href="/register" key={name} className="group rounded-2xl border border-[#151515]/15 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#151515]/50">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#151515] font-mono text-[10px] text-white">{name.slice(0, 2)}</div>
                <h3 className="mt-10 font-medium tracking-tight">{name}</h3>
                <p className="mt-2 text-sm text-[#65756d]">{field}</p>
                <p className="mt-8 border-t border-[#151515]/10 pt-4 text-xs text-[#65756d] group-hover:text-[#151515]">{openings} <ArrowUpRight className="ml-1 inline size-3" /></p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
        <div className="flex flex-col justify-between gap-6 border-b border-[#17211d]/15 pb-12 md:flex-row md:items-end">
          <h2 className="max-w-2xl text-4xl font-medium leading-[1.05] tracking-[-0.06em] sm:text-6xl">
            Một nền tảng, hai hành trình trong thế giới công nghệ.
          </h2>
          <p className="text-xs uppercase tracking-[0.25em] text-[#65756d]">Nền tảng</p>
        </div>
        <div className="grid gap-px overflow-hidden border border-[#151515]/15 bg-[#151515]/15 shadow-[0_20px_70px_rgba(21,21,21,.08)] md:grid-cols-2">
          <div id="candidates" className="scroll-mt-24 bg-[#f5f5f3] p-8 sm:p-12">
            <p className="mb-20 text-xs uppercase tracking-[0.2em] text-[#65756d]">01 / Candidate</p>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-3xl font-medium tracking-[-0.05em]">Dành cho ứng viên</h3>
              <ArrowUpRight className="size-5 opacity-40" />
            </div>
            <p className="mt-5 max-w-md leading-7 text-[#65756d]">Xây hồ sơ một lần, nhận gợi ý công việc dựa trên kỹ năng, kinh nghiệm và mục tiêu phát triển của riêng bạn.</p>
            <ul className="mt-10 space-y-4 text-sm">
              {["Tạo CV và hồ sơ tập trung", "Ứng tuyển, theo dõi trạng thái", "Nhận đề xuất công việc từ AI"].map((item, index) => (
                <li key={item} className="flex gap-4 border-t border-[#17211d]/15 pt-4"><span className="text-[#65756d]">0{index + 1}</span>{item}</li>
              ))}
            </ul>
          </div>
          <div id="employers" className="group scroll-mt-24 bg-[#dededb] p-8 transition-colors duration-500 hover:bg-[#d5d5d1] sm:p-12">
            <p className="mb-20 text-xs uppercase tracking-[0.2em] text-[#151515]/60">02 / Employer</p>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-3xl font-medium tracking-[-0.05em]">Dành cho doanh nghiệp</h3>
              <ArrowUpRight className="size-5 opacity-50 transition duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
            </div>
            <p className="mt-5 max-w-md leading-7 text-[#151515]/70">Xây dựng đội ngũ kỹ thuật mạnh hơn với dữ liệu kỹ năng, pipeline tuyển dụng và AI matching dành riêng cho ngành IT.</p>
            <ul className="mt-10 space-y-4 text-sm">
              {["Đăng tuyển vị trí IT theo skill stack", "Phân tích CV kỹ thuật tự động", "Đề xuất ứng viên theo seniority"].map((item, index) => (
                <li key={item} className="flex gap-4 border-t border-[#151515]/25 pt-4"><span className="text-[#151515]/60">0{index + 1}</span>{item}</li>
              ))}
            </ul>
            <div className="mt-12 grid grid-cols-2 gap-3 border-t border-[#151515]/20 pt-5">
              <div>
                <p className="text-2xl font-medium tracking-tight">3.2x</p>
                <p className="mt-1 text-xs text-[#151515]/60">Nhanh hơn khi sàng lọc</p>
              </div>
              <div>
                <p className="text-2xl font-medium tracking-tight">92%</p>
                <p className="mt-1 text-xs text-[#151515]/60">Độ chính xác đề xuất</p>
              </div>
            </div>
            <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#151515] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black">
              Đăng tuyển ngay <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="intelligence" className="scroll-mt-24 bg-[#e4e4e1] px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <h2 className="max-w-4xl text-4xl font-medium leading-[1.05] tracking-[-0.06em] sm:text-6xl">
            AI không thay thế tuyển dụng. AI làm cho mỗi quyết định rõ ràng hơn.
          </h2>
          <div className="mt-16 grid gap-10 border-t border-[#17211d]/15 pt-8 md:grid-cols-3">
            {capabilities.map((capability) => (
              <article key={capability.number} className="group border-t border-[#151515]/15 pt-5 transition-transform hover:-translate-y-1">
                <p className="text-sm text-[#65756d]">{capability.number}</p>
                <h3 className="mt-16 text-2xl font-medium tracking-[-0.04em]">{capability.title}</h3>
                <p className="mt-4 max-w-xs leading-7 text-[#65756d]">{capability.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#65756d]">Một luồng dữ liệu</p>
            <h2 className="mt-6 max-w-xl text-4xl font-medium leading-[1.05] tracking-[-0.06em] sm:text-6xl">Từ web đến mobile, mọi tín hiệu tuyển dụng luôn đồng bộ.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:pt-16">
            {["Website tuyển dụng", "Ứng dụng Android / iOS", "Bảng điều hành"].map((item, index) => (
              <div key={item} className="rounded-2xl border border-[#17211d]/15 p-5">
                <p className="text-xs text-[#65756d]">0{index + 1}</p>
                <p className="mt-14 font-medium">{item}</p>
                <p className="mt-2 text-sm text-[#65756d]">{["Quản lý toàn diện", "Thông báo tức thì", "Báo cáo, thống kê"][index]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === #1.6 Footer & Compliance — Chuẩn sàn giao dịch việc làm === */}
      <footer className="bg-[#0a0a0a] text-[#f5f5f3]">
        {/* CTA band giữ lại */}
        <div className="border-b border-white/10 px-6 py-14 sm:px-10 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/40">Sàn giao dịch việc làm công nghệ</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-medium leading-[1.05] tracking-[-0.06em] sm:text-5xl">Tuyển dụng có dữ liệu.<br />Quyết định có niềm tin.</h2>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:items-end">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-[#0a0a0a] transition hover:bg-[#dededb]">
                Bắt đầu cùng HIRE//AI <ArrowUpRight className="size-4" />
              </Link>
              <p className="text-xs text-white/35">Miễn phí cho ứng viên • Không spam • Ẩn danh khi cần</p>
            </div>
          </div>
        </div>

        {/* Main footer grid */}
        <div className="px-6 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
              {/* Brand */}
              <div>
                <Link href="/" className="text-lg font-semibold tracking-[-0.04em]">
                  HIRE<span className="text-white">AI</span>
                </Link>
                <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
                  Nền tảng tuyển dụng chuyên sâu cho ngành IT — kết nối đúng kỹ năng, đúng đội ngũ và đúng cơ hội phát triển bằng AI matching.
                </p>
                <div className="mt-6 flex gap-2">
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/60 transition hover:border-white/30 hover:bg-white hover:text-[#0a0a0a]">
                    <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.47.09.64-.2.64-.45v-1.6c-2.6.57-3.15-1.1-3.15-1.1-.43-1.08-1.05-1.37-1.05-1.37-.86-.58.06-.57.06-.57.95.07 1.45.98 1.45.98.84 1.44 2.2 1.02 2.74.78.08-.6.33-1.02.6-1.26-2.1-.24-4.3-1.05-4.3-4.67 0-1.03.37-1.87.98-2.53-.1-.24-.42-1.2.09-2.5 0 0 .8-.26 2.62.97a9 9 0 0 1 4.77 0c1.82-1.23 2.62-.97 2.62-.97.51 1.3.19 2.26.09 2.5.61.66.98 1.5.98 2.53 0 3.63-2.2 4.43-4.3 4.67.34.29.65.86.65 1.73v2.57c0 .25.17.54.64.45A9.5 9.5 0 0 0 12 2.5Z" /></svg>
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/60 transition hover:border-white/30 hover:bg-white hover:text-[#0a0a0a]">
                    <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14Zm-9 14V10H7v7h3Zm1.5-9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17 17v-4c0-1.1-.9-2-2-2s-2 .9-2 2v4h-3V10h3v1c.6-1 1.5-1.5 2.7-1.5 2 0 3.3 1.3 3.3 3.8V17h-2Z" /></svg>
                  </a>
                  <a href="mailto:support@hireai.vn" aria-label="Email" className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/60 transition hover:border-white/30 hover:bg-white hover:text-[#0a0a0a]">
                    <Mail className="size-4" />
                  </a>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> Hệ thống vận hành 24/7 • Dữ liệu mã hóa
                </div>
              </div>

              {/* Nền tảng */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90">Nền tảng</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-white/55">
                  <li><Link href="/viec-lam" className="transition hover:text-white">Việc làm IT</Link></li>
                  <li><Link href="/#tracks" className="transition hover:text-white">Lĩnh vực công nghệ</Link></li>
                  <li><Link href="/#companies" className="transition hover:text-white">Công ty IT</Link></li>
                  <li><Link href="/tao-cv" className="transition hover:text-white">Tạo CV & Hồ sơ</Link></li>
                  <li><Link href="/#intelligence" className="transition hover:text-white">AI Matching</Link></li>
                  <li><Link href="/dashboard" className="transition hover:text-white">Dành cho doanh nghiệp</Link></li>
                </ul>
              </div>

              {/* Hỗ trợ */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90">Hỗ trợ</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-white/55">
                  <li><Link href="/lien-he" className="transition hover:text-white">Liên hệ</Link></li>
                  <li><Link href="/ho-tro" className="transition hover:text-white">Trung tâm hỗ trợ</Link></li>
                  <li><Link href="/huong-dan" className="transition hover:text-white">Hướng dẫn ứng viên</Link></li>
                  <li><Link href="/huong-dan-nha-tuyen-dung" className="transition hover:text-white">Hướng dẫn nhà tuyển dụng</Link></li>
                  <li><Link href="/cau-hoi-thuong-gap" className="transition hover:text-white">Câu hỏi thường gặp</Link></li>
                  <li><a href="mailto:support@hireai.vn" className="transition hover:text-white">support@hireai.vn</a></li>
                </ul>
              </div>

              {/* Pháp lý — trọng tâm #1.6 */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Pháp lý & Tuân thủ</h3>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li><Link href="/dieu-khoan" className="inline-flex items-center gap-1.5 text-white/70 transition hover:text-white"><span className="size-1 rounded-full bg-white/40" /> Điều khoản dịch vụ</Link></li>
                  <li><Link href="/bao-mat" className="inline-flex items-center gap-1.5 text-white/70 transition hover:text-white"><span className="size-1 rounded-full bg-white/40" /> Chính sách bảo mật</Link></li>
                  <li><Link href="/bao-mat#du-lieu-ca-nhan" className="inline-flex items-center gap-1.5 font-medium text-emerald-300 transition hover:text-emerald-200"><span className="size-1 rounded-full bg-emerald-400" /> Bảo vệ dữ liệu cá nhân (NĐ 13/2023)</Link></li>
                  <li><Link href="/quy-che" className="inline-flex items-center gap-1.5 text-white/70 transition hover:text-white"><span className="size-1 rounded-full bg-white/40" /> Quy chế hoạt động sàn</Link></li>
                  <li><Link href="/quy-che#co-che-giai-quyet" className="inline-flex items-center gap-1.5 text-white/55 transition hover:text-white">Cơ chế giải quyết tranh chấp</Link></li>
                  <li><Link href="/bao-mat#cookies" className="inline-flex items-center gap-1.5 text-white/55 transition hover:text-white">Chính sách Cookie</Link></li>
                </ul>
                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-white/80"><Shield className="size-3.5 text-emerald-400" /> Cam kết tuân thủ</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">Tuân thủ Nghị định 52/2013, 13/2023/NĐ-CP &amp; Thông tư 59/2015 về TMĐT. Dữ liệu mã hóa TLS 1.3, lưu trữ tại Việt Nam.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Company info bar */}
        <div className="border-y border-white/10 bg-white/[0.02] px-6 py-6 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 text-xs leading-5 text-white/50 md:grid-cols-3">
              <div className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70"><MapPin className="size-3.5" /></span>
                <div>
                  <p className="font-medium text-white/80">Công ty TNHH HIREAI Việt Nam</p>
                  <p>Tầng 8, Tòa Innovation, 123 Nguyễn Huệ, Q.1, TP.HCM</p>
                  <p>MST: 0312345678 • Cấp ngày 15/03/2024 • Sở KH&ĐT TP.HCM</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70"><Phone className="size-3.5" /></span>
                <div>
                  <p className="font-medium text-white/80">Liên hệ</p>
                  <p><a href="tel:1900636890" className="transition hover:text-white">1900 636 890</a> (8:00–18:00 T2–T6)</p>
                  <p><a href="mailto:support@hireai.vn" className="transition hover:text-white">support@hireai.vn</a> • <a href="mailto:legal@hireai.vn" className="transition hover:text-white">legal@hireai.vn</a></p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70"><FileText className="size-3.5" /></span>
                <div>
                  <p className="font-medium text-white/80">Giấy phép &amp; Chứng nhận</p>
                  <p>Đã đăng ký Bộ Công Thương • DMCA Protected</p>
                  <p className="mt-1 inline-flex items-center gap-1.5">Đã thông báo <span className="rounded bg-[#ff3b30] px-1.5 py-0.5 text-[10px] font-bold text-white">BỘ CÔNG THƯƠNG</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-6 py-6 sm:px-10 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/35">
              <span>© 2026 HIRE//AI. Bảo lưu mọi quyền.</span>
              <span className="hidden sm:inline text-white/15">•</span>
              <span className="inline-flex items-center gap-1.5">Vận hành bởi <span className="font-medium text-white/60">HIREAI</span> <span className="rounded-full border border-white/15 px-2 py-0.5 font-mono text-[10px] leading-none">v2.4 • SOC 2</span></span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2 text-white/40">
                <span className="hidden sm:inline">Ngôn ngữ:</span>
                <span className="font-medium text-white">Tiếng Việt</span>
                <span className="text-white/20">|</span>
                <a href="#" className="transition hover:text-white">English</a>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-white/40">TLS 1.3</span>
                <span className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-white/40">ISO 27001</span>
                <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-emerald-300">NĐ 13/2023</span>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-7xl border-t border-white/5 pt-6 text-[11px] leading-5 text-white/30">
            HIREAI là sàn giao dịch TMĐT việc làm chuyên ngành IT. Mọi tin tuyển dụng được kiểm duyệt; ứng viên tự chịu trách nhiệm về tính chính xác của hồ sơ. Tranh chấp được giải quyết theo <Link href="/quy-che#co-che-giai-quyet" className="underline decoration-white/20 underline-offset-4 hover:text-white/60">Quy chế hoạt động</Link> và pháp luật Việt Nam. Không thu phí ứng viên; nhà tuyển dụng chịu phí theo bảng giá công khai.
          </p>
        </div>
      </footer>
    </main>
  );
}
