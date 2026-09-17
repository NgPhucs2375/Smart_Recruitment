export { emptyAiDraft, draftHasContent, draftSections, aiDraftToCvFormData } from "./ai-draft";
export type { AiDraftCv } from "./ai-draft";
export {
  CV_CONTACT_FIELDS,
  CV_SECTION_KEYS,
  SECTION_LABEL,
  buildAssistantSnapshot,
  clearPendingCvPatch,
  isCvContactField,
  isCvSectionKey,
  loadPendingCvPatch,
  missingRequiredFields,
  savePendingCvPatch,
  toJsonSafe,
} from "./cv-assistant-state";
export type {
  AssistantItemRef,
  AssistantSnapshot,
  CvContactField,
  CvSectionKey,
  PendingCvPatch,
  PendingSectionPatch,
} from "./cv-assistant-state";
export {
  applyContactPatch,
  applySectionItems,
  applyTemplatePatch,
  removeSectionItem,
  sectionReport,
} from "./merge-cv-patch";
export type { ContactPatchResult, SectionPatchResult } from "./merge-cv-patch";
