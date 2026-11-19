"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Не удалось войти");
      toast.success("Вы вошли");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось войти");
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
        <h1 className="mt-2 font-heading text-2xl">Вход</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Коллеги входят по почте, видят игры и рейтинг и сами записываются.
        </p>
        <form className="mt-5 grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
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
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Входим…" : "Войти"}
          </Button>
        </form>
        <Button nativeButton={false} variant="outline" className="mt-3 w-full" render={<Link href="/register" />}>
          Нет аккаунта — регистрация
        </Button>
      </section>
    </div>
  );
}
