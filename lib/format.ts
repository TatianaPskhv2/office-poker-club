import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  parseISO,
} from "date-fns";
import { ru } from "date-fns/locale";

export function parseGameDate(date: string, time = "00:00"): Date {
  return parseISO(`${date}T${time}:00`);
}

export function formatDate(date: string, pattern = "d MMMM yyyy"): string {
  return format(parseISO(date), pattern, { locale: ru });
}

export function formatDateTime(date: string, time: string): string {
  return format(parseGameDate(date, time), "d MMMM yyyy, HH:mm", { locale: ru });
}

export function formatWeekday(date: string): string {
  return format(parseISO(date), "EEEE", { locale: ru });
}

export function formatShortDate(date: string): string {
  return format(parseISO(date), "d MMM", { locale: ru });
}

export function formatMonthTitle(date: Date): string {
  return format(date, "LLLL yyyy", { locale: ru });
}

export function formatRelativeDate(date: string, time = "19:00"): string {
  const target = parseGameDate(date, time);
  const days = differenceInCalendarDays(target, new Date());
  if (days === 0) return "сегодня";
  if (days === 1) return "завтра";
  if (days === -1) return "вчера";
  return formatDistanceToNow(target, { addSuffix: true, locale: ru });
}

export function formatCompactRelative(date: string, time = "19:00"): string {
  const days = differenceInCalendarDays(parseGameDate(date, time), new Date());
  if (days === 0) return "сегодня";
  if (days === 1) return "завтра";
  if (days === -1) return "вчера";
  if (days > 1) return `через ${days} дн.`;
  return `${Math.abs(days)} дн. назад`;
}

export function formatMonthShort(yearMonth: string): string {
  return format(parseISO(`${yearMonth}-01`), "LLL", { locale: ru });
}

export function durationInHours(duration: number): number {
  if (duration >= 24) return Math.max(1, Math.round(duration / 60));
  return duration;
}

export function formatDuration(duration: number): string {
  const hours = durationInHours(duration);
  const mod10 = hours % 10;
  const mod100 = hours % 100;
  if (mod10 === 1 && mod100 !== 11) return `${hours} час`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${hours} часа`;
  }
  return `${hours} часов`;
}

export function playerSubtitle(player: { jobTitle?: string; department?: string }): string {
  return [player.jobTitle, player.department].filter(Boolean).join(" · ");
}

export function formatMoney(amount: number, currency = "₽"): string {
  const formatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function formatSigned(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatStreak(streak: number): string {
  if (streak > 1) return `${streak} победы подряд`;
  if (streak === 1) return "последняя игра — победа";
  if (streak < -1) return `${Math.abs(streak)} поражения подряд`;
  if (streak === -1) return "последняя игра — не в призах";
  return "без серии";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function pluralGames(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} игра`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} игры`;
  }
  return `${count} игр`;
}

export function pluralPlayers(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} участник`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} участника`;
  }
  return `${count} участников`;
}
