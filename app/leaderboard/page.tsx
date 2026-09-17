"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { RatingLineChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClub } from "@/hooks/use-club";
import { describeRatingFormula } from "@/lib/rating";
import { buildLeaderboard, ratingSeriesForPlayer } from "@/lib/data/selectors";
import type { LeaderboardPeriod } from "@/types";

export default function LeaderboardPage() {
  const { state, isHydrated } = useClub();
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [view, setView] = useState<"table" | "chart">("table");
  const rows = useMemo(() => buildLeaderboard(state, period), [state, period]);
  const top = rows[0];
  const chart = top ? ratingSeriesForPlayer(state, top.player.id) : [];

  if (!isHydrated) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        eyebrow="Рейтинг"
        title="Таблица клуба"
        description={describeRatingFormula()}
        actions={
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={view === "table" ? "default" : "outline"}
              onClick={() => setView("table")}
            >
              Таблица
            </Button>
            <Button
              size="sm"
              variant={view === "chart" ? "default" : "outline"}
              onClick={() => setView("chart")}
            >
              График
            </Button>
          </div>
        }
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
          title="Пока нет рейтинга"
          description="Как только закроется первая игра, таблица заполнится."
        />
      ) : view === "table" ? (
        <LeaderboardTable rows={rows} />
      ) : (
        <section className="glass-panel p-5">
          <h2 className="mb-3 font-heading text-lg">
            Ход рейтинга · {top?.player.name}
          </h2>
          <RatingLineChart
            data={chart.map((item) => ({ date: item.date.slice(5), rating: item.rating }))}
          />
        </section>
      )}
    </div>
  );
}
