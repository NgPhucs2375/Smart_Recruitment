using Domain.Entities;

namespace Application.Interfaces.Repositories
{
    public interface IConversationRepositoryAsync : IGenericRepositoryAsync<Conversation>
    {
        Task<IReadOnlyList<Conversation>> GetForCompanyAsync(string companyId);
        Task<Conversation> GetForCompanyAsync(int id, string companyId);
    }
}
