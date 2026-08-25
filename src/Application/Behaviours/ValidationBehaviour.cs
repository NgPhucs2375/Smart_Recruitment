using FluentValidation;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Behaviours
{
    /// <summary>
    /// Kiểm tra tính hợp lệ của dữ liệu đầu vào (request) trước khi nó được xử lý bởi Handler
    /// </summary>
    /// <typeparam name="TRequest"></typeparam>
    /// <typeparam name="TResponse"></typeparam>
    public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : IRequest<TResponse>
    {
        private readonly IEnumerable<IValidator<TRequest>> _validators; // Danh sách các validator 

        public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
        {
            _validators = validators;
        }

        public async Task<TResponse> Handle(
            TRequest request,
            RequestHandlerDelegate<TResponse> next,
            CancellationToken cancellationToken)
        {
            // gom tất cả các validator cho 1 request cụ thể 
            if (_validators.Any())
            {
                // Tạo context để validate dữ liệu đầu vào
                var context = new ValidationContext<TRequest>(request);
                // Tạo failures để lưu trữ các lỗi validate
                var failures = _validators
                    .Select(v => v.Validate(context))
                    .SelectMany(result => result.Errors)
                    .Where(f => f != null)
                    .ToList();

                // Chặn request không hợp lệ
                if (failures.Any())
                {
                    throw new ValidationException(failures);
                }
            }

            return await next();
        }
    }
}
