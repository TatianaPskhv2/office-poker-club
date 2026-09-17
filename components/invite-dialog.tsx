"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS } from "@/lib/constants";
import { canManagePlayers } from "@/lib/auth/roles";
import { useClub } from "@/hooks/use-club";
import { invitePlayerSchema } from "@/lib/validation";

export function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { role, actions } = useClub();
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [jobTitle, setJobTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  function copyLink() {
    const url = `${window.location.origin}/players`;
    void navigator.clipboard.writeText(
      `Приглашение в Office Poker Club: ${url}`
    );
    toast.success("Ссылка скопирована", {
      description: "Отправьте её коллеге в Slack или почту.",
    });
  }

  function handleAdd() {
    const parsed = invitePlayerSchema.safeParse({ name, department, jobTitle });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Проверьте поля");
      return;
    }
    actions.addPlayer({
      ...parsed.data,
      role: "member",
    });
    toast.success("Участник добавлен", {
      description: `${parsed.data.name} появился в списке клуба.`,
    });
    setName("");
    setJobTitle("");
    setError(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Пригласить участника</DialogTitle>
          <DialogDescription>
            Скопируйте ссылку или сразу добавьте коллегу в клуб.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Button variant="outline" onClick={copyLink}>
            Скопировать приглашение
          </Button>
          {canManagePlayers(role) && (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="invite-name">Имя</Label>
                <Input
                  id="invite-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Имя и фамилия"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Отдел</Label>
                <Select value={department} onValueChange={(value) => value && setDepartment(String(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="invite-title">Должность</Label>
                <Input
                  id="invite-title"
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="Product Manager"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          {canManagePlayers(role) && (
            <Button onClick={handleAdd} disabled={!name.trim() || !jobTitle.trim()}>
              Добавить
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
