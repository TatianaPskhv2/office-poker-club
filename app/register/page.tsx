"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_EMAIL, APP_NAME } from "@/lib/constants";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Не удалось зарегистрироваться");
      toast.success("Аккаунт создан");
      window.location.href = "/";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось зарегистрироваться");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <section className="glass-panel p-6">
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
          {APP_NAME}
        </p>
        <h1 className="mt-2 font-heading text-2xl">Регистрация</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Имя напишите как в списке участников (можно «Иван Петров» или «Петров Иван»).
          Свою почту и пароль — после входа увидите игры, места и сможете записаться. Менять клуб
          может только администратор.
        </p>
        <form className="mt-5 grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-1.5">
            <Label htmlFor="name">Имя и фамилия</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Почта</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Создаём…" : "Зарегистрироваться"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </p>
      </section>
    </div>
  );
}
