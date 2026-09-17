import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      title="Страница не найдена"
      description="Такого маршрута в клубе нет. Вернитесь к обзору или списку игр."
      action={
        <div className="flex gap-2">
          <Button render={<Link href="/" />}>На обзор</Button>
          <Button variant="outline" render={<Link href="/games" />}>
            К играм
          </Button>
        </div>
      }
    />
  );
}
