using Application.Interfaces.Repositories;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Persistence.Repository
{
    public sealed class MessageRepositoryAsync : GenericRepositoryAsync<Message>, IMessageRepositoryAsync
    {
        private readonly ApplicationDbContext _dbContext;

        public MessageRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<IReadOnlyList<Message>> GetForConversationAsync(int conversationId, string companyId, int take = 100)
        {
            take = take < 1 ? 1 : take > 200 ? 200 : take;
            return await _dbContext.Messages
                .Where(x => x.ConversationId == conversationId.ToString()
                    && _dbContext.Conversations.Any(c => c.Id == conversationId && c.DoanhNghiepId == companyId)
                    && !x.IsDeleted)
                .OrderByDescending(x => x.Created)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
