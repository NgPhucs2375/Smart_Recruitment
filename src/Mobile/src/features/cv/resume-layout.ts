/**
 * Modular layout (thứ tự + ẩn/hiện section) — port 1:1 từ
 * `features/tao-cv/resume-data.ts` (chỉ phần layout; ResumeData renderer
 * của Web không cần trên mobile vì preview chạy server qua /cv-render).
 */

export type CvSectionId =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'certificates';

export interface SectionConfig {
  id: CvSectionId;
  /** Tiêu đề hiển thị (cho phép đổi tên). */
  title: string;
  isVisible: boolean;
}

export interface ResumeLayoutConfig {
  sectionOrder: CvSectionId[];
  sections: Record<CvSectionId, SectionConfig>;
  /** Section nào vào sidebar khi theme dùng layout 2 cột (config từng theme). */
  sidebarSections?: CvSectionId[];
  /** Khối liên hệ nằm ở header hay đầu sidebar (theme 2 cột). Mặc định header. */
  contactsPlacement?: 'header' | 'sidebar';
}

/** Mặc định sidebar: liên hệ không có id riêng nên chỉ gồm skills + certificates. */
export const DEFAULT_SIDEBAR_SECTIONS: CvSectionId[] = ['skills', 'certificates'];

export const DEFAULT_SECTION_ORDER: CvSectionId[] = [
  'summary',
  'experience',
  'projects',
  'education',
  'skills',
  'certificates',
];

export const SECTION_TITLES: Record<CvSectionId, string> = {
  summary: 'Tóm tắt',
  experience: 'Kinh nghiệm làm việc',
  projects: 'Dự án tiêu biểu',
  education: 'Học vấn',
  skills: 'Kỹ năng',
  certificates: 'Chứng chỉ',
};

export function createDefaultLayoutConfig(): ResumeLayoutConfig {
  const sections = {} as Record<CvSectionId, SectionConfig>;
  for (const id of DEFAULT_SECTION_ORDER) {
    sections[id] = { id, title: SECTION_TITLES[id], isVisible: true };
  }
  return {
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    sections,
    sidebarSections: [...DEFAULT_SIDEBAR_SECTIONS],
    contactsPlacement: 'header',
  };
}

/** Chuẩn hóa config từ JSON/draft cũ: thiếu → default, id lạ → bỏ. */
export function normalizeLayoutConfig(raw: unknown): ResumeLayoutConfig {
  const fallback = createDefaultLayoutConfig();
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as { sectionOrder?: unknown; sections?: unknown; sidebarSections?: unknown };
  const order = Array.isArray(r.sectionOrder)
    ? (r.sectionOrder as unknown[]).filter(
        (id): id is CvSectionId =>
          typeof id === 'string' && (DEFAULT_SECTION_ORDER as string[]).includes(id),
      )
    : [];
  const merged: CvSectionId[] = [...order];
  for (const id of DEFAULT_SECTION_ORDER) {
    if (!merged.includes(id)) merged.push(id);
  }
  const rawSections = (r.sections ?? {}) as Record<
    string,
    { title?: unknown; isVisible?: unknown }
  >;
  const sections = { ...fallback.sections };
  for (const id of DEFAULT_SECTION_ORDER) {
    const s = rawSections[id];
    if (s && typeof s === 'object') {
      sections[id] = {
        id,
        title: typeof s.title === 'string' && s.title.trim() ? s.title : SECTION_TITLES[id],
        isVisible: s.isVisible !== false,
      };
    }
  }
  const sidebar = validSidebar(r.sidebarSections)
    ? [...r.sidebarSections]
    : [...DEFAULT_SIDEBAR_SECTIONS];
  const rawPlacement = (r as { contactsPlacement?: unknown }).contactsPlacement;
  const contactsPlacement = rawPlacement === 'sidebar' ? 'sidebar' : 'header';
  return { sectionOrder: merged, sections, sidebarSections: sidebar, contactsPlacement };
}

const validSidebar = (v: unknown): v is CvSectionId[] =>
  Array.isArray(v) &&
  v.every(
    (id) => typeof id === 'string' && (DEFAULT_SECTION_ORDER as string[]).includes(id),
  );
