import type { User, UserRole } from "@/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Администратор",
  member: "Участник",
  viewer: "Наблюдатель",
};

export function canCreateGame(role: UserRole): boolean {
  return role === "admin";
}

export function canEditGame(role: UserRole, organizerId: string, user: User): boolean {
  return role === "admin" || organizerId === user.playerId;
}

export function canCancelGame(role: UserRole): boolean {
  return role === "admin";
}

export function canEnterResults(role: UserRole): boolean {
  return role === "admin";
}

export function canManagePlayers(role: UserRole): boolean {
  return role === "admin";
}

export function canRsvp(role: UserRole): boolean {
  return role === "admin" || role === "member";
}

export function canViewOnly(role: UserRole): boolean {
  return role === "viewer";
}
