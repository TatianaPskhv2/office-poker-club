"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { CURRENCIES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { describeRatingFormula } from "@/lib/rating";
import { useClub } from "@/hooks/use-club";
import type { UserRole } from "@/types";

export default function SettingsPage() {
  const { state, isHydrated, currentUser, currentPlayer, role, actions } = useClub();
  const [resetOpen, setResetOpen] = useState(false);
  const supabase = isSupabaseConfigured();

  if (!isHydrated) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Настройки"
        title="Клуб и доступ"
        description="Команда, роли и источник данных. Сейчас приложение работает в mock-режиме."
      />
      <div className="space-y-4">
        <section className="glass-panel space-y-4 p-5">
          <h2 className="font-heading text-lg">Команда</h2>
          <div className="grid gap-1.5">
            <Label htmlFor="team">Название workspace</Label>
            <Input
              id="team"
              value={state.settings.teamName}
              onChange={(event) => actions.updateSettings({ teamName: event.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Валюта по умолчанию</Label>
              <Select
                value={state.settings.defaultCurrency}
                onValueChange={(value) =>
                  value && actions.updateSettings({ defaultCurrency: String(value) })
                }
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
            </div>
            {state.venues.length > 0 && (
              <div className="grid gap-1.5">
                <Label>Место по умолчанию</Label>
                <Select
                  value={state.settings.defaultVenueId}
                  onValueChange={(value) =>
                    value && actions.updateSettings({ defaultVenueId: String(value) })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {state.venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="season">Начало сезона</Label>
            <Input
              id="season"
              type="date"
              value={state.settings.seasonStart}
              onChange={(event) => actions.updateSettings({ seasonStart: event.target.value })}
            />
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Уведомлять участников о новых играх</span>
            <Switch
              checked={state.settings.notifyByDefault}
              onCheckedChange={(checked) =>
                actions.updateSettings({ notifyByDefault: Boolean(checked) })
              }
            />
          </label>
        </section>

        <section className="glass-panel space-y-4 p-5">
          <h2 className="font-heading text-lg">Текущий пользователь</h2>
          <p className="text-sm text-muted-foreground">
            {currentPlayer?.name ?? currentUser.name} · {ROLE_LABELS[role]}
          </p>
          <div className="grid gap-1.5">
            <Label>Войти как</Label>
            <Select
              value={state.currentUserId}
              onValueChange={(value) => value && actions.setCurrentUser(String(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Роль (демо)</Label>
            <Select
              value={role}
              onValueChange={(value) => value && actions.setRole(value as UserRole)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Администратор</SelectItem>
                <SelectItem value="member">Участник</SelectItem>
                <SelectItem value="viewer">Наблюдатель</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="glass-panel space-y-3 p-5">
          <h2 className="font-heading text-lg">Данные и рейтинг</h2>
          <p className="text-sm text-muted-foreground">
            Источник: {supabase ? "Supabase" : "локальный mock / localStorage"}. {describeRatingFormula()}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setResetOpen(true)}>
              Сбросить данные клуба
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.message("Supabase ещё не подключён", {
                  description: "Добавьте URL и anon key в .env.local, клиент уже готов в lib/supabase.",
                })
              }
            >
              Проверить подключение
            </Button>
          </div>
        </section>
      </div>
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Сбросить данные?"
        description="Игры, участники и рейтинг на этом устройстве будут удалены."
        confirmLabel="Сбросить"
        destructive
        onConfirm={() => {
          actions.reset();
          toast.success("Клуб очищен");
        }}
      />
    </div>
  );
}
