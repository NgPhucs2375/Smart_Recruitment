"use client";

import { FileText, UploadCloud, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import {
  MAX_IMPORT_BYTES,
  SUPPORTED_IMPORT_EXTENSIONS,
  formatBytes,
} from "@/features/tao-cv/cv-import";

interface CvUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CvUpload({
  file,
  onFileChange,
  onError,
  disabled = false,
  className,
}: CvUploadProps) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/json": [".json"],
    },
    maxSize: MAX_IMPORT_BYTES,
    multiple: false,
    disabled,
    noClick: true,
    noKeyboard: true,
    onDropAccepted: (files) => onFileChange(files[0] ?? null),
    onDropRejected: (rejections) => {
      const rejected = rejections[0];
      if (rejected?.errors.some((item) => item.code === "file-too-large")) {
        onError(`File quá lớn. Giới hạn ${formatBytes(MAX_IMPORT_BYTES)}.`);
        return;
      }
      onError("Chỉ hỗ trợ file PDF, DOCX hoặc JSON Resume.");
    },
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Chọn file CV để nhập"
        aria-disabled={disabled}
        onClick={disabled ? undefined : open}
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) open();
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          isDragActive
            ? "border-primary bg-muted"
            : "border-border bg-muted hover:border-marine/60 hover:bg-muted",
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-navy text-white">
          <UploadCloud className="size-5" />
        </span>
        <p className="mt-3 text-sm font-medium text-foreground">
          Kéo thả file vào đây hoặc bấm để chọn
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Chỉ hỗ trợ {SUPPORTED_IMPORT_EXTENSIONS.join(", ")} • tối đa {formatBytes(MAX_IMPORT_BYTES)}
        </p>
        <input {...getInputProps()} />
      </div>

      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-3">
          <FileText className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onFileChange(null)}
            aria-label="Xóa file đã chọn"
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
