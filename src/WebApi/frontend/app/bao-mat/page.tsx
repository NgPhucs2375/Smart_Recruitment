import Link from "next/link";
import { ArrowLeft, BrainCircuit, Cookie, Database, Lock, Shield, Users } from "lucide-react";

export default function BaoMatPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/10 bg-white px-6 py-4 sm:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-[-0.04em]">
            HIRE<span className="text-foreground">AI</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Về trang chủ
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/15 bg-white px-3 py-1 text-xs font-medium">
          <Lock className="size-3.5" /> Chính sách bảo mật và dữ liệu cá nhân
        </div>
        <h1 className="mt-6 text-4xl font-medium tracking-[-0.05em]">Chính sách bảo mật</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Chính sách này mô tả cách phiên bản demo/đồ án Smart Recruitment xử lý dữ liệu khi bạn sử dụng
          tài khoản, hồ sơ, CV, ứng tuyển, nhắn tin và các tính năng AI. Đây chưa phải là cam kết về chứng nhận,
          địa điểm lưu trữ hoặc tư cách pháp lý của một doanh nghiệp đã đăng ký.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <a href="#du-lieu" className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-800">Dữ liệu được xử lý</a>
          <a href="#ai" className="rounded-full border border-border/15 bg-white px-3 py-1.5">AI và bên cung cấp dịch vụ</a>
          <a href="#quyen" className="rounded-full border border-border/15 bg-white px-3 py-1.5">Quyền của bạn</a>
        </div>

        <div className="mt-8 space-y-8 rounded-2xl border border-border/10 bg-white p-8 shadow-sm">
          <section id="du-lieu" className="scroll-mt-8 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-900">
              <Database className="size-5 text-emerald-600" /> Những dữ liệu có thể được xử lý
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-foreground">
              <li><b>Tài khoản:</b> email, tên tài khoản, họ tên, số điện thoại, vai trò, trạng thái xác minh và thông tin phiên đăng nhập.</li>
              <li><b>Hồ sơ ứng viên:</b> ngày sinh, giới tính, địa chỉ, giới thiệu, ảnh đại diện, vị trí mong muốn, mức lương mong muốn, kỹ năng và kinh nghiệm.</li>
              <li><b>CV:</b> file gốc, tên file, loại và kích thước file, nội dung CV, thông tin liên hệ, học vấn, dự án, chứng chỉ, các phiên bản và kết quả phân tích.</li>
              <li><b>Tuyển dụng:</b> tin tuyển dụng, đơn ứng tuyển, trạng thái xử lý, ghi chú và bản snapshot CV tại thời điểm ứng tuyển.</li>
              <li><b>Trao đổi:</b> cuộc trò chuyện, người tham gia và nội dung tin nhắn trong tính năng nhắn tin.</li>
              <li><b>Dữ liệu kỹ thuật:</b> lịch sử thao tác cần cho vận hành, thông báo, lịch sử phiên và lịch sử hội thoại với trợ lý Adam.</li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="size-5" /> Mục đích sử dụng</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
              <li>Tạo, xác thực, bảo vệ và duy trì tài khoản.</li>
              <li>Quản lý hồ sơ, CV, tin tuyển dụng, đơn ứng tuyển và trạng thái tuyển dụng.</li>
              <li>Thực hiện matching, đề xuất việc làm và đề xuất ứng viên theo dữ liệu người dùng cung cấp.</li>
              <li>Cho phép các bên liên quan xem dữ liệu cần thiết cho chức năng tuyển dụng khi có quyền phù hợp.</li>
              <li>Gửi email xác minh, khôi phục mật khẩu và các thông báo vận hành khi tính năng đó được sử dụng.</li>
              <li>Phát hiện lỗi, chống lạm dụng, áp dụng phân quyền và bảo vệ an toàn hệ thống.</li>
            </ul>
          </section>

          <section id="ai" className="scroll-mt-8 rounded-xl border border-sky-200 bg-sky-50/60 p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-sky-950">
              <BrainCircuit className="size-5 text-sky-700" /> AI và dịch vụ bên ngoài
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-sky-950/80">
              <p>
                Khi bạn sử dụng tính năng phân tích CV, trích xuất nội dung hoặc xếp hạng đề xuất, dữ liệu cần thiết
                có thể được gửi đến dịch vụ AI DeepSeek do hệ thống cấu hình. Không nên đưa vào CV hoặc cuộc trò chuyện
                những thông tin nhạy cảm không cần thiết cho mục đích tuyển dụng.
              </p>
              <p>
                Kết quả AI chỉ có tính hỗ trợ, có thể không chính xác và không thay thế quyết định của ứng viên,
                nhà tuyển dụng hoặc người quản trị. Hệ thống không nên được hiểu là tự động quyết định tuyển dụng.
              </p>
              <p>
                Tùy cấu hình triển khai, hệ thống còn có thể sử dụng Google/GitHub cho đăng nhập xã hội, MinIO cho
                lưu file, Redis cho lịch sử chat và SMTP cho email. Bản demo không đưa ra cam kết về địa điểm lưu trữ
                hoặc chính sách riêng của các nhà cung cấp này.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Chia sẻ và khả năng hiển thị</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Dữ liệu có thể được hiển thị cho ứng viên, nhà tuyển dụng, nhân sự được phân quyền hoặc quản trị viên
              trong phạm vi cần thiết để thực hiện chức năng tương ứng. Khi ứng tuyển, một bản snapshot của CV có thể
              được lưu cùng đơn ứng tuyển để phục vụ việc theo dõi trạng thái. Hệ thống không chủ trương bán dữ liệu
              cá nhân; mọi kết nối với nhà cung cấp kỹ thuật được thực hiện nhằm vận hành tính năng được yêu cầu.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Lưu trữ và bảo mật</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Dữ liệu được lưu trong các thành phần do môi trường triển khai cấu hình, gồm cơ sở dữ liệu, object storage
              và Redis. Lịch sử chat Adam có thời hạn lưu theo cấu hình hệ thống và được phân tách theo tài khoản.
              Chúng tôi áp dụng xác thực bearer, phân quyền, kiểm tra quyền sở hữu, validation, URL tải file có thời hạn
              và rate limit ở các khu vực phù hợp. Không có hệ thống nào bảo đảm an toàn tuyệt đối; người dùng cần bảo vệ
              mật khẩu, token và không chia sẻ thông tin đăng nhập.
            </p>
          </section>

          <section id="cookies" className="scroll-mt-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Cookie className="size-5" /> Cookie và bộ nhớ trình duyệt</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Phiên bản web có thể sử dụng localStorage hoặc sessionStorage để giữ phiên đăng nhập theo lựa chọn của
              người dùng, lưu thread chat Adam, việc làm đã lưu và công ty đã theo dõi. Đây không phải là cam kết rằng
              hệ thống sử dụng cookie quảng cáo hoặc công cụ theo dõi bên thứ ba. Xóa dữ liệu trình duyệt có thể làm mất
              phiên đăng nhập hoặc các tùy chọn cục bộ.
            </p>
          </section>

          <section id="quyen" className="scroll-mt-8">
            <h2 className="text-lg font-semibold">Quyền và yêu cầu của bạn</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Bạn có thể yêu cầu xem, chỉnh sửa, cập nhật, hạn chế hoặc xóa dữ liệu của mình trong phạm vi hệ thống có
              thể thực hiện. Bạn cũng có thể yêu cầu giải thích thêm về việc sử dụng dữ liệu cho tính năng AI. Bản demo
              hiện chưa có quy trình tự phục vụ riêng cho việc xóa toàn bộ tài khoản; yêu cầu sẽ được nhóm dự án tiếp nhận
              và xử lý thủ công sau khi xác minh quyền sở hữu tài khoản.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Thông tin email, hotline và đầu mối bảo vệ dữ liệu chính thức sẽ được cập nhật sau khi nhóm thống nhất
              thông tin vận hành. Trong thời gian bản demo, bạn có thể dùng trang <Link href="/lien-he" className="underline">Liên hệ</Link>
              để trao đổi với nhóm dự án; biểu mẫu hiện tại chỉ là giao diện minh họa.
            </p>
          </section>

          <section className="rounded-xl border border-border/10 bg-background p-4">
            <p className="flex items-center gap-2 text-sm font-medium"><Shield className="size-4" /> Cập nhật gần nhất: 06/11/2026 • Phiên bản 3.0</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Chính sách sẽ được cập nhật khi nhóm hoàn thiện đơn vị vận hành, kênh liên hệ, thời hạn lưu trữ và quy trình
              xử lý yêu cầu dữ liệu cho bản triển khai chính thức.
            </p>
          </section>
        </div>

        <div className="mt-8 flex gap-3 text-sm">
          <Link href="/dieu-khoan" className="underline underline-offset-4">Điều khoản</Link>
          <span className="text-muted-foreground">•</span>
          <Link href="/quy-che" className="underline underline-offset-4">Quy chế</Link>
        </div>
      </div>
    </main>
  );
}
