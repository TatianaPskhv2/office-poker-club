import { durationInHours } from "@/lib/format";
import type { ClubState } from "@/types";

export function isClubAdminOnly(person: { id?: string; playerId?: string; name: string }) {
  return (
    person.id === "p-tanya" ||
    person.playerId === "p-tanya" ||
    person.name === "Татьяна Посохова"
  );
}

function nameKey(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replaceAll("ё", "е")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

export function isTestHusbandName(name: string) {
  return nameKey(name) === nameKey("Посохов Артем");
}

export function migrateState(state: ClubState): ClubState {
  const dropPlayerIds = new Set(
    state.players
      .filter((player) => isClubAdminOnly(player) || isTestHusbandName(player.name))
      .map((player) => player.id)
  );
  return {
    ...state,
    games: state.games.map((game) => ({
      ...game,
      duration: durationInHours(game.duration),
      venueId: "",
    })),
    players: state.players.filter(
      (player) => !isClubAdminOnly(player) && !isTestHusbandName(player.name)
    ),
    participants: state.participants.filter((item) => !dropPlayerIds.has(item.playerId)),
    results: state.results.filter((item) => !dropPlayerIds.has(item.playerId)),
    users: state.users
      .filter(
        (user) =>
          user.id === "u-tanya" ||
          (!isTestHusbandName(user.name) && !dropPlayerIds.has(user.playerId))
      )
      .map((user) =>
        user.id === "u-tanya"
          ? {
              ...user,
              name: "Татьяна Посохова",
              email: user.email || "romanenko-1007@mail.ru",
              role: "admin",
            }
          : user
      ),
  };
}
