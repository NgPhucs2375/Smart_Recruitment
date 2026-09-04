import Link from "next/link";
import { ArrowLeft, Lock, Shield, Cookie, Database } from "lucide-react";

export default function BaoMatPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f3] text-[#151515]">
      <header className="border-b border-[#151515]/10 bg-white px-6 py-4 sm:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-[-0.04em]">HIRE<span className="text-[#151515]">AI</span></Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#65756d] hover:text-[#151515]"><ArrowLeft className="size-4" /> Về trang chủ</Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#151515]/15 bg-white px-3 py-1 text-xs font-medium"><Lock className="size-3.5" /> Chính sách bảo mật • Nghị định 13/2023/NĐ-CP</div>
        <h1 className="mt-6 text-4xl font-medium tracking-[-0.05em]">Chính sách bảo mật &amp; Dữ liệu cá nhân</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#65756d]">HIREAI tuân thủ Luật Bảo vệ Dữ liệu cá nhân, lưu trữ tại Việt Nam, mã hóa TLS 1.3, và cho phép người dùng kiểm soát toàn bộ dữ liệu.</p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <a href="#du-lieu-ca-nhan" className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-800">Bảo vệ dữ liệu cá nhân</a>
          <a href="#cookies" className="rounded-full border border-[#151515]/15 bg-white px-3 py-1.5">Cookie</a>
          <a href="#quyen" className="rounded-full border border-[#151515]/15 bg-white px-3 py-1.5">Quyền của bạn</a>
        </div>

        <div className="mt-8 space-y-8 rounded-2xl border border-[#151515]/10 bg-white p-8 shadow-sm">
          <section id="du-lieu-ca-nhan" className="scroll-mt-8 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-900"><Database className="size-5 text-emerald-600" /> Bảo vệ dữ liệu cá nhân (NĐ 13/2023)</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-[#39443f]">
              <li><b>Dữ liệu thu thập:</b> họ tên, email, SĐT, CV, lịch sử ứng tuyển, hành vi tìm kiếm — chỉ khi bạn chủ động cung cấp.</li>
              <li><b>Mục đích:</b> AI matching, đề xuất việc làm, analytics ẩn danh; không bán dữ liệu cho bên thứ ba.</li>
              <li><b>Cơ sở pháp lý:</b> sự đồng ý (consent) khi đăng ký; bạn có thể rút đồng ý tại /settings/privacy.</li>
              <li><b>Chế độ ẩn danh:</b> ứng viên bật “Tìm việc ẩn danh” — nhà tuyển dụng hiện tại không thấy hồ sơ.</li>
              <li><b>Lưu trữ & Xóa:</b> dữ liệu tại VN, mã hóa AES-256; xóa tài khoản → xóa vĩnh viễn trong 30 ngày (trừ nghĩa vụ pháp lý).</li>
              <li><b>Quyền:</b> truy cập, chỉnh sửa, xóa, phản đối, khiếu nại tại <a href="mailto:dpo@hireai.vn" className="underline">dpo@hireai.vn</a> (DPO) trong 72h.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Bảo mật kỹ thuật</h2>
            <p className="mt-2 text-sm leading-6 text-[#65756d]">TLS 1.3, HSTS, mã hóa mật khẩu Argon2, token JWT ngắn hạn + refresh rotation, audit log, SOC 2 Type II. Báo lỗ hổng: security@hireai.vn.</p>
          </section>

          <section id="cookies" className="scroll-mt-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Cookie className="size-5" /> Chính sách Cookie</h2>
            <p className="mt-2 text-sm leading-6 text-[#65756d]">Chỉ dùng cookie cần thiết (đăng nhập, bảo mật) và analytics ẩn danh. Không cookie quảng cáo bên thứ ba. Bạn có thể tắt tại trình duyệt; một số tính năng (giữ đăng nhập) sẽ hạn chế.</p>
          </section>

          <section id="quyen" className="scroll-mt-8">
            <h2 className="text-lg font-semibold">Quyền & Khiếu nại</h2>
            <p className="mt-2 text-sm leading-6 text-[#65756d]">Gửi yêu cầu tới <b>dpo@hireai.vn</b> hoặc <Link href="/lien-he" className="underline">Liên hệ</Link>. Nếu không hài lòng, bạn có quyền khiếu nại tới Cục An toàn thông tin hoặc khởi kiện theo pháp luật VN.</p>
          </section>

          <section className="rounded-xl border border-[#151515]/10 bg-[#f5f5f3] p-4">
            <p className="flex items-center gap-2 text-sm font-medium"><Shield className="size-4" /> Cập nhật gần nhất: 04/09/2026 • Phiên bản 2.1</p>
            <p className="mt-1 text-xs leading-5 text-[#65756d]">Mọi thay đổi sẽ thông báo qua email và banner trong 14 ngày trước hiệu lực.</p>
          </section>
        </div>

        <div className="mt-8 flex gap-3 text-sm">
          <Link href="/dieu-khoan" className="underline underline-offset-4">Điều khoản</Link>
          <span className="text-[#65756d]">•</span>
          <Link href="/quy-che" className="underline underline-offset-4">Quy chế</Link>
        </div>
      </div>
    </main>
  );
}
