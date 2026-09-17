"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, List } from "lucide-react";
import { CalendarView } from "@/components/calendar-view";
import { EmptyState } from "@/components/empty-state";
import { GameCard } from "@/components/game-card";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClub } from "@/hooks/use-club";
import { canCreateGame } from "@/lib/auth/roles";
import { getGamePlayers } from "@/lib/data/selectors";

type Filter = "all" | "upcoming" | "completed" | "cancelled";

export default function GamesPage() {
  const { state, isHydrated, role } = useClub();
  const [month, setMonth] = useState(new Date(2026, 8, 1));
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | undefined>();

  const games = useMemo(() => {
    return [...state.games]
      .filter((game) => {
        if (filter === "upcoming") {
          return game.status === "open" || game.status === "full" || game.status === "live";
        }
        if (filter === "completed") return game.status === "completed";
        if (filter === "cancelled") return game.status === "cancelled";
        return true;
      })
      .filter((game) =>
        `${game.venueName} ${game.address} ${game.title}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      )
      .filter((game) => (selectedDate ? game.date === selectedDate : true))
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  }, [state.games, filter, query, selectedDate]);

  if (!isHydrated) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        eyebrow="Игры"
        title="Календарь столов"
        description="Все любительские игры команды: ближайшие, прошедшие и отменённые."
        actions={
          canCreateGame(role) ? (
            <Button render={<Link href="/games/new" />}>Создать игру</Button>
          ) : null
        }
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList>
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="upcoming">Будущие</TabsTrigger>
            <TabsTrigger value="completed">Завершённые</TabsTrigger>
            <TabsTrigger value="cancelled">Отменённые</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по месту"
          className="lg:max-w-xs"
          aria-label="Поиск по месту проведения"
        />
        <div className="flex gap-1 lg:ml-auto">
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
            aria-label="Календарь"
          >
            <CalendarDays />
            Календарь
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            aria-label="Список"
          >
            <List />
            Список
          </Button>
        </div>
      </div>
      {selectedDate && (
        <div className="mb-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)}>
            Сбросить дату {selectedDate}
          </Button>
        </div>
      )}
      {view === "calendar" && (
        <CalendarView
          month={month}
          onMonthChange={setMonth}
          games={state.games.filter((game) =>
            filter === "all"
              ? true
              : filter === "upcoming"
                ? game.status === "open" || game.status === "full"
                : game.status === filter
          )}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            players={getGamePlayers(state, game.id)}
            organizer={state.players.find((player) => player.id === game.organizerId)}
          />
        ))}
      </div>
      {games.length === 0 && (
        <EmptyState
          className="mt-4"
          title="Игр не найдено"
          description="Измените фильтр, сбросьте дату или создайте новый стол."
          action={
            canCreateGame(role) ? (
              <Button render={<Link href="/games/new" />}>Создать игру</Button>
            ) : null
          }
        />
      )}
    </div>
  );
}
