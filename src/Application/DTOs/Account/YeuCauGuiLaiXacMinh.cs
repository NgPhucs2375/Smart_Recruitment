using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.Account
{
    public class YeuCauGuiLaiXacMinh
    {
        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }

        [Required]
        public string Token { get; set; }
    }
}
