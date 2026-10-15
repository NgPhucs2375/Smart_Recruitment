"use client";

import { Check, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function CvCompletion({ progress, items }: { progress: number; items: { label: string; done: boolean }[] }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="w-full rounded-lg px-2 py-3 text-left transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>CV completeness</span><span className="font-mono text-foreground">{progress}%</span>
        </span>
        <Progress value={progress} className="mt-2 h-1.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Các mục cần hoàn thiện</p>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm">
              {item.done ? <Check className="size-4 text-primary" /> : <Circle className="size-4 text-muted-foreground" />}
              <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
            </li>
          ))}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
