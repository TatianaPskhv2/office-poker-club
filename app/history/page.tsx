"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClub } from "@/hooks/use-club";
import { downloadCsv, historyToCsv } from "@/lib/csv";
import {
  completedGames,
  getGamePlayers,
  getGamePot,
  getWinner,
} from "@/lib/data/selectors";
import { formatDate, formatDuration, formatMoney } from "@/lib/format";

export default function HistoryPage() {
  const { state, isHydrated } = useClub();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [venueName, setVenueName] = useState("all");
  const [winnerId, setWinnerId] = useState("all");
  const [minPlayers, setMinPlayers] = useState("all");

  const all = completedGames(state);
  const games = useMemo(() => {
    return all.filter((game) => {
      if (from && game.date < from) return false;
      if (to && game.date > to) return false;
      if (venueName !== "all" && game.venueName !== venueName) return false;
      const winner = getWinner(state, game.id);
      if (winnerId !== "all" && winner?.id !== winnerId) return false;
      const count = getGamePlayers(state, game.id).length;
      if (minPlayers === "6" && count < 6) return false;
      if (minPlayers === "8" && count < 8) return false;
      return true;
    });
  }, [all, from, to, venueName, winnerId, minPlayers, state]);

  if (!isHydrated) return <PageSkeleton />;

  function exportCsv() {
    downloadCsv("office-poker-history.csv", historyToCsv(state, games));
    toast.success("CSV скачан", {
      description: `Экспортировано игр: ${games.length}`,
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow="История"
        title="Сыгранные столы"
        description="Все завершённые игры с победителями, банками и длительностью."
        actions={<Button onClick={exportCsv}>Экспорт CSV</Button>}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="Период с" />
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="Период по" />
        <Select value={venueName} onValueChange={(value) => value && setVenueName(String(value))}>
          <SelectTrigger className="w-full" aria-label="Место">
            <SelectValue placeholder="Место" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все места</SelectItem>
            {[...new Set(all.map((game) => game.venueName).filter(Boolean))].map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={winnerId} onValueChange={(value) => value && setWinnerId(String(value))}>
          <SelectTrigger className="w-full" aria-label="Победитель">
            <SelectValue placeholder="Победитель" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все победители</SelectItem>
            {state.players.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={minPlayers} onValueChange={(value) => value && setMinPlayers(String(value))}>
          <SelectTrigger className="w-full" aria-label="Количество участников">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Любой состав</SelectItem>
            <SelectItem value="6">От 6 игроков</SelectItem>
            <SelectItem value="8">От 8 игроков</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {games.length === 0 ? (
        <EmptyState
          title="Нет завершённых игр"
          description="Сбросьте фильтры или дождитесь первой закрытой сессии."
        />
      ) : (
        <div className="glass-panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Место</TableHead>
                <TableHead>Победитель</TableHead>
                <TableHead>Игроки</TableHead>
                <TableHead>Банк</TableHead>
                <TableHead>Длительность</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => {
                const winner = getWinner(state, game.id);
                const count = getGamePlayers(state, game.id).length;
                return (
                  <TableRow key={game.id}>
                    <TableCell>{formatDate(game.date, "d MMM yyyy")}</TableCell>
                    <TableCell className="max-w-48 truncate">{game.venueName}</TableCell>
                    <TableCell className="max-w-40 truncate">{winner?.name ?? "—"}</TableCell>
                    <TableCell className="tabular">{count}</TableCell>
                    <TableCell className="tabular">{formatMoney(getGamePot(state, game), game.currency)}</TableCell>
                    <TableCell>{formatDuration(game.duration)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" render={<Link href={`/games/${game.id}`} />}>
                        Подробнее
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
