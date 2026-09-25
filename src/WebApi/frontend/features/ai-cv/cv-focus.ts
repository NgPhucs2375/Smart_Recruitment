export const CV_FOCUS_SECTIONS = [
  "contact",
  "experience",
  "education",
  "skills",
  "projects",
  "certificates",
] as const;

export type CvFocusSection = (typeof CV_FOCUS_SECTIONS)[number];

const CV_FOCUS_EVENT = "hireai:cv-focus-section";

const SECTION_LABELS: Record<CvFocusSection, string> = {
  contact: "Thông tin liên hệ",
  experience: "Kinh nghiệm làm việc",
  education: "Học vấn",
  skills: "Kỹ năng",
  projects: "Dự án",
  certificates: "Chứng chỉ",
};

const SECTION_SEARCH_TEXT: Record<CvFocusSection, string[]> = {
  contact: ["Thông tin liên hệ", "Liên hệ"],
  experience: ["Kinh nghiệm làm việc", "Kinh nghiệm"],
  education: ["Học vấn"],
  skills: ["Kỹ năng", "Kỹ năng chuyên môn", "Kỹ năng chính"],
  projects: ["Dự án", "Dự án tiêu biểu"],
  certificates: ["Chứng chỉ", "Chứng chỉ & ấn phẩm"],
};

let activeFocusTarget: HTMLElement | null = null;
let focusTimer: number | undefined;

export function getCvFocusSectionLabel(section: CvFocusSection) {
  return SECTION_LABELS[section];
}

export function requestCvSectionFocus(section: CvFocusSection) {
  if (typeof window === "undefined") return false;
  window.dispatchEvent(new CustomEvent(CV_FOCUS_EVENT, { detail: { section } }));
  return true;
}

export function getCvFocusEventName() {
  return CV_FOCUS_EVENT;
}

export function focusCvSectionInDom(section: CvFocusSection) {
  const exactTarget =
    document.getElementById(`cv-section-${section}`) ??
    document.querySelector<HTMLElement>(`[data-cv-section="${section}"]`);
  const previewTarget = document.querySelector<HTMLElement>("[data-cv-document]");
  const headingTarget = previewTarget
    ? Array.from(previewTarget.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,div,span"))
        .find((element) => SECTION_SEARCH_TEXT[section].includes(element.textContent?.trim() ?? ""))
    : undefined;
  const target = exactTarget ?? headingTarget ?? previewTarget;

  if (!target) return false;
  if (activeFocusTarget) activeFocusTarget.classList.remove("cv-ai-focused");
  if (focusTimer) window.clearTimeout(focusTimer);
  activeFocusTarget = target;
  target.classList.remove("cv-ai-focused");
  void target.offsetWidth;
  target.classList.add("cv-ai-focused");
  target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  focusTimer = window.setTimeout(() => {
    target.classList.remove("cv-ai-focused");
    if (activeFocusTarget === target) activeFocusTarget = null;
  }, 3000);
  return true;
}
