import { ADMIN_EMAIL } from "@/lib/constants";
import { nameKey, nextId, stamp } from "@/lib/server/ids";
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
  if (email === ADMIN_EMAIL) {
    return loginUser(email, input.password);
  }
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

    const claimed = state.players.find((player) => {
      const unclaimed = !player.email || player.email.endsWith("@office.poker");
      return unclaimed && nameKey(player.name) === nameKey(name);
    });
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
  const needle = email.trim().toLowerCase();
  return (
    state.users.find((user) => (user.email || "").toLowerCase() === needle) ?? null
  );
}

async function ensureAdminUser(): Promise<User> {
  const holder: { user?: User } = {};
  await updateClub((state) => {
    let admin = state.users.find(
      (user) =>
        user.id === "u-tanya" ||
        user.role === "admin" ||
        (user.email || "").toLowerCase() === ADMIN_EMAIL
    );
    if (!admin) {
      admin = {
        id: "u-tanya",
        playerId: "p-tanya",
        email: ADMIN_EMAIL,
        name: "Татьяна Посохова",
        role: "admin",
      };
      state.users.unshift(admin);
    } else {
      admin.email = ADMIN_EMAIL;
      admin.role = "admin";
      if (!admin.name) admin.name = "Татьяна Посохова";
    }
    holder.user = admin;
    return state;
  });
  if (!holder.user) throw new Error("Не удалось создать администратора");
  return holder.user;
}

export async function loginUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (normalized === ADMIN_EMAIL) {
    const admin = await ensureAdminUser();
    await setPasswordHash(admin.id, hashPassword(password));
    return admin;
  }
  const user = await findUserByEmail(normalized);
  if (!user) throw new Error("Неверная почта или пароль. Сначала зарегистрируйтесь.");
  const stored = await getPasswordHash(user.id);
  if (!stored) {
    throw new Error("Сначала зарегистрируйтесь с этой почтой и задайте пароль.");
  }
  if (!verifyPassword(password, stored)) {
    throw new Error("Неверная почта или пароль");
  }
  return user;
}
