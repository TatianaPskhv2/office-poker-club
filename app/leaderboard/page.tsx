"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClub } from "@/hooks/use-club";
import { buildLeaderboard } from "@/lib/data/selectors";
import type { LeaderboardPeriod } from "@/types";

export default function LeaderboardPage() {
  const { state, isHydrated } = useClub();
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const rows = useMemo(() => buildLeaderboard(state, period), [state, period]);

  if (!isHydrated) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        eyebrow="Таблица"
        title="Места в клубе"
        description="Пока только места за стол. Деньги и баллы спрятаны — формулу ещё уточним."
      />
      <Tabs value={period} onValueChange={(value) => setPeriod(value as LeaderboardPeriod)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">За всё время</TabsTrigger>
          <TabsTrigger value="season">Текущий сезон</TabsTrigger>
          <TabsTrigger value="30d">Последние 30 дней</TabsTrigger>
        </TabsList>
      </Tabs>
      {rows.every((row) => row.gamesPlayed === 0) ? (
        <EmptyState
          title="Пока нет результатов"
          description="Как только закроется первая игра, таблица заполнится."
        />
      ) : (
        <LeaderboardTable rows={rows} />
      )}
    </div>
  );
}
