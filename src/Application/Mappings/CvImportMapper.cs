using Application.Features.CVUngVien;
using Application.Features.CVUngVien.Commands.ImportCvUngVien;
using Application.Interfaces.Repositories;
using Domain.Entities;
using Domain.Enums;

namespace Application.Mappings;

public class CvImportMapper : ICvImportMapper
{
    public CVUngVien Map(
        ImportCvCommand request,
        int hoSoUngVienId,
        bool isDefault)
    {
        var entity = new CVUngVien
        {
            HoSoUngVienId = hoSoUngVienId,
            TenFile = request.TenFile,
            FileUrl = request.FileUrl,
            TemplateId = request.TemplateId,
            IsDefault = isDefault,
            PhuongThucTao = PhuongThucTaoCV.TaiLenTrucTiep
        };

        CvEntityMapper.ApplyContent(entity, request.NoiDung);
        return entity;
    }
}
