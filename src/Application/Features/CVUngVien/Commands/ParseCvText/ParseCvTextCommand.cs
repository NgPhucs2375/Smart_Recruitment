using Application.DTOs.CV;
using Application.Interfaces;
using Application.Wrappers;
using MediatR;

namespace Application.Features.CVUngVien.Commands.ParseCvText;

public class ParseCvTextCommand
    : IRequest<Response<ParsedCvResultDto>>
{
    public string FileName { get; set; }

    public string? FileType { get; set; }

    public long FileSize { get; set; }

    public string RawText { get; set; }
}

public class ParseCvTextCommandHandler(
    ICvStructuredParser parser)
    : IRequestHandler<
        ParseCvTextCommand,
        Response<ParsedCvResultDto>>
{
    public async Task<Response<ParsedCvResultDto>> Handle(
        ParseCvTextCommand request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(
                request.RawText))
        {
            return new Response<ParsedCvResultDto>(
                "Nội dung CV rỗng.");
        }

        var parsed =
            await parser.ParseAsync(
                request.RawText,
                cancellationToken);

        var warnings =
            BuildWarnings(parsed);

        var result =
            new ParsedCvResultDto
            {
                TenFile =
                    request.FileName,

                LoaiFile =
                    request.FileType ?? "",

                KichThuocFile =
                    request.FileSize,

                NoiDung =
                    parsed,

                CanhBao =
                    warnings,

                CanXacNhanThuCong =
                    true
            };

        return new Response<ParsedCvResultDto>(
            data: result,
            message:
                "Phân tích CV thành công.");
    }

    private static List<CvParseWarningDto>
        BuildWarnings(
            ParsedCvDto cv)
    {
        var warnings =
            new List<CvParseWarningDto>();

        if (string.IsNullOrWhiteSpace(
                cv.ThongTinLienHe?.HoTen))
        {
            warnings.Add(
                new CvParseWarningDto
                {
                    Field =
                        "thongTinLienHe.hoTen",

                    Message =
                        "Không xác định được họ tên."
                });
        }

        if (string.IsNullOrWhiteSpace(
                cv.ThongTinLienHe?.Email))
        {
            warnings.Add(
                new CvParseWarningDto
                {
                    Field =
                        "thongTinLienHe.email",

                    Message =
                        "Không xác định được email."
                });
        }

        return warnings;
    }
}