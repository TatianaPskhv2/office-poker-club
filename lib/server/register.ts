import { ADMIN_EMAIL } from "@/lib/constants";
import { nextId, normalizeName, stamp } from "@/lib/server/ids";
import { getPasswordHash, setPasswordHash } from "@/lib/server/passwords";
import { hashPassword, verifyPassword } from "@/lib/server/session";
import { loadClub, updateClub } from "@/lib/server/club-file";
import type { Player, User } from "@/types";

function emptyPlayer(partial: Omit<Player, "rating" | "gamesPlayed" | "wins" | "losses" | "winRate" | "averagePosition" | "averageResult" | "bestPosition" | "bestResult" | "currentStreak" | "bestStreak" | "badges">): Player {
  return {
    ...partial,
    rating: 1000,
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
    badges: ["rookie"],
  };
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
}): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const passwordHash = hashPassword(input.password);
  const holder: { user?: User } = {};
  const existing = await findUserByEmail(email);
  if (existing) {
    const already = await getPasswordHash(existing.id);
    if (already) {
      throw new Error("Эта почта уже занята. Нажмите «Войти» и введите пароль.");
    }
    await updateClub((state) => {
      const user = state.users.find((item) => item.id === existing.id);
      if (!user) return state;
      user.email = email;
      user.name = name || user.name;
      if (email === ADMIN_EMAIL) user.role = "admin";
      holder.user = user;
      return state;
    });
    if (!holder.user) throw new Error("Не удалось создать пользователя");
    await setPasswordHash(holder.user.id, passwordHash);
    return holder.user;
  }

  await updateClub((state) => {
    if (email === ADMIN_EMAIL) {
      let admin = state.users.find((user) => user.id === "u-tanya" || user.role === "admin");
      if (!admin) {
        admin = {
          id: "u-tanya",
          playerId: "p-tanya",
          email,
          name: name || "Татьяна Посохова",
          role: "admin",
        };
        state.users.unshift(admin);
      } else {
        admin.email = email;
        admin.name = name || admin.name;
        admin.role = "admin";
      }
      holder.user = admin;
      return state;
    }

    const claimed = state.players.find(
      (player) =>
        normalizeName(player.name) === normalizeName(name) &&
        (!player.email || player.email.endsWith("@office.poker"))
    );
    if (claimed) {
      let user = state.users.find((item) => item.playerId === claimed.id);
      if (!user) {
        user = {
          id: nextId("u"),
          playerId: claimed.id,
          email,
          name: claimed.name,
          role: "member",
        };
        state.users.push(user);
      }
      user.email = email;
      user.name = name;
      user.role = "member";
      claimed.userId = user.id;
      claimed.email = email;
      claimed.name = name;
      claimed.role = "member";
      holder.user = user;
      return state;
    }

    const playerId = nextId("p");
    const userId = nextId("u");
    const user: User = {
      id: userId,
      playerId,
      email,
      name,
      role: "member",
    };
    state.users.push(user);
    state.players.push(
      emptyPlayer({
        id: playerId,
        userId,
        name,
        department: "",
        jobTitle: "",
        email,
        role: "member",
        joinedAt: stamp().slice(0, 10),
      })
    );
    holder.user = user;
    return state;
  });

  if (!holder.user) throw new Error("Не удалось создать пользователя");
  await setPasswordHash(holder.user.id, passwordHash);
  return holder.user;
}

export async function findUserByEmail(email: string) {
  const state = await loadClub();
  return state.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function loginUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("Неверная почта или пароль");
  const stored = await getPasswordHash(user.id);
  if (!stored) throw new Error("Пароль ещё не задан. Зарегистрируйтесь с этой почтой.");
  if (!verifyPassword(password, stored)) throw new Error("Неверная почта или пароль");
  return user;
}
