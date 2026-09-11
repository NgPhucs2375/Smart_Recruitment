using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Application.DTOs.CV;
using Application.DTOs.Embedding;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Services.Embedding;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class CandidateSemanticSearch : ICandidateSemanticSearchRepository
    {
        private const int MaxSemanticChars = 4000;

        private readonly IEmbeddingRepository _embeddingRepository;
        private readonly IApplicationDbContext _context;

        public CandidateSemanticSearch(
            IEmbeddingRepository embeddingRepository,
            IApplicationDbContext context)
        {
            _embeddingRepository = embeddingRepository;
            _context = context;
        }

        public async Task<IReadOnlyList<SemanticCandidateResultDto>> SearchAsync(
            int tinTuyenDungId,
            int topK = 10,
            double threshold = 0.3,
            CancellationToken cancellationToken = default)
        {
            if (topK <= 0)
            {
                topK = 10;
            }

            var job =
                await _context.TinTuyenDungs
                    .AsNoTracking()
                    .Include(x => x.KyNangTinTuyenDungs)
                        .ThenInclude(x => x.KyNang)
                    .FirstOrDefaultAsync(
                        x => x.Id == tinTuyenDungId,
                        cancellationToken);

            if (job == null)
            {
                throw new KeyNotFoundException(
                    $"Tin tuyển dụng {tinTuyenDungId} không tồn tại.");
            }

            var cvs =
                await _context.CVUngViens
                    .AsNoTracking()
                    .Include(x => x.HoSoUngVien)
                    .Where(x => !x.IsDaXoa && x.NoiDungJson != null)
                    .ToListAsync(cancellationToken);

            var jobText = BuildJobSemanticText(job);

            if (string.IsNullOrWhiteSpace(jobText))
            {
                return new List<SemanticCandidateResultDto>();
            }

            var jobVector =
                await _embeddingRepository.GenerateEmbeddingAsync(
                    jobText,
                    EmbeddingTaskType.RetrievalQuery,
                    cancellationToken);

            // Gom text CV hợp lệ để embed batch 1 lần thay vì N lần gọi Gemini.
            var cvTexts = new List<(CVUngVien Cv, string Text)>();
            foreach (var cv in cvs)
            {
                var cvText = BuildCvSemanticText(cv.NoiDungJson!);
                if (!string.IsNullOrWhiteSpace(cvText))
                {
                    cvTexts.Add((cv, cvText));
                }
            }

            if (cvTexts.Count == 0)
            {
                return new List<SemanticCandidateResultDto>();
            }

            var cvVectors =
                await _embeddingRepository.GenerateEmbeddingsAsync(
                    cvTexts.Select(x => x.Text).ToList(),
                    EmbeddingTaskType.RetrievalDocument,
                    cancellationToken);

            var results = new List<SemanticCandidateResultDto>(cvTexts.Count);

            for (var i = 0; i < cvTexts.Count; i++)
            {
                var score = SemanticSimilarity.CosineSimilarity(
                    jobVector,
                    cvVectors[i]);

                if (score < threshold)
                {
                    continue;
                }

                results.Add(
                    new SemanticCandidateResultDto
                    {
                        CvId = cvTexts[i].Cv.Id,
                        NguoiDungId = cvTexts[i].Cv.HoSoUngVien != null
                            ? cvTexts[i].Cv.HoSoUngVien.NguoiDungId
                            : 0,
                        SemanticScore = score
                    });
            }

            return results
                .OrderByDescending(x => x.SemanticScore)
                .Take(topK)
                .ToList();
        }

        private static string BuildJobSemanticText(TinTuyenDung job)
        {
            var sb = new StringBuilder();
            AppendSection(sb, "Tieu de", job.TieuDe);
            AppendSection(sb, "Mo ta cong viec", job.MoTaCongViec);
            AppendSection(sb, "Yeu cau cong viec", job.YeuCauCongViec);
            AppendSection(sb, "Kinh nghiem yeu cau", job.KinhNghiemYeuCau);
            AppendSection(sb, "Quyen loi", job.QuyenLoi);
            AppendSection(sb, "Dia diem", job.DiaDiemLamViec);

            var kyNangs = job.KyNangTinTuyenDungs?
                .Select(x => x.KyNang?.TenKyNang)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToList();

            if (kyNangs != null && kyNangs.Count > 0)
            {
                AppendSection(sb, "Ky nang", string.Join(", ", kyNangs));
            }

            return Truncate(sb.ToString().Trim(), MaxSemanticChars);
        }

        private static string BuildCvSemanticText(string noiDungJson)
        {
            NoiDungCVDto? cv = null;
            try
            {
                cv = JsonSerializer.Deserialize<NoiDungCVDto>(
                    noiDungJson,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    });
            }
            catch (JsonException)
            {
                // JSON lạ: fallback dùng raw text để embedding vẫn chạy được.
            }

            if (cv == null)
            {
                return Truncate(noiDungJson.Trim(), MaxSemanticChars);
            }

            var sb = new StringBuilder();

            if (cv.KinhNghiemLamViec != null)
            {
                foreach (var kn in cv.KinhNghiemLamViec)
                {
                    AppendSection(sb, "Kinh nghiem",
                        $"{kn.ChucDanh} tai {kn.CongTy}. {kn.MoTa} " +
                        $"Ky nang: {string.Join(", ", kn.KyNangSuDung ?? new List<string>())}");
                }
            }

            if (cv.KyNang != null && cv.KyNang.Count > 0)
            {
                AppendSection(sb, "Ky nang",
                    string.Join(", ", cv.KyNang
                        .Select(x => x.TenKyNang)
                        .Where(x => !string.IsNullOrWhiteSpace(x))));
            }

            if (cv.HocVan != null)
            {
                foreach (var hv in cv.HocVan)
                {
                    AppendSection(sb, "Hoc van",
                        $"{hv.ChuyenNganh} - {hv.Truong}. {hv.MoTa}");
                }
            }

            if (cv.DuAn != null)
            {
                foreach (var da in cv.DuAn)
                {
                    AppendSection(sb, "Du an",
                        $"{da.TenDuAn} ({da.VaiTro}). {da.MoTa} " +
                        $"Cong nghe: {string.Join(", ", da.CongNghe ?? new List<string>())}");
                }
            }

            if (cv.ChungChi != null && cv.ChungChi.Count > 0)
            {
                AppendSection(sb, "Chung chi",
                    string.Join("; ", cv.ChungChi
                        .Select(x => $"{x.TenChungChi} - {x.DonViCap}")
                        .Where(x => !string.IsNullOrWhiteSpace(x))));
            }

            var text = sb.ToString().Trim();
            return Truncate(
                string.IsNullOrWhiteSpace(text) ? noiDungJson.Trim() : text,
                MaxSemanticChars);
        }

        private static void AppendSection(StringBuilder sb, string label, string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return;
            }

            if (sb.Length > 0)
            {
                sb.AppendLine();
            }

            sb.Append(label).Append(": ").Append(value.Trim());
        }

        private static string Truncate(string text, int maxLength)
        {
            if (string.IsNullOrEmpty(text) || text.Length <= maxLength)
            {
                return text;
            }

            return text.Substring(0, maxLength);
        }
    }
}
