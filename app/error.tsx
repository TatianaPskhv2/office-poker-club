"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      title="Не удалось загрузить страницу"
      description={error.message || "Попробуйте обновить или вернуться на обзор."}
      action={
        <div className="flex gap-2">
          <Button onClick={reset}>Повторить</Button>
          <Button variant="outline" render={<Link href="/" />}>
            На обзор
          </Button>
        </div>
      }
    />
  );
}
