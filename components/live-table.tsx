"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Spade } from "lucide-react";
import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/page-skeleton";
import { useClub } from "@/hooks/use-club";
import { useLiveSession } from "@/hooks/use-live-session";
import { ShareLiveLink } from "@/components/share-live-link";
import { abortLiveSession } from "@/lib/live/client";
import { liveResultEntries, prizePool } from "@/lib/live/logic";
import { liveShareUrl } from "@/lib/share-url";
import { formatSigned } from "@/lib/format";
import type { LivePlayer, LiveSession } from "@/types";

export function LiveTable({ id }: { id: string }) {
  const { session, error, loading, run } = useLiveSession(id);
  const { state, actions } = useClub();
  const router = useRouter();
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [pot, setPot] = useState("");
  const [stackPlayer, setStackPlayer] = useState<LivePlayer | null>(null);
  const [stackValue, setStackValue] = useState("");
  const [bustPlayer, setBustPlayer] = useState<LivePlayer | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const active = useMemo(
    () =>
      (session?.players ?? [])
        .filter((player) => player.status === "active")
        .sort((a, b) => b.stack - a.stack || b.handsWon - a.handsWon),
    [session]
  );
  const out = useMemo(
    () =>
      (session?.players ?? [])
        .filter((player) => player.status === "eliminated")
        .sort((a, b) => (b.place ?? 0) - (a.place ?? 0)),
    [session]
  );

  if (loading) return <PageSkeleton />;
  if (error || !session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-5">
        <EmptyState
          title="Живой стол не запущен"
          description="Откройте игру в клубе и нажмите «Начать стол». Ссылку 127.0.0.1 коллегам не отправляйте — она открывается только на вашем компьютере."
        />
      </div>
    );
  }

  const live = session.status === "live";
  const winnerName = winnerId
    ? session.players.find((player) => player.playerId === winnerId)?.name
    : "";

  async function copyLink() {
    const share = await liveShareUrl(id);
    if (!share.public) {
      toast.error("Это адрес только вашего компьютера", {
        description: "Коллеги не откроют 127.0.0.1. Нужна публичная ссылка.",
      });
      return;
    }
    await navigator.clipboard.writeText(share.url);
    toast.success("Ссылка для коллег скопирована", {
      description: share.url,
    });
  }

  async function submitHand() {
    if (!winnerId) return;
    setPending(true);
    try {
      await run({ type: "hand", playerId: winnerId, pot: Number(pot) || 0 });
      toast.success("Раздача записана", { description: winnerName });
      setWinnerId(null);
      setPot("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не записалось");
    } finally {
      setPending(false);
    }
  }

  async function submitStack() {
    if (!stackPlayer) return;
    setPending(true);
    try {
      await run({ type: "stack", playerId: stackPlayer.playerId, stack: Number(stackValue) || 0 });
      toast.success("Стек обновлён", { description: stackPlayer.name });
      setStackPlayer(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не обновилось");
    } finally {
      setPending(false);
    }
  }

  async function confirmBust() {
    const player = bustPlayer;
    if (!player) return;
    setPending(true);
    try {
      const next = await run({ type: "bust", playerId: player.playerId });
      const place = next.players.find((item) => item.playerId === player.playerId)?.place;
      toast.success("Игрок выбыл", {
        description: place ? `${player.name} — ${place} место` : player.name,
      });
      maybeApplyResults(next);
      setBustPlayer(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не вышло");
    } finally {
      setPending(false);
    }
  }

  async function confirmClose() {
    setPending(true);
    try {
      const next = await run({ type: "close" });
      maybeApplyResults(next);
      toast.success("Стол закрыт", { description: "Места среди живых — по стеку." });
      setCloseOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не закрылся");
    } finally {
      setPending(false);
    }
  }

  function maybeApplyResults(next: LiveSession) {
    if (next.status !== "closed") return;
    const game = state.games.find((item) => item.id === next.id);
    if (!game || game.status === "completed") return;
    actions.saveResults({
      gameId: next.id,
      pot: prizePool(next),
      notes: "Живой стол Texas Hold'em",
      entries: liveResultEntries(next),
    });
  }

  async function abortLaunch() {
    setPending(true);
    try {
      await abortLiveSession(id);
      actions.cancelLive(id);
      toast.success("Запуск отменён", {
        description: "Игра снова в записи. Стол можно начать завтра.",
      });
      router.push(`/games/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось отменить стол");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-5 pb-24">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Texas Hold’em · живой стол
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{session.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.venueName} · бай-ин {session.buyIn} {session.currency} · {session.fieldSize} игроков
          </p>
        </div>
        <Button variant="outline" size="icon" aria-label="Скопировать ссылку" onClick={() => void copyLink()}>
          <Copy className="size-4" />
        </Button>
      </header>

      <div className="mb-4">
        <ShareLiveLink id={id} />
      </div>

      {live ? (
        <section className="glass-panel mb-4 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#22c55e] text-[#052e16]">
              <Spade className="size-3.5 fill-current" />
            </span>
            <div>
              <p className="text-sm font-medium">Кто взял банк?</p>
              <p className="text-xs text-muted-foreground">Нажмите победителя раздачи</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {active.map((player) => (
              <button
                key={player.playerId}
                type="button"
                onClick={() => {
                  setWinnerId(player.playerId);
                  setPot("");
                }}
                className="rounded-xl border border-border bg-background px-3 py-3 text-left hover:border-primary/50 hover:bg-foreground/4"
              >
                <span className="block truncate font-medium">{player.name}</span>
                <span className="text-xs text-muted-foreground">
                  стек {player.stack} · банков {player.handsWon}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="glass-panel mb-4 p-4">
          <p className="text-sm font-medium">Стол закрыт</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Итог зафиксирован. Если вы открывали игру в этом браузере, рейтинг клуба уже обновлён.
          </p>
        </section>
      )}

      <section className="mb-4">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">В игре</h2>
        <ul className="space-y-2">
          {active.map((player, index) => (
            <li key={player.playerId} className="glass-panel flex items-center gap-3 p-3">
              <span className="tabular w-5 text-sm text-muted-foreground">{index + 1}</span>
              <PlayerAvatar name={player.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{player.name}</p>
                <p className="text-xs text-muted-foreground">
                  стек {player.stack} · банков {player.handsWon}
                  {player.potsWon > 0 ? ` · ${player.potsWon} ${session.currency}` : ""}
                </p>
              </div>
              <span className="tabular text-sm text-[#22c55e]">{formatSigned(player.ratingPreview)}</span>
              {live && (
                <div className="flex flex-col gap-1">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setStackPlayer(player);
                      setStackValue(String(player.stack));
                    }}
                  >
                    Стек
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => setBustPlayer(player)}>
                    Выбыл
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {out.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Выбыли</h2>
          <ul className="space-y-2">
            {out.map((player) => (
              <li
                key={player.playerId}
                className="flex items-center gap-3 rounded-xl px-1 py-2 text-muted-foreground"
              >
                <span className="tabular w-8 text-sm">{player.place} м.</span>
                <PlayerAvatar name={player.name} size="sm" />
                <span className="min-w-0 flex-1 truncate">{player.name}</span>
                <span className="tabular text-sm">{formatSigned(player.ratingPreview)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {session.hands.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Последние банки</h2>
          <ul className="space-y-1 text-sm">
            {session.hands.slice(0, 8).map((hand) => (
              <li key={hand.id} className="flex justify-between gap-3 text-muted-foreground">
                <span className="truncate">{hand.winnerName} взял банк</span>
                <span className="tabular">
                  {hand.pot > 0 ? `${hand.pot} ${session.currency}` : "без суммы"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {live && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-lg flex-col gap-2">
            <Button className="w-full" variant="secondary" onClick={() => setCloseOpen(true)}>
              Закрыть стол по стекам
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              disabled={pending}
              onClick={() => void abortLaunch()}
            >
              Отменить запуск — игра ещё не сегодня
            </Button>
          </div>
        </div>
      )}

      <Dialog open={Boolean(winnerId)} onOpenChange={(open) => !open && setWinnerId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Банк за {winnerName}</DialogTitle>
            <DialogDescription>
              Сумму можно не писать — засчитается выигранная раздача. Стек сами поправите, если надо.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="pot">Банк, если знаете</Label>
            <Input
              id="pot"
              type="number"
              min={0}
              value={pot}
              onChange={(event) => setPot(event.target.value)}
              placeholder="0"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWinnerId(null)}>
              Отмена
            </Button>
            <Button onClick={() => void submitHand()} disabled={pending}>
              Записать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(stackPlayer)} onOpenChange={(open) => !open && setStackPlayer(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Стек · {stackPlayer?.name}</DialogTitle>
            <DialogDescription>0 фишек = игрок выбывает и получает место с конца.</DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            min={0}
            value={stackValue}
            onChange={(event) => setStackValue(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setStackPlayer(null)}>
              Отмена
            </Button>
            <Button onClick={() => void submitStack()} disabled={pending}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(bustPlayer)}
        onOpenChange={(open) => !open && setBustPlayer(null)}
        title={`${bustPlayer?.name} выбыл?`}
        description="Место посчитается с конца стола, клубный рейтинг — как прогноз, пока стол не закрыт окончательно."
        confirmLabel="Да, выбыл"
        destructive
        onConfirm={() => void confirmBust()}
      />
      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title="Закрыть стол?"
        description="Оставшиеся получат места по стеку, затем по числу выигранных банков. Рейтинг клуба запишется, если игра есть в этом браузере."
        confirmLabel="Закрыть стол"
        onConfirm={() => void confirmClose()}
      />
    </div>
  );
}
