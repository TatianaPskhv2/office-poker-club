"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/constants";
import { useClub } from "@/hooks/use-club";
import { createGameSchema } from "@/lib/validation";
import type { CreateGameInput, Game } from "@/types";

const EMPTY: CreateGameInput = {
  title: "",
  date: "",
  startTime: "19:00",
  duration: 3,
  venueId: "",
  venueName: "",
  address: "",
  participantLimit: 8,
  buyIn: 250,
  currency: "₽",
  notes: "",
  allowLateJoin: false,
  notifyParticipants: true,
};

export function GameForm({
  game,
  onCancel,
}: {
  game?: Game;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const { state, actions } = useClub();
  const [values, setValues] = useState<CreateGameInput>(
    game
      ? {
          title: game.title,
          date: game.date,
          startTime: game.startTime,
          duration: game.duration,
          venueId: game.venueId,
          venueName: game.venueName,
          address: game.address,
          participantLimit: game.participantLimit,
          buyIn: game.buyIn,
          currency: game.currency,
          notes: game.notes,
          allowLateJoin: game.allowLateJoin,
          notifyParticipants: game.notifyParticipants,
        }
      : {
          ...EMPTY,
          venueId: state.settings.defaultVenueId,
          venueName:
            state.venues.find((item) => item.id === state.settings.defaultVenueId)
              ?.name ?? "",
          currency: state.settings.defaultCurrency,
          notifyParticipants: state.settings.notifyByDefault,
          address:
            state.venues.find((item) => item.id === state.settings.defaultVenueId)
              ?.address ?? "",
        }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function set<K extends keyof CreateGameInput>(key: K, value: CreateGameInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = createGameSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? "title");
        next[key] = issue.message;
      });
      setErrors(next);
      return;
    }
    setPending(true);
    if (game) {
      actions.updateGame(game.id, {
        ...parsed.data,
        address: parsed.data.address ?? "",
        notes: parsed.data.notes ?? "",
      });
      toast.success("Игра обновлена");
      onCancel?.();
      setPending(false);
      return;
    }
    const id = actions.createGame({
      ...parsed.data,
      address: parsed.data.address ?? "",
      notes: parsed.data.notes ?? "",
    });
    toast.success("Игра создана", {
      description: "Она уже появилась в календаре и списке.",
    });
    router.push(`/games/${id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <Field label="Название игры" error={errors.title}>
        <Input
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
          placeholder="Пятничный стол"
          aria-invalid={Boolean(errors.title)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Дата" error={errors.date}>
          <Input
            type="date"
            value={values.date}
            onChange={(event) => set("date", event.target.value)}
            aria-invalid={Boolean(errors.date)}
          />
        </Field>
        <Field label="Время начала" error={errors.startTime}>
          <Input
            type="time"
            value={values.startTime}
            onChange={(event) => set("startTime", event.target.value)}
            aria-invalid={Boolean(errors.startTime)}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Длительность, часы" error={errors.duration}>
          <Input
            type="number"
            min={1}
            max={12}
            value={values.duration}
            onChange={(event) => set("duration", Number(event.target.value))}
          />
        </Field>
        <Field label="Лимит участников" error={errors.participantLimit}>
          <Input
            type="number"
            min={2}
            max={12}
            value={values.participantLimit}
            onChange={(event) => set("participantLimit", Number(event.target.value))}
          />
        </Field>
      </div>
      <Field label="Место проведения" error={errors.venueName}>
        <Input
          value={values.venueName}
          onChange={(event) => {
            setValues((prev) => ({
              ...prev,
              venueId: "",
              venueName: event.target.value,
            }));
          }}
          placeholder="Кухня, переговорка, бар"
          aria-invalid={Boolean(errors.venueName)}
        />
      </Field>
      <Field label="Адрес или описание места" error={errors.address}>
        <Input
          value={values.address ?? ""}
          onChange={(event) => set("address", event.target.value)}
          placeholder="Офис, 4 этаж"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Бай-ин" error={errors.buyIn}>
          <Input
            type="number"
            min={0}
            value={values.buyIn}
            onChange={(event) => set("buyIn", Number(event.target.value))}
          />
        </Field>
        <Field label="Валюта" error={errors.currency}>
          <Select
            value={values.currency}
            onValueChange={(value) => value && set("currency", String(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Заметки" error={errors.notes}>
        <Textarea
          value={values.notes}
          onChange={(event) => set("notes", event.target.value)}
          placeholder="Что взять с собой, когда заканчиваем, кто приносит чипсы"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={values.allowLateJoin}
          onCheckedChange={(checked) => set("allowLateJoin", Boolean(checked))}
        />
        Разрешить позднюю запись
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={values.notifyParticipants}
          onCheckedChange={(checked) => set("notifyParticipants", Boolean(checked))}
        />
        Отправить уведомление участникам
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {game ? "Сохранить изменения" : "Создать игру"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : router.push("/games"))}
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
