import { cn } from "@/lib/utils";
import type { GameStatus } from "@/types";

  const LABELS: Record<GameStatus, string> = {
  open: "Открыта запись",
  full: "Игра заполнена",
  live: "Идёт стол",
  completed: "Завершена",
  cancelled: "Отменена",
};

export function GameStatusBadge({ status }: { status: GameStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        status === "open" && "bg-primary/15 text-primary",
        status === "full" && "bg-gold/15 text-gold",
        status === "live" && "bg-[#22c55e]/20 text-[#22c55e]",
        status === "completed" && "bg-muted text-muted-foreground",
        status === "cancelled" && "bg-destructive/15 text-destructive"
      )}
    >
      {LABELS[status]}
    </span>
  );
}
