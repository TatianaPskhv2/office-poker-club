import { GameStatusBadge } from "@/components/game-status-badge";
import { cn } from "@/lib/utils";
import type { GameStatus } from "@/types";

export function RatingBadge({
  rank,
  className,
}: {
  rank: number;
  rating?: number;
  className?: string;
}) {
  const gold = rank === 1;
  return (
    <div
      className={cn(
        "flex min-w-16 flex-col items-end",
        gold && "text-gold",
        className
      )}
    >
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        место в клубе
      </span>
      <span className="tabular text-lg font-medium leading-none">#{rank}</span>
    </div>
  );
}

export { GameStatusBadge };
