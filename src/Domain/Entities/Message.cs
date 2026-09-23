using Domain.Common;

namespace Domain.Entities
{
    public class Message : AuditableBaseEntity
    {
        public string ConversationId { get; set; }
        public string SenderId { get; set; }
        public string Content { get; set; }
        public bool IsDeleted { get; set; }
    }
}