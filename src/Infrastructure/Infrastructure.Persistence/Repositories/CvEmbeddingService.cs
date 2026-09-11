using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Application.DTOs.CV;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Pgvector;

namespace Infrastructure.Persistence.Repositories
{
    /// <summary>
    /// Implementation cho ICvEmbeddingService (Application.Interfaces.Repositories).
    /// Đặt ở Infrastructure.Persistence vì cần IApplicationDbContext + IEmbeddingRepository.
    /// Nhớ đăng ký DI ở ServiceRegistration.cs: services.AddScoped<ICvEmbeddingService, CvEmbeddingService>();
    /// </summary>
    public class CvEmbeddingService : ICvEmbeddingService
    {
        private readonly IApplicationDbContext _context;
        private readonly IEmbeddingRepository _embeddingRepository;

        public CvEmbeddingService(IApplicationDbContext context, IEmbeddingRepository embeddingRepository)
        {
            _context = context;
            _embeddingRepository = embeddingRepository;
        }

        public async Task<string> GetCvEmbeddingAsync(int cvId, CancellationToken cancellationToken = default)
        {
            var cv = await _context.CVUngViens
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == cvId && !x.IsDaXoa, cancellationToken);

            if (cv == null)
                throw new KeyNotFoundException($"CV {cvId} không tồn tại.");

            if (string.IsNullOrWhiteSpace(cv.NoiDungJson))
                return string.Empty;

            // 1. Build semantic text từ NoiDungJson (tái dùng logic CandidateSemanticSearch)
            var semanticText = BuildCvSemanticText(cv.NoiDungJson);

            if (string.IsNullOrWhiteSpace(semanticText))
                return string.Empty;

            // 2. Gọi Gemini để tạo embedding (768 dims)
            var vector = await _embeddingRepository.GenerateEmbeddingAsync(
                semanticText,
                EmbeddingTaskType.RetrievalDocument,
                cancellationToken);

            // 3. Lưu lại vào DB để lần sau không cần gọi lại (optional)
            // Cần tracking entity để update
            var tracked = await _context.CVUngViens.FirstOrDefaultAsync(x => x.Id == cvId, cancellationToken);
            if (tracked != null)
            {
                tracked.Embedding = new Vector(vector);
                tracked.SemanticText = semanticText;
                await _context.SaveChangesAsync(cancellationToken);
            }

            // Interface hiện tại trả về string — trả về semanticText hoặc vector dạng JSON
            // Nếu bạn muốn trả Vector, đổi interface sang Task<Vector> hoặc Task<float[]>
            return semanticText;
        }

        private static string BuildCvSemanticText(string noiDungJson)
        {
            NoiDungCVDto? dto = null;
            try
            {
                dto = JsonSerializer.Deserialize<NoiDungCVDto>(noiDungJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
            }
            catch { }

            if (dto == null) return noiDungJson.Trim();

            var sb = new StringBuilder();
            void Append(string label, string? v)
            {
                if (string.IsNullOrWhiteSpace(v)) return;
                if (sb.Length > 0) sb.AppendLine();
                sb.Append(label).Append(": ").Append(v.Trim());
            }

            if (dto.KinhNghiemLamViec != null)
                foreach (var kn in dto.KinhNghiemLamViec)
                    Append("Kinh nghiem", $"{kn.ChucDanh} tai {kn.CongTy}. {kn.MoTa}");

            if (dto.KyNang != null && dto.KyNang.Count > 0)
                Append("Ky nang", string.Join(", ", dto.KyNang.Select(x => x.TenKyNang).Where(x => !string.IsNullOrWhiteSpace(x))));

            if (dto.HocVan != null)
                foreach (var hv in dto.HocVan)
                    Append("Hoc van", $"{hv.ChuyenNganh} - {hv.Truong}. {hv.MoTa}");

            var text = sb.ToString().Trim();
            return string.IsNullOrWhiteSpace(text) ? noiDungJson.Trim() : text;
        }
    }
}
