using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Application.DTOs.CV;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Services.Retrieval;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Pgvector;

namespace Infrastructure.Persistence.Repositories
{
    public class CvEmbeddingService
        : ICvEmbeddingService
    {
        private readonly IApplicationDbContext _context;

        private readonly IEmbeddingRepository
            _embeddingRepository;

        private readonly ICvSemanticDocumentBuilder
            _documentBuilder;


        public CvEmbeddingService(
            IApplicationDbContext context,
            IEmbeddingRepository embeddingRepository,
            ICvSemanticDocumentBuilder documentBuilder)
        {
            _context = context;

            _embeddingRepository =
                embeddingRepository;

            _documentBuilder =
                documentBuilder;
        }


        public async Task GenerateAsync(
            int cvId,
            CancellationToken cancellationToken = default)
        {
            // =========================
            // 1. Lấy CV
            // =========================

            var cv = await _context.CVUngViens
                .AsTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == cvId &&
                        !x.IsDaXoa,
                    cancellationToken);


            if (cv == null)
            {
                throw new KeyNotFoundException(
                    $"CV {cvId} không tồn tại.");
            }


            // =========================
            // 2. Kiểm tra JSON
            // =========================

            if (string.IsNullOrWhiteSpace(
                cv.NoiDungJson))
            {
                throw new InvalidOperationException(
                    "CV chưa có nội dung.");
            }


            // =========================
            // 3. Deserialize JSON
            // =========================

            var jsonOptions =
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };


            var noiDung =
                JsonSerializer.Deserialize<NoiDungCVDto>(
                    cv.NoiDungJson,
                    jsonOptions);


            if (noiDung == null)
            {
                throw new InvalidOperationException(
                    "Không thể deserialize nội dung CV.");
            }


            // =========================
            // 4. Chunkless Document
            // =========================

            var semanticText =
                _documentBuilder.Build(noiDung);


            if (string.IsNullOrWhiteSpace(
                semanticText))
            {
                throw new InvalidOperationException(
                    "Semantic text của CV rỗng.");
            }


            // =========================
            // 5. Gemini Embedding
            // =========================

            var vector =
                await _embeddingRepository
                    .GenerateEmbeddingAsync(
                        semanticText,
                        EmbeddingTaskType.RetrievalDocument,
                        cancellationToken);


            // =========================
            // 6. Lưu vào PostgreSQL
            // =========================

            cv.SemanticText =
                semanticText;

            cv.Embedding =
                new Vector(vector);


            await _context.SaveChangesAsync(
                cancellationToken);
        }
    }
}