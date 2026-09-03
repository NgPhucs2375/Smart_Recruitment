

using System;
using System.ComponentModel.DataAnnotations;
using Domain.Common;
using Domain.Enums;

namespace Domain.Entities
{
    public class MagicLinkToken : AuditableBaseEntity
    {
        [Required][MaxLength(255)]
        public string Email { get; set; }
        [Required][MaxLength(64)]
        public string Token { get; set; }
        public MagicLinkPurpose Purpose { get; set; }
        [MaxLength(32)] 
        public string? Role { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool Used { get; set; }
        public DateTime? UsedAt { get; set; }
        [MaxLength(45)] public string? CreatedByIp { get; set; }
        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
        public bool IsActive => !Used && !IsExpired;
    }
}