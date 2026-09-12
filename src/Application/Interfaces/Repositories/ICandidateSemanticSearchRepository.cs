using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Application.DTOs.Embedding;

namespace Application.Interfaces.Repositories
{
    public interface ICandidateSemanticSearchRepository
    {
        Task<IReadOnlyList<SemanticCandidateResultDto>> SearchAsync(
            int tinTuyenDungId,
            int topK = 10,
            double threshold = 0.3,
            CancellationToken cancellationToken = default);
    }
}