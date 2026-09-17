"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CvUpload } from "./cv-upload";
import { CvImportError, parseCvFile } from "@/features/tao-cv/cv-import";
import type { CvFormData } from "@/lib/types";
import { cvApi } from "@/lib/api/cv-api";

interface CvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hoSoUngVienId: number | null;
  onImported: (data: Partial<CvFormData>, importSessionId: string) => void;
}

export function CvImportDialog({ open, onOpenChange, hoSoUngVienId, onImported }: CvImportDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [importing, setImporting] = React.useState(false);

  const reset = () => {
    setFile(null);
    setError(null);
    setImporting(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleImport = async () => {
    if (!file || !hoSoUngVienId || importing) return;
    setError(null);
    setImporting(true);
    try {
      const [partial, session] = await Promise.all([
        parseCvFile(file),
        cvApi.prepareImport(hoSoUngVienId, file),
      ]);
      onImported(partial, session.sessionId);
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

            <CvUpload
              className="mt-5"
              file={file}
              disabled={importing}
              onFileChange={(next) => {
                setError(null);
                setFile(next);
              }}
              onError={(message) => {
                setFile(null);
                setError(message);
              }}
            />

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
              <Button size="sm" className="rounded-full" onClick={handleImport} disabled={!file || !hoSoUngVienId || importing}>
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
