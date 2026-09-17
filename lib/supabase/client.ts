import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Клиент Supabase. Если переменные окружения не заданы,
 * приложение работает в mock-режиме с localStorage.
 * Позже достаточно заполнить NEXT_PUBLIC_SUPABASE_URL и
 * NEXT_PUBLIC_SUPABASE_ANON_KEY — слой данных уже отделён.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
