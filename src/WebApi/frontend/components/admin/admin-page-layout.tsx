import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

interface AdminPageHeaderProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actions?: ReactNode;
}

function AdminPageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Icon className="size-5" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface AdminPageLayoutProps {
  children: ReactNode;
}

function AdminPageLayout({ children }: AdminPageLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">{children}</div>
    </div>
  );
}

function AdminCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card shadow-sm ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function AdminCardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
    >
      <div>
        <h2 className="font-medium text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted">
          <Icon className="size-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function AdminLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
    </div>
  );
}

function AdminErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <AdminCard>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-destructive/10">
          <span className="text-lg text-destructive">!</span>
        </div>
        <h3 className="text-sm font-medium text-foreground">
          Đã xảy ra lỗi
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {message}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Thử lại
          </button>
        )}
      </div>
    </AdminCard>
  );
}

function AdminInfoBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export {
  AdminPageLayout,
  AdminPageHeader,
  AdminCard,
  AdminCardHeader,
  AdminEmptyState,
  AdminLoadingState,
  AdminErrorState,
  AdminInfoBanner,
};
