"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CalendarProps = {
  className?: string;
  selected?: Date;
  markedDates?: Date[];
  onSelect?: (date: Date) => void;
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function monthDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days: (Date | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= total; day += 1) days.push(new Date(month.getFullYear(), month.getMonth(), day));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export function Calendar({ className, selected, markedDates = [], onSelect }: CalendarProps) {
  const [month, setMonth] = React.useState(() => new Date(selected ?? new Date()));
  const days = monthDays(month);
  const label = month.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" aria-label="Tháng trước" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronLeft className="size-4" /></button>
        <p className="text-sm font-semibold capitalize text-foreground">{label}</p>
        <button type="button" aria-label="Tháng sau" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronRight className="size-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
        {WEEKDAYS.map((day) => <span key={day} className="py-1">{day}</span>)}
        {days.map((date, index) => {
          const isMarked = date ? markedDates.some((marked) => sameDay(marked, date)) : false;
          const isSelected = date && selected ? sameDay(selected, date) : false;
          const isToday = date ? sameDay(new Date(), date) : false;
          return date ? (
            <button key={date.toISOString()} type="button" onClick={() => onSelect?.(date)} className={cn("relative flex aspect-square items-center justify-center rounded-lg text-xs transition-colors hover:bg-muted", isSelected && "bg-primary font-semibold text-primary-foreground hover:bg-primary", !isSelected && isToday && "ring-1 ring-primary", isMarked && !isSelected && "font-semibold text-primary")}>
              {date.getDate()}
              {isMarked && <span className={cn("absolute bottom-1 size-1 rounded-full bg-primary", isSelected && "bg-primary-foreground")} />}
            </button>
          ) : <span key={`empty-${index}`} />;
        })}
      </div>
    </div>
  );
}
