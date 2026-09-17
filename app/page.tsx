"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Plus, Trophy, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { InviteDialog } from "@/components/invite-dialog";
import { ResultsDialog } from "@/components/results-form";
import { GamesByMonthChart } from "@/components/charts";
import { EmptyState } from "@/components/empty-state";
import { GameStatusBadge } from "@/components/game-status-badge";
import { PageSkeleton } from "@/components/page-skeleton";
import { PlayerAvatar } from "@/components/player-avatar";
import { RankIndex } from "@/components/rank-index";
import { StatsCard } from "@/components/stats-card";
import { Button } from "@/components/ui/button";
import { useClub } from "@/hooks/use-club";
import { canCreateGame, canEnterResults, canRsvp } from "@/lib/auth/roles";
import {
  averagePot,
  completedGames,
  gamesByMonth,
  getGamePlayers,
  getGamePot,
  getWinner,
  isSignedUp,
  nextGame,
  rankedPlayers,
} from "@/lib/data/selectors";
import {
  formatCompactRelative,
  formatDate,
  formatMoney,
  formatMonthShort,
  formatPercent,
} from "@/lib/format";

export default function DashboardPage() {
  const { state, isHydrated, currentPlayer, role, actions } = useClub();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const upcoming = nextGame(state);
  const ranked = rankedPlayers(state);
  const recent = completedGames(state).slice(0, 4);
  const leader = ranked.find((player) => player.gamesPlayed > 0);
  const monthly = gamesByMonth(state);
  const resultGame = useMemo(
    () =>
      state.games.find(
        (game) =>
          (game.status === "open" || game.status === "full") &&
          getGamePlayers(state, game.id).length >= 2
      ) ?? upcoming ?? null,
    [state, upcoming]
  );

  if (!isHydrated) return <PageSkeleton />;

  const signed =
    upcoming && currentPlayer ? isSignedUp(state, upcoming.id, currentPlayer.id) : false;
  const upcomingPlayers = upcoming ? getGamePlayers(state, upcoming.id) : [];

  function handleRsvp() {
    if (!upcoming || !currentPlayer) return;
    if (signed) {
      actions.leaveGame(upcoming.id);
      toast.success("Запись отменена");
      return;
    }
    actions.joinGame(upcoming.id);
    toast.success("Вы записались на игру");
  }

  return (
    <div>
      {upcoming ? (
        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                  {upcoming.status === "live" ? "Сейчас идёт стол" : "Ближайшая игра"}
                </p>
                <GameStatusBadge status={upcoming.status} />
              </div>
              <h1 className="text-[32px] leading-none font-semibold tracking-tight">
                {upcoming.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-primary" />
                  {formatDate(upcoming.date, "d MMM")}, {upcoming.startTime}
                </span>
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <MapPin className="size-4 text-primary" />
                  <span className="truncate">{upcoming.venueName}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4 text-primary" />
                  {upcomingPlayers.length} / {upcoming.participantLimit} игрока
                </span>
              </div>
              <div className="mt-4 flex -space-x-2">
                {upcomingPlayers.slice(0, 8).map((player) => (
                  <PlayerAvatar key={player.id} name={player.name} />
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
              <Button
                variant="secondary"
                className="h-9 min-w-40"
                render={<Link href={`/games/${upcoming.id}`} />}
              >
                Подробнее
              </Button>
              {upcoming.status === "live" ? (
                <Button
                  className="h-9 min-w-40"
                  render={<Link href={`/live/${upcoming.id}`} />}
                >
                  К живому столу
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="h-9 min-w-40"
                  onClick={handleRsvp}
                  disabled={
                    !canRsvp(role) ||
                    (!signed && upcoming.status === "full" && !upcoming.allowLateJoin)
                  }
                >
                  {signed ? "Отменить запись" : "Записаться"}
                </Button>
              )}
              <p className="pt-1 text-right text-sm text-muted-foreground">
                {formatCompactRelative(upcoming.date, upcoming.startTime)}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <EmptyState
          title="Ближайших игр нет"
          description="Создайте стол — коллеги увидят его в календаре."
          action={
            canCreateGame(role) ? (
              <Button render={<Link href="/games/new" />}>Создать игру</Button>
            ) : null
          }
        />
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Всего игр"
          value={state.games.filter((game) => game.status === "completed").length}
          hint="завершено"
        />
        <StatsCard
          label="Активных участников"
          value={state.players.filter((player) => player.gamesPlayed > 0).length}
        />
        <StatsCard
          label="Средний банк"
          value={formatMoney(averagePot(state))}
          tone="gold"
        />
        <StatsCard
          label="Лидер рейтинга"
          value={leader?.name ?? "—"}
          hint={leader ? `${leader.rating} очков` : undefined}
          tone="win"
          valueClassName="text-[22px] sm:text-[24px]"
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="glass-panel rounded-2xl p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Текущий рейтинг</h2>
              <p className="text-sm text-muted-foreground">Топ-5</p>
            </div>
            <Link href="/leaderboard" className="text-sm text-primary hover:underline">
              Все →
            </Link>
          </div>
          {ranked.some((player) => player.gamesPlayed > 0) ? (
            <ol className="space-y-1">
              {ranked.slice(0, 5).map((player, index) => (
                <li key={player.id}>
                  <Link
                    href={`/players/${player.id}`}
                    className="flex items-center gap-3 rounded-xl px-1 py-2 hover:bg-foreground/4"
                  >
                    <RankIndex rank={index + 1} />
                    <PlayerAvatar name={player.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        win rate {formatPercent(player.winRate)}
                      </p>
                    </div>
                    <span className="tabular text-sm font-medium">{player.rating}</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              title="Рейтинг пока пуст"
              description="Добавьте участников и закройте первую игру — таблица заполнится сама."
            />
          )}
        </section>
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-base font-semibold">Активность команды</h2>
          <p className="mb-4 text-sm text-muted-foreground">Игр по месяцам</p>
          {monthly.length === 0 ? (
            <EmptyState
              title="Пока нет активности"
              description="График появится после первой сыгранной игры."
            />
          ) : (
            <GamesByMonthChart
              data={monthly.map((item) => ({
                month: formatMonthShort(item.month),
                games: item.games,
              }))}
            />
          )}
        </section>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="mb-4 text-base font-semibold">Последние игры</h2>
          {recent.length === 0 ? (
            <EmptyState
              title="История пуста"
              description="После первой завершённой игры она появится здесь."
            />
          ) : (
            <ul className="space-y-2">
              {recent.map((game) => {
                const winner = getWinner(state, game.id);
                const count = getGamePlayers(state, game.id).length;
                return (
                  <li
                    key={game.id}
                    className="flex items-center gap-3 rounded-xl px-1 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{game.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {formatDate(game.date, "d MMM")} · {game.venueName} ·{" "}
                        {winner?.name ?? "без победителя"}
                      </p>
                    </div>
                    <div className="hidden text-right text-sm sm:block">
                      <p className="tabular">{count} игр.</p>
                      <p className="tabular text-muted-foreground">
                        {formatMoney(getGamePot(state, game), game.currency)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" render={<Link href={`/games/${game.id}`} />}>
                      Детали
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="mb-4 text-base font-semibold">Быстрые действия</h2>
          <div className="grid gap-2">
            <Button
              variant="secondary"
              className="h-9 justify-start"
              disabled={!canCreateGame(role)}
              render={canCreateGame(role) ? <Link href="/games/new" /> : undefined}
            >
              <Plus data-icon="inline-start" />
              Создать игру
            </Button>
            <Button
              variant="secondary"
              className="h-9 justify-start"
              render={<Link href="/leaderboard" />}
            >
              <Trophy data-icon="inline-start" />
              Посмотреть рейтинг
            </Button>
            <Button
              variant="secondary"
              className="h-9 justify-start"
              disabled={!canEnterResults(role) || !resultGame}
              onClick={() => setResultsOpen(true)}
            >
              Добавить результат
            </Button>
            <Button
              variant="secondary"
              className="h-9 justify-start"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus data-icon="inline-start" />
              Добавить участника
            </Button>
          </div>
        </section>
      </div>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <ResultsDialog game={resultGame} open={resultsOpen} onOpenChange={setResultsOpen} />
    </div>
  );
}
