using Domain.Common;
using Domain.Enums;

namespace Domain.Entities
{
    public class Conversation: AuditableBaseEntity
    {
        public string Title { get; set; }
        public string DoanhNghiepId { get; set; }
        public TypeConversation Type { get; set; }

    }
}