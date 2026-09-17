using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Queries.GetCVDownloadUrl
{
    public class GetCVDownloadUrlViewModel
{
    public int CVUngVienId { get; set; }
    public string TenFile { get; set; }
    public string Url { get; set; }
    public int ExpiresInSeconds { get; set; }
}
}

