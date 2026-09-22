using Application.Features.CVUngVien.Commands.ImportCvUngVien;
using Domain.Entities;

namespace Application.Interfaces.Repositories
{
    public interface ICvImportMapper
{
    CVUngVien Map(
        ImportCvCommand request,
        int hoSoUngVienId,
        bool isDefault);
}
    
}
