"use client";

import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Player } from "@/types";

export function ParticipantsList({
  players,
  organizerId,
  onRemove,
  className,
}: {
  players: Player[];
  organizerId?: string;
  onRemove?: (player: Player) => void;
  className?: string;
}) {
  if (players.length === 0) {
    return (
      <EmptyState
        title="Пока никто не записался"
        description="Добавьте игроков, когда будет понятно, кто придёт."
      />
    );
  }

  return (
    <ul className={cn("divide-y divide-border/70", className)}>
      {players.map((player) => (
        <li key={player.id} className="flex items-center gap-1">
          <Link
            href={`/players/${player.id}`}
            className="flex min-w-0 flex-1 items-center gap-3 py-3 transition-colors hover:bg-foreground/3"
            aria-label={`Профиль игрока ${player.name}`}
          >
            <PlayerAvatar name={player.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{player.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {player.jobTitle || "Участник"}
                {player.id === organizerId ? " · организатор" : ""}
              </p>
            </div>
            <span className="tabular text-sm text-muted-foreground">{player.rating}</span>
          </Link>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onRemove(player)}
            >
              Убрать
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
