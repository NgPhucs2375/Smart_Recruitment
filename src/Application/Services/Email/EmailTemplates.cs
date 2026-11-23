#nullable enable
using Domain.Enums;

namespace Application.Services.Email;

/// <summary>
/// Nội dung từng loại email hệ thống. Nơi gửi giữ nguyên Subject cũ; template chỉ lo
/// phần thân thư để mọi email có cùng một hình thức.
/// </summary>
public static class EmailTemplates
{
    public static EmailLayoutModel ApplicationStatus(TriggerDonUngTuyen trigger, string jobTitle, string? note)
    {
        var (badge, tone, message) = trigger switch
        {
            TriggerDonUngTuyen.XuLyHoSoThanhCong => ("Đã ghi nhận", EmailTone.Success,
                $"HIREAI đã ghi nhận hồ sơ ứng tuyển của bạn cho vị trí {jobTitle}. Nhà tuyển dụng sẽ xem hồ sơ trong thời gian sớm nhất."),
            TriggerDonUngTuyen.XemDon => ("Đã xem", EmailTone.Info,
                $"Nhà tuyển dụng đã xem hồ sơ của bạn cho vị trí {jobTitle}. Hãy theo dõi thông báo trong ứng dụng để cập nhật kết quả."),
            TriggerDonUngTuyen.DanhGiaPhuHop => ("Phù hợp", EmailTone.Success,
                $"Hồ sơ của bạn được đánh giá phù hợp với vị trí {jobTitle}. Nhà tuyển dụng có thể liên hệ với bạn trong thời gian tới."),
            TriggerDonUngTuyen.TuChoi => ("Chưa phù hợp", EmailTone.Warning,
                $"Cảm ơn bạn đã ứng tuyển. Rất tiếc hồ sơ của bạn chưa phù hợp với vị trí {jobTitle} lần này. Chúc bạn sớm tìm được công việc phù hợp."),
            TriggerDonUngTuyen.RutDon => ("Đã rút đơn", EmailTone.Info,
                $"Đơn ứng tuyển vị trí {jobTitle} của bạn đã được rút thành công."),
            TriggerDonUngTuyen.NopLaiHoSo => ("Đã nhận lại", EmailTone.Success,
                $"HIREAI đã nhận lại hồ sơ của bạn cho vị trí {jobTitle} sau sự cố kỹ thuật trước đó."),
            TriggerDonUngTuyen.XuLyHoSoThatBai => ("Sự cố", EmailTone.Danger,
                $"Hồ sơ của bạn cho vị trí {jobTitle} gặp sự cố kỹ thuật. Vui lòng mở HIREAI để gửi lại hồ sơ."),
            TriggerDonUngTuyen.HetHanXuLy => ("Quá hạn xử lý", EmailTone.Warning,
                $"Đơn ứng tuyển vị trí {jobTitle} đã quá thời hạn xử lý của nhà tuyển dụng."),
            TriggerDonUngTuyen.DongBoiTinTuyenDung => ("Tin đã đóng", EmailTone.Warning,
                $"Tin tuyển dụng {jobTitle} đã đóng nên đơn ứng tuyển của bạn được ghi nhận dừng xử lý."),
            _ => ("Cập nhật", EmailTone.Info, $"Đơn ứng tuyển vị trí {jobTitle} của bạn có cập nhật mới.")
        };

        return new EmailLayoutModel
        {
            Title = SubjectOf(trigger),
            Badge = badge,
            Tone = tone,
            Greeting = "Chào bạn,",
            Paragraphs = [message],
            Fields = [new("Vị trí ứng tuyển", jobTitle)],
            Note = CleanNote(note, trigger),
            Footer = "Bạn có thể xem chi tiết và theo dõi trạng thái hồ sơ trong mục Việc làm đã ứng tuyển của HIREAI."
        };
    }

    public static EmailLayoutModel NewApplication(string jobTitle) => new()
    {
        Title = "Đơn ứng tuyển mới",
        Badge = "Hồ sơ mới",
        Tone = EmailTone.Info,
        Greeting = "Chào bạn,",
        Paragraphs = [$"Tin tuyển dụng {jobTitle} vừa nhận hồ sơ ứng tuyển mới."],
        Fields = [new("Vị trí tuyển dụng", jobTitle)],
        Footer = "Mở mục Tin tuyển dụng trong HIREAI để xem hồ sơ và cập nhật trạng thái ứng viên."
    };

    public static EmailLayoutModel JobModeration(
        TriggerTinTuyenDung trigger, string jobTitle, string title, string message, string? note)
    {
        var (badge, tone) = trigger switch
        {
            TriggerTinTuyenDung.HeThongTuDongDuyet => ("Đã duyệt", EmailTone.Success),
            TriggerTinTuyenDung.AdminDuyet => ("Đã duyệt", EmailTone.Success),
            TriggerTinTuyenDung.NguoiDaiDienDuyet => ("Đã chuyển bước", EmailTone.Info),
            TriggerTinTuyenDung.HeThongTuChoi => ("Từ chối", EmailTone.Danger),
            TriggerTinTuyenDung.AdminTuChoi => ("Từ chối", EmailTone.Danger),
            TriggerTinTuyenDung.NguoiDaiDienTuChoi => ("Từ chối", EmailTone.Danger),
            TriggerTinTuyenDung.AdminCuongCheKhoa => ("Bị khóa", EmailTone.Danger),
            _ => ("Kiểm duyệt", EmailTone.Info)
        };

        return new EmailLayoutModel
        {
            Title = title,
            Badge = badge,
            Tone = tone,
            Greeting = "Chào bạn,",
            Paragraphs = [message],
            Fields = [new("Tin tuyển dụng", jobTitle)],
            Note = CleanNote(note, trigger),
            Footer = "Bạn có thể xem trạng thái tin trong mục Quản lý tin tuyển dụng của HIREAI."
        };
    }

    public static EmailLayoutModel StaffInviteResponse(
        TriggerLoiMoi trigger, string company, string invitee, string title, string message, string? note = null)
    {
        var accepted = trigger == TriggerLoiMoi.ChapNhan;
        return new EmailLayoutModel
        {
            Title = title,
            Badge = accepted ? "Đã chấp nhận" : "Từ chối",
            Tone = accepted ? EmailTone.Success : EmailTone.Warning,
            Greeting = "Chào bạn,",
            Paragraphs = [message],
            Fields = [new("Người được mời", invitee), new("Doanh nghiệp", company)],
            Note = CleanNote(note, trigger),
            Footer = "Xem danh sách nhân sự của doanh nghiệp trong mục Quản lý nhân sự của HIREAI."
        };
    }

    public static EmailLayoutModel StaffInviteRevoked(string company) => new()
    {
        Title = "Lời mời tham gia doanh nghiệp đã bị thu hồi",
        Badge = "Đã thu hồi",
        Tone = EmailTone.Warning,
        Greeting = "Chào bạn,",
        Paragraphs = [$"Lời mời bạn tham gia {company} trên HIREAI đã bị người đại diện thu hồi."],
        Fields = [new("Doanh nghiệp", company)],
        Footer = "Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ người đại diện của doanh nghiệp."
    };

    public static EmailLayoutModel StaffInvite(string? inviteeName, string? position, string link) => new()
    {
        Title = "Lời mời tham gia doanh nghiệp",
        Badge = "Lời mời",
        Tone = EmailTone.Info,
        Greeting = string.IsNullOrWhiteSpace(inviteeName) ? "Chào bạn," : $"Chào {inviteeName.Trim()},",
        Paragraphs =
        [
            "Bạn được mời trở thành nhân sự của một doanh nghiệp trên HIREAI.",
            "Nhấn nút bên dưới để xác nhận lời mời và bắt đầu cộng tác cùng doanh nghiệp."
        ],
        Fields = [new("Chức vụ", position ?? string.Empty)],
        CtaText = "Chấp nhận lời mời",
        CtaUrl = link,
        Footer = "Lời mời có hiệu lực trong 7 ngày. Nếu bạn không mong đợi email này, hãy bỏ qua."
    };

    public static EmailLayoutModel VerifyAccount(string link, bool resend = false) => new()
    {
        Title = resend ? "Xác nhận đăng ký tài khoản (gửi lại)" : "Xác nhận đăng ký tài khoản",
        Badge = "Xác thực email",
        Tone = EmailTone.Info,
        Greeting = "Chào bạn,",
        Paragraphs =
        [
            "Cảm ơn bạn đã đăng ký HIREAI. Vui lòng xác nhận địa chỉ email để kích hoạt tài khoản.",
            "Liên kết xác nhận chỉ dùng được một lần."
        ],
        CtaText = "Xác nhận tài khoản",
        CtaUrl = link,
        Footer = "Nếu bạn không tạo tài khoản HIREAI, hãy bỏ qua email này — tài khoản sẽ không được kích hoạt."
    };

    public static EmailLayoutModel ResetPassword(string link) => new()
    {
        Title = "Đặt lại mật khẩu",
        Badge = "Bảo mật",
        Tone = EmailTone.Warning,
        Greeting = "Chào bạn,",
        Paragraphs =
        [
            "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản HIREAI của bạn.",
            "Nhấn nút bên dưới để tạo mật khẩu mới."
        ],
        CtaText = "Đặt lại mật khẩu",
        CtaUrl = link,
        Footer = "Liên kết có hiệu lực trong 30 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này."
    };

    public static EmailLayoutModel MagicLogin(string link) => new()
    {
        Title = "Liên kết đăng nhập HIREAI",
        Badge = "Đăng nhập",
        Tone = EmailTone.Info,
        Greeting = "Chào bạn,",
        Paragraphs = ["Nhấn nút bên dưới để đăng nhập HIREAI mà không cần mật khẩu."],
        CtaText = "Đăng nhập",
        CtaUrl = link,
        Footer = "Liên kết có hiệu lực trong 15 phút và chỉ dùng được một lần. Nếu bạn không yêu cầu, hãy bỏ qua email này."
    };

    private static string SubjectOf(TriggerDonUngTuyen trigger) => trigger switch
    {
        TriggerDonUngTuyen.XuLyHoSoThanhCong => "Đã nhận hồ sơ ứng tuyển",
        TriggerDonUngTuyen.XemDon => "Nhà tuyển dụng đã xem hồ sơ",
        TriggerDonUngTuyen.DanhGiaPhuHop => "Hồ sơ được đánh giá phù hợp",
        TriggerDonUngTuyen.TuChoi => "Kết quả ứng tuyển: chưa phù hợp",
        TriggerDonUngTuyen.RutDon => "Đơn ứng tuyển đã rút",
        TriggerDonUngTuyen.NopLaiHoSo => "Đã nhận lại hồ sơ",
        TriggerDonUngTuyen.XuLyHoSoThatBai => "Hồ sơ gặp sự cố kỹ thuật",
        TriggerDonUngTuyen.HetHanXuLy => "Đơn ứng tuyển quá hạn xử lý",
        TriggerDonUngTuyen.DongBoiTinTuyenDung => "Tin tuyển dụng đã đóng",
        _ => "Cập nhật đơn ứng tuyển"
    };

    // "Ghi chú" do state machine tự điền bằng tên trigger thì không phải lời nhắn của người dùng.
    private static string? CleanNote(string? note, Enum trigger)
        => string.IsNullOrWhiteSpace(note) || note == trigger.ToString() ? null : note;
}
