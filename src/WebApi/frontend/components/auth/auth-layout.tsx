import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  leftPanel?: React.ReactNode;
}

export function AuthLayout({ children, leftPanel }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f4f2ed] text-[#202a33] lg:grid lg:grid-cols-2">
      {/* Left Panel */}
      <div className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-[#d8d5ce] bg-[#151515] p-12 text-white lg:flex xl:p-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6TTMwIDM4djJIMnYtMmgzd00zNiAyNnYySDJ2LTJoMzR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-25" />

        {/* Top brand */}
        <div className="relative z-10">
          <Link href="/" className="mb-12 flex items-center gap-3 text-white">
            <div className="size-3 rounded-full bg-white" />
            <span className="font-mono text-sm tracking-[0.25em]">HIRE//AI</span>
          </Link>
          {leftPanel}
        </div>

        {/* Security badge footer */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span>Hệ thống bảo vệ dữ liệu hồ sơ theo tiêu chuẩn mã hóa SHA-256</span>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex min-h-screen items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md rounded-[2rem] border border-[#d8d5ce] bg-white/70 p-6 shadow-[0_24px_80px_rgba(32,42,51,.06)] backdrop-blur-md sm:p-10">
          {/* Mobile Logo */}
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#151515] text-white">
              <Sparkles className="size-6" />
            </Link>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#151515]">HIRE//AI</h1>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
