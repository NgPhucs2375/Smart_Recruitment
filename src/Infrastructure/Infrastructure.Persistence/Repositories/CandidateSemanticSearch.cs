using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Application.DTOs.Embedding;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using Pgvector.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class CandidateSemanticSearch
        : ICandidateSemanticSearchRepository
    {
        private const int MaxSemanticChars = 4000;

        private readonly IEmbeddingRepository
            _embeddingRepository;

        private readonly IApplicationDbContext
            _context;


        public CandidateSemanticSearch(
            IEmbeddingRepository embeddingRepository,
            IApplicationDbContext context)
        {
            _embeddingRepository =
                embeddingRepository;

            _context =
                context;
        }


        public async Task<
            IReadOnlyList<SemanticCandidateResultDto>>
            SearchAsync(
                int tinTuyenDungId,
                int topK = 10,
                double threshold = 0.3,
                CancellationToken cancellationToken = default)
        {
            // =========================
            // 1. Validate TopK
            // =========================

            if (topK <= 0)
            {
                topK = 10;
            }


            // =========================
            // 2. Lấy tin tuyển dụng
            // =========================

            var job =
                await _context.TinTuyenDungs
                    .AsNoTracking()

                    .Include(x =>
                        x.KyNangTinTuyenDungs)

                    .ThenInclude(x =>
                        x.KyNang)

                    .FirstOrDefaultAsync(
                        x =>
                            x.Id == tinTuyenDungId,
                        cancellationToken);


            if (job == null)
            {
                throw new KeyNotFoundException(
                    $"Tin tuyển dụng " +
                    $"{tinTuyenDungId} không tồn tại.");
            }


            // =========================
            // 3. Build semantic text
            //    cho Job
            // =========================

            var jobText =
                BuildJobSemanticText(job);


            if (string.IsNullOrWhiteSpace(
                jobText))
            {
                return new List<
                    SemanticCandidateResultDto>();
            }


            // =========================
            // 4. Gemini embed Job
            //    Chỉ gọi 1 lần
            // =========================

            var queryEmbedding =
                await _embeddingRepository
                    .GenerateEmbeddingAsync(
                        jobText,
                        EmbeddingTaskType.RetrievalQuery,
                        cancellationToken);


            // =========================
            // 5. Convert float[]
            //    -> pgvector Vector
            // =========================

            var queryVector =
                new Vector(
                    queryEmbedding);


            // =========================
            // 6. PostgreSQL + pgvector
            //    tìm CV gần nhất
            // =========================

            var candidates =
                await _context.CVUngViens

                    .AsNoTracking()

                    // CV chưa bị xóa
                    .Where(x =>
                        !x.IsDaXoa)

                    // CV phải có embedding
                    .Where(x =>
                        x.Embedding != null)

                    // Ứng viên đang tìm việc
                    .Where(x =>
                        x.HoSoUngVien != null &&
                        x.HoSoUngVien.IsTimViec)

                    // Nếu một ứng viên có nhiều CV,
                    // trước mắt chỉ lấy CV mặc định.
                    .Where(x =>
                        x.IsDefault)

                    // Vector gần nhất lên trước
                    .OrderBy(x =>
                        x.Embedding!
                            .CosineDistance(
                                queryVector))

                    .Take(topK)

                    // Lấy distance trước
                    // thay vì tính SemanticScore
                    // trực tiếp trong SQL
                    .Select(x =>
                        new
                        {
                            CvId =
                                x.Id,

                            NguoiDungId =
                                x.HoSoUngVien
                                    .NguoiDungId,

                            Distance =
                                x.Embedding!
                                    .CosineDistance(
                                        queryVector)
                        })

                    .ToListAsync(
                        cancellationToken);


            // =========================
            // 7. Distance
            //    -> Similarity
            // =========================

            var results =
                candidates

                    .Select(x =>
                        new SemanticCandidateResultDto
                        {
                            CvId =
                                x.CvId,

                            NguoiDungId =
                                x.NguoiDungId,

                            SemanticScore =
                                1.0 - x.Distance
                        })

                    // Threshold
                    .Where(x =>
                        x.SemanticScore >=
                        threshold)

                    // Score cao xuống thấp
                    .OrderByDescending(x =>
                        x.SemanticScore)

                    .ToList();


            return results;
        }


        // =================================
        // Build semantic document cho Job
        // =================================

        private static string
            BuildJobSemanticText(
                TinTuyenDung job)
        {
            var sb =
                new StringBuilder();


            AppendSection(
                sb,
                "Tiêu đề",
                job.TieuDe);


            AppendSection(
                sb,
                "Mô tả công việc",
                job.MoTaCongViec);


            AppendSection(
                sb,
                "Yêu cầu công việc",
                job.YeuCauCongViec);


            AppendSection(
                sb,
                "Kinh nghiệm yêu cầu",
                job.KinhNghiemYeuCau);


            AppendSection(
                sb,
                "Địa điểm",
                job.DiaDiemLamViec);


            // =========================
            // Skills của Job
            // =========================

            var kyNangs =
                job.KyNangTinTuyenDungs?

                    .Select(x =>
                        x.KyNang?.TenKyNang)

                    .Where(x =>
                        !string.IsNullOrWhiteSpace(x))

                    .Distinct()

                    .ToList();


            if (kyNangs != null &&
                kyNangs.Count > 0)
            {
                AppendSection(
                    sb,
                    "Kỹ năng",
                    string.Join(
                        ", ",
                        kyNangs));
            }


            var text =
                sb.ToString()
                    .Trim();


            return Truncate(
                text,
                MaxSemanticChars);
        }


        // =================================
        // Helper thêm section
        // =================================

        private static void AppendSection(
            StringBuilder sb,
            string label,
            string? value)
        {
            if (string.IsNullOrWhiteSpace(
                value))
            {
                return;
            }


            if (sb.Length > 0)
            {
                sb.AppendLine();
            }


            sb
                .Append(label)
                .Append(": ")
                .Append(value.Trim());
        }


        // =================================
        // Giới hạn text gửi Gemini
        // =================================

        private static string Truncate(
            string text,
            int maxLength)
        {
            if (string.IsNullOrEmpty(text) ||
                text.Length <= maxLength)
            {
                return text;
            }


            return text.Substring(
                0,
                maxLength);
        }
    }
}