"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps { page: number; totalPages: number; onPageChange: (page: number) => void; }

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1);
  return (
    <nav aria-label="Phân trang việc làm" className="flex flex-wrap items-center justify-center gap-1">
      <Button variant="outline" size="icon-sm" aria-label="Trang trước" disabled={page === 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="size-4" /></Button>
      {pages.map((item, index) => <span key={item} className="flex items-center gap-1">{index > 0 && item - pages[index - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}<Button variant={item === page ? "default" : "ghost"} size="icon-sm" aria-current={item === page ? "page" : undefined} onClick={() => onPageChange(item)}>{item}</Button></span>)}
      <Button variant="outline" size="icon-sm" aria-label="Trang sau" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight className="size-4" /></Button>
    </nav>
  );
}

export { Pagination };
