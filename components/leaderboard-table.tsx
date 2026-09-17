"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { PlayerAvatar } from "@/components/player-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPercent, formatSigned } from "@/lib/format";
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
            <TableHead>Рейтинг</TableHead>
            <TableHead>Изменение</TableHead>
            <TableHead>Игры</TableHead>
            <TableHead>Победы</TableHead>
            <TableHead>Win rate</TableHead>
            <TableHead>Средний результат</TableHead>
            <TableHead>Лучшая серия</TableHead>
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
              <TableCell className="tabular font-medium">{row.rating}</TableCell>
              <TableCell>
                <RankChange value={row.rankChange} />
              </TableCell>
              <TableCell className="tabular">{row.gamesPlayed}</TableCell>
              <TableCell className="tabular text-win">{row.wins}</TableCell>
              <TableCell className="tabular">{formatPercent(row.winRate)}</TableCell>
              <TableCell
                className={cn(
                  "tabular",
                  row.averageResult > 0 && "text-win",
                  row.averageResult < 0 && "text-loss"
                )}
              >
                {formatSigned(row.averageResult)} ₽
              </TableCell>
              <TableCell className="tabular">{Math.max(0, row.bestStreak)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RankChange({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-win">
        <ArrowUpRight className="size-3.5" />
        {value}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-loss">
        <ArrowDownRight className="size-3.5" />
        {Math.abs(value)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Minus className="size-3.5" />
      0
    </span>
  );
}
