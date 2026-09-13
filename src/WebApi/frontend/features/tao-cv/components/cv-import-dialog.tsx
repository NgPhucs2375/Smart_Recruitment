"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { UploadCloud, FileText, X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CvImportError,
  MAX_IMPORT_BYTES,
  SUPPORTED_IMPORT_EXTENSIONS,
  formatBytes,
  parseCvFile,
} from "../cv-import";
import type { CvFormData } from "../types";

interface CvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (data: Partial<CvFormData>) => void;
}

export function CvImportDialog({ open, onOpenChange, onImported }: CvImportDialogProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  const reset = () => {
    setFile(null);
    setError(null);
    setImporting(false);
    setDragOver(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const pickFile = (next: File | null) => {
    setError(null);
    if (!next) {
      setFile(null);
      return;
    }
    const dot = next.name.lastIndexOf(".");
    const ext = dot >= 0 ? next.name.slice(dot).toLowerCase() : "";
    if (!(SUPPORTED_IMPORT_EXTENSIONS as readonly string[]).includes(ext)) {
      setFile(null);
      setError(
        `Định dạng "${ext || "không rõ"}" chưa được hỗ trợ. Hiện tại chỉ nhập được file JSON. Phân tích tự động file PDF/DOCX cần API phía server.`
      );
      return;
    }
    if (next.size > MAX_IMPORT_BYTES) {
      setFile(null);
      setError(`File quá lớn (${formatBytes(next.size)}). Giới hạn ${formatBytes(MAX_IMPORT_BYTES)}.`);
      return;
    }
    if (next.size === 0) {
      setFile(null);
      setError("File rỗng, không có dữ liệu để nhập.");
      return;
    }
    setFile(next);
  };

  const handleImport = async () => {
    if (!file || importing) return;
    setError(null);
    setImporting(true);
    try {
      const partial = await parseCvFile(file);
      onImported(partial);
      handleOpenChange(false);
    } catch (e) {
      setError(e instanceof CvImportError ? e.message : "Không đọc được file, vui lòng thử lại.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-[2px] transition-opacity" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPrimitive.Popup className="w-full max-w-md rounded-3xl border border-linen bg-card p-6 shadow-xl outline-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-charcoal">
                  Tải CV hiện có
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-charcoal/60">
                  Tải CV của bạn để sử dụng làm dữ liệu khởi đầu. Bạn vẫn có thể chỉnh sửa toàn bộ nội dung sau khi nhập.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                aria-label="Đóng"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-charcoal/50 transition hover:bg-ivory hover:text-charcoal"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label="Chọn file CV để nhập"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                "mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition",
                dragOver
                  ? "border-marine bg-frost"
                  : "border-linen bg-ivory hover:border-marine/60 hover:bg-frost/60"
              )}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-navy text-white">
                <UploadCloud className="size-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-charcoal">Kéo thả file vào đây hoặc bấm để chọn</p>
              <p className="mt-1 text-xs text-charcoal/55">
                Chỉ hỗ trợ {SUPPORTED_IMPORT_EXTENSIONS.join(", ")} • tối đa {formatBytes(MAX_IMPORT_BYTES)}
              </p>
              <input
                ref={inputRef}
                type="file"
                accept={SUPPORTED_IMPORT_EXTENSIONS.join(",")}
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {file && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-linen bg-ivory px-4 py-3">
                <FileText className="size-4 shrink-0 text-marine" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-charcoal">{file.name}</p>
                  <p className="text-xs text-charcoal/55">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => pickFile(null)}
                  aria-label="Xóa file đã chọn"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-charcoal/50 transition hover:bg-linen/60 hover:text-charcoal"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {error && (
              <p role="alert" className="mt-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <DialogPrimitive.Close className="rounded-full px-4 py-2 text-sm font-medium text-charcoal/70 transition hover:bg-ivory hover:text-charcoal">
                Huỷ
              </DialogPrimitive.Close>
              <Button size="sm" className="rounded-full" onClick={handleImport} disabled={!file || importing}>
                {importing && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                {importing ? "Đang nhập..." : "Nhập CV"}
              </Button>
            </div>
          </DialogPrimitive.Popup>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
