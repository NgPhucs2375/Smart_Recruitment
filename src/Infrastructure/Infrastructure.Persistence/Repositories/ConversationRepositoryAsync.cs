using Application.Interfaces.Repositories;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Persistence.Repository
{
    public sealed class ConversationRepositoryAsync : GenericRepositoryAsync<Conversation>, IConversationRepositoryAsync
    {
        private readonly ApplicationDbContext _dbContext;

        public ConversationRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<IReadOnlyList<Conversation>> GetForCompanyAsync(string companyId)
        {
            return await _dbContext.Conversations
                .Where(x => x.DoanhNghiepId == companyId)
                .OrderByDescending(x => x.LastModified ?? x.Created)
                .AsNoTracking()
                .ToListAsync();
        }

        public Task<Conversation> GetForCompanyAsync(int id, string companyId)
        {
            return _dbContext.Conversations
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id && x.DoanhNghiepId == companyId);
        }
    }
}
