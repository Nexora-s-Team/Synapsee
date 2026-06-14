import { useEffect, useRef } from "react";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  CheckCheck,
  X,
  Loader2,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/hooks/useNotifications";

interface NotificationsSheetProps {
  notifications: AppNotification[];
  loading: boolean;
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onClose: () => void;
  onViewProfile?: (userId: string) => void;
}

const typeIcon = (type: AppNotification["type"]) => {
  if (type === "follow")
    return <UserPlus className="h-3.5 w-3.5 text-sky-400" />;
  if (type === "like")
    return <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />;
  return <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />;
};

const typeLabel = (
  type: AppNotification["type"],
  name: string,
): string => {
  if (type === "follow") return `${name} começou a te seguir`;
  if (type === "like") return `${name} curtiu seu post`;
  return `${name} comentou no seu post`;
};

export const NotificationsSheet = ({
  notifications,
  loading,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  onClose,
  onViewProfile,
}: NotificationsSheetProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Travar scroll do body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      aria-label="Fechar notificações"
    >
      {/* Sheet deslizando de cima */}
      <div
        className="absolute left-0 right-0 top-0 flex max-h-[85vh] flex-col overflow-hidden rounded-b-3xl bg-background shadow-2xl"
        style={{ animation: "slideDown 0.22s cubic-bezier(0.4,0,0.2,1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-4 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="font-display text-base font-semibold">
              Notificações
            </h2>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-bold text-background">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-text-faint transition-smooth hover:bg-secondary hover:text-foreground"
                aria-label="Marcar todas como lidas"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar lidas
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-1.5 transition-smooth hover:bg-secondary"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-text-faint" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <Bell className="h-6 w-6 text-text-faint" />
              </div>
              <p className="text-sm font-semibold">Tudo tranquilo por aqui</p>
              <p className="text-xs text-text-faint">
                Você verá aqui quando alguém te seguir, curtir ou comentar.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3.5 transition-smooth",
                    !n.read && "bg-foreground/[0.04]",
                  )}
                >
                  {/* Avatar do ator */}
                  <button
                    className="shrink-0 hover:opacity-80 transition-opacity"
                    onClick={() => {
                      onMarkRead(n.id);
                      onViewProfile?.(n.actor_id);
                      onClose();
                    }}
                  >
                    <Avatar
                      name={n.actor.display_name}
                      url={n.actor.avatar_url}
                      size="sm"
                    />
                  </button>

                  {/* Texto */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <span className="font-semibold">
                        {n.actor.display_name}
                      </span>{" "}
                      <span className="text-text-subtle">
                        {n.type === "follow"
                          ? "começou a te seguir"
                          : n.type === "like"
                          ? "curtiu seu post"
                          : "comentou no seu post"}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-faint">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>

                  {/* Ícone do tipo + ponto de não lida */}
                  <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary">
                      {typeIcon(n.type)}
                    </div>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};
