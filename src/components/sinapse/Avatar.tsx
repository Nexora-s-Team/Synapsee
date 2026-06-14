import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  url?: string | null;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: boolean;
  className?: string;
}

const sizeMap = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

export const Avatar = ({
  name,
  url,
  color = "from-zinc-300 to-zinc-500",
  size = "md",
  ring,
  className,
}: AvatarProps) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-zinc-900 shadow-soft overflow-hidden",
        color,
        sizeMap[size],
        ring && "ring-2 ring-foreground/80 ring-offset-2 ring-offset-background",
        className,
      )}
    >
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
};