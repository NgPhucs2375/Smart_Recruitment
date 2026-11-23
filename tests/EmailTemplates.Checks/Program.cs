using Application.Services.Email;
using Domain.Enums;

var checks = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new Exception($"FAIL: {name}");
    checks++;
    Console.WriteLine($"PASS: {name}");
}

var hostileTitle = "<script>alert(1)</script> & \"Backend\"";
var hostileNote = "Thiếu \"chứng chỉ\" <b>AWS</b>\ndòng 2";
var status = EmailTemplates.ApplicationStatus(TriggerDonUngTuyen.TuChoi, hostileTitle, hostileNote);
var statusHtml = EmailLayout.Render(status);

Check(statusHtml.StartsWith("<!DOCTYPE html>") && statusHtml.Contains("HIREAI"), "Rendered email is a full branded HTML document");
Check(!statusHtml.Contains("<script>") && !statusHtml.Contains("<b>AWS</b>"), "User text is HTML-escaped, never executed");
Check(statusHtml.Contains("&lt;script&gt;") && statusHtml.Contains("&amp;"), "Escaped output stays readable");
Check(status.Badge == "Chưa phù hợp" && statusHtml.Contains("Chưa phù hợp"), "Rejection email carries its status badge");
Check(statusHtml.Contains("Ghi chú:") && statusHtml.Contains("dòng 2"), "Note block is rendered when the reviewer leaves one");
Check(statusHtml.Contains("Vị trí ứng tuyển") && statusHtml.Contains("&lt;script&gt;"), "Info field shows the job title escaped");
Check(statusHtml.Contains("Email tự động từ HIREAI"), "Footer tells the reader not to reply");

var congratulated = EmailLayout.Render(EmailTemplates.ApplicationStatus(TriggerDonUngTuyen.DanhGiaPhuHop, "Backend", null));
Check(congratulated.Contains("Phù hợp") && !congratulated.Contains("Ghi chú:"), "Approval email omits the note block when there is no note");

var selfNote = EmailLayout.Render(EmailTemplates.JobModeration(
    TriggerTinTuyenDung.AdminTuChoi, "Tin A", "Tin bị Admin từ chối", "Tin A bị Admin từ chối.", TriggerTinTuyenDung.AdminTuChoi.ToString()));
Check(!selfNote.Contains("Ghi chú:"), "Trigger-name note is not echoed back as a user message");
var realNote = EmailLayout.Render(EmailTemplates.JobModeration(
    TriggerTinTuyenDung.AdminCuongCheKhoa, "Tin A", "Tin bị khóa", "Tin A bị khóa.", "Spam liên hệ"));
Check(realNote.Contains("Bị khóa") && realNote.Contains("Spam liên hệ"), "Moderation email shows badge tone and admin note");
Check(EmailLayout.Render(EmailTemplates.JobModeration(TriggerTinTuyenDung.HeThongTuDongDuyet, "Tin A", "Đã công khai", "ok", null))
    .Contains("Đã duyệt"), "Auto-approved posting shows a success badge");

var invite = EmailTemplates.StaffInvite(null, null, "https://hireais.dev/accept-invite?token=a&b=1");
var inviteHtml = EmailLayout.Render(invite);
Check(invite.Greeting == "Chào bạn," && invite.Fields.Count == 1 && invite.Fields[0].Value == string.Empty,
    "Invite without a name uses a neutral greeting and hides blank position");
Check(inviteHtml.Contains("Chấp nhận lời mời") && inviteHtml.Contains("https://hireais.dev/accept-invite?token=a&amp;b=1"),
    "Invite renders a CTA button with an attribute-escaped link");
Check(inviteHtml.Contains("https://hireais.dev/accept-invite?token=a&amp;b=1</a>"),
    "Invite also prints the raw link for clients that block buttons");

var revoked = EmailLayout.Render(EmailTemplates.StaffInviteRevoked("ACME"));
Check(revoked.Contains("Đã thu hồi") && revoked.Contains("ACME"), "Revoked invite names the company and the state");

var accepted = EmailLayout.Render(EmailTemplates.StaffInviteResponse(
    TriggerLoiMoi.ChapNhan, "ACME", "An (an@acme.vn)", "Nhân sự đã chấp nhận lời mời", "An đã chấp nhận lời mời tham gia ACME."));
Check(accepted.Contains("Đã chấp nhận") && accepted.Contains("an@acme.vn"), "Accepted invite shows the invitee and success badge");
var declined = EmailLayout.Render(EmailTemplates.StaffInviteResponse(
    TriggerLoiMoi.TuChoi, "ACME", "An", "Nhân sự đã từ chối lời mời", "An đã từ chối."));
Check(declined.Contains("Từ chối"), "Declined invite shows the rejection badge");

var verify = EmailTemplates.VerifyAccount("https://hireais.dev/confirm?token=x");
Check(verify.Title == "Xác nhận đăng ký tài khoản" && verify.CtaText == "Xác nhận tài khoản", "Registration email points at confirming the mailbox");
Check(EmailTemplates.VerifyAccount("x", resend: true).Title.Contains("gửi lại"), "Resent verification is labelled as a resend");
Check(EmailTemplates.ResetPassword("https://hireais.dev/reset?a=1").Footer!.Contains("30 phút"), "Reset email states the 30-minute expiry");
Check(EmailTemplates.MagicLogin("https://hireais.dev/magic?a=1").Footer!.Contains("15 phút"), "Magic-link email states the 15-minute expiry");
Check(EmailLayout.Render(EmailTemplates.MagicLogin("https://hireais.dev/magic?a=1")).Contains("Đăng nhập"), "Magic-link email has a login CTA");

var noCta = EmailLayout.Render(new EmailLayoutModel { Title = "Chỉ tiêu đề" });
Check(!noCta.Contains("<a href"), "Model without a CTA renders no empty button");

Console.WriteLine($"DONE: {checks} email-template checks");
