"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileSearch } from "lucide-react";
import { cvApi } from "@/lib/api/cv-api";
import type { CvDetailVm } from "@/lib/types";

/**
 * Tra cứu CV ứng viên theo ID — chỉ dùng endpoint đã verify
 * (cvApi.getById, cùng phạm vi phân quyền với backend).
 * Không có nút xóa: business rule xóa CV (soft-delete + đôn default)
 * là luồng của chủ sở hữu, chưa xác nhận cho admin.
 */
function CvLookupContent() {
  const [cvId, setCvId] = useState("");
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<CvDetailVm | null>(null);

  const handleLookup = async () => {
    const id = Number(cvId);
    if (!id) {
      toast.error("Nhập ID CV cần tra cứu");
      return;
    }
    setLoading(true);
    setDetail(null);
    try {
      const data = await cvApi.getById(id);
      setDetail(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được CV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="size-5" /> Tra cứu CV ứng viên
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nhập ID CV để xem thông tin (tên file, mẫu, chủ sở hữu). Danh sách toàn hệ thống
            chưa có endpoint phân quyền admin nên tab này chỉ tra cứu theo ID.
          </p>
          <div className="flex max-w-md items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="cv-lookup-id">ID CV</Label>
              <Input
                id="cv-lookup-id"
                type="number"
                min={1}
                placeholder="vd: 12"
                value={cvId}
                onChange={(e) => setCvId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleLookup();
                }}
              />
            </div>
            <Button onClick={() => void handleLookup()} disabled={loading}>
              {loading ? "Đang tải..." : "Tra cứu"}
            </Button>
          </div>

          {loading && <Skeleton className="h-40 w-full" />}

          {detail && (
            <div className="grid gap-3 rounded-xl border border-border bg-card p-4 text-sm sm:grid-cols-2">
              <p><span className="text-muted-foreground">ID:</span> <span className="font-mono">{detail.id}</span></p>
              <p><span className="text-muted-foreground">Tên file:</span> <span className="font-medium">{detail.tenFile}</span></p>
              <p><span className="text-muted-foreground">Mẫu:</span> <span className="font-mono text-xs">{detail.templateId ?? "—"}</span></p>
              <p><span className="text-muted-foreground">Ứng viên:</span> {detail.hoTen ?? `HoSo #${detail.hoSoUngVienId}`}</p>
              <p><span className="text-muted-foreground">Vị trí:</span> {detail.viTriUngTuyen ?? "—"}</p>
              <p><span className="text-muted-foreground">Ngày tải:</span> {detail.ngayUpload ?? "—"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminCvUngVienPage() {
  return <CvLookupContent />;
}
