import { FileText, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CvLoading() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-muted/30 p-3 sm:p-5" aria-busy="true" aria-label="Đang mở trình soạn CV">
      <div className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-[1680px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="size-4" /></span>
            <div className="space-y-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-40" /></div>
          </div>
          <div className="flex gap-2"><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-24" /></div>
        </header>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(20rem,34%)_1fr]">
          <section className="flex flex-col border-b border-border p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3"><Skeleton className="size-10 rounded-xl" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-36" /></div></div>
            <Skeleton className="mt-5 h-3 w-full" /><Skeleton className="mt-2 h-3 w-4/5" />
            <div className="mt-6 flex-1 rounded-xl bg-muted/50 p-4"><div className="flex items-center gap-2"><Skeleton className="size-7 rounded-full" /><Skeleton className="h-3 w-28" /></div><Skeleton className="mt-4 h-3 w-3/4" /><Skeleton className="mt-2 h-3 w-1/2" /></div>
          </section>
          <section className="flex min-h-[32rem] flex-col bg-muted/30 p-4 sm:p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><FileText className="size-4 text-primary" /><Skeleton className="h-4 w-24" /></div><Skeleton className="h-8 w-32" /></div><div className="flex flex-1 items-center justify-center"><Skeleton className="h-[min(70vh,720px)] w-[min(100%,560px)] rounded-xl" /></div></section>
        </div>
      </div>
    </main>
  );
}
