import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Job } from "@/features/viec-lam/types";

export function RecommendedCompanyJobs({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) return null;
  return <section className="border-y border-border py-6"><p className="text-base font-semibold">Công nghệ / Kỹ năng</p><p className="mt-1 text-sm text-muted-foreground">Các kỹ năng thường xuất hiện trong việc làm của doanh nghiệp.</p><div className="mt-4 flex flex-wrap gap-2">{jobs.slice(0, 5).flatMap((job) => job.skills).filter((skill, index, all) => all.indexOf(skill) === index).slice(0, 8).map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></section>;
}
