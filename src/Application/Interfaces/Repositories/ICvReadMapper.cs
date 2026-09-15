using Application.DTOs.CV;
using Domain.Entities;
namespace Application.Interfaces.Repositories
{
    
public interface ICvReadMapper
{
    CvDetailDto Map(CVUngVien cv);
}
}
