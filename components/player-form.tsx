"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { useClub } from "@/hooks/use-club";
import { playerProfileSchema } from "@/lib/validation";
import type { Player, UserRole } from "@/types";

type Draft = {
  name: string;
  department: string;
  jobTitle: string;
  email: string;
  phone: string;
  notes: string;
  role: UserRole;
};

const EMPTY: Draft = {
  name: "",
  department: "",
  jobTitle: "",
  email: "",
  phone: "",
  notes: "",
  role: "member",
};

function fromPlayer(player: Player): Draft {
  return {
    name: player.name,
    department: player.department ?? "",
    jobTitle: player.jobTitle ?? "",
    email: player.email ?? "",
    phone: player.phone ?? "",
    notes: player.notes ?? "",
    role: player.role,
  };
}

export function PlayerFormDialog({
  open,
  onOpenChange,
  player,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: Player | null;
  onCreated?: (playerId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {open ? (
          <PlayerFormFields
            player={player}
            onClose={() => onOpenChange(false)}
            onCreated={onCreated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PlayerFormFields({
  player,
  onClose,
  onCreated,
}: {
  player?: Player | null;
  onClose: () => void;
  onCreated?: (playerId: string) => void;
}) {
  const { actions } = useClub();
  const [values, setValues] = useState<Draft>(player ? fromPlayer(player) : EMPTY);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const parsed = playerProfileSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Проверьте поля");
      return;
    }
    const payload = {
      ...parsed.data,
      department: parsed.data.department ?? "",
      jobTitle: parsed.data.jobTitle ?? "",
      email: parsed.data.email ?? "",
      phone: parsed.data.phone ?? "",
      notes: parsed.data.notes ?? "",
    };
    if (player) {
      actions.updatePlayer(player.id, payload);
      toast.success("Данные сохранены", {
        description: payload.name,
      });
      onClose();
      return;
    }
    const id = actions.addPlayer(payload);
    toast.success("Участник добавлен", {
      description: `${payload.name} появился в списке клуба.`,
    });
    onCreated?.(id);
    onClose();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{player ? "Редактировать участника" : "Новый участник"}</DialogTitle>
        <DialogDescription>
          {player
            ? "Обновите имя, контакты и роль."
            : "Заполните данные сами — участник сразу появится в клубе."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <Field label="Имя и фамилия">
          <Input
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="Иван Петров"
            autoFocus
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Должность">
            <Input
              value={values.jobTitle}
              onChange={(event) => set("jobTitle", event.target.value)}
              placeholder="Администратор"
            />
          </Field>
          <Field label="Отдел">
            <Input
              value={values.department}
              onChange={(event) => set("department", event.target.value)}
              placeholder="Можно оставить пустым"
            />
          </Field>
        </div>
        <Field label="Email">
          <Input
            type="email"
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
            placeholder="name@company.com"
          />
        </Field>
        <Field label="Телефон">
          <Input
            value={values.phone}
            onChange={(event) => set("phone", event.target.value)}
            placeholder="+7 999 000-00-00"
          />
        </Field>
        <Field label="Роль в клубе">
          <Select
            value={values.role}
            onValueChange={(value) => value && set("role", value as UserRole)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Заметки">
          <Textarea
            value={values.notes}
            onChange={(event) => set("notes", event.target.value)}
            placeholder="Ник в покере, предпочтения по времени, кто кого пригласил"
          />
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button onClick={handleSave} disabled={!values.name.trim()}>
          {player ? "Сохранить" : "Добавить"}
        </Button>
      </DialogFooter>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
