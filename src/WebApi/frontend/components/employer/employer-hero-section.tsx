import Link from "next/link";
import {
  ArrowRight,
  Building2,
  FileSearch,
  KanbanSquare,
  Shield,
  Sparkles,
  ArrowUpRight,
  Users,
} from "lucide-react";

/**
 * Employer hero — landing visual language (ivory/navy/marine, airy
 * container, pill CTAs) with a pipeline/flow motif instead of the
 * landing's orbit arcs: dotted connectors, connection nodes, soft glows.
 * Content unchanged; navbar/routes/logic untouched.
 */

const PIPELINE_ROWS = [
  { name: "Nguyễn Văn A", match: "96% khớp", stage: "Phỏng vấn vòng 2", width: "w-[96%]", bar: "bg-teal" },
  { name: "Trần Thị B", match: "89% khớp", stage: "Phỏng vấn vòng 1", width: "w-[89%]", bar: "bg-marine" },
  { name: "Lê Văn C", match: "84% khớp", stage: "Chờ phản hồi", width: "w-[84%]", bar: "bg-mist" },
] as const;

const PIPELINE_STATS = [
  ["38", "Hồ sơ mới"],
  ["12", "Đã phỏng vấn"],
  ["4", "Chờ offer"],
] as const;

/** Full-bleed section backdrop in the landing spirit (large sage arcs,
 *  dotted navy flow, soft suns) but composed as a pipeline stream that
 *  converges toward the visual block. Text stays dominant via low
 *  opacity + gradient wash. */
function EmployerHeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden dark:opacity-60">
      <svg
        viewBox="0 0 1440 640"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 hidden h-full w-full sm:block"
      >
        {/* large sage arcs, left — landing spirit, different amplitude */}
        <path d="M-80 620 A 620 620 0 0 1 900 620" fill="none" stroke="#7fae9b" strokeWidth="5" strokeLinecap="round" opacity="0.45" />
        <path d="M60 620 A 480 480 0 0 1 880 620" fill="none" stroke="#7fae9b" strokeWidth="2.5" strokeLinecap="round" opacity="0.30" />
        {/* dotted navy pipeline stream converging right toward the card */}
        <path
          d="M120 180 C 360 140, 520 220, 760 200 S 1080 160, 1290 220"
          fill="none"
          stroke="#355c8c"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="1 12"
          opacity="0.55"
        />
        <path
          d="M60 480 C 300 440, 560 520, 820 470 S 1150 430, 1360 470"
          fill="none"
          stroke="#355c8c"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="1 10"
          opacity="0.30"
        />
        {/* soft suns */}
        <circle cx="180" cy="130" r="46" fill="#d7b98e" opacity="0.30" />
        <circle cx="180" cy="130" r="26" fill="#d7b98e" opacity="0.40" />
        <circle cx="1260" cy="480" r="34" fill="#8fb3cf" opacity="0.30" />
        {/* nodes along the stream */}
        <circle cx="420" cy="178" r="8" fill="#ffffff" stroke="#355c8c" strokeWidth="3" opacity="0.8" />
        <circle cx="760" cy="200" r="8" fill="#ffffff" stroke="#7fae9b" strokeWidth="3" opacity="0.8" />
        {/* extra thin arc right + short dotted connectors + small nodes */}
        <path d="M1080 120 A 150 150 0 0 1 1330 300" fill="none" stroke="#355c8c" strokeWidth="2" strokeLinecap="round" opacity="0.22" />
        <path d="M200 320 l40 -24 M1040 400 l36 14" stroke="#7fae9b" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" opacity="0.45" />
        <circle cx="240" cy="296" r="5" fill="#7fae9b" opacity="0.55" />
        <circle cx="1076" cy="414" r="5" fill="#d7b98e" opacity="0.65" />
        <circle cx="300" cy="462" r="6" fill="#d7b98e" opacity="0.7" />
        <circle cx="980" cy="452" r="6" fill="#8fb3cf" opacity="0.7" />
        {/* faint continuation: short dotted flow + candidate nodes */}
        <path d="M1140 200 C 1180 260, 1160 340, 1210 400" fill="none" stroke="#7fae9b" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" opacity="0.35" />
        <circle cx="1195" cy="330" r="9" fill="#ffffff" stroke="#355c8c" strokeWidth="2.5" opacity="0.55" />
        <circle cx="1195" cy="326" r="3" fill="none" stroke="#355c8c" strokeWidth="1.5" />
        <circle cx="240" cy="420" r="5" fill="#7fae9b" opacity="0.5" />
      </svg>
      <div className="absolute -left-24 top-16 size-72 rounded-full bg-sage/15 blur-3xl" />
      <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-marine/15 blur-3xl" />
      <div className="absolute left-1/3 top-1/4 size-44 rounded-full bg-teal/10 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-b from-ivory/70 via-ivory/40 to-ivory" />
    </div>
  );
}

/** Pipeline/flow connectors tying floating badges to the card. */
function EmployerCardConnectors() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 560 120"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -top-24 left-0 hidden h-24 w-full sm:block"
    >
      <path
        d="M90 110 C 90 70, 140 60, 180 44 S 300 20, 340 24"
        fill="none"
        stroke="#355c8c"
        strokeOpacity="0.30"
        strokeWidth="2"
        strokeDasharray="2 8"
        strokeLinecap="round"
      />
      <path
        d="M470 110 C 470 76, 430 66, 400 50"
        fill="none"
        stroke="#7fae9b"
        strokeOpacity="0.40"
        strokeWidth="2"
        strokeDasharray="2 8"
        strokeLinecap="round"
      />
      <circle cx="90" cy="110" r="5" fill="#ffffff" stroke="#355c8c" strokeWidth="2.5" />
      <circle cx="470" cy="110" r="5" fill="#ffffff" stroke="#7fae9b" strokeWidth="2.5" />
    </svg>
  );
}

export function EmployerHeroVisual() {
  return (
    <div className="relative mt-4 lg:mt-0">
      <EmployerCardConnectors />
      {/* Floating badges */}
      <div className="absolute -top-8 left-2 z-10 hidden items-center gap-1.5 rounded-full border border-linen bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-navy shadow-sm backdrop-blur animate-float sm:inline-flex" style={{ animationDelay: "0.4s" }}>
        <FileSearch className="size-3.5 text-marine" /> Hồ sơ phù hợp
      </div>
      <div className="absolute -top-5 right-6 z-10 hidden items-center gap-1.5 rounded-full border border-linen bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-navy shadow-sm backdrop-blur animate-float sm:inline-flex">
        <Sparkles className="size-3.5 text-teal" /> AI chấm điểm
      </div>
      <div className="absolute -bottom-4 left-10 z-10 hidden items-center gap-1.5 rounded-full border border-linen bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-navy shadow-sm backdrop-blur animate-float sm:inline-flex" style={{ animationDelay: "1.2s" }}>
        <Users className="size-3.5 text-bronze" /> Phỏng vấn
      </div>
      <div className="absolute -bottom-3 right-8 z-10 hidden items-center gap-1.5 rounded-full border border-linen bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-navy shadow-sm backdrop-blur sm:inline-flex">
        <span className="size-1.5 rounded-full bg-teal" /> Chờ offer • 4
      </div>

      <div className="relative rounded-[2rem] border border-linen bg-white p-8 shadow-[0_28px_72px_rgba(53,92,140,0.14)] ring-1 ring-white lg:p-10">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy/70">
            <KanbanSquare className="size-4 text-marine" /> Pipeline tuyển dụng
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-[11px] font-medium text-navy">
            <span className="size-1.5 rounded-full bg-teal" /> Senior Frontend • 24 hồ sơ
          </span>
        </div>
        <div className="mt-5 space-y-3">
          {PIPELINE_ROWS.map((row) => (
            <div key={row.name} className="rounded-2xl border border-linen bg-ivory px-4 py-3.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-charcoal">
                  {row.name} <span className="text-marine">— {row.match}</span>
                </span>
                <span className="shrink-0 text-xs text-charcoal/55">{row.stage}</span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white">
                <div className={`h-full rounded-full ${row.bar} ${row.width}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-linen pt-5">
          {PIPELINE_STATS.map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-frost px-3 py-3 text-center">
              <p className="font-mono text-xl font-semibold text-navy">{value}</p>
              <p className="mt-0.5 text-[11px] text-charcoal/60">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmployerHeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-linen/70 px-4 pb-24 pt-28 sm:px-10 sm:pt-32 lg:px-16 lg:pb-32 lg:pt-36">
      <EmployerHeroBackdrop />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div className="animate-slide-in">
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
            <Link href="/employer/register" className="group inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(53,92,140,0.30)] transition hover:bg-marine">
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

        <EmployerHeroVisual />
      </div>
    </section>
  );
}

const VALUE_CARDS = [
  {
    icon: FileSearch,
    tint: "bg-frost",
    iconColor: "text-marine",
    title: "Lọc hồ sơ bằng AI",
    description: "AI đọc hiểu từng CV và loại nhiễu, bạn chỉ xem hồ sơ đáng xem.",
  },
  {
    icon: ArrowUpRight,
    tint: "bg-teal/10",
    iconColor: "text-teal",
    title: "Xếp hạng ứng viên theo độ khớp",
    description: "Điểm match rõ ràng cho từng người, từ Fresher đến Manager.",
  },
  {
    icon: Users,
    tint: "bg-sand/20",
    iconColor: "text-bronze",
    title: "Theo dõi pipeline theo thời gian thực",
    description: "Mọi vòng phỏng vấn và offer nằm gọn trên một bảng điều hành.",
  },
];

/** Quick value cards strip directly under the hero (Option B). */
export function EmployerValueCards() {
  return (
    <section className="border-b border-linen/70 bg-white px-4 py-14 sm:px-10 lg:px-16 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
        {VALUE_CARDS.map((card) => (
          <div key={card.title} className="rounded-3xl border border-linen bg-ivory p-6 transition hover:border-marine/30 hover:shadow-[0_16px_40px_rgba(53,92,140,0.10)]">
            <span className={`flex size-10 items-center justify-center rounded-2xl ${card.tint}`}>
              <card.icon className={`size-5 ${card.iconColor}`} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-charcoal">{card.title}</h2>
            <p className="mt-1.5 text-sm leading-6 text-charcoal/60">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
