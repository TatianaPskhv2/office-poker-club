export type UserRole = "admin" | "member" | "viewer";

export type GameStatus = "open" | "full" | "live" | "completed" | "cancelled";

export type BadgeKind =
  | "leader"
  | "most-active"
  | "win-streak"
  | "rookie"
  | "shark"
  | "consistent";

export type Badge = {
  id: BadgeKind;
  label: string;
  description: string;
};

export type User = {
  id: string;
  playerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
};

export type Player = {
  id: string;
  userId?: string;
  name: string;
  avatarUrl?: string;
  department: string;
  jobTitle: string;
  email?: string;
  phone?: string;
  notes?: string;
  role: UserRole;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  averagePosition: number;
  averageResult: number;
  bestPosition: number;
  bestResult: number;
  currentStreak: number;
  bestStreak: number;
  badges: BadgeKind[];
  joinedAt: string;
};

export type Venue = {
  id: string;
  name: string;
  address: string;
  description: string;
};

export type Game = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  duration: number;
  venueId: string;
  venueName: string;
  address: string;
  organizerId: string;
  participantLimit: number;
  buyIn: number;
  currency: string;
  status: GameStatus;
  notes: string;
  allowLateJoin: boolean;
  notifyParticipants: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GameParticipant = {
  id: string;
  gameId: string;
  playerId: string;
  joinedAt: string;
};

export type GameResult = {
  id: string;
  gameId: string;
  playerId: string;
  place: number;
  payout: number;
  ratingDelta: number;
  isWinner: boolean;
};

export type RatingHistory = {
  id: string;
  playerId: string;
  gameId?: string;
  rating: number;
  delta: number;
  recordedAt: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  type: "game" | "result" | "system";
};

export type AppSettings = {
  teamName: string;
  defaultCurrency: string;
  defaultVenueId: string;
  seasonStart: string;
  notifyByDefault: boolean;
  dataMode: "mock" | "supabase";
  dataRevision?: number;
};

export type ClubState = {
  users: User[];
  currentUserId: string;
  players: Player[];
  venues: Venue[];
  games: Game[];
  participants: GameParticipant[];
  results: GameResult[];
  ratingHistory: RatingHistory[];
  notifications: NotificationItem[];
  settings: AppSettings;
};

export type LeaderboardPeriod = "all" | "season" | "30d";

export type LeaderboardRow = {
  player: Player;
  rank: number;
  previousRank: number;
  rankChange: number;
  rating: number;
  ratingDelta: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  averageResult: number;
  bestStreak: number;
};

export type CreateGameInput = {
  title: string;
  date: string;
  startTime: string;
  duration: number;
  venueId?: string;
  venueName: string;
  address?: string;
  participantLimit: number;
  buyIn: number;
  currency: string;
  notes: string;
  allowLateJoin: boolean;
  notifyParticipants: boolean;
};

export type ResultEntryInput = {
  playerId: string;
  place: number;
  payout: number;
};

export type SaveResultsInput = {
  gameId: string;
  pot: number;
  notes?: string;
  entries: ResultEntryInput[];
};

export type LivePlayerStatus = "active" | "eliminated";

export type LivePlayer = {
  playerId: string;
  name: string;
  stack: number;
  handsWon: number;
  potsWon: number;
  status: LivePlayerStatus;
  place?: number;
  ratingPreview: number;
};

export type LiveHand = {
  id: string;
  winnerId: string;
  winnerName: string;
  pot: number;
  createdAt: string;
};

export type LiveSession = {
  id: string;
  title: string;
  venueName: string;
  date: string;
  buyIn: number;
  currency: string;
  fieldSize: number;
  status: "live" | "closed";
  startedAt: string;
  updatedAt: string;
  closedAt?: string;
  players: LivePlayer[];
  hands: LiveHand[];
};

export type CreateLiveInput = {
  id: string;
  title: string;
  venueName: string;
  date: string;
  buyIn: number;
  currency: string;
  players: { playerId: string; name: string }[];
};
