"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlayerAvatar } from "@/components/player-avatar";
import { useClub } from "@/hooks/use-club";
import { getGamePlayers } from "@/lib/data/selectors";
import { resultsSchema } from "@/lib/validation";
import type { Game, Player } from "@/types";

type Draft = {
  gameId: string;
  order: string[];
  payouts: Record<string, string>;
  pot: string;
  notes: string;
  error: string | null;
};

function createDraft(
  game: Game,
  players: Player[],
  existing: { playerId: string; place: number; payout: number }[]
): Draft {
  const ranked = [...existing].sort((a, b) => a.place - b.place);
  const rankedIds = ranked.map((item) => item.playerId);
  const rest = players.filter((player) => !rankedIds.includes(player.id)).map((player) => player.id);
  const order = rankedIds.length > 0 ? [...rankedIds, ...rest] : players.map((player) => player.id);
  const pot =
    ranked.length > 0
      ? ranked.reduce((sum, item) => sum + item.payout, 0)
      : game.buyIn * order.length;
  const shares = [0.5, 0.25, 0.15, 0.1];
  const payouts: Record<string, string> = {};
  order.forEach((id, index) => {
    const saved = ranked.find((item) => item.playerId === id);
    payouts[id] =
      saved !== undefined
        ? String(saved.payout)
        : String(Math.round(pot * (shares[index] ?? 0)));
  });
  return { gameId: game.id, order, payouts, pot: String(pot), notes: "", error: null };
}

export function ResultsDialog({
  game,
  open,
  onOpenChange,
}: {
  game: Game | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, actions } = useClub();
  const players = useMemo(
    () => (game ? getGamePlayers(state, game.id) : []),
    [game, state]
  );
  const existing = useMemo(
    () => (game ? state.results.filter((item) => item.gameId === game.id) : []),
    [game, state.results]
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const active =
    game && open
      ? draft && draft.gameId === game.id
        ? draft
        : createDraft(game, players, existing)
      : null;

  if (!game || !active) return null;
  const currentGame = game;
  const current = active;

  function update(patch: Partial<Draft>) {
    setDraft({ ...current, ...patch, gameId: currentGame.id });
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...current.order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update({ order: next });
  }

  function handleSave() {
    const entries = current.order.map((playerId, index) => ({
      playerId,
      place: index + 1,
      payout: 0,
    }));
    const parsed = resultsSchema.safeParse({
      pot: 0,
      notes: current.notes,
      entries,
    });
    if (!parsed.success) {
      update({ error: parsed.error.issues[0]?.message ?? "Проверьте поля" });
      return;
    }
    const dropped = players
      .map((player) => player.id)
      .filter((playerId) => !current.order.includes(playerId));
    void (async () => {
      if (dropped.length > 0) {
        await actions.leavePlayers(currentGame.id, dropped);
      }
      await actions.saveResults({
        gameId: currentGame.id,
        pot: parsed.data.pot,
        notes: parsed.data.notes,
        entries: parsed.data.entries,
      });
      toast.success("Результаты сохранены", {
        description: "Места сохранены.",
      });
      setDraft(null);
      onOpenChange(false);
    })();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setDraft(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Результаты: {currentGame.title}</DialogTitle>
          <DialogDescription>
            Расставьте игроков по местам. Кто не играл — уберите из списка. Деньги и баллы пока не считаем.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <ul className="space-y-2">
            {current.order.map((playerId, index) => {
              const player = players.find((item) => item.id === playerId);
              if (!player) return null;
              return (
                <li
                  key={playerId}
                  className="flex items-center gap-2 rounded-xl border border-border/70 p-2"
                >
                  <span className="tabular w-6 text-sm text-muted-foreground">{index + 1}</span>
                  <PlayerAvatar name={player.name} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm">{player.name}</span>
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Выше"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Ниже"
                      disabled={index === current.order.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={current.order.length <= 2}
                    onClick={() => {
                      const next = current.order.filter((id) => id !== playerId);
                      const payouts = { ...current.payouts };
                      delete payouts[playerId];
                      update({ order: next, payouts });
                    }}
                  >
                    Убрать
                  </Button>
                </li>
              );
            })}
          </ul>
          <div className="grid gap-1.5">
            <Label htmlFor="result-notes">Заметки</Label>
            <Textarea
              id="result-notes"
              value={current.notes}
              onChange={(event) => update({ notes: event.target.value })}
              placeholder="Например: хедз-ап затянулся, банк собрали без ребаев"
            />
          </div>
          {current.error && <p className="text-sm text-destructive">{current.error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={current.order.length < 2}>
            Сохранить результаты
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
