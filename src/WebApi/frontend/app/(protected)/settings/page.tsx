"use client";

import { Settings, Globe, Database } from "lucide-react";
import {
  AdminPageLayout,
  AdminPageHeader,
  AdminCard,
  AdminCardHeader,
} from "@/components/admin/admin-page-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={Settings}
        title="Cài đặt hệ thống"
        description="Quản lý cấu hình và tùy chọn hệ thống tuyển dụng."
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Chung</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="integrations">Tích hợp</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <AdminCard>
            <AdminCardHeader
              title="Thông tin hệ thống"
              description="Cấu hình chung cho ứng dụng tuyển dụng"
            />
            <div className="space-y-6 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Tên hệ thống</Label>
                  <Input id="site-name" placeholder="Smart Recruitment" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-url">URL hệ thống</Label>
                  <Input id="site-url" placeholder="https://recruitment.example.com" disabled />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email quản trị</Label>
                  <Input id="admin-email" placeholder="admin@example.com" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Múi giờ</Label>
                  <Input id="timezone" placeholder="Asia/Ho_Chi_Minh" disabled />
                </div>
              </div>
              <div className="flex justify-end">
                <Button disabled>Lưu thay đổi</Button>
              </div>
            </div>
          </AdminCard>
        </TabsContent>

        <TabsContent value="notifications">
          <AdminCard>
            <AdminCardHeader
              title="Cài đặt thông báo"
              description="Quản lý cách hệ thống gửi thông báo"
            />
            <div className="space-y-6 p-5">
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Thông báo email</p>
                  <p className="text-sm text-muted-foreground">Gửi email khi có sự kiện quan trọng</p>
                </div>
                <Button variant="outline" size="sm" disabled>Sắp ra mắt</Button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Thông báo hệ thống</p>
                  <p className="text-sm text-muted-foreground">Hiển thị thông báo trong ứng dụng</p>
                </div>
                <Button variant="outline" size="sm" disabled>Sắp ra mắt</Button>
              </div>
            </div>
          </AdminCard>
        </TabsContent>

        <TabsContent value="security">
          <AdminCard>
            <AdminCardHeader
              title="Cài đặt bảo mật"
              description="Quản lý chính sách bảo mật và xác thực"
            />
            <div className="space-y-6 p-5">
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Xác thực hai yếu tố (2FA)</p>
                  <p className="text-sm text-muted-foreground">Bắt buộc 2FA cho tài khoản quản trị</p>
                </div>
                <Button variant="outline" size="sm" disabled>Sắp ra mắt</Button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Phiên đăng nhập</p>
                  <p className="text-sm text-muted-foreground">Quản lý phiên đăng nhập đang hoạt động</p>
                </div>
                <Button variant="outline" size="sm" disabled>Sắp ra mắt</Button>
              </div>
            </div>
          </AdminCard>
        </TabsContent>

        <TabsContent value="integrations">
          <AdminCard>
            <AdminCardHeader
              title="Tích hợp bên thứ ba"
              description="Quản lý kết nối với các dịch vụ bên ngoài"
            />
            <div className="space-y-6 p-5">
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <Globe className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Google OAuth</p>
                    <p className="text-sm text-muted-foreground">Đăng nhập bằng tài khoản Google</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Đang hoạt động</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <Database className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">CopilotKit AI</p>
                    <p className="text-sm text-muted-foreground">Trợ lý AI hỗ trợ tuyển dụng</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Đang hoạt động</span>
              </div>
            </div>
          </AdminCard>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}
