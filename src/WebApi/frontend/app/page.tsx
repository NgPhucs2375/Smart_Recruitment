"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@refinedev/core";
import { ArrowUpRight, Bookmark, Building2, Check, ChevronRight, Clock, Code2, FileText, Flame, Home, Laptop, Layers, Loader2, Lock, Mail, MapPin, Phone, Search, Shield, Sparkles, Users, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrandLogo } from "@/components/brand-logo";
import { HeroBackgroundIllustration } from "@/features/landing/brand-illustration-card";
import { locations, jobLevels } from "@/features/viec-lam/constants";
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

const publicNavLinks = [
  { label: "Việc làm", href: "/#jobs" },
  { label: "Công ty", href: "/#companies" },
  { label: "AI matching", href: "/#intelligence" },
  { label: "Nhà tuyển dụng", href: "/nha-tuyen-dung" },
];

const popularTechTags = [".NET Core", "React", "Python", "AWS", "Node.js", "Next.js", "Java", "Golang", "TypeScript", "Docker", "Kubernetes", "AI/ML"];

// Landing search subsets — derived from the single shared dataset in
// `@/features/viec-lam/constants` (no separate location/level dataset here).
const landingLocations = locations.filter(
  (l) => l === "Hà Nội" || l === "Hồ Chí Minh" || l === "Đà Nẵng" || l === "Remote"
);
const landingLevels = jobLevels.filter((l) => l !== "Intern");

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
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const { mutateAsync: login, isPending: loginPending } = useLogin();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchLevel, setSearchLevel] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    <main className="min-h-screen overflow-hidden bg-ivory text-charcoal">
      {/* ============ Header + Hero — light, airy, growth-oriented ============ */}
      <section className="relative border-b border-linen/70 bg-ivory pt-28 md:pt-16">
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-10 sm:pt-6 lg:px-16">
          <nav aria-label="Điều hướng chính" className="fixed inset-x-0 top-0 z-50 border-b border-linen/70 bg-white/85 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-10 lg:px-16">
              <BrandLogo href="/" variant="workspace" size="sm" className="shrink-0" />
              <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
                {publicNavLinks.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium text-charcoal/65 transition hover:bg-mist/20 hover:text-navy"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <Link href="/login" className="hidden whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium text-charcoal/70 transition hover:bg-mist/20 hover:text-navy sm:inline-flex">
                  Đăng nhập
                </Link>
                <Link href="/register" className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-marine px-4 py-2 text-sm font-medium text-white transition hover:bg-navy">
                  Bắt đầu ngay
                </Link>
              </div>
            </div>
            <div className="border-t border-linen/60 md:hidden">
              <div className="flex gap-1 overflow-x-auto px-4 py-2">
                {publicNavLinks.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-charcoal/65 transition hover:bg-mist/20 hover:text-navy"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-marine transition hover:bg-mist/20 sm:hidden"
                >
                  Đăng nhập
                </Link>
              </div>
            </div>
          </nav>

          <div id="overview" className="relative scroll-mt-24 overflow-hidden">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <HeroBackgroundIllustration />
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ivory/60 via-ivory/40 to-ivory" />
            <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-14 text-center sm:px-10 sm:pt-20 lg:pt-24">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-navy/70">HIREAI</p>
              <h1 className="mx-auto mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-navy sm:text-6xl sm:leading-[1.02]">
                <span className="block">Đúng người, đúng việc.</span>
                <span className="block text-marine">Đúng thời điểm.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-charcoal/70 sm:mt-6 sm:text-lg">
                Nền tảng tuyển dụng IT giúp ứng viên và nhà tuyển dụng kết nối nhanh hơn bằng AI matching.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/register" className="group flex items-center justify-center gap-2 rounded-full bg-marine px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(53,92,140,0.30)] transition hover:bg-navy">
                  Tìm việc phù hợp <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link href="/nha-tuyen-dung" className="flex items-center justify-center gap-2 rounded-full border border-linen bg-ivory px-6 py-3.5 text-sm font-medium text-navy transition hover:border-marine/40 hover:bg-frost">
                  Dành cho nhà tuyển dụng <ChevronRight className="size-4" />
                </Link>
              </div>
              <dl className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3">
                {[
                  { icon: Building2, tint: "bg-frost", iconColor: "text-marine", value: "1.200+", label: "Việc làm đang mở" },
                  { icon: Users, tint: "bg-blush", iconColor: "text-bronze", value: "8.500+", label: "Kết nối thành công" },
                  { icon: Sparkles, tint: "bg-teal/10", iconColor: "text-teal", value: "92%", label: "Độ khớp AI" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-linen bg-ivory px-4 py-3">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${stat.tint}`}>
                      <stat.icon className={`size-4 ${stat.iconColor}`} />
                    </span>
                    <div>
                      <dd className="text-lg font-semibold tracking-tight text-navy">{stat.value}</dd>
                      <dt className="text-xs text-charcoal/60">{stat.label}</dt>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Lower section: functional cards, clearly detached from hero */}
          <div className="border-t border-linen/70 py-12 sm:py-16">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3.5 py-1.5 text-xs font-semibold text-navy">
                <span className="size-1.5 rounded-full bg-teal" /> Bắt đầu nhanh
              </p>
              <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
                AI matching, đăng nhập và bắt đầu — ngay tại đây.
              </h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
              <div className="relative">
              {/* AI Match preview — light card, navy number, teal bars */}
              <div className="relative h-full overflow-hidden rounded-[2rem] border border-mist/40 bg-white p-6 shadow-[0_20px_56px_rgba(53,92,140,0.12)] sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-navy/70">AI match engine</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-2.5 py-1 text-[11px] font-medium text-navy">
                    <span className="size-1.5 rounded-full bg-teal" /> Đang phân tích
                  </span>
                </div>
                <div className="mt-5 rounded-3xl bg-frost p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-marine">Product Designer</span>
                    <Sparkles className="size-4 text-marine" />
                  </div>
                  <div className="mt-3 flex items-end gap-3">
                    <span className="text-6xl font-semibold tracking-[-0.04em] text-navy">92%</span>
                    <span className="mb-1.5 max-w-32 text-xs leading-5 text-charcoal/60">Mức độ phù hợp cho vị trí này</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full w-[92%] rounded-full bg-teal" />
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    { skill: "Nghiên cứu người dùng", width: "w-[94%]" },
                    { skill: "Figma & Design Systems", width: "w-[90%]" },
                    { skill: "Tư duy sản phẩm", width: "w-[86%]" },
                  ].map((row) => (
                    <div key={row.skill} className="rounded-2xl border border-linen bg-ivory px-4 py-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-charcoal">{row.skill}</span>
                        <span className="flex items-center gap-1 text-xs font-medium text-navy"><Check className="size-3.5 text-teal" /> Khớp cao</span>
                      </div>
                      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-mist/25">
                        <div className={`h-full rounded-full bg-teal ${row.width}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -right-3 -top-6 hidden w-44 rotate-2 rounded-3xl border border-linen bg-white p-4 shadow-[0_12px_32px_rgba(53,92,140,0.12)] sm:block">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/50">
                  <span className="size-1.5 rounded-full bg-sand" /> Live signal
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-navy">+38%</p>
                <p className="mt-1 text-[11px] text-charcoal/60">Tín hiệu phù hợp tuần này</p>
              </div>
            </div>
            <div className="flex h-full flex-col justify-center gap-5 rounded-[2rem] border border-linen bg-white p-5 shadow-[0_12px_32px_rgba(53,92,140,0.08)] sm:p-6">
            <form onSubmit={handleLandingLogin}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-charcoal">Đã có tài khoản?</p>
                  <p className="mt-1 text-xs text-charcoal/60">Đăng nhập để tiếp tục hành trình</p>
                </div>
                <span className="flex size-9 items-center justify-center rounded-full bg-frost">
                  <Lock className="size-4 text-marine" />
                </span>
              </div>
              {loginError && <p className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{loginError}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="relative">
                  <Mail className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-mist" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    placeholder="Email"
                    className="h-11 w-full rounded-2xl border border-linen bg-ivory pl-9 pr-3 text-sm text-charcoal outline-none transition placeholder:text-charcoal/40 focus:border-marine/50 focus:ring-2 focus:ring-marine/10"
                  />
                </label>
                <label className="relative">
                  <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-mist" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="Mật khẩu"
                    className="h-11 w-full rounded-2xl border border-linen bg-ivory pl-9 pr-3 text-sm text-charcoal outline-none transition placeholder:text-charcoal/40 focus:border-marine/50 focus:ring-2 focus:ring-marine/10"
                  />
                </label>
              </div>
              <button type="submit" disabled={loginPending} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-marine text-sm font-semibold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60">
                {loginPending && <Loader2 className="size-4 animate-spin" />}
                {loginPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
              <div className="mt-3 flex items-center justify-between text-xs">
                <Link href="/forgot-password" className="text-charcoal/60 transition hover:text-marine hover:underline">Quên mật khẩu?</Link>
                <Link href="/register" className="font-medium text-charcoal/60 transition hover:text-marine hover:underline">Đăng ký ngay</Link>
              </div>
            </form>
            <div>
              <div className="relative text-center text-[11px] uppercase tracking-wider text-charcoal/45">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-linen" /></div>
                <span className="relative bg-white px-3">Hoặc bắt đầu với HIREAI</span>
              </div>
              <h3 className="mt-3 text-base font-semibold tracking-tight text-charcoal">Bạn mới đến với HIREAI?</h3>
              <p className="mt-1 text-xs leading-5 text-charcoal/60">Chọn lối vào phù hợp — miễn phí, bắt đầu trong một phút.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link href="/register" className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-marine text-sm font-semibold text-white transition hover:bg-navy">
                  Tôi tìm việc <ArrowUpRight className="size-4" />
                </Link>
                <Link href="/nha-tuyen-dung" className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-linen bg-ivory text-sm font-medium text-navy transition hover:border-marine/40 hover:bg-frost">
                  Tôi tuyển dụng <ChevronRight className="size-4" />
                </Link>
              </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Featured jobs — airy parchment section ============ */}
      <section id="jobs" className="scroll-mt-24 border-b border-linen/70 bg-parchment px-4 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3.5 py-1.5 text-xs font-semibold text-navy">
                <span className="size-1.5 rounded-full bg-teal" /> Việc làm nổi bật
              </p>
              <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-5xl">Cơ hội tốt cho người mới bắt đầu.</h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-charcoal/60">Lướt nhẹ, lưu nhanh, ứng tuyển trong vài chạm — không còn cảm giác ngợp.</p>
          </div>
          {/* === Thanh tìm kiếm đa chiều === */}
          <form
            onSubmit={handleJobSearch}
            className="mt-10 rounded-[1.75rem] border border-linen bg-white p-3 shadow-[0_16px_44px_rgba(53,92,140,0.08)] sm:p-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative flex flex-1 items-center">
                <Search className="pointer-events-none absolute left-4 size-4 text-marine" />
                <input
                  ref={searchInputRef}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Thử gõ: React, Python, Remote..."
                  className="h-12 w-full rounded-full border border-linen bg-ivory py-2 pl-11 pr-10 text-sm text-charcoal outline-none transition placeholder:text-charcoal/40 focus:border-marine/50 focus:ring-2 focus:ring-marine/10"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword("")}
                    className="absolute right-2 flex size-7 items-center justify-center rounded-full bg-linen/60 text-charcoal/60 transition hover:bg-marine/10 hover:text-navy"
                    aria-label="Xóa từ khóa"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </label>

              <div className="hidden h-8 w-px shrink-0 bg-linen lg:block" />

              <div className="flex gap-3 lg:w-[340px]">
                <div className="relative flex-1">
                  <Select value={searchLocation} onValueChange={(v) => setSearchLocation(!v || v === "__ALL__" ? "" : v)}>
                    <SelectTrigger className="h-12 w-full justify-between rounded-full border-linen bg-ivory px-4 py-2 text-sm font-normal text-charcoal shadow-none focus:ring-2 focus:ring-marine/10 data-[placeholder]:text-charcoal/40 [&_svg]:text-marine">
                      <span className="flex items-center gap-2 truncate">
                        <MapPin className="size-4 shrink-0 text-marine" />
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

                <div className="relative flex-1">
                  <Select value={searchLevel} onValueChange={(v) => setSearchLevel(!v || v === "__ALL__" ? "" : v)}>
                    <SelectTrigger className="h-12 w-full justify-between rounded-full border-linen bg-ivory px-4 py-2 text-sm font-normal text-charcoal shadow-none focus:ring-2 focus:ring-marine/10 data-[placeholder]:text-charcoal/40 [&_svg]:text-marine">
                      <span className="flex items-center gap-2 truncate">
                        <Layers className="size-4 shrink-0 text-marine" />
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
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-marine px-7 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(53,92,140,0.30)] transition hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marine/30"
              >
                <Search className="size-4" />
                Tìm việc IT
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs text-charcoal/60">
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-linen bg-ivory px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">
                  <span className="flex size-4 items-center justify-center rounded bg-navy text-[10px] font-bold text-white">/</span> để tìm nhanh
                </span>
                <span className="hidden sm:inline text-linen">•</span>
                <span>1.200+ việc làm đang mở</span>
              </p>
              {hasActiveSearch && (
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs text-charcoal/60 sm:inline">
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-linen bg-white px-3 py-1.5 text-xs font-medium text-charcoal transition hover:border-navy hover:bg-navy hover:text-white"
                  >
                    <X className="size-3" /> Xóa lọc
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Tag phổ biến — pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1.5 rounded-full bg-sand/20 px-3 py-1.5 text-xs font-semibold text-charcoal"><Flame className="size-3.5 text-bronze" /> Thử ngay:</span>
            {popularTechTags.map((tag) => {
              const active = searchKeyword.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-navy bg-navy text-white shadow-sm"
                      : "border-linen bg-white text-charcoal/75 hover:border-marine hover:bg-frost hover:text-navy"
                  }`}
                  aria-pressed={active}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* === Job cards — fewer per view, airier === */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {landingFeaturedJobs.map((job) => {
              const bookmarked = isBookmarked(job.id);
              const wm = workModeMeta[job.workMode];
              const WIcon = wm.icon;
              return (
                <article
                  key={job.id}
                  onClick={() => router.push(`/viec-lam?${new URLSearchParams({ keyword: job.title }).toString()}`)}
                  className="group relative flex cursor-pointer flex-col rounded-[1.75rem] border border-linen bg-white p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-marine/30 hover:shadow-[0_20px_48px_rgba(53,92,140,0.12)]"
                >
                  {job.isHot && (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-charcoal">
                      <Flame className="size-3" /> Hot
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-frost font-mono text-xs font-bold text-navy">
                        {job.logo}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-marine">{job.company}</p>
                        <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug tracking-[-0.02em] text-charcoal transition group-hover:text-navy">
                          {job.title}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleBookmark(e, job)}
                      aria-label={bookmarked ? "Bỏ lưu việc làm" : "Lưu việc làm"}
                      aria-pressed={bookmarked}
                      className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marine/20 ${
                        bookmarked
                          ? "border-navy bg-navy text-white"
                          : "border-linen bg-white text-mist hover:border-marine/40 hover:text-marine"
                      } ${job.isHot ? "mt-7" : ""}`}
                      title={bookmarked ? "Đã lưu — bấm để bỏ lưu" : "Lưu việc làm để xem lại sau"}
                    >
                      <Bookmark className={`size-4 ${bookmarked ? "fill-white" : ""}`} />
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-3 py-1.5 text-xs font-bold text-navy">
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1 text-charcoal/60">
                      <MapPin className="size-3 text-marine" /> {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-linen bg-ivory px-2.5 py-1.5 text-[11px] font-medium text-charcoal/75">
                      <WIcon className="size-3 text-teal" /> {wm.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-mist/20 px-3 py-1.5 text-[11px] font-semibold text-navy">{job.level}</span>
                    {job.skills.map((skill) => (
                      <span key={skill} className="rounded-full border border-linen bg-white px-3 py-1.5 text-[11px] font-medium text-charcoal/70">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-linen pt-4 text-xs text-charcoal/55">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-mist" /> {job.postedAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3 text-mist" /> {job.applicants} ứng viên
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-charcoal/60">
              Hiển thị <span className="font-semibold text-navy">6</span> việc nổi bật •{" "}
              {bookmarkCount > 0 ? (
                <span className="font-medium text-marine">
                  Đã lưu {bookmarkCount} việc <Bookmark className="mb-0.5 inline size-3 fill-marine" />
                </span>
              ) : (
                <span>Bấm bookmark để lưu mà không cần mở chi tiết</span>
              )}
            </p>
            <Link
              href="/viec-lam"
              className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-marine"
            >
              Xem tất cả việc làm <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* === Trust Bar — light frost === */}
      <section aria-label="Đối tác và số liệu tin cậy" className="border-y border-mist/25 bg-frost">
        <div className="mx-auto max-w-7xl px-4 sm:px-10 lg:px-16">
          <div className="flex flex-col gap-4 border-b border-navy/10 py-6 md:flex-row md:items-center md:justify-between">
            <p className="shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-charcoal/65">
              Được tin tưởng bởi <span className="font-bold text-navy">500+</span> công ty công nghệ
            </p>
            <div className="hidden items-center gap-1.5 text-xs text-charcoal/55 md:flex">
              <span className="size-1.5 rounded-full bg-teal" /> Dữ liệu thực • Cập nhật 04/09/2026
            </div>
          </div>

          <div className="relative overflow-hidden py-6">
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
                  className="font-mono text-sm font-bold tracking-[0.18em] text-navy/40 transition hover:text-navy/75 sm:text-base"
                  style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                >
                  {name}
                </span>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-frost to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-frost to-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-4 py-8 md:grid-cols-4 md:gap-6">
            {[
              { value: "1.200+", note: "Việc làm đang mở", sub: "Cập nhật mỗi giờ", tint: "bg-white" },
              { value: "8.500+", note: "Kết nối thành công", sub: "↑ 18% tháng này", tint: "bg-white" },
              { value: "<48h", note: "Phản hồi trung bình", sub: "Từ nhà tuyển dụng", tint: "bg-white" },
              { value: "92%", note: "Độ khớp AI trung bình", sub: "Đo trên 12k CV thực", tint: "bg-white" },
            ].map((stat) => (
              <div key={stat.note} className={`rounded-3xl border border-linen px-5 py-5 ${stat.tint}`}>
                <p className="font-mono text-3xl font-semibold tracking-[-0.04em] text-navy">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs font-medium text-charcoal/60">{stat.note}</p>
                <p className="mt-0.5 text-xs text-teal">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-navy/10 py-4 text-xs text-charcoal/60 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2">
              <span className="rounded-full border border-navy/15 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-navy">Đã kiểm duyệt</span>
              Mọi tin tuyển dụng được xác thực trước khi hiển thị
            </p>
            <Link href="/quy-che" className="inline-flex items-center gap-1 font-medium text-navy/80 underline decoration-navy/25 underline-offset-4 transition hover:text-navy">
              Xem quy chế kiểm duyệt <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ Lĩnh vực — airy cards ============ */}
      <section id="tracks" className="scroll-mt-24 bg-ivory px-4 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3.5 py-1.5 text-xs font-semibold text-navy">
                <span className="size-1.5 rounded-full bg-teal" /> Lĩnh vực công nghệ
              </p>
              <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-5xl">Chọn đúng hướng đi trong ngành IT.</h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-charcoal/60">Khám phá cơ hội theo chuyên môn thay vì những danh mục nghề nghiệp chung chung.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {techTracks.map(([number, title, roles], trackIndex) => (
              <Link href="/register" key={title} className="group flex items-end justify-between rounded-[1.75rem] border border-linen bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-marine/30 hover:shadow-[0_20px_48px_rgba(53,92,140,0.10)] sm:p-8">
                <div>
                  <p className={`font-mono text-xs font-semibold ${trackIndex % 2 === 0 ? "text-marine" : "text-teal"}`}>{number}</p>
                  <h3 className="mt-8 text-xl font-semibold text-charcoal group-hover:text-navy sm:text-2xl">{title}</h3>
                  <p className="mt-2 text-sm text-charcoal/60">{roles}</p>
                </div>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-frost transition group-hover:bg-navy">
                  <ArrowUpRight className="size-5 text-marine transition group-hover:text-white" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Công ty — warm cream band ============ */}
      <section id="companies" className="scroll-mt-24 border-y border-linen/70 bg-cream/60 px-4 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-navy">
                <span className="size-1.5 rounded-full bg-sand" /> Công ty nổi bật
              </p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-navy sm:text-5xl">Nơi những sản phẩm mới được tạo ra.</h2>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 self-start rounded-full border border-navy/20 bg-white px-4 py-2 text-sm font-medium text-navy transition hover:border-navy hover:bg-navy hover:text-white md:self-auto">Xem tất cả công ty <ArrowUpRight className="size-4" /></Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {techCompanies.map(([name, field, openings], companyIndex) => (
              <Link href="/register" key={name} className="group rounded-[1.75rem] border border-linen bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-marine/30 hover:shadow-[0_20px_48px_rgba(53,92,140,0.10)]">
                <div className={`flex size-12 items-center justify-center rounded-2xl font-mono text-[10px] font-bold text-white ${companyIndex % 2 === 0 ? "bg-navy" : "bg-marine"}`}>{name.slice(0, 2)}</div>
                <h3 className="mt-8 font-semibold tracking-tight text-charcoal">{name}</h3>
                <p className="mt-1.5 text-sm text-charcoal/60">{field}</p>
                <p className="mt-6 flex items-center justify-between border-t border-linen pt-4 text-xs text-charcoal/60 group-hover:text-navy">
                  {openings}
                  <span className="inline-flex items-center gap-1 rounded-full bg-sand/20 px-2.5 py-1 font-semibold text-charcoal">Đang tuyển <ArrowUpRight className="size-3" /></span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Hai hành trình ============ */}
      <section className="mx-auto max-w-7xl scroll-mt-24 bg-ivory px-4 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3.5 py-1.5 text-xs font-semibold text-navy">
            <span className="size-1.5 rounded-full bg-teal" /> Nền tảng
          </p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-5xl">
            Một nền tảng, hai hành trình trong thế giới công nghệ.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div id="candidates" className="scroll-mt-24 rounded-[2rem] border border-mist/30 bg-blush p-7 sm:p-10">
            <p className="mb-8 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-marine">
              <span className="size-1.5 rounded-full bg-marine" /> 01 / Ứng viên
            </p>
            <h3 className="text-2xl font-semibold tracking-[-0.02em] text-navy sm:text-3xl">Dành cho ứng viên</h3>
            <p className="mt-4 max-w-md leading-7 text-charcoal/70">Xây hồ sơ một lần, nhận gợi ý công việc dựa trên kỹ năng, kinh nghiệm và mục tiêu phát triển của riêng bạn.</p>
            <ul className="mt-8 space-y-3 text-sm text-charcoal">
              {["Tạo CV và hồ sơ tập trung", "Ứng tuyển, theo dõi trạng thái", "Nhận đề xuất công việc từ AI"].map((item, index) => (
                <li key={item} className="flex items-center gap-3 rounded-2xl border border-white bg-white/70 px-4 py-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal/15 font-mono text-[11px] font-bold text-navy">0{index + 1}</span>{item}
                </li>
              ))}
            </ul>
            <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-marine px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy">
              Tạo hồ sơ ngay <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div id="employers" className="scroll-mt-24 rounded-[2rem] border border-sand/40 bg-sandsoft p-7 sm:p-10">
            <p className="mb-8 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-charcoal">
              <span className="size-1.5 rounded-full bg-sand" /> 02 / Doanh nghiệp
            </p>
            <h3 className="text-2xl font-semibold tracking-[-0.02em] text-navy sm:text-3xl">Dành cho doanh nghiệp</h3>
            <p className="mt-4 max-w-md leading-7 text-charcoal/70">Xây dựng đội ngũ kỹ thuật mạnh hơn với dữ liệu kỹ năng, pipeline tuyển dụng và AI matching dành riêng cho ngành IT.</p>
            <ul className="mt-8 space-y-3 text-sm text-charcoal">
              {["Đăng tuyển vị trí IT theo skill stack", "Phân tích CV kỹ thuật tự động", "Đề xuất ứng viên theo seniority"].map((item, index) => (
                <li key={item} className="flex items-center gap-3 rounded-2xl border border-white bg-white/70 px-4 py-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sand/25 font-mono text-[11px] font-bold text-charcoal">0{index + 1}</span>{item}
                </li>
              ))}
            </ul>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-2xl font-semibold tracking-tight text-navy">3.2x</p>
                <p className="mt-1 text-xs text-charcoal/60">Nhanh hơn khi sàng lọc</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="flex items-center gap-1.5 text-2xl font-semibold tracking-tight text-navy">92% <span className="size-1.5 rounded-full bg-teal" /></p>
                <p className="mt-1 text-xs text-charcoal/60">Độ chính xác đề xuất</p>
              </div>
            </div>
            <Link href="/nha-tuyen-dung" className="mt-8 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-marine">
              Khám phá giải pháp tuyển dụng <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* === AI / Intelligence — deep navy anchor === */}
      <section id="intelligence" className="scroll-mt-24 bg-navy px-4 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-mist">
            <span className="size-1.5 rounded-full bg-teal" /> AI match engine
          </p>
          <h2 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
            AI không thay thế tuyển dụng. <span className="text-mist">Mọi quyết định rõ ràng hơn.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/65">
            Ba lớp phân tích chạy trên mỗi hồ sơ và tin tuyển dụng, để hai phía gặp nhau ở điểm phù hợp nhất.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {capabilities.map((capability, capabilityIndex) => (
              <article key={capability.number} className={`rounded-[1.75rem] border p-7 transition hover:-translate-y-1 ${capabilityIndex === 1 ? "border-teal/40 bg-white/[0.08]" : "border-white/10 bg-white/[0.04]"}`}>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm font-semibold text-mist">{capability.number}</p>
                  <span className={`flex size-9 items-center justify-center rounded-full ${capabilityIndex === 1 ? "bg-teal/20" : "bg-mist/15"}`}>
                    <Check className={`size-4 ${capabilityIndex === 1 ? "text-teal" : "text-mist"}`} />
                  </span>
                </div>
                <h3 className="mt-8 text-2xl font-semibold tracking-[-0.02em] text-white">{capability.title}</h3>
                <p className="mt-3 max-w-xs leading-7 text-white/60">{capability.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-white/70">
              <span className="size-1.5 rounded-full bg-teal" /> Điểm phù hợp được tính lại mỗi khi hồ sơ hoặc tin tuyển dụng thay đổi
            </p>
            <Link href="/register" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-mist">
              Trải nghiệm AI matching <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ Workflow ============ */}
      <section id="workflow" className="mx-auto max-w-7xl scroll-mt-24 bg-ivory px-4 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3.5 py-1.5 text-xs font-semibold text-navy">
              <span className="size-1.5 rounded-full bg-teal" /> Một luồng dữ liệu
            </p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-5xl">Từ web đến mobile, mọi tín hiệu tuyển dụng luôn đồng bộ.</h2>
            <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-marine px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy">
              Khám phá nền tảng <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-3 lg:pt-12">
            {[
              { title: "Website tuyển dụng", desc: "Quản lý toàn diện", icon: Code2, chip: "bg-frost", iconColor: "text-marine" },
              { title: "Ứng dụng Android / iOS", desc: "Thông báo tức thì", icon: Phone, chip: "bg-teal/10", iconColor: "text-teal" },
              { title: "Bảng điều hành", desc: "Báo cáo, thống kê", icon: Layers, chip: "bg-sand/20", iconColor: "text-bronze" },
            ].map((item, index) => (
              <div key={item.title} className="rounded-[1.75rem] border border-linen bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(53,92,140,0.10)]">
                <span className={`flex size-11 items-center justify-center rounded-2xl ${item.chip}`}>
                  <item.icon className={`size-5 ${item.iconColor}`} />
                </span>
                <p className="mt-8 font-mono text-xs font-semibold text-charcoal/40">0{index + 1}</p>
                <p className="mt-2 font-semibold text-charcoal">{item.title}</p>
                <p className="mt-1.5 text-sm text-charcoal/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === Footer — deep navy === */}
      <footer className="bg-navy text-ivory">
        <div className="border-b border-white/10 px-4 py-14 sm:px-10 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-sand">
                <span className="size-1.5 rounded-full bg-teal" /> Sàn giao dịch việc làm công nghệ
              </p>
              <h2 className="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl"><span className="block">Tuyển dụng có dữ liệu.</span><span className="block">Quyết định có niềm tin.</span></h2>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:items-end">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-sand px-6 py-3 text-sm font-semibold text-navy transition hover:bg-white">
                Bắt đầu cùng HIRE//AI <ArrowUpRight className="size-4" />
              </Link>
              <p className="text-xs text-white/55">Miễn phí cho ứng viên • Không spam • Ẩn danh khi cần</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
              <div>
                <Link href="/" className="text-lg font-semibold tracking-[-0.04em] text-white">
                  HIRE<span className="text-mist">AI</span>
                </Link>
                <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
                  Nền tảng tuyển dụng chuyên sâu cho ngành IT — kết nối đúng kỹ năng, đúng đội ngũ và đúng cơ hội phát triển bằng AI matching.
                </p>
                <div className="mt-6 flex gap-2">
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:border-transparent hover:bg-sand hover:text-navy">
                    <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.47.09.64-.2.64-.45v-1.6c-2.6.57-3.15-1.1-3.15-1.1-.43-1.08-1.05-1.37-1.05-1.37-.86-.58.06-.57.06-.57.95.07 1.45.98 1.45.98.84 1.44 2.2 1.02 2.74.78.08-.6.33-1.02.6-1.26-2.1-.24-4.3-1.05-4.3-4.67 0-1.03.37-1.87.98-2.53-.1-.24-.42-1.2.09-2.5 0 0 .8-.26 2.62.97a9 9 0 0 1 4.77 0c1.82-1.23 2.62-.97 2.62-.97.51 1.3.19 2.26.09 2.5.61.66.98 1.5.98 2.53 0 3.63-2.2 4.43-4.3 4.67.34.29.65.86.65 1.73v2.57c0 .25.17.54.64.45A9.5 9.5 0 0 0 12 2.5Z" /></svg>
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:border-transparent hover:bg-sand hover:text-navy">
                    <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14Zm-9 14V10H7v7h3Zm1.5-9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17 17v-4c0-1.1-.9-2-2-2s-2 .9-2 2v4h-3V10h3v1c.6-1 1.5-1.5 2.7-1.5 2 0 3.3 1.3 3.3 3.8V17h-2Z" /></svg>
                  </a>
                  <a href="mailto:support@hireai.vn" aria-label="Email" className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:border-transparent hover:bg-sand hover:text-navy">
                    <Mail className="size-4" />
                  </a>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-white/5 px-3 py-1.5 text-xs font-medium text-cream">
                  <span className="size-1.5 rounded-full bg-teal" /> Hệ thống vận hành 24/7 • Dữ liệu mã hóa
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Nền tảng</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-white/65">
                  <li><Link href="/viec-lam" className="transition hover:text-white">Việc làm IT</Link></li>
                  <li><Link href="/nha-tuyen-dung" className="transition hover:text-white">Dành cho nhà tuyển dụng</Link></li>
                  <li><Link href="/#tracks" className="transition hover:text-white">Lĩnh vực công nghệ</Link></li>
                  <li><Link href="/#companies" className="transition hover:text-white">Công ty IT</Link></li>
                  <li><Link href="/tao-cv" className="transition hover:text-white">Tạo CV & Hồ sơ</Link></li>
                  <li><Link href="/#intelligence" className="transition hover:text-white">AI Matching</Link></li>
                  <li><Link href="/dashboard" className="transition hover:text-white">Dành cho doanh nghiệp</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Hỗ trợ</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-white/65">
                  <li><Link href="/lien-he" className="transition hover:text-white">Liên hệ</Link></li>
                  <li><Link href="/ho-tro" className="transition hover:text-white">Trung tâm hỗ trợ</Link></li>
                  <li><Link href="/huong-dan" className="transition hover:text-white">Hướng dẫn ứng viên</Link></li>
                  <li><Link href="/huong-dan-nha-tuyen-dung" className="transition hover:text-white">Hướng dẫn nhà tuyển dụng</Link></li>
                  <li><Link href="/cau-hoi-thuong-gap" className="transition hover:text-white">Câu hỏi thường gặp</Link></li>
                  <li><a href="mailto:support@hireai.vn" className="transition hover:text-white">support@hireai.vn</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Pháp lý & Tuân thủ</h3>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li><Link href="/dieu-khoan" className="inline-flex items-center gap-1.5 text-white/70 transition hover:text-white"><span className="size-1 rounded-full bg-white/40" /> Điều khoản dịch vụ</Link></li>
                  <li><Link href="/bao-mat" className="inline-flex items-center gap-1.5 text-white/70 transition hover:text-white"><span className="size-1 rounded-full bg-white/40" /> Chính sách bảo mật</Link></li>
                  <li><Link href="/bao-mat#du-lieu-ca-nhan" className="inline-flex items-center gap-1.5 font-medium text-sand transition hover:text-white"><span className="size-1 rounded-full bg-sand" /> Bảo vệ dữ liệu cá nhân (NĐ 13/2023)</Link></li>
                  <li><Link href="/quy-che" className="inline-flex items-center gap-1.5 text-white/70 transition hover:text-white"><span className="size-1 rounded-full bg-white/40" /> Quy chế hoạt động sàn</Link></li>
                  <li><Link href="/quy-che#co-che-giai-quyet" className="inline-flex items-center gap-1.5 text-white/60 transition hover:text-white">Cơ chế giải quyết tranh chấp</Link></li>
                  <li><Link href="/bao-mat#cookies" className="inline-flex items-center gap-1.5 text-white/60 transition hover:text-white">Chính sách Cookie</Link></li>
                </ul>
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-white"><Shield className="size-3.5 text-teal" /> Cam kết tuân thủ</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">Tuân thủ Nghị định 52/2013, 13/2023/NĐ-CP &amp; Thông tư 59/2015 về TMĐT. Dữ liệu mã hóa TLS 1.3, lưu trữ tại Việt Nam.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-y border-white/10 bg-white/[0.03] px-4 py-6 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 text-xs leading-5 text-white/60 md:grid-cols-3">
              <div className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-sand"><MapPin className="size-3.5" /></span>
                <div>
                  <p className="font-medium text-white">Công ty TNHH HIREAI Việt Nam</p>
                  <p>Tầng 8, Tòa Innovation, 123 Nguyễn Huệ, Q.1, TP.HCM</p>
                  <p>MST: 0312345678 • Cấp ngày 15/03/2024 • Sở KH&ĐT TP.HCM</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-sand"><Phone className="size-3.5" /></span>
                <div>
                  <p className="font-medium text-white">Liên hệ</p>
                  <p><a href="tel:1900636890" className="transition hover:text-white">1900 636 890</a> (8:00–18:00 T2–T6)</p>
                  <p><a href="mailto:support@hireai.vn" className="transition hover:text-white">support@hireai.vn</a> • <a href="mailto:legal@hireai.vn" className="transition hover:text-white">legal@hireai.vn</a></p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-sand"><FileText className="size-3.5" /></span>
                <div>
                  <p className="font-medium text-white">Giấy phép &amp; Chứng nhận</p>
                  <p>Đã đăng ký Bộ Công Thương • DMCA Protected</p>
                  <p className="mt-1 inline-flex items-center gap-1.5">Đã thông báo <span className="rounded bg-sand px-1.5 py-0.5 text-[10px] font-bold text-navy">BỘ CÔNG THƯƠNG</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-10 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
              <span>© 2026 HIRE//AI. Bảo lưu mọi quyền.</span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="inline-flex items-center gap-1.5">Vận hành bởi <span className="font-medium text-white/75">HIREAI</span> <span className="rounded-full border border-white/15 px-2 py-0.5 font-mono text-[10px] leading-none">v2.4 • SOC 2</span></span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2 text-white/50">
                <span className="hidden sm:inline">Ngôn ngữ:</span>
                <span className="font-medium text-white">Tiếng Việt</span>
                <span className="text-white/20">|</span>
                <a href="#" className="transition hover:text-white">English</a>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-white/55">TLS 1.3</span>
                <span className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-white/55">ISO 27001</span>
                <span className="rounded border border-teal/30 bg-teal/15 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-mist">NĐ 13/2023</span>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-7xl border-t border-white/10 pt-6 text-[11px] leading-5 text-white/45">
            HIREAI là sàn giao dịch TMĐT việc làm chuyên ngành IT. Mọi tin tuyển dụng được kiểm duyệt; ứng viên tự chịu trách nhiệm về tính chính xác của hồ sơ. Tranh chấp được giải quyết theo <Link href="/quy-che#co-che-giai-quyet" className="underline decoration-white/20 underline-offset-4 hover:text-white/70">Quy chế hoạt động</Link> và pháp luật Việt Nam. Không thu phí ứng viên; nhà tuyển dụng chịu phí theo bảng giá công khai.
          </p>
        </div>
      </footer>
    </main>
  );
}
