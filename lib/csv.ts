import type { ClubState, Game } from "@/types";
import { completedGames, getGamePot, getWinner } from "@/lib/data/selectors";
import { formatDate, formatDuration, formatMoney } from "@/lib/format";

function csvEscape(value: string | number) {
  const text = String(value);
  if (/[",\n;]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function historyToCsv(state: ClubState, games: Game[] = completedGames(state)) {
  const header = [
    "Дата",
    "Название",
    "Место",
    "Победитель",
    "Участники",
    "Банк",
    "Длительность",
    "Бай-ин",
    "Статус",
  ];
  const rows = games.map((game) => {
    const winner = getWinner(state, game.id);
    const count = state.participants.filter((item) => item.gameId === game.id).length;
    return [
      formatDate(game.date, "yyyy-MM-dd"),
      game.title,
      game.venueName,
      winner?.name ?? "—",
      count,
      formatMoney(getGamePot(state, game), game.currency),
      formatDuration(game.duration),
      formatMoney(game.buyIn, game.currency),
      game.status,
    ];
  });
  return [header, ...rows].map((row) => row.map(csvEscape).join(";")).join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
