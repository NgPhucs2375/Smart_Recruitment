namespace WebApp.Server.DemoSeed.Content;

/// <summary>
/// Câu chữ nghiệp vụ cho vòng đời đơn ứng tuyển: lý do từ chối, thư mời trao đổi,
/// nhận xét của nhà tuyển dụng và ghi chú hệ thống. Tất cả trung tính, không nhắc
/// tên ứng viên thật và đủ đa dạng để danh sách đơn không lặp một câu.
/// </summary>
internal static class DemoFeedback
{
    public static readonly string[] MatchNotes =
    [
        "Kinh nghiệm và kỹ năng phù hợp với yêu cầu vị trí. Đề xuất trao đổi ở vòng phỏng vấn tiếp theo.",
        "Hồ sơ đáp ứng các tiêu chí bắt buộc, kinh nghiệm thực tế sát với công việc. Hẹn trao đổi chi tiết.",
        "Kỹ năng chuyên môn tốt và kinh nghiệm dự án rõ ràng. Chuyển sang vòng đánh giá chuyên sâu.",
        "Ứng viên có nền tảng phù hợp, thái độ chủ động. Mời trao đổi về mức lương và thời gian nhận việc.",
        "Đáp ứng yêu cầu về kỹ năng và kinh nghiệm. Đề xuất sắp xếp phỏng vấn với quản lý trực tiếp.",
        "Hồ sơ nổi bật ở phần dự án thực tế. Mời ứng viên trao đổi thêm về định hướng công việc."
    ];

    public static readonly string[] RejectionNotes =
    [
        "Hồ sơ chưa đáp ứng yêu cầu về số năm kinh nghiệm cho vị trí này. Cảm ơn bạn đã quan tâm.",
        "Kinh nghiệm chuyên môn chưa sát với phạm vi công việc đang tuyển. Chúc bạn tìm được vị trí phù hợp.",
        "Ứng viên thiếu một số kỹ năng bắt buộc của vị trí. Hồ sơ được lưu để liên hệ khi có vị trí phù hợp hơn.",
        "Hồ sơ đã được xem xét kỹ, hiện chưa phù hợp với nhu cầu tuyển dụng đợt này.",
        "Vị trí ưu tiên ứng viên có kinh nghiệm gần với lĩnh vực đang tuyển. Cảm ơn bạn đã ứng tuyển.",
        "Chúng tôi đã chọn ứng viên có mức độ phù hợp cao hơn ở thời điểm hiện tại. Chúc bạn thành công."
    ];

    public static readonly string[] InvitationNotes =
    [
        "Hồ sơ phù hợp. Nhà tuyển dụng sẽ liên hệ để sắp xếp trao đổi trực tiếp.",
        "Đề nghị trao đổi ở vòng tiếp theo. Vui lòng theo dõi email và điện thoại trong 3 ngày tới.",
        "Hồ sơ được đánh giá tích cực. Chuyển sang bước phỏng vấn với bộ phận chuyên môn."
    ];

    public static readonly string[] WithdrawNotes =
    [
        "Ứng viên chủ động rút đơn vì đã nhận lời mời ở nơi khác.",
        "Ứng viên rút đơn do thay đổi kế hoạch cá nhân.",
        "Ứng viên rút đơn và mong được liên hệ ở các đợt tuyển sau."
    ];

    public static readonly string[] SystemNotes =
    [
        "Hồ sơ hợp lệ, chờ nhà tuyển dụng xử lý.",
        "Hệ thống đã tiếp nhận hồ sơ ứng tuyển."
    ];

    public static readonly string[] OverdueNotes =
    [
        "Đơn quá hạn xử lý theo quy định SLA, hệ thống tự động chuyển trạng thái.",
        "Quá thời hạn phản hồi, đơn được đánh dấu quá hạn xử lý."
    ];

    public static readonly string[] ClosedJobNotes =
    [
        "Tin tuyển dụng đã đóng khi đơn chưa có kết quả cuối cùng.",
        "Tin tuyển dụng hết hạn trước khi hồ sơ được xử lý xong."
    ];

    public static readonly string[] ViewedNotes =
    [
        "Đã xem hồ sơ ứng viên.",
        "Nhà tuyển dụng đã mở hồ sơ để xem xét."
    ];
}
