"use client";

import { useState } from "react";
import { toast } from "sonner";
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

export function UnenrollPlayerDialog({
  game,
  open,
  onOpenChange,
}: {
  game: Game;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <UnenrollPlayerFields game={game} onClose={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function UnenrollPlayerFields({
  game,
  onClose,
}: {
  game: Game;
  onClose: () => void;
}) {
  const { state, actions } = useClub();
  const seated = getGamePlayers(state, game.id);
  const [selected, setSelected] = useState<string[]>([]);
  const allChecked = seated.length > 0 && selected.length === seated.length;

  function toggle(playerId: string, checked: boolean) {
    setSelected((prev) => {
      if (checked) return prev.includes(playerId) ? prev : [...prev, playerId];
      return prev.filter((id) => id !== playerId);
    });
  }

  function handleRemove() {
    if (selected.length === 0) return;
    const removed = actions.leavePlayers(game.id, selected);
    if (removed === 0) {
      toast.error("Никого не убрали");
      return;
    }
    toast.success("Сняли с игры", {
      description: pluralPlayers(removed),
    });
    onClose();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Убрать с игры</DialogTitle>
        <DialogDescription>
          Отметьте тех, кто не придёт, и снимите их с записи. В клубе они останутся.
        </DialogDescription>
      </DialogHeader>
      <div className="grid max-h-72 gap-1 overflow-y-auto">
        {seated.length === 0 ? (
          <p className="text-sm text-muted-foreground">На эту игру пока никто не записан.</p>
        ) : (
          <>
            <label className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(checked) =>
                  setSelected(checked ? seated.map((player) => player.id) : [])
                }
                aria-label="Выбрать всех"
              />
              <span className="font-medium">Выбрать всех</span>
              <span className="ml-auto text-muted-foreground">{seated.length}</span>
            </label>
            {seated.map((player) => (
              <label
                key={player.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-foreground/4"
              >
                <Checkbox
                  checked={selected.includes(player.id)}
                  onCheckedChange={(value) => toggle(player.id, Boolean(value))}
                  aria-label={player.name}
                />
                <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
              </label>
            ))}
          </>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="destructive" onClick={handleRemove} disabled={selected.length === 0}>
          {selected.length === 0 ? "Убрать выбранных" : `Убрать (${selected.length})`}
        </Button>
      </DialogFooter>
    </>
  );
}
