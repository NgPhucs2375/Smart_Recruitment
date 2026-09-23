using Domain.Common;

namespace Domain.Entities
{
    public class ConversationMember : AuditableBaseEntity
    {
        public string NguoiDungId { get; set; }
        public string ConversationId { get; set; }
        public string JoinedAt { get; set; }
        public string LastReadAt { get; set; }
        public Conversation Conversation { get; set; }
    }
}