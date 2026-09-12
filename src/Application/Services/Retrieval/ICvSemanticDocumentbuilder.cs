using Application.DTOs.CV;

namespace Application.Services.Retrieval
{
    public interface ICvSemanticDocumentBuilder
    {
        string Build(NoiDungCVDto cv);
    }
}