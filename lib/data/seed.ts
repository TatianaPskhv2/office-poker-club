import { STARTING_RATING, scoreGameResult } from "@/lib/rating";
import { BADGES } from "@/lib/constants";
import type {
  BadgeKind,
  ClubState,
  Game,
  GameStatus,
  GameParticipant,
  GameResult,
  Player,
  RatingHistory,
  User,
  Venue,
} from "@/types";

const now = "2026-09-17T08:00:00.000Z";

const venues: Venue[] = [
  {
    id: "v01",
    name: "Переговорка «Бай-ин»",
    address: "Офис, 4 этаж, переговорка у кухни",
    description: "Тихая комната на 10 человек, стол уже стоит",
  },
  {
    id: "v02",
    name: "Кухня на 7 этаже",
    address: "Офис, 7 этаж, большая кухня",
    description: "После 19:00 почти никого нет",
  },
  {
    id: "v03",
    name: "Бар у офиса",
    address: "ул. Лесная, 5, бар «Фолд»",
    description: "Забронирован стол у окна, можно есть во время игры",
  },
  {
    id: "v04",
    name: "Коворкинг на Тверской",
    address: "Тверская улица, 12, 3 этаж",
    description: "Отдельная комната на вечер пятницы",
  },
];

type PlayerSeed = Omit<
  Player,
  | "rating"
  | "gamesPlayed"
  | "wins"
  | "losses"
  | "winRate"
  | "averagePosition"
  | "averageResult"
  | "bestPosition"
  | "bestResult"
  | "currentStreak"
  | "bestStreak"
  | "badges"
>;

const playerSeeds: PlayerSeed[] = [
  {
    id: "p01",
    userId: "u01",
    name: "Александр Волков",
    department: "Engineering",
    jobTitle: "Senior Backend",
    role: "member",
    joinedAt: "2025-01-14",
  },
  {
    id: "p02",
    userId: "u02",
    name: "Мария Соколова",
    department: "Design",
    jobTitle: "Lead Designer",
    role: "member",
    joinedAt: "2025-02-03",
  },
  {
    id: "p03",
    userId: "u03",
    name: "Дмитрий Орлов",
    department: "Engineering",
    jobTitle: "Frontend Engineer",
    role: "member",
    joinedAt: "2025-02-18",
  },
  {
    id: "p04",
    userId: "u04",
    name: "Елена Кузнецова",
    department: "Marketing",
    jobTitle: "Brand Manager",
    role: "member",
    joinedAt: "2025-03-11",
  },
  {
    id: "p05",
    userId: "u05",
    name: "Иван Петров",
    department: "Engineering",
    jobTitle: "DevOps Engineer",
    role: "member",
    joinedAt: "2025-03-20",
  },
  {
    id: "p06",
    userId: "u06",
    name: "Анна Смирнова",
    department: "HR",
    jobTitle: "People Partner",
    role: "member",
    joinedAt: "2025-04-02",
  },
  {
    id: "p07",
    userId: "u07",
    name: "Павел Новиков",
    department: "Sales",
    jobTitle: "Account Executive",
    role: "member",
    joinedAt: "2025-04-15",
  },
  {
    id: "p08",
    userId: "u08",
    name: "Ольга Морозова",
    department: "Finance",
    jobTitle: "Financial Analyst",
    role: "member",
    joinedAt: "2025-05-06",
  },
  {
    id: "p09",
    userId: "u09",
    name: "Никита Фёдоров",
    department: "Engineering",
    jobTitle: "iOS Engineer",
    role: "member",
    joinedAt: "2025-01-28",
  },
  {
    id: "p10",
    userId: "u10",
    name: "Татьяна Белова",
    department: "Product",
    jobTitle: "Product Manager",
    role: "admin",
    joinedAt: "2025-01-10",
  },
  {
    id: "p11",
    userId: "u11",
    name: "Сергей Лебедев",
    department: "Legal",
    jobTitle: "Counsel",
    role: "viewer",
    joinedAt: "2025-06-01",
  },
  {
    id: "p12",
    userId: "u12",
    name: "Юлия Козлова",
    department: "Design",
    jobTitle: "Product Designer",
    role: "member",
    joinedAt: "2025-06-18",
  },
  {
    id: "p13",
    userId: "u13",
    name: "Артём Васильев",
    department: "Engineering",
    jobTitle: "QA Engineer",
    role: "member",
    joinedAt: "2025-08-04",
  },
  {
    id: "p14",
    userId: "u14",
    name: "Наталья Егорова",
    department: "Operations",
    jobTitle: "Office Manager",
    role: "member",
    joinedAt: "2025-08-21",
  },
];

const users: User[] = playerSeeds.map((player) => ({
  id: player.userId!,
  playerId: player.id,
  email: emailFromName(player.name),
  name: player.name,
  role: player.role,
}));

function emailFromName(name: string): string {
  const [first, last] = name.toLowerCase().split(" ");
  const translit: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  const slug = `${first}.${last}`
    .split("")
    .map((ch) => translit[ch] ?? ch)
    .join("");
  return `${slug}@office.poker`;
}

function venueById(id: string): Venue {
  const venue = venues.find((item) => item.id === id);
  if (!venue) throw new Error(`Unknown venue ${id}`);
  return venue;
}

function game(partial: Omit<Game, "venueName" | "address" | "createdAt" | "updatedAt">): Game {
  const venue = venueById(partial.venueId);
  return {
    ...partial,
    venueName: venue.name,
    address: venue.address,
    createdAt: now,
    updatedAt: now,
  };
}

const games: Game[] = [
  game({
    id: "g01",
    title: "Пятничный стол #12",
    date: "2026-05-22",
    startTime: "19:00",
    duration: 210,
    venueId: "v02",
    organizerId: "p01",
    participantLimit: 8,
    buyIn: 200,
    currency: "₽",
    status: "completed",
    notes: "Первая тёплая пятница — играли на кухне до полуночи.",
    allowLateJoin: false,
    notifyParticipants: true,
  }),
  game({
    id: "g02",
    title: "Июньский барный турнир",
    date: "2026-06-12",
    startTime: "20:00",
    duration: 180,
    venueId: "v03",
    organizerId: "p02",
    participantLimit: 6,
    buyIn: 200,
    currency: "₽",
    status: "completed",
    notes: "Короткий стол, много агрессии на флопе.",
    allowLateJoin: true,
    notifyParticipants: true,
  }),
  game({
    id: "g03",
    title: "Спринт после релиза",
    date: "2026-06-26",
    startTime: "19:30",
    duration: 195,
    venueId: "v01",
    organizerId: "p09",
    participantLimit: 8,
    buyIn: 200,
    currency: "₽",
    status: "completed",
    notes: "Инженеры отмечали выкладку 2.4.",
    allowLateJoin: false,
    notifyParticipants: true,
  }),
  game({
    id: "g04",
    title: "Большой стол на Тверской",
    date: "2026-07-10",
    startTime: "18:30",
    duration: 240,
    venueId: "v04",
    organizerId: "p10",
    participantLimit: 10,
    buyIn: 250,
    currency: "₽",
    status: "completed",
    notes: "Самый большой банк сезона.",
    allowLateJoin: true,
    notifyParticipants: true,
  }),
  game({
    id: "g05",
    title: "Кухонный кэш",
    date: "2026-07-24",
    startTime: "19:00",
    duration: 200,
    venueId: "v02",
    organizerId: "p03",
    participantLimit: 8,
    buyIn: 200,
    currency: "₽",
    status: "completed",
    notes: "Долгий хедз-ап Волков — Орлов.",
    allowLateJoin: false,
    notifyParticipants: true,
  }),
  game({
    id: "g06",
    title: "Августовский бар",
    date: "2026-08-07",
    startTime: "20:00",
    duration: 170,
    venueId: "v03",
    organizerId: "p01",
    participantLimit: 6,
    buyIn: 200,
    currency: "₽",
    status: "completed",
    notes: "Короткий вечер перед отпусками.",
    allowLateJoin: true,
    notifyParticipants: true,
  }),
  game({
    id: "g07",
    title: "Возвращение из отпусков",
    date: "2026-08-21",
    startTime: "19:00",
    duration: 220,
    venueId: "v01",
    organizerId: "p10",
    participantLimit: 8,
    buyIn: 250,
    currency: "₽",
    status: "completed",
    notes: "Снова полный стол в переговорке.",
    allowLateJoin: false,
    notifyParticipants: true,
  }),
  game({
    id: "g08",
    title: "Сентябрьский разгон",
    date: "2026-09-04",
    startTime: "19:00",
    duration: 190,
    venueId: "v02",
    organizerId: "p12",
    participantLimit: 8,
    buyIn: 250,
    currency: "₽",
    status: "completed",
    notes: "Юлия забрала первый кубок сезона.",
    allowLateJoin: false,
    notifyParticipants: true,
  }),
  game({
    id: "g09",
    title: "Четверг в «Фолде»",
    date: "2026-09-11",
    startTime: "19:30",
    duration: 205,
    venueId: "v03",
    organizerId: "p09",
    participantLimit: 8,
    buyIn: 250,
    currency: "₽",
    status: "completed",
    notes: "Вторая победа Юлии подряд.",
    allowLateJoin: true,
    notifyParticipants: true,
  }),
  game({
    id: "g10",
    title: "Пятница в «Бай-ине»",
    date: "2026-09-18",
    startTime: "19:00",
    duration: 180,
    venueId: "v01",
    organizerId: "p10",
    participantLimit: 8,
    buyIn: 250,
    currency: "₽",
    status: "open",
    notes: "Ближайшая игра клуба. Берём снеки из кухни 4 этажа.",
    allowLateJoin: true,
    notifyParticipants: true,
  }),
  game({
    id: "g11",
    title: "Кухня, поздний стол",
    date: "2026-09-25",
    startTime: "19:30",
    duration: 180,
    venueId: "v02",
    organizerId: "p01",
    participantLimit: 8,
    buyIn: 200,
    currency: "₽",
    status: "open",
    notes: "Если успеем закончить стендап — начнём раньше.",
    allowLateJoin: false,
    notifyParticipants: true,
  }),
  game({
    id: "g12",
    title: "Октябрьский барный",
    date: "2026-10-02",
    startTime: "20:00",
    duration: 200,
    venueId: "v03",
    organizerId: "p02",
    participantLimit: 10,
    buyIn: 300,
    currency: "₽",
    status: "open",
    notes: "Повышенный бай-ин, стол уже забронирован.",
    allowLateJoin: true,
    notifyParticipants: true,
  }),
  game({
    id: "g13",
    title: "Коворкинг на Тверской",
    date: "2026-10-09",
    startTime: "18:30",
    duration: 210,
    venueId: "v04",
    organizerId: "p09",
    participantLimit: 8,
    buyIn: 250,
    currency: "₽",
    status: "open",
    notes: "Можно приходить сразу после работы.",
    allowLateJoin: false,
    notifyParticipants: true,
  }),
  game({
    id: "g14",
    title: "Экстренный четверг",
    date: "2026-09-05",
    startTime: "19:00",
    duration: 150,
    venueId: "v01",
    organizerId: "p05",
    participantLimit: 6,
    buyIn: 200,
    currency: "₽",
    status: "cancelled",
    notes: "Отменили: половина команды уехала на выездной.",
    allowLateJoin: false,
    notifyParticipants: true,
  }),
];

const lineup: Record<string, string[]> = {
  g01: ["p01", "p03", "p10", "p05", "p02", "p07", "p06", "p13"],
  g02: ["p02", "p01", "p09", "p04", "p10", "p08"],
  g03: ["p09", "p01", "p03", "p12", "p05", "p07", "p11"],
  g04: ["p01", "p09", "p02", "p10", "p03", "p04", "p08", "p06", "p14"],
  g05: ["p03", "p01", "p09", "p12", "p05", "p10", "p07", "p13"],
  g06: ["p01", "p02", "p10", "p04", "p08", "p11"],
  g07: ["p09", "p01", "p12", "p03", "p02", "p05", "p07", "p06"],
  g08: ["p12", "p09", "p01", "p10", "p03", "p04", "p08"],
  g09: ["p12", "p01", "p09", "p02", "p10", "p05", "p03", "p07"],
  g10: ["p10", "p01", "p02", "p03", "p09", "p12"],
  g11: ["p01", "p05", "p07", "p13"],
  g12: ["p02", "p04", "p08"],
  g13: ["p09", "p03"],
  g14: ["p05", "p07", "p13"],
};

const payoutShare = [0.5, 0.25, 0.15, 0.1];

function potFor(gameItem: Game, count: number): number {
  return gameItem.buyIn * count;
}

function payoutsFor(pot: number, field: number): number[] {
  return Array.from({ length: field }, (_, index) => {
    const share = payoutShare[index] ?? 0;
    return Math.round(pot * share);
  });
}

function buildParticipants(): GameParticipant[] {
  return Object.entries(lineup).flatMap(([gameId, playerIds]) =>
    playerIds.map((playerId, index) => ({
      id: `gp-${gameId}-${playerId}`,
      gameId,
      playerId,
      joinedAt: `2026-05-01T12:0${index}:00.000Z`,
    }))
  );
}

function emptyPlayer(seed: PlayerSeed): Player {
  return {
    ...seed,
    rating: STARTING_RATING,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    averagePosition: 0,
    averageResult: 0,
    bestPosition: 0,
    bestResult: 0,
    currentStreak: 0,
    bestStreak: 0,
    badges: [],
  };
}

export function recomputeClubState(state: ClubState): ClubState {
  const players = state.players.map((player) => emptyPlayer(player));
  const byId = new Map(players.map((player) => [player.id, player]));
  const completed = [...state.games]
    .filter((item) => item.status === "completed")
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));

  const results: GameResult[] = [];
  const ratingHistory: RatingHistory[] = players.map((player) => ({
    id: `rh-start-${player.id}`,
    playerId: player.id,
    rating: STARTING_RATING,
    delta: 0,
    recordedAt: `${player.joinedAt}T09:00:00.000Z`,
  }));

  completed.forEach((gameItem) => {
    const seated = state.participants.filter((item) => item.gameId === gameItem.id);
    const existing = state.results.filter((item) => item.gameId === gameItem.id);
    const ordered =
      existing.length > 0
        ? [...existing].sort((a, b) => a.place - b.place).map((item) => item.playerId)
        : lineup[gameItem.id] ?? seated.map((item) => item.playerId);
    const field = ordered.length;
    const pot =
      existing.length > 0
        ? existing.reduce((sum, item) => sum + item.payout, 0)
        : potFor(gameItem, field);
    const payouts =
      existing.length > 0
        ? ordered.map(
            (playerId) => existing.find((item) => item.playerId === playerId)?.payout ?? 0
          )
        : payoutsFor(pot, field);

    ordered.forEach((playerId, index) => {
      const place = index + 1;
      const isWinner = place === 1;
      const delta = scoreGameResult(place, field, isWinner);
      const payout = payouts[index] ?? 0;
      const player = byId.get(playerId);
      if (!player) return;

      player.rating += delta;
      player.gamesPlayed += 1;
      if (isWinner) {
        player.wins += 1;
        player.currentStreak = player.currentStreak > 0 ? player.currentStreak + 1 : 1;
      } else {
        player.losses += 1;
        player.currentStreak = player.currentStreak < 0 ? player.currentStreak - 1 : -1;
      }
      player.bestStreak = Math.max(player.bestStreak, player.currentStreak);
      const profit = payout - gameItem.buyIn;
      player.bestResult = player.gamesPlayed === 1 ? profit : Math.max(player.bestResult, profit);
      player.bestPosition =
        player.gamesPlayed === 1 ? place : Math.min(player.bestPosition || place, place);

      results.push({
        id: `gr-${gameItem.id}-${playerId}`,
        gameId: gameItem.id,
        playerId,
        place,
        payout,
        ratingDelta: delta,
        isWinner,
      });

      ratingHistory.push({
        id: `rh-${gameItem.id}-${playerId}`,
        playerId,
        gameId: gameItem.id,
        rating: player.rating,
        delta,
        recordedAt: `${gameItem.date}T${gameItem.startTime}:00.000Z`,
      });
    });
  });

  const derivedPlayers = players.map((player) => {
    const playerResults = results.filter((item) => item.playerId === player.id);
    const gamesPlayed = playerResults.length;
    const avgPosition =
      gamesPlayed === 0
        ? 0
        : playerResults.reduce((sum, item) => sum + item.place, 0) / gamesPlayed;
    const avgResult =
      gamesPlayed === 0
        ? 0
        : playerResults.reduce((sum, item) => {
            const gameItem = state.games.find((g) => g.id === item.gameId);
            return sum + (item.payout - (gameItem?.buyIn ?? 0));
          }, 0) / gamesPlayed;
    return {
      ...player,
      winRate: gamesPlayed === 0 ? 0 : player.wins / gamesPlayed,
      averagePosition: Number(avgPosition.toFixed(2)),
      averageResult: Math.round(avgResult),
    };
  });

  const ranked = [...derivedPlayers].sort(
    (a, b) => b.rating - a.rating || b.wins - a.wins || a.name.localeCompare(b.name, "ru")
  );
  const mostActiveId = [...derivedPlayers].sort(
    (a, b) => b.gamesPlayed - a.gamesPlayed || b.rating - a.rating
  )[0]?.id;

  const withBadges = derivedPlayers.map((player) => {
    const badges: BadgeKind[] = [];
    if (ranked[0]?.id === player.id) badges.push("leader");
    if (player.id === mostActiveId) badges.push("most-active");
    if (player.currentStreak >= 2) badges.push("win-streak");
    if (player.gamesPlayed > 0 && player.gamesPlayed <= 3) badges.push("rookie");
    if (player.winRate >= 0.35 && player.gamesPlayed >= 5) badges.push("shark");
    if (player.averagePosition > 0 && player.averagePosition <= 3 && player.gamesPlayed >= 5) {
      badges.push("consistent");
    }
    return { ...player, badges };
  });

  const gamesWithStatus = state.games.map((gameItem) => {
    if (gameItem.status === "completed" || gameItem.status === "cancelled") return gameItem;
    const count = state.participants.filter((item) => item.gameId === gameItem.id).length;
    const status: GameStatus = count >= gameItem.participantLimit ? "full" : "open";
    return {
      ...gameItem,
      status,
    };
  });

  return {
    ...state,
    players: withBadges,
    games: gamesWithStatus,
    results,
    ratingHistory,
  };
}

export function createSeedState(): ClubState {
  const seededPlayers = playerSeeds.map(emptyPlayer);
  return recomputeClubState({
    users,
    currentUserId: "u10",
    players: seededPlayers,
    venues,
    games,
    participants: buildParticipants(),
    results: [],
    ratingHistory: [],
    notifications: [
      {
        id: "n01",
        title: "Открыта запись",
        body: "Пятница в «Бай-ине» — осталось 2 места.",
        createdAt: "2026-09-16T11:20:00.000Z",
        read: false,
        type: "game",
      },
      {
        id: "n02",
        title: "Результаты сохранены",
        body: "Юлия Козлова выиграла четверг в «Фолде».",
        createdAt: "2026-09-11T23:40:00.000Z",
        read: true,
        type: "result",
      },
    ],
    settings: {
      teamName: "Команда «Фолд»",
      defaultCurrency: "₽",
      defaultVenueId: "v01",
      seasonStart: "2026-07-01",
      notifyByDefault: true,
      dataMode: "mock",
    },
  });
}

export { BADGES };
