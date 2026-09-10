"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  DollarSign,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlusCircle,
  Pencil,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { hoSoApi, type HoSoVm } from "@/lib/cv-api";
import { useStoredIdentity } from "@/hooks/use-stored-identity";

export function HoSoView() {
  const identity = useStoredIdentity();
  const [hoSo, setHoSo] = useState<HoSoVm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [hoTen, setHoTen] = useState("");
  const [sdt, setSdt] = useState("");
  const [ngaySinh, setNgaySinh] = useState("");
  const [gioiTinh, setGioiTinh] = useState("Nam");
  const [diaChi, setDiaChi] = useState("");
  const [gioiThieu, setGioiThieu] = useState("");
  const [viTriUngTuyen, setViTriUngTuyen] = useState("");
  const [mucLuongMongMuon, setMucLuongMongMuon] = useState<number | "">(0);
  const [isTimViec, setIsTimViec] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await hoSoApi.getMyHoSo();
      if (data) {
        setHoSo(data);
        populateForm(data);
        setIsEditing(false);
      }
    } catch (err: unknown) {
      // 404 / Bạn chưa có hồ sơ
      setHoSo(null);
      setIsEditing(true);
      if (identity?.name) setHoTen(identity.name);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data: HoSoVm) => {
    setHoTen(data.hoTen || "");
    setSdt(data.sdt || "");
    setNgaySinh(data.ngaySinh ? data.ngaySinh.substring(0, 10) : "");
    setGioiTinh(data.gioiTinh || "Nam");
    setDiaChi(data.diaChi || "");
    setGioiThieu(data.gioiThieu || "");
    setViTriUngTuyen(data.viTriUngTuyen || "");
    setMucLuongMongMuon(data.mucLuongMongMuon ?? 0);
    setIsTimViec(data.isTimViec !== false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoTen.trim()) {
      toast.error("Vui lòng nhập họ tên.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        hoTen: hoTen.trim(),
        sdt: sdt.trim(),
        ngaySinh: ngaySinh ? new Date(ngaySinh).toISOString() : null,
        gioiTinh,
        diaChi: diaChi.trim(),
        gioiThieu: gioiThieu.trim(),
        viTriUngTuyen: viTriUngTuyen.trim(),
        mucLuongMongMuon: typeof mucLuongMongMuon === "number" ? mucLuongMongMuon : 0,
        isTimViec,
      };

      if (hoSo && hoSo.id > 0) {
        await hoSoApi.update(hoSo.id, {
          id: hoSo.id,
          ...payload,
        });
        toast.success("Cập nhật hồ sơ thành công!");
      } else {
        await hoSoApi.create({
          nguoiDungId: 0,
          ...payload,
        });
        toast.success("Tạo mới hồ sơ ứng viên thành công!");
      }

      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Đang tải thông tin hồ sơ...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hồ sơ ứng viên</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thông tin cá nhân và định hướng nghề nghiệp của bạn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hoSo && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa hồ sơ
            </Button>
          )}
          <Link href="/tao-cv">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Tạo CV từ hồ sơ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {!hoSo && !isEditing && (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <CardTitle className="mt-2">Bạn chưa có hồ sơ ứng viên</CardTitle>
            <CardDescription>
              Tạo hồ sơ ngay để bắt đầu ứng tuyển các công việc hấp dẫn và tạo CV chuyên nghiệp.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={() => setIsEditing(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tạo hồ sơ ngay
            </Button>
          </CardContent>
        </Card>
      )}

      {/* View Mode */}
      {hoSo && !isEditing && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card Thông tin chính */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {hoSo.hoTen
                  ? hoSo.hoTen
                      .split(" ")
                      .map((n) => n[0])
                      .slice(-2)
                      .join("")
                      .toUpperCase()
                  : "UV"}
              </div>
              <CardTitle className="mt-4 text-xl">{hoSo.hoTen}</CardTitle>
              <CardDescription>{hoSo.viTriUngTuyen || "Chưa cập nhật vị trí"}</CardDescription>
              <div className="pt-2">
                <Badge variant={hoSo.isTimViec ? "default" : "secondary"}>
                  {hoSo.isTimViec ? "Đang tìm việc" : "Đã có việc / Tạm dừng"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>{hoSo.sdt || "Chưa có SĐT"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  {hoSo.ngaySinh
                    ? new Date(hoSo.ngaySinh).toLocaleDateString("vi-VN")
                    : "Chưa cập nhật ngày sinh"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>{hoSo.diaChi || "Chưa có địa chỉ"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  {hoSo.mucLuongMongMuon
                    ? `${hoSo.mucLuongMongMuon.toLocaleString("vi-VN")} VNĐ`
                    : "Thương lượng"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Chi tiết Giới thiệu & Mục tiêu */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Giới thiệu bản thân & Mục tiêu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Giới thiệu</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                  {hoSo.gioiThieu || "Chưa có lời giới thiệu bản thân."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-4">
                <div>
                  <span className="text-xs text-muted-foreground">Giới tính</span>
                  <p className="font-medium text-foreground">{hoSo.gioiTinh || "Khác"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Mức lương mong muốn</span>
                  <p className="font-medium text-foreground">
                    {hoSo.mucLuongMongMuon
                      ? `${hoSo.mucLuongMongMuon.toLocaleString("vi-VN")} đ`
                      : "Thương lượng"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit / Create Form Mode */}
      {isEditing && (
        <form onSubmit={handleSave}>
          <Card className="border-[#d8d5ce]/70 shadow-sm">
            <CardHeader className="border-b border-[#d8d5ce]/40 bg-[#f4f2ed]/40 pb-4">
              <CardTitle className="text-xl font-semibold text-[#151515]">
                {hoSo ? "Chỉnh sửa thông tin hồ sơ" : "Tạo hồ sơ ứng viên mới"}
              </CardTitle>
              <CardDescription className="text-xs text-[#69727a]">
                Điền đầy đủ thông tin cá nhân và vị trí mong muốn để nhà tuyển dụng tiếp cận bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Thông tin cá nhân */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#69727a]">
                  1. Thông tin cá nhân
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Nguyễn Văn A"
                        value={hoTen}
                        onChange={(e) => setHoTen(e.target.value)}
                        required
                        className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="0912345678"
                        value={sdt}
                        onChange={(e) => setSdt(e.target.value)}
                        className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Ngày sinh</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="date"
                        value={ngaySinh}
                        onChange={(e) => setNgaySinh(e.target.value)}
                        className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Giới tính</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                      <select
                        className="flex h-10 w-full rounded-xl border border-[#d8d5ce] bg-white pl-10 pr-3 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#151515]"
                        value={gioiTinh}
                        onChange={(e) => setGioiTinh(e.target.value)}
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Địa chỉ hiện tại</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Quận 1, TP. Hồ Chí Minh"
                      value={diaChi}
                      onChange={(e) => setDiaChi(e.target.value)}
                      className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Vị trí & Định hướng */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#69727a]">
                  2. Định hướng nghề nghiệp & Mong muốn
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Vị trí mong muốn / Chức danh</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Fullstack .NET Developer"
                        value={viTriUngTuyen}
                        onChange={(e) => setViTriUngTuyen(e.target.value)}
                        className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Mức lương mong muốn (VNĐ)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="number"
                        min="0"
                        step="500000"
                        placeholder="15000000"
                        value={mucLuongMongMuon}
                        onChange={(e) =>
                          setMucLuongMongMuon(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Trạng thái tìm việc */}
                <div className="flex items-center gap-3 rounded-xl border border-[#d8d5ce] bg-[#f4f2ed]/50 p-4">
                  <input
                    type="checkbox"
                    id="isTimViec"
                    className="size-4 rounded border-gray-300 text-[#151515] focus:ring-[#151515]"
                    checked={isTimViec}
                    onChange={(e) => setIsTimViec(e.target.checked)}
                  />
                  <label htmlFor="isTimViec" className="text-xs font-medium cursor-pointer text-gray-800">
                    Bật trạng thái sẵn sàng tìm việc (Cho phép Nhà tuyển dụng tìm thấy hồ sơ)
                  </label>
                </div>

                {/* Giới thiệu */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">
                    Giới thiệu bản thân & Mục tiêu nghề nghiệp
                  </label>
                  <Textarea
                    rows={4}
                    placeholder="Tóm tắt kinh nghiệm làm việc, kỹ năng nổi bật và định hướng phát triển sự nghiệp..."
                    value={gioiThieu}
                    onChange={(e) => setGioiThieu(e.target.value)}
                    className="rounded-xl border-[#d8d5ce] bg-white text-sm"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#d8d5ce]/40">
                {hoSo && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      populateForm(hoSo);
                      setIsEditing(false);
                    }}
                    className="h-10 rounded-xl border-[#d8d5ce]"
                  >
                    Hủy bỏ
                  </Button>
                )}
                <Button type="submit" disabled={saving} className="h-10 rounded-xl bg-[#151515] text-white hover:bg-black">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu hồ sơ
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}