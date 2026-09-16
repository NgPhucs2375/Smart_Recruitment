"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { MauCvGallery } from "@/components/cv/mau-cv-gallery";

export default function MauCvPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Đang tải mẫu CV...
        </div>
      }
    >
      <MauCvGallery />
    </Suspense>
  );
}
