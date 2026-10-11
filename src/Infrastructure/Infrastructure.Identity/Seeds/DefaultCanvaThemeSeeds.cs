using Application.Interfaces;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Seeds
{
    /// <summary>
    /// Seed 7 preset themes chuẩn Canva cho bảng Quản lý CV/mẫu CV.
    /// CauHinhJson sinh từ features/tao-cv/services/canva-seeds.ts
    /// (single source of truth) — KHÔNG sửa tay JSON dưới đây, sửa TS
    /// rồi chạy lại scripts/export-canva-seeds.cjs.
    /// Idempotent — chỉ thêm slug chưa tồn tại trong DB.
    /// </summary>
    public static class DefaultCanvaThemeSeeds
    {
        private static IEnumerable<CvTheme> PendingThemes(IApplicationDbContext appContext)
        {
                if (!appContext.CvThemes.Any(x => x.Slug == "canva-corporate-navy"))
                {
                    yield return new CvTheme
                    {
                        Slug = "canva-corporate-navy",
                        Ten = @"Corporate Navy & White",
                        MoTa = @"Xanh navy công sở, sidebar trái cho chuyên viên truyền thông",
                        DanhMuc = "business",
                        CapBac = "all",
                        Tags = "Studio,Canva",
                        PhongCachThietKe = "studio",
                        SoCot = 2,
                        ThanThienATS = true,
                        MauSacChuDao = "#1e3a8a",
                        IsActive = true,
                        ThuTu = 45,
                        CauHinhJson = @"{""id"":""canva-corporate-navy"",""slug"":""canva-corporate-navy"",""name"":""Corporate Navy & White"",""description"":""Xanh navy công sở, sidebar trái cho chuyên viên truyền thông"",""thumbnailGradient"":""linear-gradient(135deg,#1e3a8a,#3b82f6)"",""category"":""business"",""level"":""all"",""atsFriendly"":true,""createdAt"":""2026-10-11T08:41:56.060Z"",""updatedAt"":""2026-10-11T08:41:56.060Z"",""isDefault"":false,""layout"":{""sectionOrder"":[""summary"",""experience"",""projects"",""education"",""skills"",""certificates""],""sections"":{""summary"":{""id"":""summary"",""title"":""Tóm tắt"",""isVisible"":true},""experience"":{""id"":""experience"",""title"":""Kinh nghiệm làm việc"",""isVisible"":true},""projects"":{""id"":""projects"",""title"":""Dự án tiêu biểu"",""isVisible"":true},""education"":{""id"":""education"",""title"":""Học vấn"",""isVisible"":true},""skills"":{""id"":""skills"",""title"":""Kỹ năng"",""isVisible"":true},""certificates"":{""id"":""certificates"",""title"":""Chứng chỉ"",""isVisible"":true}},""sidebarSections"":[""skills"",""certificates""],""contactsPlacement"":""sidebar""},""structure"":""sidebar-left"",""sidebarWidthPct"":33,""colors"":{""primary"":""#1e3a8a"",""secondary"":""#3b82f6"",""textPrimary"":""#0f172a"",""textMuted"":""#64748b"",""paperBackground"":""#ffffff""},""typography"":{""fontFamily"":""font-sans"",""baseFontSizePx"":13.5,""headingVariant"":""underline"",""uppercaseHeadings"":true,""dividerStyle"":""solid"",""dividerWidthPx"":2,""enclosure"":""flat"",""verticalTagEnabled"":false},""spacing"":{""density"":""normal"",""sectionGapMm"":5,""itemGapMm"":3,""pagePaddingMm"":15},""zones"":{""headerBg"":""transparent"",""sidebarBg"":""#f0f4f8"",""mainBg"":""transparent""},""policy"":{""policyApproved"":true,""isPublished"":true},""avatarConfig"":{""visible"":true,""shape"":""circle"",""sizePx"":96,""hasBorder"":true,""borderColor"":""primary""}}",
                        Created = new DateTime(2026, 10, 11, 0, 0, 0, DateTimeKind.Utc),
                        CreatedBy = "system",
                    };
                }
                if (!appContext.CvThemes.Any(x => x.Slug == "canva-minimal-monochrome"))
                {
                    yield return new CvTheme
                    {
                        Slug = "canva-minimal-monochrome",
                        Ten = @"Monochrome Minimalist ATS",
                        MoTa = @"Đen trắng tối giản, 1 cột chuẩn ATS toàn phần",
                        DanhMuc = "ats",
                        CapBac = "all",
                        Tags = "Studio,Canva",
                        PhongCachThietKe = "studio",
                        SoCot = 1,
                        ThanThienATS = true,
                        MauSacChuDao = "#111827",
                        IsActive = true,
                        ThuTu = 46,
                        CauHinhJson = @"{""id"":""canva-minimal-monochrome"",""slug"":""canva-minimal-monochrome"",""name"":""Monochrome Minimalist ATS"",""description"":""Đen trắng tối giản, 1 cột chuẩn ATS toàn phần"",""thumbnailGradient"":""linear-gradient(135deg,#111827,#4b5563)"",""category"":""ats"",""level"":""all"",""atsFriendly"":true,""createdAt"":""2026-10-11T08:41:56.060Z"",""updatedAt"":""2026-10-11T08:41:56.060Z"",""isDefault"":false,""layout"":{""sectionOrder"":[""summary"",""experience"",""projects"",""education"",""skills"",""certificates""],""sections"":{""summary"":{""id"":""summary"",""title"":""Tóm tắt"",""isVisible"":true},""experience"":{""id"":""experience"",""title"":""Kinh nghiệm làm việc"",""isVisible"":true},""projects"":{""id"":""projects"",""title"":""Dự án tiêu biểu"",""isVisible"":true},""education"":{""id"":""education"",""title"":""Học vấn"",""isVisible"":true},""skills"":{""id"":""skills"",""title"":""Kỹ năng"",""isVisible"":true},""certificates"":{""id"":""certificates"",""title"":""Chứng chỉ"",""isVisible"":true}},""sidebarSections"":[""skills"",""certificates""],""contactsPlacement"":""header""},""structure"":""single"",""sidebarWidthPct"":32,""colors"":{""primary"":""#111827"",""secondary"":""#4b5563"",""textPrimary"":""#111827"",""textMuted"":""#6b7280"",""paperBackground"":""#ffffff""},""typography"":{""fontFamily"":""font-sans"",""baseFontSizePx"":13.5,""headingVariant"":""minimal"",""uppercaseHeadings"":true,""dividerStyle"":""solid"",""dividerWidthPx"":1,""enclosure"":""flat"",""verticalTagEnabled"":false},""spacing"":{""density"":""normal"",""sectionGapMm"":5,""itemGapMm"":3,""pagePaddingMm"":15},""zones"":{""headerBg"":""transparent"",""sidebarBg"":""transparent"",""mainBg"":""transparent""},""policy"":{""policyApproved"":true,""isPublished"":true},""avatarConfig"":{""visible"":false,""shape"":""circle"",""sizePx"":96,""hasBorder"":false}}",
                        Created = new DateTime(2026, 10, 11, 0, 0, 0, DateTimeKind.Utc),
                        CreatedBy = "system",
                    };
                }
                if (!appContext.CvThemes.Any(x => x.Slug == "canva-clean-slate"))
                {
                    yield return new CvTheme
                    {
                        Slug = "canva-clean-slate",
                        Ten = @"Community Manager Clean Slate",
                        MoTa = @"Xám slate hiện đại, sidebar phải, kỹ năng dạng pill",
                        DanhMuc = "developer",
                        CapBac = "all",
                        Tags = "Studio,Canva",
                        PhongCachThietKe = "studio",
                        SoCot = 2,
                        ThanThienATS = true,
                        MauSacChuDao = "#0f766e",
                        IsActive = true,
                        ThuTu = 47,
                        CauHinhJson = @"{""id"":""canva-clean-slate"",""slug"":""canva-clean-slate"",""name"":""Community Manager Clean Slate"",""description"":""Xám slate hiện đại, sidebar phải, kỹ năng dạng pill"",""thumbnailGradient"":""linear-gradient(135deg,#0f766e,#14b8a6)"",""category"":""developer"",""level"":""all"",""atsFriendly"":true,""createdAt"":""2026-10-11T08:41:56.060Z"",""updatedAt"":""2026-10-11T08:41:56.060Z"",""isDefault"":false,""layout"":{""sectionOrder"":[""summary"",""experience"",""projects"",""education"",""skills"",""certificates""],""sections"":{""summary"":{""id"":""summary"",""title"":""Tóm tắt"",""isVisible"":true},""experience"":{""id"":""experience"",""title"":""Kinh nghiệm làm việc"",""isVisible"":true},""projects"":{""id"":""projects"",""title"":""Dự án tiêu biểu"",""isVisible"":true},""education"":{""id"":""education"",""title"":""Học vấn"",""isVisible"":true},""skills"":{""id"":""skills"",""title"":""Kỹ năng"",""isVisible"":true},""certificates"":{""id"":""certificates"",""title"":""Chứng chỉ"",""isVisible"":true}},""sidebarSections"":[""skills"",""certificates"",""education""],""contactsPlacement"":""sidebar""},""structure"":""sidebar-right"",""sidebarWidthPct"":32,""colors"":{""primary"":""#0f766e"",""secondary"":""#14b8a6"",""textPrimary"":""#1e293b"",""textMuted"":""#64748b"",""paperBackground"":""#ffffff""},""typography"":{""fontFamily"":""font-sans"",""baseFontSizePx"":13.5,""headingVariant"":""left-border"",""uppercaseHeadings"":true,""dividerStyle"":""dashed"",""dividerWidthPx"":2,""enclosure"":""left-pill"",""verticalTagEnabled"":false},""spacing"":{""density"":""normal"",""sectionGapMm"":5,""itemGapMm"":3,""pagePaddingMm"":15},""zones"":{""headerBg"":""transparent"",""sidebarBg"":""#f8fafc"",""mainBg"":""transparent""},""policy"":{""policyApproved"":true,""isPublished"":true},""avatarConfig"":{""visible"":true,""shape"":""circle"",""sizePx"":96,""hasBorder"":false}}",
                        Created = new DateTime(2026, 10, 11, 0, 0, 0, DateTimeKind.Utc),
                        CreatedBy = "system",
                    };
                }
                if (!appContext.CvThemes.Any(x => x.Slug == "canva-blue-gold-designer"))
                {
                    yield return new CvTheme
                    {
                        Slug = "canva-blue-gold-designer",
                        Ten = @"Modern Graphic Blue & Gold",
                        MoTa = @"Xanh ocean + vàng gold, sidebar tối, tag dọc DESIGN PORTFOLIO",
                        DanhMuc = "designer",
                        CapBac = "all",
                        Tags = "Studio,Canva",
                        PhongCachThietKe = "studio",
                        SoCot = 2,
                        ThanThienATS = false,
                        MauSacChuDao = "#0c4a6e",
                        IsActive = true,
                        ThuTu = 48,
                        CauHinhJson = @"{""id"":""canva-blue-gold-designer"",""slug"":""canva-blue-gold-designer"",""name"":""Modern Graphic Blue & Gold"",""description"":""Xanh ocean + vàng gold, sidebar tối, tag dọc DESIGN PORTFOLIO"",""thumbnailGradient"":""linear-gradient(135deg,#0c4a6e,#eab308)"",""category"":""designer"",""level"":""all"",""atsFriendly"":false,""createdAt"":""2026-10-11T08:41:56.060Z"",""updatedAt"":""2026-10-11T08:41:56.060Z"",""isDefault"":false,""layout"":{""sectionOrder"":[""summary"",""experience"",""projects"",""education"",""skills"",""certificates""],""sections"":{""summary"":{""id"":""summary"",""title"":""Tóm tắt"",""isVisible"":true},""experience"":{""id"":""experience"",""title"":""Kinh nghiệm làm việc"",""isVisible"":true},""projects"":{""id"":""projects"",""title"":""Dự án tiêu biểu"",""isVisible"":true},""education"":{""id"":""education"",""title"":""Học vấn"",""isVisible"":true},""skills"":{""id"":""skills"",""title"":""Kỹ năng"",""isVisible"":true},""certificates"":{""id"":""certificates"",""title"":""Chứng chỉ"",""isVisible"":true}},""sidebarSections"":[""skills"",""certificates""],""contactsPlacement"":""sidebar""},""structure"":""sidebar-left"",""sidebarWidthPct"":35,""colors"":{""primary"":""#0c4a6e"",""secondary"":""#eab308"",""textPrimary"":""#0f172a"",""textMuted"":""#64748b"",""paperBackground"":""#ffffff""},""typography"":{""fontFamily"":""font-sans"",""baseFontSizePx"":13.5,""headingVariant"":""pill"",""uppercaseHeadings"":true,""dividerStyle"":""accent-dot"",""dividerWidthPx"":2,""enclosure"":""flat"",""verticalTagEnabled"":true,""verticalTagText"":""DESIGN PORTFOLIO""},""spacing"":{""density"":""normal"",""sectionGapMm"":5,""itemGapMm"":3,""pagePaddingMm"":15},""zones"":{""headerBg"":""transparent"",""sidebarBg"":""#0c4a6e"",""mainBg"":""transparent""},""policy"":{""policyApproved"":true,""isPublished"":true},""avatarConfig"":{""visible"":true,""shape"":""rounded"",""sizePx"":100,""hasBorder"":true,""borderColor"":""secondary""}}",
                        Created = new DateTime(2026, 10, 11, 0, 0, 0, DateTimeKind.Utc),
                        CreatedBy = "system",
                    };
                }
                if (!appContext.CvThemes.Any(x => x.Slug == "canva-executive-banner"))
                {
                    yield return new CvTheme
                    {
                        Slug = "canva-executive-banner",
                        Ten = @"Executive Blue Header Banner",
                        MoTa = @"Banner ngang xanh royal cho senior, dưới chia 2 cột",
                        DanhMuc = "business",
                        CapBac = "senior",
                        Tags = "Studio,Canva",
                        PhongCachThietKe = "studio",
                        SoCot = 2,
                        ThanThienATS = true,
                        MauSacChuDao = "#1d4ed8",
                        IsActive = true,
                        ThuTu = 49,
                        CauHinhJson = @"{""id"":""canva-executive-banner"",""slug"":""canva-executive-banner"",""name"":""Executive Blue Header Banner"",""description"":""Banner ngang xanh royal cho senior, dưới chia 2 cột"",""thumbnailGradient"":""linear-gradient(135deg,#1d4ed8,#1e3a8a)"",""category"":""business"",""level"":""senior"",""atsFriendly"":true,""createdAt"":""2026-10-11T08:41:56.060Z"",""updatedAt"":""2026-10-11T08:41:56.060Z"",""isDefault"":false,""layout"":{""sectionOrder"":[""summary"",""experience"",""projects"",""education"",""skills"",""certificates""],""sections"":{""summary"":{""id"":""summary"",""title"":""Tóm tắt"",""isVisible"":true},""experience"":{""id"":""experience"",""title"":""Kinh nghiệm làm việc"",""isVisible"":true},""projects"":{""id"":""projects"",""title"":""Dự án tiêu biểu"",""isVisible"":true},""education"":{""id"":""education"",""title"":""Học vấn"",""isVisible"":true},""skills"":{""id"":""skills"",""title"":""Kỹ năng"",""isVisible"":true},""certificates"":{""id"":""certificates"",""title"":""Chứng chỉ"",""isVisible"":true}},""sidebarSections"":[""skills"",""certificates""],""contactsPlacement"":""header""},""structure"":""banner-top"",""sidebarWidthPct"":30,""colors"":{""primary"":""#1d4ed8"",""secondary"":""#60a5fa"",""textPrimary"":""#0f172a"",""textMuted"":""#64748b"",""paperBackground"":""#ffffff""},""typography"":{""fontFamily"":""font-sans"",""baseFontSizePx"":13.5,""headingVariant"":""underline"",""uppercaseHeadings"":true,""dividerStyle"":""solid"",""dividerWidthPx"":2,""enclosure"":""flat"",""verticalTagEnabled"":false},""spacing"":{""density"":""normal"",""sectionGapMm"":5,""itemGapMm"":3,""pagePaddingMm"":15},""zones"":{""headerBg"":""#1e3a8a"",""sidebarBg"":""#f1f5f9"",""mainBg"":""transparent""},""policy"":{""policyApproved"":true,""isPublished"":true},""avatarConfig"":{""visible"":true,""shape"":""circle"",""sizePx"":100,""hasBorder"":true,""borderColor"":""white""}}",
                        Created = new DateTime(2026, 10, 11, 0, 0, 0, DateTimeKind.Utc),
                        CreatedBy = "system",
                    };
                }
                if (!appContext.CvThemes.Any(x => x.Slug == "canva-darkroom-creative"))
                {
                    yield return new CvTheme
                    {
                        Slug = "canva-darkroom-creative",
                        Ten = @"Creative Darkroom Studio",
                        MoTa = @"Tím vàng trên charcoal nghệ thuật, tag dọc VISUAL RESUME",
                        DanhMuc = "creative",
                        CapBac = "all",
                        Tags = "Studio,Canva",
                        PhongCachThietKe = "studio",
                        SoCot = 2,
                        ThanThienATS = false,
                        MauSacChuDao = "#7c3aed",
                        IsActive = true,
                        ThuTu = 50,
                        CauHinhJson = @"{""id"":""canva-darkroom-creative"",""slug"":""canva-darkroom-creative"",""name"":""Creative Darkroom Studio"",""description"":""Tím vàng trên charcoal nghệ thuật, tag dọc VISUAL RESUME"",""thumbnailGradient"":""linear-gradient(135deg,#7c3aed,#f59e0b)"",""category"":""creative"",""level"":""all"",""atsFriendly"":false,""createdAt"":""2026-10-11T08:41:56.060Z"",""updatedAt"":""2026-10-11T08:41:56.060Z"",""isDefault"":false,""layout"":{""sectionOrder"":[""summary"",""experience"",""projects"",""education"",""skills"",""certificates""],""sections"":{""summary"":{""id"":""summary"",""title"":""Tóm tắt"",""isVisible"":true},""experience"":{""id"":""experience"",""title"":""Kinh nghiệm làm việc"",""isVisible"":true},""projects"":{""id"":""projects"",""title"":""Dự án tiêu biểu"",""isVisible"":true},""education"":{""id"":""education"",""title"":""Học vấn"",""isVisible"":true},""skills"":{""id"":""skills"",""title"":""Kỹ năng"",""isVisible"":true},""certificates"":{""id"":""certificates"",""title"":""Chứng chỉ"",""isVisible"":true}},""sidebarSections"":[""skills"",""certificates""],""contactsPlacement"":""sidebar""},""structure"":""sidebar-left"",""sidebarWidthPct"":36,""colors"":{""primary"":""#7c3aed"",""secondary"":""#f59e0b"",""textPrimary"":""#18181b"",""textMuted"":""#71717a"",""paperBackground"":""#fbfbfe""},""typography"":{""fontFamily"":""font-mono"",""baseFontSizePx"":13.5,""headingVariant"":""left-border"",""uppercaseHeadings"":true,""dividerStyle"":""gradient"",""dividerWidthPx"":2,""enclosure"":""flat"",""verticalTagEnabled"":true,""verticalTagText"":""VISUAL RESUME""},""spacing"":{""density"":""normal"",""sectionGapMm"":5,""itemGapMm"":3,""pagePaddingMm"":15},""zones"":{""headerBg"":""transparent"",""sidebarBg"":""#18181b"",""mainBg"":""transparent""},""policy"":{""policyApproved"":true,""isPublished"":true},""avatarConfig"":{""visible"":true,""shape"":""rounded"",""sizePx"":100,""hasBorder"":false}}",
                        Created = new DateTime(2026, 10, 11, 0, 0, 0, DateTimeKind.Utc),
                        CreatedBy = "system",
                    };
                }
                if (!appContext.CvThemes.Any(x => x.Slug == "canva-editorial-classic"))
                {
                    yield return new CvTheme
                    {
                        Slug = "canva-editorial-classic",
                        Ten = @"Classic Editorial Grid",
                        MoTa = @"Đen trắng serif thanh lịch, section đóng khung",
                        DanhMuc = "ats",
                        CapBac = "senior",
                        Tags = "Studio,Canva",
                        PhongCachThietKe = "studio",
                        SoCot = 1,
                        ThanThienATS = true,
                        MauSacChuDao = "#27272a",
                        IsActive = true,
                        ThuTu = 51,
                        CauHinhJson = @"{""id"":""canva-editorial-classic"",""slug"":""canva-editorial-classic"",""name"":""Classic Editorial Grid"",""description"":""Đen trắng serif thanh lịch, section đóng khung"",""thumbnailGradient"":""linear-gradient(135deg,#27272a,#71717a)"",""category"":""ats"",""level"":""senior"",""atsFriendly"":true,""createdAt"":""2026-10-11T08:41:56.060Z"",""updatedAt"":""2026-10-11T08:41:56.060Z"",""isDefault"":false,""layout"":{""sectionOrder"":[""summary"",""experience"",""projects"",""education"",""skills"",""certificates""],""sections"":{""summary"":{""id"":""summary"",""title"":""Tóm tắt"",""isVisible"":true},""experience"":{""id"":""experience"",""title"":""Kinh nghiệm làm việc"",""isVisible"":true},""projects"":{""id"":""projects"",""title"":""Dự án tiêu biểu"",""isVisible"":true},""education"":{""id"":""education"",""title"":""Học vấn"",""isVisible"":true},""skills"":{""id"":""skills"",""title"":""Kỹ năng"",""isVisible"":true},""certificates"":{""id"":""certificates"",""title"":""Chứng chỉ"",""isVisible"":true}},""sidebarSections"":[""skills"",""certificates""],""contactsPlacement"":""header""},""structure"":""single"",""sidebarWidthPct"":32,""colors"":{""primary"":""#27272a"",""secondary"":""#71717a"",""textPrimary"":""#18181b"",""textMuted"":""#71717a"",""paperBackground"":""#ffffff""},""typography"":{""fontFamily"":""font-serif"",""baseFontSizePx"":13.5,""headingVariant"":""underline"",""uppercaseHeadings"":true,""dividerStyle"":""solid"",""dividerWidthPx"":2,""enclosure"":""boxed"",""verticalTagEnabled"":false},""spacing"":{""density"":""normal"",""sectionGapMm"":5,""itemGapMm"":3,""pagePaddingMm"":15},""zones"":{""headerBg"":""transparent"",""sidebarBg"":""transparent"",""mainBg"":""transparent""},""policy"":{""policyApproved"":true,""isPublished"":true},""avatarConfig"":{""visible"":true,""shape"":""circle"",""sizePx"":96,""hasBorder"":true,""borderColor"":""muted""}}",
                        Created = new DateTime(2026, 10, 11, 0, 0, 0, DateTimeKind.Utc),
                        CreatedBy = "system",
                    };
                }
            yield break;
        }

        public static async Task SeedAsync(IApplicationDbContext appContext)
        {
            foreach (var theme in PendingThemes(appContext).ToList())
            {
                await appContext.CvThemes.AddAsync(theme);
            }
            // Ẩn 7 seeds Studio cũ (bản vẽ tay mới thay thế, tránh gallery trùng):
            // rows giữ nguyên cho CV cũ, chỉ tắt hiển thị.
            var legacySlugs = new[]
            {
                "canva-corporate-navy",
                "canva-minimal-monochrome",
                "canva-clean-slate",
                "canva-blue-gold-designer",
                "canva-executive-banner",
                "canva-darkroom-creative",
                "canva-editorial-classic",
            };
            var legacyRows = appContext.CvThemes
                .Where(x => legacySlugs.Contains(x.Slug) && x.IsActive)
                .ToList();
            foreach (var row in legacyRows)
            {
                row.IsActive = false;
            }
            await appContext.SaveChangesAsync();
        }
    }
}
