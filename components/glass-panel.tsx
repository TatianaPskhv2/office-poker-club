import { cn } from "@/lib/utils";

export function GlassPanel({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("glass-panel rounded-2xl", className)}
      {...props}
    />
  );
}
