/**
 * Registry metadata của Web `features/tao-cv/template-registry.ts` — port
 * metadata-only (id/label/description/tags/version/columns/categories/paperSize).
 * KHÔNG port Component React (mobile render preview qua route /cv-render của Web)
 * và KHÔNG port hydrateTemplateRegistry (overlay DB cv_themes — xem report).
 */

export type TemplateCategory =
  | 'ats'
  | 'developer'
  | 'corporate'
  | 'creative'
  | 'senior'
  | 'fresher'
  | 'two-column'
  | 'one-column';

export type ResumeTemplateMeta = {
  id: string;
  label: string;
  description: string;
  tags: string[];
  /** Version tĩnh để lưu cùng CV — render lại đúng bản dù template đã đổi. */
  version: string;
  /** Cột layout (1 | 2) — filter gallery. */
  columns?: 1 | 2;
  /** Gallery/selector filter facets. */
  categories?: TemplateCategory[];
  /** Giấy A4 (Web render A4). */
  paperSize: 'A4';
};

export const TEMPLATE_REGISTRY: Record<string, ResumeTemplateMeta> = {
  'minimal-ats': {
    id: 'minimal-ats',
    label: 'Minimal ATS',
    description: 'Một cột, tương thích hệ thống lọc hồ sơ',
    tags: ['ATS', 'Professional'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['ats', 'corporate', 'fresher', 'one-column'],
  },
  'tech-modern': {
    id: 'tech-modern',
    label: 'Tech Modern',
    description: 'Hai cột, dành cho IT / Developer',
    tags: ['IT', 'Developer'],
    version: '1.0',
    paperSize: 'A4',
    columns: 2,
    categories: ['developer', 'two-column'],
  },
  'ats-classic': {
    id: 'ats-classic',
    label: 'ATS Classic',
    description: 'Một cột gọn nhẹ, tối ưu hệ thống lọc hồ sơ',
    tags: ['ATS', 'Backend', 'DevOps'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['ats', 'developer', 'one-column'],
  },
  'compact-developer': {
    id: 'compact-developer',
    label: 'Compact Developer',
    description: 'Một cột siêu gọn cho fresher / junior IT',
    tags: ['ATS', 'Fresher', 'Junior'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['ats', 'developer', 'fresher', 'one-column'],
  },
  'clean-corporate': {
    id: 'clean-corporate',
    label: 'Clean Corporate',
    description: 'Phong cách công sở chuẩn mực cho BA / PM / QA / HR',
    tags: ['Corporate', 'BA', 'PM'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['corporate', 'one-column'],
  },
  'creative-portfolio': {
    id: 'creative-portfolio',
    label: 'Creative Portfolio',
    description: 'Cá tính mạnh, dự án dạng thẻ cho designer / frontend',
    tags: ['Creative', 'Portfolio', 'Designer'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['creative', 'developer', 'one-column'],
  },
  'academic-cv': {
    id: 'academic-cv',
    label: 'Academic CV',
    description: 'Học vấn lên trước, đánh số nghiên cứu / chứng chỉ',
    tags: ['Academic', 'Research', 'Học vấn'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['ats', 'fresher', 'one-column'],
  },
  'data-specialist': {
    id: 'data-specialist',
    label: 'Data Specialist',
    description: 'Dải stack nổi bật, dự án dẫn đầu cho Data / AI / ML',
    tags: ['Data', 'AI', 'ML'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['developer', 'one-column'],
  },
  'startup-modern': {
    id: 'startup-modern',
    label: 'Startup Modern',
    description: 'Trẻ trung, gọn nhẹ nhưng vẫn chuyên nghiệp',
    tags: ['Startup', 'Hiện đại', 'Fresher'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['creative', 'fresher', 'one-column'],
  },
  'ocean-wave': {
    id: 'ocean-wave',
    label: 'Ocean Wave',
    description: 'Sidebar sóng xanh, timeline thân thiện cho dịch vụ',
    tags: ['Sales', 'CSKH', 'Du lịch', 'Giao tiếp'],
    version: '1.0',
    paperSize: 'A4',
    columns: 2,
    categories: ['creative', 'two-column'],
  },
  'forest-fresh': {
    id: 'forest-fresh',
    label: 'Forest Fresh',
    description: 'Xanh lá tươi mới, mục tiêu nghề nghiệp dạng quote',
    tags: ['Môi trường', 'Giáo dục', 'NGO', 'Content'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['creative', 'one-column'],
  },
  'bento-grid': {
    id: 'bento-grid',
    label: 'Bento Grid',
    description: 'Module lưới bento bất đối xứng kiểu portfolio web',
    tags: ['Portfolio', 'Frontend', 'Product', 'Dự án'],
    version: '1.0',
    paperSize: 'A4',
    columns: 2,
    categories: ['creative', 'two-column'],
  },
  'zen-minimal': {
    id: 'zen-minimal',
    label: 'Zen Minimal',
    description: 'Khoảng trắng cực lớn, không màu accent',
    tags: ['Tối giản', 'Cao cấp'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['ats', 'one-column'],
  },
  'snapshot-pro': {
    id: 'snapshot-pro',
    label: 'Snapshot Pro',
    description: 'Ảnh đại diện lớn, chuẩn CV ảnh thị trường',
    tags: ['Ảnh', 'Giao tiếp', 'Dịch vụ'],
    version: '1.0',
    paperSize: 'A4',
    columns: 2,
    categories: ['corporate', 'two-column'],
  },
  'care-plus': {
    id: 'care-plus',
    label: 'Care Plus',
    description: 'Header chữ thập y tế, block chứng chỉ hành nghề',
    tags: ['Y tế', 'Bác sĩ', 'Điều dưỡng', 'Chứng chỉ'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['corporate', 'one-column'],
  },
  'mentor-class': {
    id: 'mentor-class',
    label: 'Mentor Class',
    description: 'Sidebar thành tích giảng dạy, bảng khóa đào tạo',
    tags: ['Giáo viên', 'Đào tạo', 'Học thuật'],
    // 1.1: banner chuẩn hóa (custom → vị trí ứng tuyển → 'Hồ sơ năng lực').
    version: '1.1',
    paperSize: 'A4',
    columns: 1,
    categories: ['corporate', 'one-column'],
  },
  'vault-finance': {
    id: 'vault-finance',
    label: 'Vault Finance',
    description: 'Navy + gold premium, bảng số liệu tài chính',
    tags: ['Ngân hàng', 'Tài chính', 'CFA'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['senior', 'one-column'],
  },
  'editorial-magazine': {
    id: 'editorial-magazine',
    label: 'Editorial Magazine',
    description: 'Bố cục tạp chí, drop-cap và pull-quote',
    tags: ['Editorial', 'Tạp chí', 'Content'],
    version: '1.0',
    paperSize: 'A4',
    columns: 2,
    categories: ['creative', 'two-column'],
  },
  'archi-portfolio': {
    id: 'archi-portfolio',
    label: 'Archi Portfolio',
    description: 'Khung bản vẽ kỹ thuật, nhãn sheet',
    tags: ['Kiến trúc', 'Bản vẽ', 'Portfolio'],
    version: '1.0',
    paperSize: 'A4',
    columns: 2,
    categories: ['creative', 'two-column'],
  },
  'legal-prestige': {
    id: 'legal-prestige',
    label: 'Legal Prestige',
    description: 'Trang trọng, điều khoản đánh số La Mã',
    tags: ['Luật', 'Pháp chế'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['corporate', 'one-column'],
  },
  'research-scholar': {
    id: 'research-scholar',
    label: 'Research Scholar',
    description: 'Abstract, citation và metrics học thuật',
    tags: ['Nghiên cứu', 'Học thuật'],
    version: '1.0',
    paperSize: 'A4',
    columns: 2,
    categories: ['senior', 'two-column'],
  },
  'culinary-signature': {
    id: 'culinary-signature',
    label: 'Culinary Signature',
    description: 'Phong cách menu nhà hàng cao cấp',
    tags: ['F&B', 'Đầu bếp'],
    // 1.1: banner/sections chuẩn hóa theo ngành (BATCH-print task).
    // Version ghi vào Payload lúc lưu CV mới (mapper đọc từ đây).
    version: '1.1',
    paperSize: 'A4',
    columns: 1,
    categories: ['creative', 'one-column'],
  },
  'mono-portfolio': {
    id: 'mono-portfolio',
    label: 'Portfolio Đơn Sắc',
    description: 'Đen trắng tối giản kiểu portfolio cá nhân',
    tags: ['Đen trắng', 'Portfolio', 'Tối giản'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['creative', 'one-column'],
  },
  'kem-minimal': {
    id: 'kem-minimal',
    label: 'Tối Giản Kem',
    description: 'Nền kem thanh lịch, căn giữa tối giản',
    tags: ['Tối giản', 'Thanh lịch', 'Nhẹ nhàng'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['corporate', 'one-column'],
  },
  'beige-editorial': {
    id: 'beige-editorial',
    label: 'Editorial Be',
    description: 'Phong cách báo chí, khung viền rõ ràng',
    tags: ['Báo chí', 'Thanh lịch', 'Khung viền'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['corporate', 'one-column'],
  },
  'canva-corporate-navy': {
    id: 'canva-corporate-navy',
    label: 'Navy Công Sở',
    description: '2 cột thanh lịch, sidebar khói tràn viền, avatar tròn',
    tags: ['Navy', 'Công sở', '2 cột'],
    version: '1.0',
    paperSize: 'A4',
    columns: 2,
    categories: ['corporate', 'two-column'],
  },
  'canva-minimal-monochrome': {
    id: 'canva-minimal-monochrome',
    label: 'Đơn Sắc ATS',
    description: 'Đen trắng tinh tế 1 cột, line mảnh, chuẩn máy quét',
    tags: ['ATS', 'Đen trắng', 'Tối giản'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['ats', 'one-column'],
  },
  'canva-clean-slate': {
    id: 'canva-clean-slate',
    label: 'Slate Sạch',
    description: 'Sidebar phải slate nhẹ, tag phẳng thoáng đãng',
    tags: ['Slate', 'Nhẹ nhàng', 'Hiện đại'],
    version: '1.0',
    paperSize: 'A4',
    columns: 2,
    categories: ['developer', 'two-column'],
  },
  'canva-blue-gold-designer': {
    id: 'canva-blue-gold-designer',
    label: 'Xanh Vàng Executive',
    description: 'Navy sang trọng nhấn line vàng gold mảnh',
    tags: ['Navy', 'Vàng gold', 'Sang trọng'],
    version: '1.0',
    paperSize: 'A4',
    columns: 2,
    categories: ['corporate', 'creative', 'two-column'],
  },
  'canva-executive-banner': {
    id: 'canva-executive-banner',
    label: 'Banner Xanh',
    description: 'Banner ngang xanh sẫm tràn viền, 2 cột thoáng',
    tags: ['Banner', 'Xanh', 'Senior'],
    version: '1.0',
    paperSize: 'A4',
    columns: 2,
    categories: ['corporate', 'senior', 'two-column'],
  },
  'canva-darkroom-creative': {
    id: 'canva-darkroom-creative',
    label: 'Than Chì Sáng Tạo',
    description: 'Sidebar than chì chữ trắng, dải chữ dọc tinh tế',
    tags: ['Tối', 'Sáng tạo', 'Tương phản'],
    version: '1.0',
    paperSize: 'A4',
    columns: 2,
    categories: ['creative', 'two-column'],
  },
  'canva-editorial-classic': {
    id: 'canva-editorial-classic',
    label: 'Editorial Cổ Điển',
    description: 'Serif sang trọng, phân cách bằng khoảng trắng',
    tags: ['Serif', 'Báo chí', 'Thanh lịch'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['ats', 'senior', 'one-column'],
  },
  'nhan-su-royal': {
    id: 'nhan-su-royal',
    label: 'Nhân Sự Royal',
    description: 'Xanh hoàng gia cho HR, photo blob, sóng footer',
    tags: ['Nhân sự', 'Xanh', 'Chuyên nghiệp'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['corporate', 'one-column'],
  },
  'den-moody': {
    id: 'den-moody',
    label: 'Đen Moody',
    description: 'Cột đen ảnh duotone tương phản cột sáng',
    tags: ['Đen', 'Cá tính', 'Tương phản'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['creative', 'one-column'],
  },
  'do-hoa-lime': {
    id: 'do-hoa-lime',
    label: 'Đồ Họa Lime',
    description: 'Sidebar xanh dương, quote lime nổi bật',
    tags: ['Thiết kế', 'Xanh', 'Nổi bật'],
    version: '1.0',
    paperSize: 'A4',
    columns: 1,
    categories: ['creative', 'one-column'],
  },
};

export const TEMPLATE_CATEGORIES: { id: TemplateCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'ats', label: 'ATS' },
  { id: 'developer', label: 'Developer' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'creative', label: 'Creative' },
  { id: 'senior', label: 'Senior' },
  { id: 'fresher', label: 'Fresher' },
  { id: 'two-column', label: '2 cột' },
  { id: 'one-column', label: '1 cột' },
];

export const DEFAULT_TEMPLATE_ID = 'minimal-ats';

/**
 * Legacy template ids saved by older versions ('modern', 'professional',
 * 'creative', 'minimal'). Resolved at render time only — the stored
 * templateId in backend is never rewritten by this mapping.
 */
const LEGACY_ALIASES: Record<string, string> = {
  modern: 'tech-modern',
  minimal: 'minimal-ats',
  professional: 'tech-modern',
  creative: 'tech-modern',
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

/** Nhãn chip gallery theo wireframe: 'Chuẩn ATS', 'IT / Dev' (registry giữ nhãn gốc). */
export const GALLERY_CHIP_LABELS: Partial<Record<TemplateCategory | 'all', string>> = {
  ats: 'Chuẩn ATS',
  developer: 'IT / Dev',
};

/** Nhãn nhóm hiển thị trên card gallery ('Chuẩn ATS • 1 cột'). */
export function templateCategoryLabel(meta: ResumeTemplateMeta): string {
  const cats = meta.categories ?? [];
  const first = TEMPLATE_CATEGORIES.find((c) => c.id !== 'all' && cats.includes(c.id));
  if (!first) return 'Mẫu CV';
  return GALLERY_CHIP_LABELS[first.id] ?? first.label;
}
