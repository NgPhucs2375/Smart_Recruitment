"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Construction, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

/**
 * Friendly state for KNOWN planned product routes.
 * Genuine unknown URLs still fall through to the real Next.js 404.
 */
export function ComingSoon({
  title = "Chức năng đang phát triển",
  description = "Tính năng này đang được hoàn thiện và sẽ sớm được cập nhật.",
  backHref = "/dashboard",
  backLabel = "Về tổng quan",
}: ComingSoonProps) {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Construction className="size-7" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href={backHref}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
        >
          <LayoutDashboard className="size-4" aria-hidden />
          {backLabel}
        </Link>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="h-11 rounded-xl px-6"
        >
          <ArrowLeft className="mr-2 size-4" aria-hidden />
          Quay lại
        </Button>
      </div>
    </div>
  );
}
