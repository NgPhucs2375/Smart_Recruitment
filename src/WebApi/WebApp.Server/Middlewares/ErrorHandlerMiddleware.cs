using Application.Exceptions;
using Application.Wrappers;
using System.Net;
using System.Text.Json;

namespace WebApp.Server.Middlewares
{
    public class ErrorHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlerMiddleware> _logger;

        public ErrorHandlerMiddleware(RequestDelegate next, ILogger<ErrorHandlerMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception error)
            {
                var response = context.Response;

                // Response đã bắt đầu gửi (vd. SSE của agent đang stream giữa chừng):
                // không thể đổi status/content-type hay ghi đè body — chỉ log rồi kết thúc,
                // tránh ném thêm InvalidOperationException che lỗi gốc.
                if (response.HasStarted)
                {
                    _logger.LogError(error, "Lỗi sau khi response đã bắt đầu gửi; không thể ghi error body.");
                    return;
                }

                _logger.LogError(error, "Unhandled exception tại {Path}.", context.Request.Path);

                response.ContentType = "application/json";
                var responseModel = new Response<string>() { Succeeded = false, Message = error?.Message };

                switch (error)
                {
                    case Application.Exceptions.ApiException e:
                        // Lấy StatusCode từ Exception, nếu không có thì mặc định là 400
                        response.StatusCode = e.StatusCode > 0 ? e.StatusCode : (int)HttpStatusCode.BadRequest;
                        break;
                    case ValidationException e:
                        // custom application error
                        response.StatusCode = (int)HttpStatusCode.BadRequest;
                        responseModel.Errors = e.Errors;
                        break;
                    case FluentValidation.ValidationException e:
                        response.StatusCode = (int)HttpStatusCode.BadRequest;
                        responseModel.Errors = e.Errors.Select(f => f.ErrorMessage).Distinct().ToList();
                        break;
                    case KeyNotFoundException e:
                        // not found error
                        response.StatusCode = (int)HttpStatusCode.NotFound;
                        break;
                    case UnauthorizedAccessException e:
                        // Bổ sung xử lý truy cập trái phép (401/403) của hệ thống
                        response.StatusCode = (int)HttpStatusCode.Unauthorized;
                        break;
                    default:
                        // unhandled error: KHÔNG lộ chi tiết nội bộ (DB/SQL/đường dẫn) ra client.
                        response.StatusCode = (int)HttpStatusCode.InternalServerError;
                        responseModel.Message = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";
                        break;
                }
                var result = JsonSerializer.Serialize(responseModel);

                await response.WriteAsync(result);
            }
        }
    }
}
