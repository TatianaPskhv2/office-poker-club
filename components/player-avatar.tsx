import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const PALETTE = [
  "bg-rose-700 text-rose-50",
  "bg-amber-600 text-amber-50",
  "bg-emerald-700 text-emerald-50",
  "bg-violet-700 text-violet-50",
  "bg-sky-800 text-sky-50",
  "bg-orange-800 text-orange-50",
  "bg-teal-700 text-teal-50",
  "bg-fuchsia-800 text-fuchsia-50",
];

function colorFromName(name: string) {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length];
}

type Size = "sm" | "default" | "lg" | "xl";

const sizeClass: Record<Size, string> = {
  sm: "size-6 text-[10px]",
  default: "size-8 text-xs",
  lg: "size-11 text-sm",
  xl: "size-24 text-2xl",
};

export function PlayerAvatar({
  name,
  className,
  size = "default",
}: {
  name: string;
  className?: string;
  size?: Size;
}) {
  return (
    <Avatar
      size={size === "sm" ? "sm" : size === "lg" || size === "xl" ? "lg" : "default"}
      className={cn(sizeClass[size], className)}
    >
      <AvatarFallback className={cn("font-medium", colorFromName(name))}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
