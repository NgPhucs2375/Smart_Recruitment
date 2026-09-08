import Link from "next/link";
import { ArrowLeft, FileText, Shield } from "lucide-react";

export default function DieuKhoanPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f3] text-[#151515]">
      <header className="border-b border-[#151515]/10 bg-white px-6 py-4 sm:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-[-0.04em]">HIRE<span className="text-[#151515]">AI</span></Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#65756d] hover:text-[#151515]"><ArrowLeft className="size-4" /> Về trang chủ</Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#151515]/15 bg-white px-3 py-1 text-xs font-medium"><FileText className="size-3.5" /> Điều khoản dịch vụ • Cập nhật 04/09/2026</div>
        <h1 className="mt-6 text-4xl font-medium tracking-[-0.05em]">Điều khoản dịch vụ</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#65756d]">Áp dụng cho ứng viên và nhà tuyển dụng sử dụng sàn giao dịch việc làm HIREAI. Việc tạo tài khoản đồng nghĩa chấp nhận toàn bộ điều khoản dưới đây.</p>

        <div className="mt-10 space-y-8 rounded-2xl border border-[#151515]/10 bg-white p-8 shadow-sm">
          <section>
            <h2 className="text-lg font-semibold">1. Định nghĩa & Phạm vi</h2>
            <p className="mt-2 text-sm leading-6 text-[#65756d]">HIREAI là sàn TMĐT việc làm ngành IT, cung cấp dịch vụ kết nối, AI matching, quản lý hồ sơ và tin tuyển dụng. Người dùng gồm Ứng viên (cá nhân tìm việc) và Nhà tuyển dụng (doanh nghiệp, tổ chức).</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold">2. Tài khoản & Bảo mật</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#65756d]">
              <li>Ứng viên cam kết thông tin CV trung thực; giả mạo kỹ năng, kinh nghiệm sẽ bị khóa tài khoản.</li>
              <li>Nhà tuyển dụng chịu trách nhiệm về tính hợp pháp của tin tuyển dụng, mức lương, địa điểm và không thu phí ứng viên.</li>
              <li>Mật khẩu, OTP, Magic Link không được chia sẻ; mọi hành vi đăng nhập được coi là của chủ tài khoản.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold">3. Phí & Thanh toán</h2>
            <p className="mt-2 text-sm leading-6 text-[#65756d]">Ứng viên miễn phí 100%. Nhà tuyển dụng trả phí theo gói hiển thị công khai tại /bang-gia. HIREAI không đảm bảo số lượng ứng viên cố định.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold">4. Quyền sở hữu & AI</h2>
            <p className="mt-2 text-sm leading-6 text-[#65756d]">Thuật toán AI chỉ hỗ trợ đề xuất; quyết định tuyển dụng thuộc về người dùng. Dữ liệu huấn luyện được ẩn danh và tuân thủ <Link href="/bao-mat#du-lieu-ca-nhan" className="underline">Chính sách bảo vệ dữ liệu cá nhân</Link>.</p>
          </section>
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-900"><Shield className="size-4" /> Liên hệ pháp chế: legal@hireai.vn — 1900 636 890</p>
          </section>
        </div>
        <div className="mt-8 flex gap-3 text-sm">
          <Link href="/bao-mat" className="underline underline-offset-4">Chính sách bảo mật</Link>
          <span className="text-[#65756d]">•</span>
          <Link href="/quy-che" className="underline underline-offset-4">Quy chế hoạt động</Link>
        </div>
      </div>
    </main>
  );
}
