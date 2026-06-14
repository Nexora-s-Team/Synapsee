import { Bell, Heart, MessageCircle, Search, ChevronLeft } from "lucide-react";
import { SinapseLogo } from "./SinapseLogo";

interface TopBarProps {
  title?: string;
  showLogo?: boolean;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  rightSlot?: React.ReactNode;
  onBack?: () => void;
}

export const TopBar = ({
  title,
  showLogo = true,
  showSearch = false,
  searchQuery = "",
  onSearchChange,
  rightSlot,
  onBack,
}: TopBarProps) => {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-background/85 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-1 rounded-full p-1.5 transition-smooth hover:bg-secondary"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {showLogo ? <SinapseLogo /> : <h1 className="font-display text-lg font-semibold">{title}</h1>}
        </div>
        <div className="flex items-center gap-1">
          {rightSlot ?? (
            <>
              <button className="rounded-full p-2 transition-smooth hover:bg-secondary" aria-label="Notificações">
                <Heart className="h-5 w-5" />
              </button>
              <button className="rounded-full p-2 transition-smooth hover:bg-secondary" aria-label="Mensagens">
                <MessageCircle className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
      {showSearch && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <Search className="h-4 w-4 text-text-faint" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Buscar pessoas..."
              className="w-full bg-transparent text-sm placeholder:text-text-faint focus:outline-none"
            />
          </div>
        </div>
      )}
    </header>
  );
};
