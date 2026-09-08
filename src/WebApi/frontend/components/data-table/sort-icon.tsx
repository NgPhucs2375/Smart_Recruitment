import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

interface Props {
  field: string;
  sorters: { field: string; order: "asc" | "desc" }[];
}

export function SortIcon({ field, sorters }: Props) {
  const active = sorters.find(
    (s) => s.field.toLowerCase() === field.toLowerCase(),
  );
  if (!active)
    return (
      <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 text-muted-foreground/40" />
    );
  return active.order === "asc" ? (
    <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
  ) : (
    <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
  );
}
