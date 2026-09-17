"use client";

import { GameForm } from "@/components/game-form";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { useClub } from "@/hooks/use-club";
import { canCreateGame } from "@/lib/auth/roles";

export default function NewGamePage() {
  const { isHydrated, role } = useClub();
  if (!isHydrated) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Новая игра"
        title="Собрать стол"
        description="Укажите дату, место своими словами и бай-ин. Участников добавите отдельно — вы сами в стол не попадаете."
      />
      {canCreateGame(role) ? (
        <div className="glass-panel p-5 sm:p-6">
          <GameForm />
        </div>
      ) : (
        <div className="glass-panel p-6 text-sm text-muted-foreground">
          Создавать игры могут только администраторы. Переключите роль в настройках, если это демо.
        </div>
      )}
    </div>
  );
}
