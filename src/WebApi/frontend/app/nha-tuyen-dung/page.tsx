import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  FileSearch,
  Layers,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

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
    iconColor: "text-[#8A6A3B]",
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
    <main className="min-h-screen bg-ivory text-charcoal">
      {/* Top nav */}
      <nav aria-label="Điều hướng chính" className="fixed inset-x-0 top-0 z-50 border-b border-linen/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-10 lg:px-16">
          <Link href="/" className="shrink-0 text-sm font-semibold tracking-[-0.03em] text-navy">
            HIRE<span className="text-marine">AI</span>
          </Link>
          <div className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
            {[
              ["Tính năng", "#tinh-nang"],
              ["Quy trình", "#quy-trinh"],
              ["Bảng giá", "#lien-he"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs text-charcoal/60 transition hover:bg-mist/20 hover:text-navy"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link href="/login" className="hidden rounded-full px-3.5 py-1.5 text-xs font-medium text-charcoal/70 transition hover:text-navy sm:inline-flex">
              Đăng nhập
            </Link>
            <Link href="/register" className="inline-flex shrink-0 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white transition hover:bg-marine">
              Đăng tuyển ngay
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-linen/70 px-4 pb-16 pt-28 sm:px-10 sm:pt-32 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-marine/20 bg-frost px-3.5 py-1.5 text-xs font-semibold text-navy">
              <Building2 className="size-3.5 text-marine" /> Dành cho nhà tuyển dụng IT
            </p>
            <h1 className="mt-6 max-w-2xl text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.03em] text-navy sm:text-6xl">
              Tuyển đúng người IT,{" "}
              <span className="text-marine">không cần lọc hàng trăm CV.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-charcoal/70 sm:text-lg">
              Đăng tin theo skill stack, nhận hồ sơ đã được AI chấm điểm và quản lý toàn bộ pipeline trên một bảng điều hành duy nhất.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="group inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(53,92,140,0.30)] transition hover:bg-marine">
                Bắt đầu tuyển dụng <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link href="/lien-he" className="inline-flex items-center justify-center gap-2 rounded-full border border-linen bg-white px-6 py-3.5 text-sm font-medium text-navy transition hover:border-marine/40 hover:bg-frost">
                Đặt lịch demo
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-charcoal/55">
              <Shield className="size-3.5 text-teal" /> Tin tuyển dụng được kiểm duyệt • Dữ liệu mã hóa TLS 1.3
            </p>
          </div>

          {/* Pipeline preview card */}
          <div className="rounded-[2rem] border border-linen bg-white p-6 shadow-[0_20px_56px_rgba(53,92,140,0.10)] sm:p-8">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-navy/70">Pipeline tuyển dụng</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-[11px] font-medium text-navy">
                <span className="size-1.5 rounded-full bg-teal" /> Senior Frontend • 24 hồ sơ
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                { name: "Nguyễn Văn A — 96% khớp", stage: "Phỏng vấn vòng 2", width: "w-[96%]", bar: "bg-teal" },
                { name: "Trần Thị B — 89% khớp", stage: "Phỏng vấn vòng 1", width: "w-[89%]", bar: "bg-marine" },
                { name: "Lê Văn C — 84% khớp", stage: "Chờ phản hồi", width: "w-[84%]", bar: "bg-mist" },
              ].map((row) => (
                <div key={row.name} className="rounded-2xl border border-linen bg-ivory px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-charcoal">{row.name}</span>
                    <span className="shrink-0 text-xs text-charcoal/55">{row.stage}</span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white">
                    <div className={`h-full rounded-full ${row.bar} ${row.width}`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-linen pt-5">
              {[
                ["38", "Hồ sơ mới"],
                ["12", "Đã phỏng vấn"],
                ["4", "Chờ offer"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-frost px-3 py-3 text-center">
                  <p className="text-xl font-semibold text-navy">{value}</p>
                  <p className="mt-0.5 text-[11px] text-charcoal/60">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="border-b border-linen/70 bg-white px-4 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-3xl border border-linen bg-ivory px-5 py-5">
              <p className="font-mono text-3xl font-semibold tracking-tight text-navy">{m.value}</p>
              <p className="mt-1.5 text-xs leading-5 text-charcoal/60">{m.label}</p>
            </div>
          ))}
        </div>
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
          <div className="mt-10 grid gap-5 md:grid-cols-3">
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
          </div>
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
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.number} className="rounded-[1.75rem] border border-linen bg-white p-7 sm:p-8">
                <p className="font-mono text-sm font-bold text-marine">{s.number}</p>
                <h3 className="mt-4 text-lg font-semibold text-charcoal">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-charcoal/60">{s.description}</p>
              </div>
            ))}
          </div>
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
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-sand px-6 py-3.5 text-sm font-semibold text-navy transition hover:bg-white">
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
