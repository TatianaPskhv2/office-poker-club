import { cn } from "@/lib/utils";

export function RankIndex({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        rank === 1 && "bg-gold text-black",
        rank === 2 && "bg-zinc-400 text-black",
        rank === 3 && "bg-primary text-primary-foreground",
        rank > 3 && "bg-muted text-muted-foreground"
      )}
    >
      {rank}
    </span>
  );
}
