using System;
using System.Collections.Generic;
using Application.Filters;

namespace Infrastructure.Identity
{
    public class GetPagingRoleClaimParameter : RequestParameter
    {
        public List<int> id { get; set; }
    }
}
