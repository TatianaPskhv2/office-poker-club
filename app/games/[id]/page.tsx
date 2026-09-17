"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { EnrollPlayerDialog } from "@/components/enroll-player-dialog";
import { UnenrollPlayerDialog } from "@/components/unenroll-player-dialog";
import { GameForm } from "@/components/game-form";
import { GameStatusBadge } from "@/components/game-status-badge";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { ParticipantsList } from "@/components/participants-list";
import { PlayerAvatar } from "@/components/player-avatar";
import { ResultsDialog } from "@/components/results-form";
import { ShareLiveLink } from "@/components/share-live-link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClub } from "@/hooks/use-club";
import { canCancelGame, canEditGame, canEnterResults, canManagePlayers, canRsvp } from "@/lib/auth/roles";
import { abortLiveSession, fetchLiveSession, startLiveSession } from "@/lib/live/client";
import { liveResultEntries, prizePool } from "@/lib/live/logic";
import { liveShareUrl } from "@/lib/share-url";
import { getGamePlayers, getGamePot, getWinner, isSignedUp } from "@/lib/data/selectors";
import {
  formatDateTime,
  formatDuration,
  formatMoney,
  formatRelativeDate,
  formatSigned,
} from "@/lib/format";

export default function GameDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { state, isHydrated, currentUser, currentPlayer, role, actions } = useClub();
  const [editOpen, setEditOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [unenrollOpen, setUnenrollOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const game = state.games.find((item) => item.id === id);
  const players = game ? getGamePlayers(state, game.id) : [];
  const organizer = game
    ? state.players.find((player) => player.id === game.organizerId)
    : undefined;
  const signed = game && currentPlayer ? isSignedUp(state, game.id, currentPlayer.id) : false;
  const results = game
    ? [...state.results.filter((item) => item.gameId === game.id)].sort((a, b) => a.place - b.place)
    : [];
  const winner = game ? getWinner(state, game.id) : undefined;

  if (!isHydrated) return <PageSkeleton />;
  if (!game) {
    return (
      <EmptyState
        title="Игра не найдена"
        description="Возможно, её удалили или ссылка устарела."
        action={<Button render={<Link href="/games" />}>Ко всем играм</Button>}
      />
    );
  }

  const currentGame = game;
  const canManage = canEditGame(role, currentGame.organizerId, currentUser);
  const joinDisabled =
    !canRsvp(role) ||
    currentGame.status === "cancelled" ||
    currentGame.status === "completed" ||
    currentGame.status === "live" ||
    (!signed && currentGame.status === "full" && !currentGame.allowLateJoin);
  const rosterLocked =
    currentGame.status === "live" ||
    currentGame.status === "completed" ||
    currentGame.status === "cancelled";

  async function handleLiveTable() {
    setStarting(true);
    try {
      await startLiveSession({
        id: currentGame.id,
        title: currentGame.title,
        venueName: currentGame.venueName,
        date: currentGame.date,
        buyIn: currentGame.buyIn,
        currency: currentGame.currency,
        players: players.map((player) => ({ playerId: player.id, name: player.name })),
      });
      actions.markLive(currentGame.id);
      const share = await liveShareUrl(currentGame.id);
      try {
        if (share.public) {
          await navigator.clipboard.writeText(share.url);
          toast.success("Стол открыт, ссылка для коллег скопирована", {
            description: share.url,
          });
        } else {
          toast.success("Стол открыт", {
            description: "127.0.0.1 коллегам не отправляйте — скопируйте публичную ссылку на странице стола.",
          });
        }
      } catch {
        toast.success("Стол открыт", { description: share.url });
      }
      router.push(`/live/${currentGame.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось открыть стол");
    } finally {
      setStarting(false);
    }
  }

  async function handleAbortLive() {
    try {
      await abortLiveSession(currentGame.id);
      actions.cancelLive(currentGame.id);
      toast.success("Запуск отменён", {
        description: "Игра снова в записи, стол можно начать в день игры.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось отменить стол");
    }
  }

  async function handleImportLive() {
    try {
      const session = await fetchLiveSession(currentGame.id);
      if (!session || session.status !== "closed") {
        toast.error("Стол ещё не закрыт");
        return;
      }
      actions.saveResults({
        gameId: currentGame.id,
        pot: prizePool(session),
        notes: "Живой стол Texas Hold'em",
        entries: liveResultEntries(session),
      });
      toast.success("Рейтинг обновлён");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось записать рейтинг");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={formatRelativeDate(game.date, game.startTime)}
        title={game.title}
        description={`${formatDateTime(game.date, game.startTime)} · ${game.venueName}`}
        actions={
          <>
            <Button
              onClick={() => {
                if (signed) {
                  actions.leaveGame(game.id);
                  toast.success("Запись отменена");
                } else {
                  actions.joinGame(game.id);
                  toast.success("Вы записались");
                }
              }}
              disabled={joinDisabled}
            >
              {signed ? "Отменить запись" : "Записаться"}
            </Button>
            {canManage && game.status !== "completed" && game.status !== "cancelled" && game.status !== "live" && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Редактировать
              </Button>
            )}
            {canManage && (game.status === "open" || game.status === "full") && (
              <Button
                disabled={starting || players.length < 2}
                onClick={() => void handleLiveTable()}
              >
                Начать стол
              </Button>
            )}
            {canManage && game.status === "live" && (
              <>
                <Button nativeButton={false} render={<Link href={`/live/${game.id}`} />}>
                  К живому столу
                </Button>
                <Button variant="outline" onClick={() => void handleAbortLive()}>
                  Отменить запуск
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="glass-panel p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <GameStatusBadge status={game.status} />
            <span className="text-sm text-muted-foreground">
              бай-ин {formatMoney(game.buyIn, game.currency)}
            </span>
            <span className="text-sm text-muted-foreground">
              банк {formatMoney(getGamePot(state, game), game.currency)}
            </span>
          </div>
          {game.status === "live" && (
            <div className="mt-5">
              <ShareLiveLink id={game.id} />
            </div>
          )}
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info label="Организатор" value={organizer?.name ?? "—"} />
            <Info label="Участники" value={`${players.length}/${game.participantLimit}`} />
            <Info label="Длительность" value={formatDuration(game.duration)} />
            <Info label="Поздняя запись" value={game.allowLateJoin ? "да" : "нет"} />
          </dl>
          {game.notes && (
            <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {game.notes}
            </p>
          )}
          <div className="mt-5 rounded-2xl border border-border/70 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-medium">{game.venueName}</p>
                {game.address ? (
                  <p className="text-sm text-muted-foreground">{game.address}</p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 h-28 overflow-hidden rounded-xl bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]">
              <div className="flex h-full items-end p-3 text-xs text-muted-foreground">
                Карта недоступна в mock-режиме · ориентир по адресу выше
              </div>
            </div>
          </div>
          {canManage && game.status !== "completed" && (
            <div className="mt-5 flex flex-wrap gap-2">
              {game.status === "live" && (
                <Button variant="outline" onClick={() => void handleImportLive()}>
                  Записать рейтинг со стола
                </Button>
              )}
              {canEnterResults(role) && game.status !== "live" && (
                <Button onClick={() => setResultsOpen(true)} disabled={players.length < 2}>
                  Внести результаты
                </Button>
              )}
              {canCancelGame(role) && game.status !== "cancelled" && game.status !== "live" && (
                <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                  Отменить игру
                </Button>
              )}
              <Button variant="ghost" onClick={() => setDeleteOpen(true)}>
                Удалить
              </Button>
            </div>
          )}
        </section>
        <section className="glass-panel p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg">Записались</h2>
            {canManagePlayers(role) && !rosterLocked && (
              <div className="flex flex-wrap gap-1">
                {players.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setUnenrollOpen(true)}>
                    Убрать
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setEnrollOpen(true)}>
                  Добавить
                </Button>
              </div>
            )}
          </div>
          <ParticipantsList
            players={players}
            organizerId={game.organizerId}
            onRemove={
              canManagePlayers(role) && !rosterLocked
                ? (player) => {
                    actions.leavePlayers(game.id, [player.id]);
                    toast.success("Сняли с игры", { description: player.name });
                  }
                : undefined
            }
          />
        </section>
      </div>

      {game.status === "completed" && (
        <section className="glass-panel mt-4 p-5">
          <h2 className="font-heading text-lg">Итоги стола</h2>
          {winner && (
            <p className="mt-1 text-sm text-muted-foreground">
              Победитель — {winner.name}. Банк {formatMoney(getGamePot(state, game), game.currency)}, {formatDuration(game.duration)}.
            </p>
          )}
          <ol className="mt-4 space-y-2">
            {results.map((result) => {
              const player = state.players.find((item) => item.id === result.playerId);
              if (!player) return null;
              const profit = result.payout - game.buyIn;
              return (
                <li key={result.id}>
                  <Link
                    href={`/players/${player.id}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-foreground/4"
                  >
                    <span className="tabular w-6 text-sm text-muted-foreground">{result.place}</span>
                    <PlayerAvatar name={player.name} />
                    <span className="min-w-0 flex-1 truncate">{player.name}</span>
                    <span className={profit >= 0 ? "tabular text-win" : "tabular text-loss"}>
                      {formatSigned(profit)} {game.currency}
                    </span>
                    <span className="tabular text-sm text-muted-foreground">
                      {formatSigned(result.ratingDelta)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать игру</DialogTitle>
          </DialogHeader>
          <GameForm game={game} onCancel={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
      <EnrollPlayerDialog game={game} open={enrollOpen} onOpenChange={setEnrollOpen} />
      <UnenrollPlayerDialog game={game} open={unenrollOpen} onOpenChange={setUnenrollOpen} />
      <ResultsDialog game={game} open={resultsOpen} onOpenChange={setResultsOpen} />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Отменить игру?"
        description="Участники увидят статус «Отменена». Запись закроется."
        confirmLabel="Отменить игру"
        destructive
        onConfirm={() => {
          actions.cancelGame(game.id);
          toast.success("Игра отменена");
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Удалить игру?"
        description="Игра исчезнет из календаря и истории. Это действие нельзя отменить."
        confirmLabel="Удалить"
        destructive
        onConfirm={() => {
          actions.deleteGame(game.id);
          toast.success("Игра удалена");
          router.push("/games");
        }}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
