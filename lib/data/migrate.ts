import { durationInHours } from "@/lib/format";
import type { ClubState } from "@/types";

export function isClubAdminOnly(person: { id?: string; playerId?: string; name: string }) {
  return (
    person.id === "p-tanya" ||
    person.playerId === "p-tanya" ||
    person.name === "Татьяна Посохова"
  );
}

export function migrateState(state: ClubState): ClubState {
  return {
    ...state,
    games: state.games.map((game) => ({
      ...game,
      duration: durationInHours(game.duration),
      venueId: "",
    })),
    players: state.players.filter((player) => !isClubAdminOnly(player)),
    participants: state.participants.filter((item) => item.playerId !== "p-tanya"),
    results: state.results.filter((item) => item.playerId !== "p-tanya"),
    users: state.users.map((user) =>
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
