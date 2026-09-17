import type { Badge, BadgeKind } from "@/types";

export const APP_NAME = "Office Poker Club";
export const STORAGE_KEY = "office-poker-club-state-v5";
export const SEED_REVISION = 2;
export const LEGACY_STORAGE_KEYS = [
  "office-poker-club-state-v1",
  "office-poker-club-state-v2",
  "office-poker-club-state-v3",
  "office-poker-club-state-v4",
];

export const BADGES: Record<BadgeKind, Badge> = {
  leader: {
    id: "leader",
    label: "Лидер",
    description: "Первое место в общем рейтинге",
  },
  "most-active": {
    id: "most-active",
    label: "Самый активный",
    description: "Больше всех сыгранных игр",
  },
  "win-streak": {
    id: "win-streak",
    label: "Серия побед",
    description: "Две и больше побед подряд",
  },
  rookie: {
    id: "rookie",
    label: "Новичок",
    description: "Сыграл не больше трёх игр",
  },
  shark: {
    id: "shark",
    label: "Шарк",
    description: "Win rate от 35% при пяти и более играх",
  },
  consistent: {
    id: "consistent",
    label: "Стабильный",
    description: "Среднее место не хуже третьего",
  },
};

export const DEPARTMENTS = [
  "Product",
  "Engineering",
  "Design",
  "Marketing",
  "HR",
  "Sales",
  "Finance",
  "Legal",
  "Operations",
] as const;

export const CURRENCIES = ["₽", "€", "$"] as const;
