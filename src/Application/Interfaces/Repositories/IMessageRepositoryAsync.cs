using Domain.Entities;

namespace Application.Interfaces.Repositories
{
    public interface IMessageRepositoryAsync : IGenericRepositoryAsync<Message>
    {
        Task<IReadOnlyList<Message>> GetForConversationAsync(int conversationId, string companyId, int take = 100);
    }
}
