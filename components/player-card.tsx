import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/glass-panel";
import { PlayerAvatar } from "@/components/player-avatar";
import { RatingBadge } from "@/components/rating-badge";
import { BADGES } from "@/lib/constants";
import { formatPercent, formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Player } from "@/types";

export function PlayerCard({
  player,
  rank,
  className,
}: {
  player: Player;
  rank: number;
  className?: string;
}) {
  return (
    <Link
      href={`/players/${player.id}`}
      className={cn("block rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/50", className)}
      aria-label={`Профиль игрока ${player.name}`}
    >
      <GlassPanel className="h-full p-4 transition-colors hover:bg-foreground/3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <PlayerAvatar name={player.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-medium">{player.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {player.jobTitle && player.department
                  ? `${player.jobTitle} · ${player.department}`
                  : player.jobTitle || player.department || "Участник клуба"}
              </p>
            </div>
          </div>
          <RatingBadge rank={rank} rating={player.rating} />
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Игры</dt>
            <dd className="tabular text-lg font-medium">{player.gamesPlayed}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Победы</dt>
            <dd className="tabular text-lg font-medium text-win">{player.wins}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Win rate</dt>
            <dd className="tabular text-lg font-medium">{formatPercent(player.winRate)}</dd>
          </div>
        </dl>
        <div className="mt-3 flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="truncate">Средний результат {formatSigned(player.averageResult)} ₽</span>
          <span className="shrink-0">
            {player.currentStreak >= 2
              ? `серия ${player.currentStreak}`
              : player.currentStreak <= -2
                ? `спад ${Math.abs(player.currentStreak)}`
                : "без серии"}
          </span>
        </div>
        {player.badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {player.badges.map((badge) => (
              <Badge key={badge} variant={badge === "leader" ? "default" : "outline"}>
                {BADGES[badge].label}
              </Badge>
            ))}
          </div>
        )}
      </GlassPanel>
    </Link>
  );
}
