import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="grain flex min-h-dvh items-center justify-center bg-[#f5f5f3] px-6 py-20 text-[#151515]"
    >
      <div className="w-full max-w-xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#65756d]">
          404 — Không tìm thấy trang
        </p>
        <h1 className="mt-6 text-balance text-5xl font-medium leading-[1.02] tracking-[-0.06em] sm:text-6xl">
          Trang này đã chuyển đi hoặc không còn nữa.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-7 text-[#65756d]">
          Liên kết có thể đã cũ. Quay lại trang chủ hoặc mở danh sách việc làm
          IT đang tuyển để tiếp tục.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#151515] px-5 py-3 text-sm font-medium text-white transition hover:bg-black active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151515]/40"
          >
            Về trang chủ
          </Link>
          <Link
            href="/viec-lam"
            className="inline-flex items-center gap-2 rounded-full border border-[#151515]/20 bg-white px-5 py-3 text-sm transition hover:border-[#151515] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151515]/30"
          >
            Xem việc làm IT
          </Link>
          <Link
            href="/lien-he"
            className="px-2 py-3 text-sm text-[#65756d] underline decoration-[#151515]/20 underline-offset-4 transition hover:text-[#151515]"
          >
            Liên hệ hỗ trợ
          </Link>
        </div>
      </div>
    </main>
  );
}
