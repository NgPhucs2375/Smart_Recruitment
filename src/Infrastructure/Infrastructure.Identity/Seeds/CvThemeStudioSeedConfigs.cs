using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace Infrastructure.Identity.Seeds
{
    /// <summary>
    /// Config ThemeCanvas cho các row `cv_themes` được curate metadata nhưng
    /// chưa từng có component render (professional-split, sunset-gradient,
    /// midnight-pro, ...). Row có `CauHinhJson` hợp lệ sẽ được
    /// `registerStudioEntry` (features/tao-cv/template-registry.ts) đăng ký
    /// động và vẽ bằng ThemeCanvas — DB là nguồn chân lý, không cần viết
    /// template React tĩnh mới.
    ///
    /// Token set lấy đúng theo CvThemeConfig (features/tao-cv/types/theme-studio.ts);
    /// giá trị design bám theo MoTa/MauSacChuDao/TamLyMauSac/PhongCachThietKe đã
    /// seed trong CvThemeConfiguration.cs.
    /// </summary>
    public static class CvThemeStudioSeedConfigs
    {
        /// <summary>Một phương án design tokens. Field mặc định = mặc định Studio.</summary>
        public sealed record Design(
            string Structure,
            string Primary,
            string? Secondary = null,
            string Paper = "#ffffff",
            string Text = "#0f172a",
            string Muted = "#64748b",
            string Font = "font-sans",
            double FontSize = 13.5,
            string Heading = "underline",
            bool Uppercase = true,
            string Divider = "solid",
            int DividerWidth = 2,
            string Enclosure = "flat",
            string HeaderAlign = "left",
            double LineHeight = 1.4,
            string Density = "normal",
            int SidebarWidthPct = 32,
            int MainWidthPct = 100,
            int Radius = 8,
            string ZoneStyle = "flat",
            string Decoration = "none",
            string Timeline = "none",
            string SkillMode = "outline-tag",
            string? Gradient = null,
            string HeaderBg = "transparent",
            string SidebarBg = "#f1f5f9",
            string MainBg = "transparent",
            bool AvatarVisible = false,
            int AvatarSizePx = 96,
            string? Thumbnail = null,
            double SectionGapMm = 5,
            double ItemGapMm = 3,
            double PagePaddingMm = 15);

        private static readonly Dictionary<string, Design> Specs = new(StringComparer.Ordinal)
        {
            // 2 cột sidebar hẹp, navy trầm — "Thanh lịch 2 cột".
            ["professional-split"] = new("sidebar-left", "#274b73", "#4f7ca8",
                SidebarWidthPct: 28, SidebarBg: "#eef2f7", Heading: "left-border", SkillMode: "list"),
            // 1 cột điểm nhấn màu dẫn mắt — "Điểm nhấn hiện đại".
            ["modern-accent"] = new("single", "#274b73", "#3b82f6",
                Heading: "accent-bg", Gradient: "linear-gradient(90deg,#274b73,#3b82f6)", SkillMode: "pill"),
            // Doanh nghiệp trang trọng cho senior/lead — serif, header split.
            ["executive-tech"] = new("single", "#1f2a37", "#475569",
                Font: "font-serif", HeaderAlign: "split", Timeline: "vertical-line", Heading: "underline"),
            // Header gradient rực rỡ cho ngành sáng tạo — "tên nổi bật".
            ["sunset-gradient"] = new("single", "#f97316", "#ec4899",
                Paper: "#fff7ed", HeaderBg: "linear-gradient(135deg,#f97316,#ec4899,#8b5cf6)",
                HeaderAlign: "center", ZoneStyle: "floating-cards", Decoration: "soft-blobs",
                Radius: 12, SkillMode: "pill", Thumbnail: "linear-gradient(135deg,#f97316,#ec4899)"),
            // Nền tối chữ trắng, skill mono — "đẳng cấp kỹ thuật".
            ["midnight-pro"] = new("single", "#38bdf8", "#22d3ee",
                Paper: "#0f172a", Text: "#e2e8f0", Muted: "#94a3b8", Font: "font-mono",
                SidebarBg: "rgba(255,255,255,0.05)", Radius: 6, SkillMode: "outline-tag",
                Thumbnail: "linear-gradient(135deg,#0f172a,#38bdf8)"),
            // Thẻ pastel bo tròn, avatar lớn — "nhẹ nhàng tinh tế".
            ["pastel-studio"] = new("sidebar-left", "#db2777", "#a78bfa",
                Paper: "#fffbfa", SidebarWidthPct: 34, SidebarBg: "#fdf2f8",
                ZoneStyle: "floating-cards", Decoration: "soft-blobs", Radius: 16,
                SkillMode: "pill", AvatarVisible: true, AvatarSizePx: 120,
                Thumbnail: "linear-gradient(135deg,#f9a8d4,#a78bfa)"),
            // Nền gradient loang futuristic — giấy là gradient, chữ nổi.
            ["aurora-mesh"] = new("single", "#34d399", "#a855f7",
                Paper: "linear-gradient(160deg,#0f172a,#1e1b4b 45%,#134e4a)",
                Text: "#f8fafc", Muted: "#94a3b8", HeaderAlign: "center",
                Enclosure: "boxed", Radius: 14, Gradient: "linear-gradient(120deg,#34d399,#a855f7)",
                MainBg: "transparent", SidebarBg: "rgba(255,255,255,0.05)",
                Thumbnail: "linear-gradient(160deg,#1e1b4b,#34d399)"),
            // Pop-art: khối màu vàng-đỏ-cobalt, heading pill, số liệu nổi.
            ["pop-art-bold"] = new("single", "#facc15", "#ef4444",
                Paper: "#fffbeb", Text: "#111827", HeaderBg: "#facc15", HeaderAlign: "center",
                Decoration: "geometric-circles", Enclosure: "boxed", Divider: "accent-dot",
                Radius: 4, SkillMode: "pill", Thumbnail: "linear-gradient(135deg,#facc15,#ef4444)"),
            // Trục thời gian dọc kể hành trình thăng tiến.
            ["career-timeline"] = new("single", "#1e3a5f", "#5b7ea6",
                Timeline: "vertical-line", Heading: "left-border", SkillMode: "minimal-comma"),
            // Sidebar phải + thanh % kỹ năng, lưới nhẹ — "trực quan dữ liệu".
            ["infographic-pro"] = new("sidebar-right", "#0d9488", "#14b8a6",
                Paper: "#f8fefd", SidebarWidthPct: 30, SidebarBg: "#e6f7f5",
                ZoneStyle: "split-margin", Decoration: "subtle-grid", Enclosure: "boxed",
                Radius: 10, SkillMode: "progress-bar"),
            // Header một màu đặc, tên khổng lồ — thương hiệu cá nhân lãnh đạo.
            ["statement-header"] = new("single", "#1e40af", "#1c3ea8",
                HeaderBg: "#1e40af", Text: "#f8fafc", Muted: "#cbd5e1", Paper: "#ffffff",
                Heading: "minimal", Divider: "none", Uppercase: true, HeaderAlign: "left",
                Enclosure: "left-pill", FontSize: 13, Thumbnail: "linear-gradient(135deg,#1e40af,#0f172a)"),
            // Ép 1 trang mật độ cao cho C-level — lề hẹp, gap compact.
            ["one-page-exec"] = new("sidebar-left", "#0f2a44", "#3b6ea5",
                SidebarWidthPct: 27, SidebarBg: "#eff4f9", Density: "compact",
                SectionGapMm: 3, ItemGapMm: 2, PagePaddingMm: 12, FontSize: 12.5,
                DividerWidth: 1, Heading: "underline", SkillMode: "minimal-comma"),
            // Bo tròn thân thiện cho dịch vụ/bán lẻ/thực tập — avatar nổi bật.
            ["host-warm"] = new("single", "#fb923c", "#fdba74",
                Paper: "#fffaf5", HeaderAlign: "center", ZoneStyle: "floating-cards",
                Decoration: "soft-blobs", Radius: 16, SkillMode: "pill",
                AvatarVisible: true, AvatarSizePx: 100, Thumbnail: "linear-gradient(135deg,#fb923c,#fde68a)"),
            // Band nghiêng + khối chuyển động cho multimedia.
            ["motion-creative"] = new("single", "#f43f5e", "#a855f7",
                Paper: "#fff5f7", HeaderBg: "linear-gradient(120deg,#f43f5e,#a855f7)",
                HeaderAlign: "center", Decoration: "diagonal-cut", Enclosure: "boxed",
                Radius: 12, SkillMode: "pill", Gradient: "linear-gradient(120deg,#f43f5e,#a855f7)",
                Thumbnail: "linear-gradient(120deg,#f43f5e,#a855f7)"),
            // Lookbook thời trang: serif, khoảng trắng lớn, divider ẩn.
            ["fashion-editorial"] = new("single", "#0a0a0a", "#737373",
                Font: "font-serif", Text: "#0a0a0a", Muted: "#6b7280", HeaderAlign: "center",
                Heading: "minimal", Divider: "none", Decoration: "top-accent-bar",
                LineHeight: 1.6, SectionGapMm: 7, SkillMode: "minimal-comma",
                Thumbnail: "linear-gradient(135deg,#0a0a0a,#e5e5e5)"),
            // Lưới blueprint + chữ mono, section đóng khung kiểu specs-table.
            ["industrial-blueprint"] = new("single", "#475569", "#64748b",
                Paper: "#f8fafc", Font: "font-mono", Text: "#111827", Muted: "#475569",
                Heading: "left-border", Divider: "dashed", Enclosure: "boxed", Radius: 4,
                Decoration: "subtle-grid", SkillMode: "list",
                Thumbnail: "linear-gradient(135deg,#475569,#1e293b)"),
        };

        /// <summary>Slug sẽ được cấp config (elegant-serif không ở đây: seed coi nó là bản trùng code đã xóa).</summary>
        public static IReadOnlyCollection<string> Slugs => Specs.Keys;

        /// <summary>Dựng CauHinhJson cho 1 row; null nếu slug không có phương án design.</summary>
        public static string? BuildJson(string slug, string? ten, string? moTa, bool atsFriendly)
        {
            if (!Specs.TryGetValue(slug, out var d)) return null;
            var now = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.000Z");
            var payload = new
            {
                Id = slug,
                Slug = slug,
                Name = string.IsNullOrWhiteSpace(ten) ? slug : ten,
                Description = moTa,
                ThumbnailGradient = d.Thumbnail,
                CreatedAt = now,
                UpdatedAt = now,
                IsDefault = false,
                AtsFriendly = atsFriendly,
                Structure = d.Structure,
                SidebarWidthPct = d.SidebarWidthPct,
                MainWidthPct = d.MainWidthPct,
                BorderRadiusPx = d.Radius,
                ZoneStyle = d.ZoneStyle,
                Decoration = d.Decoration,
                TimelineStyle = d.Timeline,
                SkillDisplayMode = d.SkillMode,
                AccentGradient = d.Gradient,
                Colors = new
                {
                    Primary = d.Primary,
                    Secondary = d.Secondary ?? d.Primary,
                    TextPrimary = d.Text,
                    TextMuted = d.Muted,
                    PaperBackground = d.Paper,
                },
                Typography = new
                {
                    FontFamily = d.Font,
                    BaseFontSizePx = d.FontSize,
                    HeadingVariant = d.Heading,
                    UppercaseHeadings = d.Uppercase,
                    DividerStyle = d.Divider,
                    DividerWidthPx = d.DividerWidth,
                    Enclosure = d.Enclosure,
                    VerticalTagEnabled = false,
                    LineHeightScale = d.LineHeight,
                    HeaderAlign = d.HeaderAlign,
                    DividerSpacingMm = 2,
                },
                Spacing = new
                {
                    Density = d.Density,
                    SectionGapMm = d.SectionGapMm,
                    ItemGapMm = d.ItemGapMm,
                    PagePaddingMm = d.PagePaddingMm,
                },
                Zones = new
                {
                    HeaderBg = d.HeaderBg,
                    SidebarBg = d.SidebarBg,
                    MainBg = d.MainBg,
                },
                Policy = new
                {
                    PolicyApproved = true,
                    IsPublished = true,
                    ApprovedBy = "system",
                    ApprovedAt = now,
                    Notes = "Phat hanh qua ThemeCanvas (seed config)",
                },
                AvatarConfig = new
                {
                    Visible = d.AvatarVisible,
                    Shape = "circle",
                    SizePx = d.AvatarSizePx,
                    HasBorder = d.AvatarVisible,
                    BorderColor = "primary",
                    Position = "left",
                },
            };
            return JsonSerializer.Serialize(payload, JsonOptions);
        }

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
        };
    }
}
