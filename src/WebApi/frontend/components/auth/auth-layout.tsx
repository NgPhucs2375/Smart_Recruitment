import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

interface AuthLayoutProps {
  children: React.ReactNode;
  leftPanel?: React.ReactNode;
}

/**
 * Shared orbit backdrop — lighter reuse of the landing illustration
 * language (concentric arcs, dotted journey, glowing nodes) in
 * monochrome-on-navy. Presentational only.
 */
function AuthOrbitBackdrop() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <circle cx="520" cy="140" r="190" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1.5" />
      <circle cx="520" cy="140" r="130" fill="none" stroke="#ffffff" strokeOpacity="0.10" strokeWidth="1.5" />
      <circle cx="520" cy="140" r="70" fill="none" stroke="#7fae9b" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="2 8" strokeLinecap="round" />
      <circle cx="520" cy="140" r="6" fill="#7fae9b" opacity="0.9" />
      <circle cx="418" cy="222" r="4" fill="#d7b98e" opacity="0.9" />
      <circle cx="120" cy="620" r="130" fill="none" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1.5" />
      <path d="M60 700 C 180 640, 260 680, 380 620 S 520 560, 560 580" fill="none" stroke="#7fae9b" strokeOpacity="0.30" strokeWidth="2" strokeDasharray="1 10" strokeLinecap="round" />
    </svg>
  );
}

export function AuthLayout({ children, leftPanel }: AuthLayoutProps) {
  return (
    <div className="theme-auth min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[52fr_48fr]">
      {/* Left Panel */}
      <div className="relative hidden min-h-dvh flex-col justify-between overflow-hidden border-r border-white/10 bg-primary-hover p-12 text-white lg:flex xl:p-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6TTMwIDM4djJIMnYtMmgzd00zNiAyNnYySDJ2LTJoMzR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-25" />
        <AuthOrbitBackdrop />

        {/* Top brand */}
        <div className="relative z-10">
          <div className="mb-12">
            <BrandLogo href="/" variant="light" size="md" showTagline />
          </div>
          {leftPanel}
        </div>

        {/* Security badge footer */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck className="size-4 text-sage" />
          <span>Hệ thống bảo vệ dữ liệu hồ sơ theo tiêu chuẩn mã hóa SHA-256</span>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex min-h-dvh items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-white/70 p-6 shadow-[0_24px_80px_rgba(47,52,64,.06)] backdrop-blur-md sm:p-10">
          {/* Mobile Logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo href="/" variant="workspace" size="auth" showTagline />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
