"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hash,
  History,
  LayoutGrid,
  Plus,
  Settings,
  Spade,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_NAME } from "@/lib/constants";
import { ROLE_LABELS, canCreateGame } from "@/lib/auth/roles";
import { useClub } from "@/hooks/use-club";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Обзор", icon: LayoutGrid },
  { href: "/games", label: "Игры", icon: Plus },
  { href: "/leaderboard", label: "Рейтинг", icon: Hash },
  { href: "/players", label: "Участники", icon: Users },
  { href: "/history", label: "История", icon: History },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentPlayer, currentUser, role } = useClub();
  const displayName = currentPlayer?.name ?? currentUser.name;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#22c55e] text-[#052e16]">
            <Spade className="size-4 fill-current" />
          </span>
          <span className="text-[15px] leading-5 font-semibold tracking-tight text-foreground">
            Office
            <br />
            Poker Club
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/settings"
          className={cn(
            "mt-auto flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            pathname.startsWith("/settings") &&
              "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          <Settings className="size-4" />
          Настройки
        </Link>
      </aside>

      <div className="flex min-h-screen flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#22c55e] text-[#052e16]">
              <Spade className="size-3.5 fill-current" />
            </span>
            <span className="truncate text-sm font-semibold">{APP_NAME}</span>
          </Link>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-sm text-muted-foreground">Команда</span>
            <span className="rounded-md border border-border bg-card px-2.5 py-1 text-sm">
              {APP_NAME}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {canCreateGame(role) && (
              <Button
                render={<Link href="/games/new" />}
                className="hidden h-9 rounded-full px-3.5 sm:inline-flex"
              >
                <Plus data-icon="inline-start" />
                Создать игру
              </Button>
            )}
            {canCreateGame(role) && (
              <Button
                size="icon"
                className="rounded-full sm:hidden"
                aria-label="Создать игру"
                render={<Link href="/games/new" />}
              >
                <Plus />
              </Button>
            )}
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="h-auto gap-2 rounded-lg px-1.5 py-1"
                    aria-label="Меню профиля"
                  />
                }
              >
                <PlayerAvatar name={displayName} size="sm" />
                <span className="hidden flex-col items-start sm:flex">
                  <span className="text-sm leading-4 font-medium">{displayName}</span>
                  <span className="text-[11px] leading-4 text-muted-foreground">
                    {ROLE_LABELS[role]}
                  </span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{displayName}</span>
                    <span className="font-normal text-muted-foreground">
                      {ROLE_LABELS[role]}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <Link
                      href={currentPlayer ? `/players/${currentPlayer.id}` : "/settings"}
                    />
                  }
                >
                  Мой профиль
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/settings" />}>
                  Настройки
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        <ul className="grid grid-cols-6 gap-1">
          {[...NAV, { href: "/settings", label: "Настройки", icon: Settings }].map(
            (item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg py-1 text-[10px] text-muted-foreground",
                      active && "text-foreground"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                </li>
              );
            }
          )}
        </ul>
      </nav>
    </div>
  );
}
