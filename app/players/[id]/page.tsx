"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { GamesByMonthChart } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerFormDialog } from "@/components/player-form";
import { RatingBadge } from "@/components/rating-badge";
import { StatsCard } from "@/components/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClub } from "@/hooks/use-club";
import { canEditPlayer, canManagePlayers, ROLE_LABELS } from "@/lib/auth/roles";
import { BADGES } from "@/lib/constants";
import {
  monthlyActivityForPlayer,
  playerGameHistory,
  playerRank,
} from "@/lib/data/selectors";
import {
  formatDate,
  formatPercent,
  formatPlace,
  formatStreak,
} from "@/lib/format";

export default function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { state, isHydrated, role, currentUser, actions } = useClub();
  const [editOpen, setEditOpen] = useState(false);
  const player = state.players.find((item) => item.id === id);

  if (!isHydrated) return <PageSkeleton />;
  if (!player) {
    return (
      <EmptyState
        title="Участник не найден"
        description="Проверьте ссылку или вернитесь к списку."
        action={<Button render={<Link href="/players" />}>Ко всем участникам</Button>}
      />
    );
  }

  const rank = playerRank(state, player.id);
  const history = playerGameHistory(state, player.id);
  const monthly = monthlyActivityForPlayer(state, player.id);

  return (
    <div>
      <div className="glass-panel mb-6 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <PlayerAvatar name={player.name} size="xl" />
        <div className="min-w-0 flex-1">
          <PageHeader
            eyebrow={player.department || ROLE_LABELS[player.role]}
            title={player.name}
            description={`${player.department || "отдел не указан"}${player.jobTitle ? ` · ${player.jobTitle}` : ""} · в клубе с ${formatDate(player.joinedAt, "d MMMM yyyy")}`}
            actions={
              <>
                {canEditPlayer(role, player.id, currentUser) ? (
                  <Button variant="outline" onClick={() => setEditOpen(true)}>
                    Редактировать профиль
                  </Button>
                ) : null}
                {canManagePlayers(role) ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      void (async () => {
                        await actions.deletePlayer(player.id);
                        toast.success("Участник удалён");
                        router.push("/players");
                      })();
                    }}
                  >
                    Удалить
                  </Button>
                ) : null}
              </>
            }
          />
          <div className="flex flex-wrap gap-1.5">
            {(player.badges ?? []).map((badge) => (
              <Badge key={badge} variant={badge === "leader" ? "default" : "outline"}>
                {BADGES[badge]?.label ?? badge}
              </Badge>
            ))}
          </div>
          {(player.email || player.phone || player.notes) && (
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {player.email && <p>{player.email}</p>}
              {player.phone && <p>{player.phone}</p>}
              {player.notes && <p className="whitespace-pre-wrap">{player.notes}</p>}
            </div>
          )}
        </div>
        <RatingBadge rank={rank} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Игры" value={player.gamesPlayed} />
        <StatsCard label="Победы" value={player.wins} tone="win" />
        <StatsCard label="Поражения" value={player.losses} tone="loss" />
        <StatsCard label="Win rate" value={formatPercent(player.winRate)} />
        <StatsCard label="Среднее место" value={formatPlace(player.averagePosition)} />
        <StatsCard label="Лучшее место" value={player.bestPosition || "—"} />
        <StatsCard label="Серия" value={formatStreak(player.currentStreak)} />
      </div>

      <div className="mt-4 grid gap-4">
        <section className="glass-panel p-5">
          <h2 className="mb-3 font-heading text-lg">Игры по месяцам</h2>
          <GamesByMonthChart
            data={monthly.map((item) => ({ month: item.month.slice(5), games: item.games }))}
          />
        </section>
      </div>

      <section className="glass-panel mt-4 overflow-hidden p-0">
        <div className="px-5 pt-5">
          <h2 className="font-heading text-lg">Игры участника</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Здесь записи на столы и места в завершённых играх.
          </p>
        </div>
        {history.length === 0 ? (
          <EmptyState className="m-5" title="Пока нет игр" description="Когда запишетесь или сыграете, игры появятся здесь." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Игра</TableHead>
                <TableHead>Место</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map(({ game, result }) => {
                if (!game) return null;
                return (
                  <TableRow key={`${game.id}-${result?.id ?? "rsvp"}`}>
                    <TableCell>{formatDate(game.date, "d MMM yyyy")}</TableCell>
                    <TableCell className="max-w-48 truncate">{game.title}</TableCell>
                    <TableCell className="tabular">
                      {result ? result.place : game.status === "completed" ? "—" : "запись"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" render={<Link href={`/games/${game.id}`} />}>
                        Игра
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
      <PlayerFormDialog player={player} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
