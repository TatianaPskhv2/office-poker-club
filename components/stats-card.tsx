import { cn } from "@/lib/utils";

export function StatsCard({
  label,
  value,
  hint,
  tone = "default",
  valueClassName,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "win" | "gold" | "loss";
  valueClassName?: string;
}) {
  return (
    <div className="glass-panel rounded-2xl px-4 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 tabular truncate text-[28px] leading-none font-semibold tracking-tight",
          tone === "win" && "text-win",
          tone === "gold" && "text-gold",
          tone === "loss" && "text-loss",
          valueClassName
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-2 truncate text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
