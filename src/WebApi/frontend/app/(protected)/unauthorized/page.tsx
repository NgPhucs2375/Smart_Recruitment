export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-bold">403 — Không có quyền truy cập</h1>
      <p className="text-muted-foreground">
        Tài khoản của bạn không được phép xem trang này.
      </p>
    </div>
  );
}
