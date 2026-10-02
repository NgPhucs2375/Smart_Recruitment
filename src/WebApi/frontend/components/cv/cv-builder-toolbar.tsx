"use client";

import Link from "next/link";
import { ArrowLeft, Check, Download, FileJson, MoreHorizontal, Plus, Printer, Save, Star, Trash2, Upload, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CvVersionVm, CvVm } from "@/lib/types";
import { TemplatePicker } from "./template-selector";

export function CvBuilderToolbar({
  title,
  onTitleChange,
  status,
  cvList,
  selectedId,
  templateId,
  versions,
  onSelectCv,
  onSelectTemplate,
  onSetDefault,
  onNew,
  onImport,
  onFillProfile,
  onExportJson,
  onDownloadVersion,
  onDownloadOriginal,
  onDelete,
  onExportPdf,
  onSave,
  saving,
  disabled,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  status: string;
  cvList: CvVm[];
  selectedId: number | null;
  templateId: string;
  versions: CvVersionVm[];
  onSelectCv: (id: number) => void;
  onSelectTemplate: (id: string) => void;
  onSetDefault: (id: number) => void;
  onNew: () => void;
  onImport: () => void;
  onFillProfile: () => void;
  onExportJson: () => void;
  onDownloadVersion: (id: number) => void;
  onDownloadOriginal: () => void;
  onDelete: () => void;
  onExportPdf: () => void;
  onSave: () => void;
  saving: boolean;
  disabled: boolean;
}) {
  const current = cvList.find((cv) => cv.id === selectedId);

  return (
    <header className="relative z-20 -mx-4 border-b border-border bg-background px-4 py-3 sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">CV của tôi</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Chọn CV</DropdownMenuLabel>
              {cvList.length === 0 ? <p className="px-2 py-3 text-sm text-muted-foreground">Chưa có CV đã lưu.</p> : null}
              {cvList.map((cv) => (
                <DropdownMenuItem key={cv.id} onClick={() => onSelectCv(cv.id)}>
                  <span className="min-w-0 flex-1 truncate">{cv.tenFile || `CV #${cv.id}`}</span>
                  {cv.id === selectedId ? <Check className="size-4 text-primary" /> : cv.isDefault ? <Star className="size-3.5 text-muted-foreground" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/CV" />}><ArrowLeft className="size-4" /> Quản lý tất cả CV</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="min-w-[180px] flex-1 sm:max-w-md">
          <Input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="CV chưa đặt tên"
            aria-label="Tên CV"
            className="h-8 border-transparent bg-transparent px-1 text-base font-semibold shadow-none hover:border-border focus-visible:bg-card sm:text-lg"
          />
          <p className="px-1 text-[11px] text-muted-foreground" aria-live="polite">{status}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <TemplatePicker selectedId={templateId} onSelect={onSelectTemplate} cvId={selectedId} compact />
          </div>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger aria-label="Thêm tùy chọn" className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <MoreHorizontal className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onNew}><Plus className="size-4" /> CV mới</DropdownMenuItem>
              <DropdownMenuItem onClick={onImport}><Upload className="size-4" /> Tải CV lên</DropdownMenuItem>
              <DropdownMenuItem onClick={onFillProfile}><UserRound className="size-4" /> Tạo từ hồ sơ</DropdownMenuItem>
              <DropdownMenuItem onClick={onExportPdf}><Printer className="size-4" /> Xuất PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={onExportJson}><FileJson className="size-4" /> JSON Resume</DropdownMenuItem>
              {selectedId && !current?.isDefault ? <DropdownMenuItem onClick={() => onSetDefault(selectedId)}><Star className="size-4" /> Đặt làm mặc định</DropdownMenuItem> : null}
              {versions.length > 0 ? <DropdownMenuSeparator /> : null}
              {versions.map((version) => (
                <DropdownMenuItem key={version.id} onClick={() => onDownloadVersion(version.id)}><Download className="size-4" /> Tải phiên bản {version.soPhienBan}</DropdownMenuItem>
              ))}
              {versions.some((version) => version.hasOriginal) ? <DropdownMenuItem onClick={onDownloadOriginal}><Download className="size-4" /> Tải file gốc</DropdownMenuItem> : null}
              {selectedId ? <DropdownMenuSeparator /> : null}
              {selectedId ? <DropdownMenuItem variant="destructive" onClick={onDelete}><Trash2 className="size-4" /> Xóa CV</DropdownMenuItem> : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button type="button" variant="outline" size="sm" className="hidden sm:inline-flex" onClick={onExportPdf} disabled={disabled}>Xuất PDF</Button>
          <Button type="button" size="sm" onClick={onSave} disabled={disabled || saving}><Save className="size-4" /> {saving ? "Đang lưu" : "Lưu CV"}</Button>
        </div>
      </div>
    </header>
  );
}
