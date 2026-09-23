"use client";

// Registry thống nhất metadata và props của template, không chứa logic form/export.
import type { ComponentType } from "react";
import type { ResumeData } from "./resume-data";
import type { ResumeTemplateProps } from "@/components/cv/templates/shared";
import { MinimalAtsTemplate } from "@/components/cv/templates/minimal-ats";
import { TechModernTemplate } from "@/components/cv/templates/tech-modern";
import { AtsClassicTemplate } from "@/components/cv/templates/ats-classic";
import { ProfessionalSplitTemplate } from "@/components/cv/templates/professional-split";
import { ModernAccentTemplate } from "@/components/cv/templates/modern-accent";
import { ExecutiveTechTemplate } from "@/components/cv/templates/executive-tech";
import { CompactDeveloperTemplate } from "@/components/cv/templates/compact-developer";
import { SidebarProTemplate } from "@/components/cv/templates/sidebar-pro";
import { CleanCorporateTemplate } from "@/components/cv/templates/clean-corporate";
import { CreativePortfolioTemplate } from "@/components/cv/templates/creative-portfolio";
import { SeniorExecutiveTemplate } from "@/components/cv/templates/senior-executive";
import { AcademicCvTemplate } from "@/components/cv/templates/academic-cv";
import { DataSpecialistTemplate } from "@/components/cv/templates/data-specialist";
import { DevopsStackTemplate } from "@/components/cv/templates/devops-stack";
import { ProductBuilderTemplate } from "@/components/cv/templates/product-builder";
import { StartupModernTemplate } from "@/components/cv/templates/startup-modern";
import { ElegantSerifTemplate } from "@/components/cv/templates/elegant-serif";
import { MinimalGridTemplate } from "@/components/cv/templates/minimal-grid";
import { SunsetGradientTemplate } from "@/components/cv/templates/sunset-gradient";
import { OceanWaveTemplate } from "@/components/cv/templates/ocean-wave";
import { ForestFreshTemplate } from "@/components/cv/templates/forest-fresh";
import { MidnightProTemplate } from "@/components/cv/templates/midnight-pro";
import { PastelStudioTemplate } from "@/components/cv/templates/pastel-studio";
import { BentoGridTemplate } from "@/components/cv/templates/bento-grid";
import { AuroraMeshTemplate } from "@/components/cv/templates/aurora-mesh";
import { PopArtBoldTemplate } from "@/components/cv/templates/pop-art-bold";
import { CareerTimelineTemplate } from "@/components/cv/templates/career-timeline";
import { InfographicProTemplate } from "@/components/cv/templates/infographic-pro";
import { StatementHeaderTemplate } from "@/components/cv/templates/statement-header";
import { ZenMinimalTemplate } from "@/components/cv/templates/zen-minimal";
import { SnapshotProTemplate } from "@/components/cv/templates/snapshot-pro";
import { OnePageExecTemplate } from "@/components/cv/templates/one-page-exec";
import { CarePlusTemplate } from "@/components/cv/templates/care-plus";
import { MentorClassTemplate } from "@/components/cv/templates/mentor-class";
import { VaultFinanceTemplate } from "@/components/cv/templates/vault-finance";
import { HostWarmTemplate } from "@/components/cv/templates/host-warm";
import { EditorialMagazineTemplate } from "@/components/cv/templates/editorial-magazine";
import { ArchiPortfolioTemplate } from "@/components/cv/templates/archi-portfolio";
import { LegalPrestigeTemplate } from "@/components/cv/templates/legal-prestige";
import { MotionCreativeTemplate } from "@/components/cv/templates/motion-creative";
import { ResearchScholarTemplate } from "@/components/cv/templates/research-scholar";
import { CulinarySignatureTemplate } from "@/components/cv/templates/culinary-signature";
import { FashionEditorialTemplate } from "@/components/cv/templates/fashion-editorial";
import { IndustrialBlueprintTemplate } from "@/components/cv/templates/industrial-blueprint";

export type TemplateCategory =
  | "ats"
  | "developer"
  | "corporate"
  | "creative"
  | "senior"
  | "fresher"
  | "two-column"
  | "one-column";

export type ResumeTemplateMeta = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  /** Version tĩnh để lưu cùng CV — render lại đúng bản dù template đã đổi. */
  version: string;
  Component: ComponentType<ResumeTemplateProps>;
  /** Column structure for layout filters. Frontend-only, defaults to 1. */
  columns?: 1 | 2;
  /** Gallery/selector filter facets. Frontend-only. */
  categories?: TemplateCategory[];
  /** DB-driven overlay (bảng cv_themes). Không đụng Component/render. */
  previewImageUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
  /** Thân thiện ATS từ DB (cột ThanThienATS). Undefined = chưa hydrate. */
  atsFriendly?: boolean;
  source?: "static" | "db";
};

/** Metadata tối thiểu từ API cv_themes để phủ lên registry tĩnh. */
export type DbThemeOverlay = {
  Slug: string;
  Ten?: string | null;
  MoTa?: string | null;
  Tags?: string | null;
  DanhMuc?: string | null;
  SoCot?: number | null;
  IsActive?: boolean | null;
  ThuTu?: number | null;
  PreviewStorageKey?: string | null;
  Id?: number | null;
  ThanThienATS?: boolean | null;
};

/**
 * Phủ metadata DB lên registry tĩnh. Slug lạ bị bỏ qua để render
 * không bao giờ crash (giữ triết lý resolveTemplateId fallback).
 * previewImageUrl trỏ endpoint stream public của backend.
 */
export function hydrateTemplateRegistry(themes: DbThemeOverlay[]): void {
  for (const theme of themes) {
    const slug = (theme.Slug ?? "").trim().toLowerCase();
    const meta = TEMPLATE_REGISTRY[slug];
    if (!slug || !meta) continue;
    if (theme.Ten?.trim()) meta.name = theme.Ten.trim();
    if (theme.MoTa?.trim()) meta.description = theme.MoTa.trim();
    if (theme.Tags?.trim()) {
      meta.tags = theme.Tags.split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
    if (theme.DanhMuc?.trim()) {
      const cats = theme.DanhMuc.split(",")
        .map((c) => c.trim().toLowerCase())
        .filter((c): c is TemplateCategory =>
          (TEMPLATE_CATEGORIES as { id: string }[]).some((k) => k.id === c));
      if (cats.length > 0) meta.categories = cats;
    }
    if (theme.SoCot === 1 || theme.SoCot === 2) meta.columns = theme.SoCot;
    if (typeof theme.IsActive === "boolean") meta.isActive = theme.IsActive;
    if (typeof theme.ThuTu === "number") meta.sortOrder = theme.ThuTu;
    if (typeof theme.ThanThienATS === "boolean") meta.atsFriendly = theme.ThanThienATS;
    // Chỉ trỏ preview URL khi DB thực sự có ảnh. Gán mù khiến gallery
    // chuyển sang <img> 404 trắng trơn — live render luôn là fallback.
    if (typeof theme.Id === "number" && theme.PreviewStorageKey?.trim()) {
      meta.previewImageUrl = `/api/dotnet/cvthemes/${theme.Id}/preview`;
    } else {
      delete meta.previewImageUrl;
    }
    meta.source = "db";
  }
}

export const TEMPLATE_CATEGORIES: { id: TemplateCategory | "all"; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "ats", label: "ATS" },
  { id: "developer", label: "Developer" },
  { id: "corporate", label: "Corporate" },
  { id: "creative", label: "Creative" },
  { id: "senior", label: "Senior" },
  { id: "fresher", label: "Fresher" },
  { id: "two-column", label: "2 cột" },
  { id: "one-column", label: "1 cột" },
];

/**
 * Single source of truth for visual CV templates.
 * Templates consume ResumeData only — no form state, no API, no backend.
 */
export const TEMPLATE_REGISTRY: Record<string, ResumeTemplateMeta> = {
  "minimal-ats": {
    id: "minimal-ats",
    name: "Minimal ATS",
    description: "Một cột, tương thích hệ thống lọc hồ sơ",
    tags: ["ATS", "Professional"],
    version: "1.0",
    Component: MinimalAtsTemplate,
    columns: 1,
    categories: ["ats", "corporate", "fresher", "one-column"],
  },
  "tech-modern": {
    id: "tech-modern",
    name: "Tech Modern",
    description: "Hai cột, dành cho IT / Developer",
    tags: ["IT", "Developer"],
    version: "1.0",
    Component: TechModernTemplate,
    columns: 2,
    categories: ["developer", "two-column"],
  },
  "ats-classic": {
    id: "ats-classic",
    name: "ATS Classic",
    description: "Một cột gọn nhẹ, tối ưu hệ thống lọc hồ sơ",
    tags: ["ATS", "Backend", "DevOps"],
    version: "1.0",
    Component: AtsClassicTemplate,
    columns: 1,
    categories: ["ats", "developer", "one-column"],
  },
  "professional-split": {
    id: "professional-split",
    name: "Professional Split",
    description: "Hai cột thanh lịch, sidebar hẹp cho IT / BA / PM",
    tags: ["IT", "2 cột", "Chuyên nghiệp"],
    version: "1.0",
    Component: ProfessionalSplitTemplate,
    columns: 2,
    categories: ["developer", "corporate", "two-column"],
  },
  "modern-accent": {
    id: "modern-accent",
    name: "Modern Accent",
    description: "Hiện đại, điểm nhấn mạnh cho Product / Frontend",
    tags: ["Hiện đại", "Frontend", "Product"],
    version: "1.0",
    Component: ModernAccentTemplate,
    columns: 1,
    categories: ["creative", "developer", "one-column"],
  },
  "executive-tech": {
    id: "executive-tech",
    name: "Executive Tech",
    description: "Bố cục doanh nghiệp trang trọng cho senior / lead",
    tags: ["Senior", "Chuyên nghiệp", "Lead"],
    version: "1.0",
    Component: ExecutiveTechTemplate,
    columns: 1,
    categories: ["senior", "corporate", "one-column"],
  },
  "compact-developer": {
    id: "compact-developer",
    name: "Compact Developer",
    description: "Một cột siêu gọn cho fresher / junior IT",
    tags: ["ATS", "Fresher", "Junior"],
    version: "1.0",
    Component: CompactDeveloperTemplate,
    columns: 1,
    categories: ["ats", "developer", "fresher", "one-column"],
  },
  "sidebar-pro": {
    id: "sidebar-pro",
    name: "Sidebar Pro",
    description: "Sidebar phải, kỹ năng đặt lên đầu cho IT",
    tags: ["IT", "2 cột", "Kỹ năng"],
    version: "1.0",
    Component: SidebarProTemplate,
    columns: 2,
    categories: ["developer", "two-column"],
  },
  "clean-corporate": {
    id: "clean-corporate",
    name: "Clean Corporate",
    description: "Phong cách công sở chuẩn mực cho BA / PM / QA / HR",
    tags: ["Corporate", "BA", "PM"],
    version: "1.0",
    Component: CleanCorporateTemplate,
    columns: 1,
    categories: ["corporate", "one-column"],
  },
  "creative-portfolio": {
    id: "creative-portfolio",
    name: "Creative Portfolio",
    description: "Cá tính mạnh, dự án dạng thẻ cho designer / frontend",
    tags: ["Creative", "Portfolio", "Designer"],
    version: "1.0",
    Component: CreativePortfolioTemplate,
    columns: 1,
    categories: ["creative", "developer", "one-column"],
  },
  "senior-executive": {
    id: "senior-executive",
    name: "Senior Executive",
    description: "Thoáng đãng, tôn vinh kinh nghiệm lãnh đạo",
    tags: ["Senior", "Leadership", "Manager"],
    version: "1.0",
    Component: SeniorExecutiveTemplate,
    columns: 1,
    categories: ["senior", "corporate", "one-column"],
  },
  "academic-cv": {
    id: "academic-cv",
    name: "Academic CV",
    description: "Học vấn lên trước, đánh số nghiên cứu / chứng chỉ",
    tags: ["Academic", "Research", "Học vấn"],
    version: "1.0",
    Component: AcademicCvTemplate,
    columns: 1,
    categories: ["ats", "fresher", "one-column"],
  },
  "data-specialist": {
    id: "data-specialist",
    name: "Data Specialist",
    description: "Dải stack nổi bật, dự án dẫn đầu cho Data / AI / ML",
    tags: ["Data", "AI", "ML"],
    version: "1.0",
    Component: DataSpecialistTemplate,
    columns: 1,
    categories: ["developer", "one-column"],
  },
  "devops-stack": {
    id: "devops-stack",
    name: "DevOps Stack",
    description: "Timeline ngày tháng, nhóm công cụ hạ tầng rõ ràng",
    tags: ["DevOps", "Infra", "Cloud"],
    version: "1.0",
    Component: DevopsStackTemplate,
    columns: 1,
    categories: ["developer", "one-column"],
  },
  "product-builder": {
    id: "product-builder",
    name: "Product Builder",
    description: "Dự án lên trước, nhấn mạnh kết quả sản phẩm",
    tags: ["Product", "PM", "Freelance"],
    version: "1.0",
    Component: ProductBuilderTemplate,
    columns: 1,
    categories: ["creative", "fresher", "one-column"],
  },
  "startup-modern": {
    id: "startup-modern",
    name: "Startup Modern",
    description: "Trẻ trung, gọn nhẹ nhưng vẫn chuyên nghiệp",
    tags: ["Startup", "Hiện đại", "Fresher"],
    version: "1.0",
    Component: StartupModernTemplate,
    columns: 1,
    categories: ["creative", "fresher", "one-column"],
  },
  "elegant-serif": {
    id: "elegant-serif",
    name: "Elegant Serif",
    description: "Tiêu đề serif trang nhã, thân thiện ATS",
    tags: ["Serif", "Editorial", "Premium"],
    version: "1.0",
    Component: ElegantSerifTemplate,
    columns: 1,
    categories: ["corporate", "creative", "senior", "one-column"],
  },
  "minimal-grid": {
    id: "minimal-grid",
    name: "Minimal Grid",
    description: "Mô-đun lưới gọn gàng, cấu trúc thị giác rõ",
    tags: ["Grid", "Hiện đại", "Gọn"],
    version: "1.0",
    Component: MinimalGridTemplate,
    columns: 2,
    categories: ["developer", "creative", "two-column"],
  },
  "sunset-gradient": {
    id: "sunset-gradient",
    name: "Sunset Gradient",
    description: "Header gradient rực rỡ, tên nổi bật cho ngành sáng tạo",
    tags: ["Marketing", "Content", "Social", "Branding", "Event"],
    version: "1.0",
    Component: SunsetGradientTemplate,
    columns: 1,
    categories: ["creative", "one-column"],
  },
  "ocean-wave": {
    id: "ocean-wave",
    name: "Ocean Wave",
    description: "Sidebar sóng xanh, timeline thân thiện cho dịch vụ",
    tags: ["Sales", "CSKH", "Du lịch", "Giao tiếp"],
    version: "1.0",
    Component: OceanWaveTemplate,
    columns: 2,
    categories: ["creative", "two-column"],
  },
  "forest-fresh": {
    id: "forest-fresh",
    name: "Forest Fresh",
    description: "Xanh lá tươi mới, mục tiêu nghề nghiệp dạng quote",
    tags: ["Môi trường", "Giáo dục", "NGO", "Content"],
    version: "1.0",
    Component: ForestFreshTemplate,
    columns: 1,
    categories: ["creative", "one-column"],
  },
  "midnight-pro": {
    id: "midnight-pro",
    name: "Midnight Pro",
    description: "Nền tối, skill tags mono cho dân kỹ thuật",
    tags: ["Developer", "DevOps", "Game", "Github"],
    version: "1.0",
    Component: MidnightProTemplate,
    columns: 1,
    categories: ["developer", "one-column"],
  },
  "pastel-studio": {
    id: "pastel-studio",
    name: "Pastel Studio",
    description: "Thẻ pastel bo tròn, avatar lớn cho ngành thẩm mỹ",
    tags: ["Design", "UI", "UX", "Branding", "Portfolio"],
    version: "1.0",
    Component: PastelStudioTemplate,
    columns: 2,
    categories: ["creative", "two-column"],
  },
  "bento-grid": {
    id: "bento-grid",
    name: "Bento Grid",
    description: "Module lưới bento bất đối xứng kiểu portfolio web",
    tags: ["Portfolio", "Frontend", "Product", "Dự án"],
    version: "1.0",
    Component: BentoGridTemplate,
    columns: 2,
    categories: ["creative", "two-column"],
  },
  "aurora-mesh": {
    id: "aurora-mesh",
    name: "Aurora Mesh",
    description: "Nền gradient loang futuristic cho startup và AI",
    tags: ["Startup", "AI", "Product", "Đổi mới"],
    version: "1.0",
    Component: AuroraMeshTemplate,
    columns: 1,
    categories: ["creative", "one-column"],
  },
  "pop-art-bold": {
    id: "pop-art-bold",
    name: "Pop Art Bold",
    description: "Khối màu pop-art, số liệu phóng to kiểu poster",
    tags: ["Quảng cáo", "Event", "Sales", "Truyền thông"],
    version: "1.0",
    Component: PopArtBoldTemplate,
    columns: 1,
    categories: ["creative", "one-column"],
  },
  "career-timeline": {
    id: "career-timeline",
    name: "Career Timeline",
    description: "Trục thời gian dọc kể hành trình thăng tiến",
    tags: ["Thăng tiến", "Quản lý", "Kinh nghiệm"],
    version: "1.0",
    Component: CareerTimelineTemplate,
    columns: 1,
    categories: ["corporate", "one-column"],
  },
  "infographic-pro": {
    id: "infographic-pro",
    name: "Infographic Pro",
    description: "Thanh/donut % kỹ năng và số liệu trực quan",
    tags: ["Kỹ năng", "KPI", "Data"],
    version: "1.0",
    Component: InfographicProTemplate,
    columns: 2,
    categories: ["developer", "two-column"],
  },
  "statement-header": {
    id: "statement-header",
    name: "Statement Header",
    description: "Header màu đặc, tên khổng lồ khó quên",
    tags: ["Quản lý", "Thương hiệu cá nhân"],
    version: "1.0",
    Component: StatementHeaderTemplate,
    columns: 1,
    categories: ["corporate", "one-column"],
  },
  "zen-minimal": {
    id: "zen-minimal",
    name: "Zen Minimal",
    description: "Khoảng trắng cực lớn, không màu accent",
    tags: ["Tối giản", "Cao cấp"],
    version: "1.0",
    Component: ZenMinimalTemplate,
    columns: 1,
    categories: ["ats", "one-column"],
  },
  "snapshot-pro": {
    id: "snapshot-pro",
    name: "Snapshot Pro",
    description: "Ảnh đại diện lớn, chuẩn CV ảnh thị trường",
    tags: ["Ảnh", "Giao tiếp", "Dịch vụ"],
    version: "1.0",
    Component: SnapshotProTemplate,
    columns: 2,
    categories: ["corporate", "two-column"],
  },
  "one-page-exec": {
    id: "one-page-exec",
    name: "One-Page Exec",
    description: "Ép 1 trang mật độ cao cho lãnh đạo bận rộn",
    tags: ["C-level", "Tư vấn", "Súc tích"],
    version: "1.0",
    Component: OnePageExecTemplate,
    columns: 2,
    categories: ["senior", "two-column"],
  },
  "care-plus": {
    id: "care-plus",
    name: "Care Plus",
    description: "Header chữ thập y tế, block chứng chỉ hành nghề",
    tags: ["Y tế", "Bác sĩ", "Điều dưỡng", "Chứng chỉ"],
    version: "1.0",
    Component: CarePlusTemplate,
    columns: 1,
    categories: ["corporate", "one-column"],
  },
  "mentor-class": {
    id: "mentor-class",
    name: "Mentor Class",
    description: "Sidebar thành tích giảng dạy, bảng khóa đào tạo",
    tags: ["Giáo viên", "Đào tạo", "Học thuật"],
    version: "1.0",
    Component: MentorClassTemplate,
    columns: 1,
    categories: ["corporate", "one-column"],
  },
  "vault-finance": {
    id: "vault-finance",
    name: "Vault Finance",
    description: "Navy + gold premium, bảng số liệu tài chính",
    tags: ["Ngân hàng", "Tài chính", "CFA"],
    version: "1.0",
    Component: VaultFinanceTemplate,
    columns: 1,
    categories: ["senior", "one-column"],
  },
  "host-warm": {
    id: "host-warm",
    name: "Host Warm",
    description: "Bo tròn thân thiện cho dịch vụ và thực tập",
    tags: ["Phục vụ", "Bán lẻ", "Thực tập"],
    version: "1.0",
    Component: HostWarmTemplate,
    columns: 1,
    categories: ["fresher", "one-column"],
  },
  "editorial-magazine": {
    id: "editorial-magazine",
    name: "Editorial Magazine",
    description: "Bố cục tạp chí, drop-cap và pull-quote",
    tags: ["Editorial", "Tạp chí", "Content"],
    version: "1.0",
    Component: EditorialMagazineTemplate,
    columns: 2,
    categories: ["creative", "two-column"],
  },
  "archi-portfolio": {
    id: "archi-portfolio",
    name: "Archi Portfolio",
    description: "Khung bản vẽ kỹ thuật, nhãn sheet",
    tags: ["Kiến trúc", "Bản vẽ", "Portfolio"],
    version: "1.0",
    Component: ArchiPortfolioTemplate,
    columns: 2,
    categories: ["creative", "two-column"],
  },
  "legal-prestige": {
    id: "legal-prestige",
    name: "Legal Prestige",
    description: "Trang trọng, điều khoản đánh số La Mã",
    tags: ["Luật", "Pháp chế"],
    version: "1.0",
    Component: LegalPrestigeTemplate,
    columns: 1,
    categories: ["corporate", "one-column"],
  },
  "motion-creative": {
    id: "motion-creative",
    name: "Motion Creative",
    description: "Band nghiêng, khối chuyển động",
    tags: ["Sáng tạo", "Multimedia"],
    version: "1.0",
    Component: MotionCreativeTemplate,
    columns: 1,
    categories: ["creative", "one-column"],
  },
  "research-scholar": {
    id: "research-scholar",
    name: "Research Scholar",
    description: "Abstract, citation và metrics học thuật",
    tags: ["Nghiên cứu", "Học thuật"],
    version: "1.0",
    Component: ResearchScholarTemplate,
    columns: 2,
    categories: ["senior", "two-column"],
  },
  "culinary-signature": {
    id: "culinary-signature",
    name: "Culinary Signature",
    description: "Phong cách menu nhà hàng cao cấp",
    tags: ["F&B", "Đầu bếp"],
    version: "1.0",
    Component: CulinarySignatureTemplate,
    columns: 1,
    categories: ["creative", "one-column"],
  },
  "fashion-editorial": {
    id: "fashion-editorial",
    name: "Fashion Editorial",
    description: "Lookbook, type-scale thời trang",
    tags: ["Thời trang", "Lookbook"],
    version: "1.0",
    Component: FashionEditorialTemplate,
    columns: 1,
    categories: ["creative", "one-column"],
  },
  "industrial-blueprint": {
    id: "industrial-blueprint",
    name: "Industrial Blueprint",
    description: "Lưới blueprint, specs-table kỹ thuật",
    tags: ["Cơ khí", "Bản vẽ", "Kỹ thuật"],
    version: "1.0",
    Component: IndustrialBlueprintTemplate,
    columns: 1,
    categories: ["developer", "one-column"],
  },
};

export const DEFAULT_TEMPLATE_ID = "minimal-ats";

/**
 * Legacy template ids saved by older versions ("modern", "professional",
 * "creative", "minimal"). Resolved at render time only — the stored
 * templateId in backend is never rewritten by this mapping.
 */
const LEGACY_ALIASES: Record<string, string> = {
  modern: "tech-modern",
  minimal: "minimal-ats",
  professional: "tech-modern",
  creative: "tech-modern",
};

export function resolveTemplateId(rawId: string | null | undefined): string {
  if (!rawId) return DEFAULT_TEMPLATE_ID;
  if (TEMPLATE_REGISTRY[rawId]) return rawId;
  return LEGACY_ALIASES[rawId] ?? DEFAULT_TEMPLATE_ID;
}

/**
 * True only for canonical IDs and known legacy aliases — used to tell
 * a deliberate deep-link apart from garbage (?template=xyz must be
 * ignored, never wipe the working copy to default).
 */
export function isKnownTemplateId(rawId: string | null | undefined): boolean {
  if (!rawId) return false;
  return Boolean(TEMPLATE_REGISTRY[rawId] ?? LEGACY_ALIASES[rawId]);
}

export function resolveTemplate(rawId: string | null | undefined): ResumeTemplateMeta {
  return TEMPLATE_REGISTRY[resolveTemplateId(rawId)];
}

/** Fixed sample data for selector thumbnails — layout preview only. */
export const SAMPLE_RESUME: ResumeData = {
  name: "Nguyễn Văn An",
  title: "Frontend Developer",
  summary: "Lập trình viên với 3 năm kinh nghiệm React và TypeScript.",
  contacts: [
    { label: "Email", value: "an.nguyen@email.com" },
    { label: "Điện thoại", value: "0901 234 567" },
    { label: "Địa chỉ", value: "TP. Hồ Chí Minh" },
  ],
  experience: [
    {
      id: "sample-exp-1",
      role: "Frontend Developer",
      company: "Tech Company",
      range: { start: "06/2022", end: "Nay", current: true },
      description: "Phát triển giao diện với React và TypeScript.",
      skills: ["React", "TypeScript"],
    },
    {
      id: "sample-exp-2",
      role: "Intern",
      company: "Startup",
      range: { start: "01/2022", end: "05/2022" },
      skills: ["JavaScript"],
    },
  ],
  education: [
    {
      id: "sample-edu-1",
      school: "Đại học Bách Khoa",
      degree: "Kỹ sư Công nghệ thông tin",
      range: { start: "09/2018", end: "06/2022" },
    },
  ],
  skills: [
    { id: "sample-sk-1", name: "React", detail: "3 năm" },
    { id: "sample-sk-2", name: "TypeScript" },
    { id: "sample-sk-3", name: "Node.js" },
  ],
  projects: [
    {
      id: "sample-pr-1",
      name: "Portfolio Website",
      role: "Developer",
      description: "Website cá nhân với Next.js.",
      tech: ["Next.js", "Tailwind"],
    },
  ],
  certificates: [{ id: "sample-ce-1", name: "AWS Basics", issuer: "Amazon" }],
  hasContent: true,
};
