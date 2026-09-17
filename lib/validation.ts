import { z } from "zod";

export const createGameSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Название должно содержать минимум 3 символа")
    .max(80, "Слишком длинное название"),
  date: z.string().min(1, "Укажите дату"),
  startTime: z.string().min(1, "Укажите время начала"),
  duration: z.coerce
    .number()
    .min(1, "Минимум 1 час")
    .max(12, "Максимум 12 часов"),
  venueName: z.string().trim().min(2, "Укажите место проведения").max(80),
  address: z.string().trim().max(160).optional().or(z.literal("")),
  participantLimit: z.coerce
    .number()
    .int("Лимит должен быть целым числом")
    .min(2, "Нужно хотя бы 2 игрока")
    .max(12, "Не больше 12 мест за столом"),
  buyIn: z.coerce.number().min(0, "Бай-ин не может быть отрицательным").max(100000),
  currency: z.string().min(1, "Выберите валюту"),
  notes: z.string().max(500, "Заметка слишком длинная").optional().or(z.literal("")),
  allowLateJoin: z.boolean(),
  notifyParticipants: z.boolean(),
});

export const playerProfileSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(60),
  department: z.string().trim().max(60).optional().or(z.literal("")),
  jobTitle: z.string().trim().max(60).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Некорректный email")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(400).optional().or(z.literal("")),
  role: z.enum(["admin", "member", "viewer"]),
});

export const invitePlayerSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(60),
  department: z.string().trim().max(60).optional().or(z.literal("")),
  jobTitle: z.string().trim().max(60).optional().or(z.literal("")),
});

export const resultsSchema = z.object({
  pot: z.coerce.number().min(0, "Банк не может быть отрицательным"),
  notes: z.string().max(400).optional().or(z.literal("")),
  entries: z
    .array(
      z.object({
        playerId: z.string(),
        place: z.coerce.number().int().min(1),
        payout: z.coerce.number().min(0),
      })
    )
    .min(2, "Нужно минимум двое участников"),
});

export type CreateGameValues = z.infer<typeof createGameSchema>;
export type InvitePlayerValues = z.infer<typeof invitePlayerSchema>;
export type PlayerProfileValues = z.infer<typeof playerProfileSchema>;
export type ResultsValues = z.infer<typeof resultsSchema>;
