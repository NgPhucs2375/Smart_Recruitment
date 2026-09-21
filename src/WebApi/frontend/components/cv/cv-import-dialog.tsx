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
  const [elapsed, setElapsed] = React.useState(0);
  // Dialog đóng giữa chừng thì kết quả về sau bị bỏ (tránh đổ dữ liệu muộn vào form).
  const cancelledRef = React.useRef(false);

  // Prewarm engine đọc PDF/DOCX ngay khi mở dialog để lúc bấm "Nhập CV"
  // không tốn thêm 1 lượt tải module nặng (~vài trăm KB).
  React.useEffect(() => {
    if (!open) return;
    cancelledRef.current = false;
    void import("pdfjs-dist").catch(() => undefined);
    void import("mammoth").catch(() => undefined);
  }, [open ]);

  // Đồng hồ chờ để user biết tiến độ khi AI phân tích file lớn (30–90s là bình thường).
  React.useEffect(() => {
    if (!importing) return;
    const timer = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [importing]);

  const reset = () => {
    setFile(null);
    setError(null);
    setImporting(false);
    setElapsed(0);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      cancelledRef.current = true;
      reset();
    } else {
      cancelledRef.current = false;
    }
    onOpenChange(next);
  };

  const handleImport = async () => {
    if (!file || !hoSoUngVienId || importing) return;
    setError(null);
    setElapsed(0);
    setImporting(true);
    try {
      // Đọc text + tải file lên server chạy song song; AI phân tích nội dung
      // là bước lâu nhất (thường 30–90s với file nhiều chữ).
      const [partial, session] = await Promise.all([
        parseCvFile(file),
        cvApi.prepareImport(hoSoUngVienId, file),
      ]);
      if (cancelledRef.current) return;
      onImported(partial, session.sessionId);
      handleOpenChange(false);
    } catch (e) {
      if (cancelledRef.current) return;
      setError(e instanceof CvImportError ? e.message : "Không đọc được file, vui lòng thử lại.");
    } finally {
      if (!cancelledRef.current) setImporting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPrimitive.Popup className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl outline-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-foreground">
                  Tải CV hiện có
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                  Tải CV của bạn để sử dụng làm dữ liệu khởi đầu. Bạn vẫn có thể chỉnh sửa toàn bộ nội dung sau khi nhập.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                aria-label="Đóng"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
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

            {importing && (
              <p role="status" className="mt-3 flex items-start gap-2 rounded-2xl border border-border bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground">
                <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin" />
                Đang đọc và phân tích CV bằng AI (đã chờ {elapsed}s — file nhiều chữ thường mất 30–90s, bạn cứ để dialog mở).
              </p>
            )}
            {error && (
              <p role="alert" className="mt-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <DialogPrimitive.Close className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                Huỷ
              </DialogPrimitive.Close>
              <Button size="sm" className="rounded-full" onClick={handleImport} disabled={!file || !hoSoUngVienId || importing}>
                {importing && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                {importing ? `Đang nhập (${elapsed}s)...` : "Nhập CV"}
              </Button>
            </div>
          </DialogPrimitive.Popup>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
