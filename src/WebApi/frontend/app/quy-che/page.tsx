import Link from "next/link";
import { ArrowLeft, Scale, Gavel, FileCheck, AlertTriangle } from "lucide-react";

export default function QuyChePage() {
  return (
    <main className="min-h-screen bg-[#f5f5f3] text-[#151515]">
      <header className="border-b border-[#151515]/10 bg-white px-6 py-4 sm:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-[-0.04em]">HIRE<span className="text-[#151515]">AI</span></Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#65756d] hover:text-[#151515]"><ArrowLeft className="size-4" /> Về trang chủ</Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#151515]/15 bg-white px-3 py-1 text-xs font-medium"><Scale className="size-3.5" /> Quy chế hoạt động sàn TMĐT</div>
        <h1 className="mt-6 text-4xl font-medium tracking-[-0.05em]">Quy chế hoạt động sàn giao dịch việc làm</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#65756d]">Ban hành theo Nghị định 52/2013/NĐ-CP, Thông tư 59/2015/TT-BCT. HIREAI là sàn TMĐT cho phép ứng viên và nhà tuyển dụng giao kết hợp đồng lao động, không phải bên tuyển dụng trực tiếp.</p>

        <div className="mt-8 space-y-8 rounded-2xl border border-[#151515]/10 bg-white p-8 shadow-sm">
          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><FileCheck className="size-5" /> Nguyên tắc kiểm duyệt</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#65756d]">
              <li>Mọi tin tuyển dụng kiểm duyệt trong 24h; từ chối tin lương ảo, phân biệt đối xử, thu phí ứng viên.</li>
              <li>CV rác, spam bị khóa; nhà tuyển dụng vi phạm 3 lần bị đình chỉ 90 ngày.</li>
              <li>HIREAI không thu phí ứng viên dưới mọi hình thức.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Quyền & Nghĩa vụ</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#151515]/10 bg-[#f5f5f3] p-4">
                <p className="text-sm font-semibold">Ứng viên</p>
                <ul className="mt-2 list-disc pl-4 text-xs leading-5 text-[#65756d]"><li>Cung cấp thông tin thật</li><li>Chủ động ẩn danh nếu cần</li><li>Tố cáo tin lừa đảo</li></ul>
              </div>
              <div className="rounded-xl border border-[#151515]/10 bg-[#f5f5f3] p-4">
                <p className="text-sm font-semibold">Nhà tuyển dụng</p>
                <ul className="mt-2 list-disc pl-4 text-xs leading-5 text-[#65756d]"><li>Chịu trách nhiệm pháp lý tin đăng</li><li>Không thu phí, không giữ giấy tờ</li><li>Phản hồi ứng viên trong 7 ngày</li></ul>
              </div>
            </div>
          </section>

          <section id="co-che-giai-quyet" className="scroll-mt-8 rounded-xl border border-amber-200 bg-amber-50/70 p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-900"><Gavel className="size-5 text-amber-600" /> Cơ chế giải quyết tranh chấp</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#39443f]">
              <li><b>Thương lượng:</b> liên hệ <a href="mailto:support@hireai.vn" className="underline">support@hireai.vn</a> / 1900 636 890 trong 7 ngày.</li>
              <li><b>Hòa giải qua sàn:</b> HIREAI làm trung gian trong 14 ngày, đề xuất phương án; nếu thất bại chuyển bước 3.</li>
              <li><b>Cơ quan nhà nước / Tòa án:</b> Cục TMĐT &amp; KTS, Sở Công Thương TP.HCM hoặc TAND có thẩm quyền tại TP.HCM.</li>
              <li><b>Thời hiệu:</b> khiếu nại trong 90 ngày kể từ phát sinh.</li>
            </ol>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><AlertTriangle className="size-5 text-red-500" /> Xử lý vi phạm</h2>
            <p className="mt-2 text-sm leading-6 text-[#65756d]">Tùy mức độ: cảnh cáo, gỡ tin, khóa tài khoản 30–180 ngày, chuyển cơ quan chức năng. Người bị hại được bồi thường theo thỏa thuận và pháp luật.</p>
          </section>

          <section className="rounded-xl border border-[#151515]/10 bg-[#0a0a0a] p-4 text-white">
            <p className="text-sm font-medium">Thông tin sàn giao dịch</p>
            <p className="mt-2 text-xs leading-5 text-white/60">Công ty TNHH HIREAI VN • Tầng 8, 123 Nguyễn Huệ, Q.1, TP.HCM • MST 0312345678 • Đã thông báo Bộ Công Thương • Liên hệ pháp chế: legal@hireai.vn</p>
          </section>
        </div>

        <div className="mt-8 flex gap-3 text-sm">
          <Link href="/dieu-khoan" className="underline underline-offset-4">Điều khoản</Link>
          <span className="text-[#65756d]">•</span>
          <Link href="/bao-mat" className="underline underline-offset-4">Bảo mật</Link>
          <span className="text-[#65756d]">•</span>
          <Link href="/lien-he" className="underline underline-offset-4">Liên hệ</Link>
        </div>
      </div>
    </main>
  );
}
