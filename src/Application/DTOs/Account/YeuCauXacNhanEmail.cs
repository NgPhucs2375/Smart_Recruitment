using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.Account
{
    public class YeuCauXacNhanEmail
    {
        [Required]
        public string nguoiDungId {get; set;}
        [Required]
        public string Code {get; set;}
    }
}
