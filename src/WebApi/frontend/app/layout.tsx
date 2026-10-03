import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Be_Vietnam_Pro, JetBrains_Mono, Merriweather } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Be Vietnam Pro: font thiết kế cho tiếng Việt, có subset "vietnamese".
// Thay Outfit (data next/font: chỉ latin/latin-ext → vỡ glyph Ệ/Trường).
const sans = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  // Như trên: chip kỹ năng/tags trong CV dùng font-mono chứa tiếng Việt.
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-code",
  display: "swap",
});

// Merriweather: serif có subset vietnamese cho tiêu đề CV (culinary,
// legal, elegant-serif...). Georgia hệ thống thiếu trên một số nền tảng
// nên chữ ư/ệ bị fallback giật nét — font này đảm bảo đồng nhất.
const serif = Merriweather({
  weight: ["400", "700", "900"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HIREAI — Việc làm IT & AI matching",
    template: "%s | HIREAI",
  },
  description:
    "Nền tảng tuyển dụng chuyên sâu cho ngành công nghệ — kết nối đúng kỹ năng, đúng đội ngũ và đúng cơ hội phát triển bằng AI matching.",
  metadataBase: new URL("https://hireai.vn"),
  openGraph: {
    title: "HIREAI — Đúng người. Đúng việc. Đúng thời điểm.",
    description:
      "1.200+ việc làm IT đang mở. Tạo CV, nhận gợi ý công việc từ AI, ứng tuyển và theo dõi trạng thái.",
    type: "website",
    locale: "vi_VN",
  },
  twitter: {
    card: "summary_large_image",
    title: "HIREAI — Việc làm IT & AI matching",
    description:
      "Nền tảng tuyển dụng chuyên sâu cho ngành IT với AI matching theo kỹ năng và seniority.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[#151515] focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-lg"
        >
          Bỏ qua tới nội dung chính
        </a>
        <Suspense
          fallback={
            <div className="flex min-h-dvh items-center justify-center bg-background px-6" aria-busy="true" aria-label="Đang tải">
              <div className="w-full max-w-3xl space-y-4" aria-hidden="true">
                <div className="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
                <div className="grid gap-3 pt-4 sm:grid-cols-3">
                  <div className="h-28 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-28 animate-pulse rounded-2xl bg-muted [animation-delay:120ms]" />
                  <div className="h-28 animate-pulse rounded-2xl bg-muted [animation-delay:240ms]" />
                </div>
                <p className="sr-only">Đang tải…</p>
              </div>
            </div>
          }
        >
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
