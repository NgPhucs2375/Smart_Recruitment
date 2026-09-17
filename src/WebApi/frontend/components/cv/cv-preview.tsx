"use client";

// Wrapper giao diện preview; nội dung CV được render duy nhất bởi CvDocument.
import type { CvFormData } from "@/lib/types";
import { CvDocument } from "./cv-document";

interface CvPreviewProps {
  data: CvFormData;
}

export function CvPreview({ data }: CvPreviewProps) {
  return <CvDocument data={data} />;
}
