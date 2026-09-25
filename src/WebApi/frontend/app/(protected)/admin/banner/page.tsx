"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Power, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminGate } from "@/features/admin/AdminGate";
import { AdminPageHeader, AdminPageLayout } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getAuthToken } from "@/lib/auth-provider";

type Banner = {
  id: number;
  title: string;
  description: string;
  mediaType: string;
  mediaUrl: string;
  linkUrl: string;
  isActive: boolean;
};

async function request(path: string, init?: RequestInit) {
  const token = getAuthToken();
  const response = await fetch(`/api/dotnet/marketingbanners${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.Message ?? body?.message ?? `Lỗi HTTP ${response.status}`);
  }
  return response.json().catch(() => null);
}

function BannerMedia({ banner }: { banner: Banner }) {
  if (banner.mediaType.startsWith("video/")) {
    return <video src={banner.mediaUrl} controls className="aspect-[16/6] w-full rounded-xl bg-muted object-cover" />;
  }
  return <img src={banner.mediaUrl} alt={banner.title} className="aspect-[16/6] w-full rounded-xl bg-muted object-cover" />;
}

function BannerAdminPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const body = await request("");
      setBanners((body?.Data ?? body?.data ?? []) as Banner[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được banner");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const upload = async () => {
    if (!file) {
      toast.error("Vui lòng chọn ảnh hoặc video");
      return;
    }
    if (!title.trim()) {
      toast.error("Tiêu đề banner không được để trống");
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.set("title", title.trim());
      form.set("description", description.trim());
      form.set("linkUrl", linkUrl.trim());
      form.set("media", file);
      await request("", { method: "POST", body: form });
      setTitle("");
      setDescription("");
      setLinkUrl("");
      setFile(null);
      const input = document.getElementById("banner-media") as HTMLInputElement | null;
      if (input) input.value = "";
      toast.success("Đã tải banner và bật hiển thị");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tải banner thất bại");
    } finally {
      setSaving(false);
    }
  };

  const activate = async (id: number) => {
    try {
      await request(`/${id}/active`, { method: "PUT" });
      toast.success("Đã chọn banner hiển thị");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể bật banner");
    }
  };

  const remove = async (banner: Banner) => {
    if (!window.confirm(`Xóa banner "${banner.title}"?`)) return;
    try {
      await request(`/${banner.id}`, { method: "DELETE" });
      toast.success("Đã xóa banner");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa banner");
    }
  };

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={ImagePlus}
        title="Banner marketing"
        description="Chọn một ảnh hoặc video để hiển thị bên dưới đơn ứng tuyển của ứng viên."
      />

      <Card>
        <CardHeader>
          <CardTitle>Tạo banner mới</CardTitle>
          <CardDescription>Banner mới sẽ được bật ngay và banner cũ tự chuyển sang trạng thái tắt.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="banner-title">Tiêu đề *</Label>
            <Input id="banner-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Tạo CV nổi bật trong 5 phút" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="banner-link">Liên kết khi bấm</Label>
            <Input id="banner-link" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="/tao-cv hoặc https://..." />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="banner-description">Mô tả ngắn</Label>
            <Textarea id="banner-description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Thông điệp marketing hiển thị trên banner" />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="banner-media">Ảnh hoặc video * (tối đa 100 MB)</Label>
            <Input id="banner-media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">Ảnh: JPG, PNG, WEBP. Video: MP4, WEBM.</p>
          </div>
          <Button className="w-fit" onClick={() => void upload()} disabled={saving}>
            <Upload className="mr-2 size-4" /> {saving ? "Đang tải..." : "Tải và bật banner"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banner đã tải</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">Đang tải...</p> : banners.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có banner nào.</p> : banners.map((banner) => (
            <div key={banner.id} className="space-y-3 rounded-2xl border border-border p-4">
              <BannerMedia banner={banner} />
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><h3 className="truncate font-medium">{banner.title}</h3>{banner.isActive && <Badge>Đang hiển thị</Badge>}</div>
                  {banner.description && <p className="mt-1 text-sm text-muted-foreground">{banner.description}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {!banner.isActive && <Button variant="outline" size="sm" onClick={() => void activate(banner.id)}><Power className="mr-2 size-3.5" /> Bật</Button>}
                  <Button variant="destructive" size="sm" onClick={() => void remove(banner)}><Trash2 className="mr-2 size-3.5" /> Xóa</Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}

export default function MarketingBannerPage() {
  return <AdminGate><BannerAdminPage /></AdminGate>;
}
