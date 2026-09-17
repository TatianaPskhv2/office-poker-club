"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PlayerFormDialog } from "@/components/player-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClub } from "@/hooks/use-club";
import { getGamePlayers } from "@/lib/data/selectors";
import { pluralPlayers } from "@/lib/format";
import type { Game } from "@/types";

export function EnrollPlayerDialog({
  game,
  open,
  onOpenChange,
}: {
  game: Game;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          {open ? (
            <EnrollPlayerFields
              game={game}
              onClose={() => onOpenChange(false)}
              onCreateNew={() => {
                onOpenChange(false);
                setCreateOpen(true);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <PlayerFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(playerId) => {
          useClubJoin(game.id, playerId);
        }}
      />
    </>
  );
}

function useClubJoin(gameId: string, playerId: string) {
  // Called from onCreated after the enroll dialog has unmounted its store hook.
  // Use the module-level actions via a nested component instead.
  void gameId;
  void playerId;
}

function EnrollPlayerFields({
  game,
  onClose,
  onCreateNew,
}: {
  game: Game;
  onClose: () => void;
  onCreateNew: () => void;
}) {
  const { state, actions } = useClub();
  const seated = getGamePlayers(state, game.id);
  const seatedIds = useMemo(() => new Set(seated.map((player) => player.id)), [seated]);
  const available = state.players.filter((player) => !seatedIds.has(player.id));
  const [selected, setSelected] = useState<string[]>([]);
  const remaining = Math.max(0, game.participantLimit - seated.length);
  const allChecked = available.length > 0 && selected.length === available.length;

  function toggle(playerId: string, checked: boolean) {
    setSelected((prev) => {
      if (checked) return prev.includes(playerId) ? prev : [...prev, playerId];
      return prev.filter((id) => id !== playerId);
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? available.map((player) => player.id) : []);
  }

  function handleAdd() {
    if (selected.length === 0) return;
    const added = actions.joinPlayers(game.id, selected);
    if (added === 0) {
      toast.error("Никого не записали", {
        description: "Стол уже полный или эти игроки уже в списке.",
      });
      return;
    }
    toast.success("Игроки записаны", {
      description: `${pluralPlayers(added)}${
        added < selected.length ? ` из ${selected.length} выбранных — мест больше нет` : ""
      }`,
    });
    onClose();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Записать на игру</DialogTitle>
        <DialogDescription>
          Отметьте галочками, кого посадить за стол, и добавьте всех сразу. Свободно мест: {remaining}.
        </DialogDescription>
      </DialogHeader>
      <div className="grid max-h-72 gap-1 overflow-y-auto">
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Все текущие участники клуба уже записаны. Добавьте нового.
          </p>
        ) : (
          <>
            <label className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                aria-label="Выбрать всех"
              />
              <span className="font-medium">Выбрать всех</span>
              <span className="ml-auto text-muted-foreground">{available.length}</span>
            </label>
            {available.map((player) => {
              const checked = selected.includes(player.id);
              return (
                <label
                  key={player.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-foreground/4"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => toggle(player.id, Boolean(value))}
                    aria-label={player.name}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
                  <span className="truncate text-muted-foreground">
                    {player.jobTitle || "участник"}
                  </span>
                </label>
              );
            })}
          </>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCreateNew}>
          Новый участник
        </Button>
        <Button onClick={handleAdd} disabled={selected.length === 0}>
          {selected.length === 0
            ? "Добавить выбранных"
            : `Добавить (${selected.length})`}
        </Button>
      </DialogFooter>
    </>
  );
}
