import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  FileSearch,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";
import { EmployerHeroSection, EmployerValueCards } from "@/components/employer/employer-hero-section";
import { EmployerNavLinks } from "@/components/landing/employer-nav-links";
import { PublicHeader } from "@/components/landing/public-header";
import { Reveal } from "@/components/landing/reveal";

const metrics = [
  { value: "3.2x", label: "Nhanh hơn khi sàng lọc hồ sơ" },
  { value: "92%", label: "Độ chính xác đề xuất ứng viên" },
  { value: "<48h", label: "Phản hồi trung bình từ ứng viên" },
  { value: "500+", label: "Công ty công nghệ đang tuyển" },
];

const features = [
  {
    icon: Layers,
    tint: "bg-frost",
    iconColor: "text-marine",
    title: "Đăng tuyển theo skill stack",
    description:
      "Mô tả vị trí theo kỹ năng cụ thể — Frontend, Backend, Data, DevOps — thay vì danh mục chung chung. Tin tuyển dụng đến đúng người ngay từ đầu.",
  },
  {
    icon: FileSearch,
    tint: "bg-teal/10",
    iconColor: "text-teal",
    title: "Phân tích CV kỹ thuật tự động",
    description:
      "AI đọc hiểu từng CV: trích xuất kỹ năng, kinh nghiệm và tín hiệu phù hợp để bạn không phải lọc thủ công hàng trăm hồ sơ.",
  },
  {
    icon: Users,
    tint: "bg-sand/20",
    iconColor: "text-bronze",
    title: "Đề xuất ứng viên theo seniority",
    description:
      "Nhận danh sách ứng viên xếp hạng theo độ phù hợp — từ Fresher đến Manager — kèm điểm match rõ ràng cho từng người.",
  },
];

const steps = [
  {
    number: "01",
    title: "Đăng tin tuyển dụng",
    description: "Tạo tin theo mẫu chuẩn IT, gắn skill stack và khoảng lương minh bạch.",
  },
  {
    number: "02",
    title: "Nhận hồ sơ đã chấm điểm",
    description: "AI phân tích và xếp hạng ứng viên theo độ phù hợp với vị trí.",
  },
  {
    number: "03",
    title: "Phỏng vấn và chốt offer",
    description: "Quản lý pipeline, lịch phỏng vấn và trạng thái ứng viên tập trung.",
  },
];

export default function RecruiterLandingPage() {
  return (
    <main className="min-h-dvh bg-ivory text-charcoal">
      {/* Top nav */}
      <PublicHeader
        nav={<EmployerNavLinks large />}
        mobileNav={<EmployerNavLinks />}
        loginHref="/employer/login"
        ctaHref="/employer/register"
        ctaLabel="Đăng tuyển ngay"
      />

      {/* Hero */}
      <EmployerHeroSection />

      {/* Quick value cards */}
      <EmployerValueCards />

      {/* Metrics */}
      <section className="border-b border-linen/70 bg-white px-4 py-12 sm:px-10 lg:px-16">
        <Reveal stagger className="mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-3xl border border-linen bg-ivory px-5 py-5">
              <p className="font-mono text-3xl font-semibold tracking-tight text-navy">{m.value}</p>
              <p className="mt-1.5 text-xs leading-5 text-charcoal/60">{m.label}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Features */}
      <section id="tinh-nang" className="scroll-mt-24 bg-ivory px-4 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-marine/20 bg-frost px-3.5 py-1.5 text-xs font-semibold text-navy">
            <Sparkles className="size-3.5 text-marine" /> Tính năng
          </p>
          <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-5xl">
            Mọi thứ nhà tuyển dụng cần, gói gọn trong một nơi.
          </h2>
          <Reveal stagger className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((f) => (
              <article key={f.title} className="rounded-[1.75rem] border border-linen bg-white p-7 transition hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(53,92,140,0.10)] sm:p-8">
                <span className={`flex size-12 items-center justify-center rounded-2xl ${f.tint}`}>
                  <f.icon className={`size-6 ${f.iconColor}`} />
                </span>
                <h3 className="mt-6 text-xl font-semibold tracking-tight text-charcoal">{f.title}</h3>
                <p className="mt-3 text-sm leading-6 text-charcoal/65">{f.description}</p>
                <p className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-teal">
                  <Check className="size-3.5" /> Đã bao gồm trong gói chuẩn
                </p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Workflow */}
      <section id="quy-trinh" className="scroll-mt-24 border-y border-linen/70 bg-parchment px-4 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-navy">
            <span className="size-1.5 rounded-full bg-sand" /> Quy trình
          </p>
          <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-5xl">
            Từ tin tuyển dụng đến offer trong 3 bước.
          </h2>
          <Reveal stagger className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.number} className="rounded-[1.75rem] border border-linen bg-white p-7 sm:p-8">
                <p className="font-mono text-sm font-bold text-marine">{s.number}</p>
                <h3 className="mt-4 text-lg font-semibold text-charcoal">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-charcoal/60">{s.description}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* CTA + contact */}
      <section id="lien-he" className="scroll-mt-24 bg-navy px-4 py-20 sm:px-10 lg:px-16 lg:py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-sand">
              <span className="size-1.5 rounded-full bg-teal" /> Bắt đầu ngay hôm nay
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
              Đội ngũ kỹ thuật tiếp theo của bạn đang ở đây.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
              Tạo tài khoản doanh nghiệp miễn phí, đăng tin đầu tiên trong vài phút. Cần tư vấn? Liên hệ đội ngũ hỗ trợ.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            <Link href="/employer/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-sand px-6 py-3.5 text-sm font-semibold text-navy transition hover:bg-white">
              Đăng ký tài khoản doanh nghiệp <ArrowUpRight className="size-4" />
            </Link>
            <Link href="/lien-he" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/10">
              Liên hệ tư vấn
            </Link>
          </div>
        </div>
      </section>

      {/* Mini footer */}
      <footer className="border-t border-white/10 bg-navy px-4 py-8 text-ivory sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm font-semibold tracking-[-0.03em] text-white">
            HIRE<span className="text-mist">AI</span> <span className="ml-2 font-normal text-white/45">© 2026 — Bảo lưu mọi quyền.</span>
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="transition hover:text-white">Dành cho ứng viên</Link>
            <Link href="/quy-che" className="transition hover:text-white">Quy chế hoạt động</Link>
            <Link href="/bao-mat" className="transition hover:text-white">Bảo mật</Link>
            <Link href="/lien-he" className="transition hover:text-white">Liên hệ</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
