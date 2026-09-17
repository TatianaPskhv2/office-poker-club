"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { liveShareUrl } from "@/lib/share-url";

export function ShareLiveLink({ id }: { id: string }) {
  const [url, setUrl] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void liveShareUrl(id).then((share) => {
      if (cancelled) return;
      setUrl(share.url);
      setIsPublic(share.public);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function copy() {
    if (!url) return;
    if (!isPublic) {
      toast.error("Это адрес только вашего компьютера", {
        description: "Коллеги его не откроют. Нужна публичная ссылка, не 127.0.0.1.",
      });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Ссылка для коллег скопирована", { description: url });
  }

  if (!url) return null;

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
      <p className="text-sm font-medium">Ссылка для коллег</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {isPublic
          ? "Эту ссылку можно кинуть в чат — откроется на любом ПК."
          : "127.0.0.1 открывается только на этом компьютере. Коллегам нужна публичная ссылка."}
      </p>
      <p className="mt-2 break-all font-mono text-[12px] leading-5">{url}</p>
      <Button className="mt-3" size="sm" variant="outline" onClick={() => void copy()}>
        <Copy className="size-3.5" />
        Скопировать
      </Button>
    </div>
  );
}
