"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useLogin } from "@refinedev/core";
import { ArrowUpRight, Check, ChevronRight, Code2, Loader2, Lock, Mail, Search, Sparkles } from "lucide-react";

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

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const { mutateAsync: login, isPending: loginPending } = useLogin();

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
          <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-[#151515]/15 bg-[#f5f5f3] p-3 shadow-[0_18px_50px_rgba(21,21,21,.06)] sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#65756d]" />
              <input className="h-12 w-full rounded-xl border border-[#151515]/10 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#151515]/50" placeholder="Tìm vị trí: Frontend, Data Engineer..." />
            </label>
            <button type="button" className="h-12 rounded-xl bg-[#151515] px-6 text-sm font-medium text-white transition hover:bg-black">Tìm việc IT</button>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Frontend Developer", "Backend Engineer", "Mobile Developer", "Data & AI", "DevOps / Cloud", "QA Engineer", "Product Tech"].map((role) => (
              <span key={role} className="rounded-full border border-[#151515]/15 bg-white px-4 py-2 text-sm text-[#39443f] transition hover:border-[#151515]/50 hover:bg-[#f5f5f3]">{role}</span>
            ))}
          </div>
          <div className="mt-12 grid gap-3 md:grid-cols-3">
            {[
              ["Senior Frontend Engineer", "React · TypeScript", "Hà Nội / Hybrid"],
              ["Machine Learning Engineer", "Python · MLOps", "Hồ Chí Minh / Remote"],
              ["Cloud & DevOps Engineer", "Azure · Kubernetes", "Remote / Việt Nam"],
            ].map(([title, skills, location], index) => (
              <article key={title} className="group rounded-2xl border border-[#151515]/15 bg-[#f5f5f3] p-5 transition duration-300 hover:-translate-y-1 hover:bg-[#151515] hover:text-white">
                <div className="flex items-center justify-between text-[#65756d] group-hover:text-white/60"><Code2 className="size-5" /><span className="font-mono text-xs">0{index + 1}</span></div>
                <h3 className="mt-12 text-lg font-medium">{title}</h3>
                <p className="mt-2 text-sm text-[#65756d] group-hover:text-white/60">{skills}</p>
                <div className="mt-5 flex items-center justify-between border-t border-[#151515]/10 pt-4 text-xs text-[#65756d] group-hover:border-white/15 group-hover:text-white/60"><span>{location}</span><ArrowUpRight className="size-4" /></div>
              </article>
            ))}
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

      <footer className="bg-[#151515] px-6 py-20 text-[#f5f5f3] sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="max-w-2xl text-4xl font-medium leading-[1.05] tracking-[-0.06em] sm:text-6xl">Tuyển dụng có dữ liệu. Quyết định có niềm tin.</h2>
            <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-[#151515] transition hover:bg-[#dededb]">Bắt đầu cùng HIRE//AI <ArrowUpRight className="size-4" /></Link>
          </div>
          <div className="text-sm text-white/50 sm:text-right"><p>HIRE//AI © 2026</p><p className="mt-2">Data-led matching</p></div>
        </div>
      </footer>
    </main>
  );
}
