import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/glass-panel";
import { GameStatusBadge } from "@/components/game-status-badge";
import { PlayerAvatar } from "@/components/player-avatar";
import { formatDate, formatRelativeDate, pluralPlayers } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Game, Player } from "@/types";

export function GameCard({
  game,
  players,
  organizer,
  className,
}: {
  game: Game;
  players: Player[];
  organizer?: Player;
  className?: string;
}) {
  return (
    <GlassPanel className={cn("flex h-full flex-col p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground capitalize">
            {formatRelativeDate(game.date, game.startTime)}
          </p>
          <h3 className="mt-1 truncate text-base font-medium">{game.title}</h3>
        </div>
        <GameStatusBadge status={game.status} />
      </div>
      <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0" />
          <span className="truncate capitalize">
            {formatDate(game.date, "d MMMM")}, {game.startTime}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0" />
          <span className="truncate">{game.venueName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-4 shrink-0" />
          <span>
            {players.length}/{game.participantLimit} · {pluralPlayers(players.length)}
          </span>
        </div>
      </dl>
      <div className="mt-4 flex items-center gap-2">
        <div className="flex -space-x-2">
          {players.slice(0, 5).map((player) => (
            <PlayerAvatar key={player.id} name={player.name} size="sm" />
          ))}
        </div>
        {organizer && (
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            орг. {organizer.name}
          </p>
        )}
      </div>
      <div className="mt-4 pt-1">
        <Button
          variant="outline"
          className="w-full"
          render={<Link href={game.status === "live" ? `/live/${game.id}` : `/games/${game.id}`} />}
        >
          {game.status === "live" ? "К живому столу" : "Открыть детали"}
        </Button>
      </div>
    </GlassPanel>
  );
}
