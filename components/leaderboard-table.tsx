"use client";

import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPercent, formatPlace } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LeaderboardRow } from "@/types";

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="glass-panel overflow-hidden rounded-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Место</TableHead>
            <TableHead>Участник</TableHead>
            <TableHead>Игры</TableHead>
            <TableHead>Победы</TableHead>
            <TableHead>Win rate</TableHead>
            <TableHead>Среднее место</TableHead>
            <TableHead>Лучшее место</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.player.id}
              className={cn(
                row.rank === 1 && "bg-gold/8",
                row.rank === 2 && "bg-foreground/3",
                row.rank === 3 && "bg-foreground/[0.02]"
              )}
            >
              <TableCell className="tabular font-medium">
                <span className={cn(row.rank <= 3 && "text-gold")}>{row.rank}</span>
              </TableCell>
              <TableCell>
                <Link
                  href={`/players/${row.player.id}`}
                  className="flex min-w-0 items-center gap-2"
                  aria-label={`Профиль игрока ${row.player.name}`}
                >
                  <PlayerAvatar name={row.player.name} size="sm" />
                  <span className="truncate">{row.player.name}</span>
                </Link>
              </TableCell>
              <TableCell className="tabular">{row.gamesPlayed}</TableCell>
              <TableCell className="tabular text-win">{row.wins}</TableCell>
              <TableCell className="tabular">{formatPercent(row.winRate)}</TableCell>
              <TableCell className="tabular">{formatPlace(row.averagePosition)}</TableCell>
              <TableCell className="tabular">{row.player.bestPosition || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
