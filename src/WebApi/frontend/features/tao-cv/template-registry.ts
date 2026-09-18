"use client";

// Registry thống nhất metadata và props của template, không chứa logic form/export.
import type { ComponentType } from "react";
import type { ResumeData } from "./resume-data";
import type { ResumeTemplateProps } from "@/components/cv/templates/shared";
import { MinimalAtsTemplate } from "@/components/cv/templates/minimal-ats";
import { TechModernTemplate } from "@/components/cv/templates/tech-modern";

export type ResumeTemplateMeta = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  /** Version tĩnh để lưu cùng CV — render lại đúng bản dù template đã đổi. */
  version: string;
  Component: ComponentType<ResumeTemplateProps>;
};

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
  },
  "tech-modern": {
    id: "tech-modern",
    name: "Tech Modern",
    description: "Hai cột, dành cho IT / Developer",
    tags: ["IT", "Developer"],
    version: "1.0",
    Component: TechModernTemplate,
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
