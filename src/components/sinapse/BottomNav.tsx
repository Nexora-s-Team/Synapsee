import { Briefcase, Home, Megaphone, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "feed" | "avisos" | "vagas" | "mensagens" | "perfil";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const items: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "feed", label: "Feed", icon: Home },
  { id: "avisos", label: "Avisos", icon: Megaphone },
  { id: "vagas", label: "Vagas", icon: Briefcase },
  { id: "mensagens", label: "Chat IA", icon: MessageSquare },
  { id: "perfil", label: "Perfil", icon: User },
];

export const BottomNav = ({ active, onChange }: BottomNavProps) => {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-hairline bg-background/95 backdrop-blur-xl">
      <ul className="flex items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <li key={it.id} className="flex-1">
              <button
                onClick={() => onChange(it.id)}
                className={cn(
                  "flex w-full flex-col items-center gap-1 px-2 py-2.5 transition-smooth",
                  isActive ? "text-foreground" : "text-text-faint hover:text-text-subtle",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span className={cn("text-[10px] font-medium tracking-wide", isActive && "text-foreground")}>
                  {it.label}
                </span>
                {isActive && <span className="h-0.5 w-6 -mt-0.5 rounded-full bg-foreground" />}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
