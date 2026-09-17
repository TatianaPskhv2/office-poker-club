"use client";

import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { PlayerCard } from "@/components/player-card";
import { PlayerFormDialog } from "@/components/player-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClub } from "@/hooks/use-club";
import { canManagePlayers } from "@/lib/auth/roles";
import { rankedPlayers } from "@/lib/data/selectors";

type SortKey = "rating" | "wins" | "games" | "winRate" | "name";

export default function PlayersPage() {
  const { state, isHydrated, role } = useClub();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [sort, setSort] = useState<SortKey>("rating");
  const [createOpen, setCreateOpen] = useState(false);
  const ranks = useMemo(() => {
    const map = new Map<string, number>();
    rankedPlayers(state).forEach((player, index) => map.set(player.id, index + 1));
    return map;
  }, [state]);
  const departments = useMemo(
    () =>
      [...new Set(state.players.map((player) => player.department).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "ru")
      ),
    [state.players]
  );

  const players = useMemo(() => {
    return [...state.players]
      .filter((player) =>
        player.name.toLowerCase().includes(query.trim().toLowerCase())
      )
      .filter((player) => department === "all" || player.department === department)
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name, "ru");
        if (sort === "wins") return b.wins - a.wins;
        if (sort === "games") return b.gamesPlayed - a.gamesPlayed;
        if (sort === "winRate") return b.winRate - a.winRate;
        return b.rating - a.rating;
      });
  }, [state.players, query, department, sort]);

  if (!isHydrated) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        eyebrow="Участники"
        title="Кто играет в клубе"
        description="Добавляйте игроков сами: имя, должность, контакты и заметки."
        actions={
          canManagePlayers(role) ? (
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus data-icon="inline-start" />
              Добавить участника
            </Button>
          ) : undefined
        }
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по имени"
          aria-label="Поиск по имени"
          className="sm:max-w-xs"
        />
        <Select value={department} onValueChange={(value) => value && setDepartment(String(value))}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Фильтр по отделу">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все отделы</SelectItem>
            {departments.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => value && setSort(value as SortKey)}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Сортировка">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">По рейтингу</SelectItem>
            <SelectItem value="wins">По победам</SelectItem>
            <SelectItem value="games">По количеству игр</SelectItem>
            <SelectItem value="winRate">По win rate</SelectItem>
            <SelectItem value="name">По имени</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {players.length === 0 ? (
        <EmptyState
          title="Пока никого нет"
          description="Добавьте первого игрока — имя и любые данные, которые хотите хранить."
          action={
            canManagePlayers(role) ? (
              <Button onClick={() => setCreateOpen(true)}>Добавить участника</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              rank={ranks.get(player.id) ?? 0}
            />
          ))}
        </div>
      )}
      <PlayerFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
