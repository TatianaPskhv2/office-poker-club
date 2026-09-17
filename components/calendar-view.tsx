"use client";

import { useMemo } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthTitle } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Game } from "@/types";

export function CalendarView({
  month,
  onMonthChange,
  games,
  selectedDate,
  onSelectDate,
}: {
  month: Date;
  onMonthChange: (date: Date) => void;
  games: Game[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const byDate = useMemo(() => {
    const map = new Map<string, Game[]>();
    games.forEach((game) => {
      const list = map.get(game.date) ?? [];
      list.push(game);
      map.set(game.date, list);
    });
    return map;
  }, [games]);

  return (
    <div className="glass-panel p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="capitalize font-heading text-lg">{formatMonthTitle(month)}</h2>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Предыдущий месяц"
            onClick={() => onMonthChange(addMonths(month, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Следующий месяц"
            onClick={() => onMonthChange(addMonths(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayGames = byDate.get(key) ?? [];
          const outside = !isSameMonth(day, month);
          const selected = selectedDate === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate?.(key)}
              aria-label={`${format(day, "d MMMM", { locale: ru })}${dayGames.length ? `, игр: ${dayGames.length}` : ""}`}
              className={cn(
                "flex min-h-16 flex-col rounded-xl border border-transparent p-1.5 text-left transition-colors hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50",
                outside && "opacity-40",
                selected && "border-primary/40 bg-primary/8"
              )}
            >
              <span className="tabular text-sm">{format(day, "d")}</span>
              <div className="mt-auto flex flex-wrap gap-1">
                {dayGames.slice(0, 3).map((game) => (
                  <span
                    key={game.id}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      game.status === "cancelled" && "bg-loss",
                      game.status === "completed" && "bg-muted-foreground",
                      (game.status === "open" || game.status === "full") && "bg-primary"
                    )}
                  />
                ))}
              </div>
              {dayGames[0] && (
                <span className="mt-1 hidden truncate text-[10px] text-muted-foreground sm:block">
                  {dayGames[0].venueName}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
