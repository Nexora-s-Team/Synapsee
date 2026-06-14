import { useState } from "react";
import {
  Bell,
  Bookmark,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Avatar } from "../Avatar";
import { TopBar } from "../TopBar";
import { CommentsSheet } from "../CommentsSheet";
import { PostComposer } from "../PostComposer";
import { NotificationsSheet } from "../NotificationsSheet";
import { stories } from "@/lib/mockData";
import { usePosts } from "@/hooks/usePosts";
import { useNotifications } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import type { SinapseProfile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface FeedScreenProps {
  user: User | null;
  profile: SinapseProfile | null;
  onViewProfile?: (userId: string) => void;
}

interface SearchResultProfile {
  user_id: string;
  display_name: string;
  handle: string | null;
  course: string | null;
  semester: string | null;
}

export const FeedScreen = ({ user, profile, onViewProfile }: FeedScreenProps) => {
  const { posts, loading, create, toggleLike, toggleSave, remove } = usePosts(user);
  const { notifications, loading: notifLoading, unreadCount, markAllRead, markRead } =
    useNotifications(user);
  const [composerOpen, setComposerOpen] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, handle, course, semester")
      .or(`display_name.ilike.%${query}%,handle.ilike.%${query}%`)
      .limit(10);
    setSearchLoading(false);
    if (!error && data) {
      setSearchResults(data);
    }
  };

  return (
    <div className="flex flex-col">
      <TopBar
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        rightSlot={
          <>
            <button
              onClick={() => setComposerOpen(true)}
              className="rounded-full p-2 transition-smooth hover:bg-secondary"
              aria-label="Novo post"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative rounded-full p-2 transition-smooth hover:bg-secondary"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </>
        }
      />

      {searchQuery.trim() ? (
        <div className="flex flex-col bg-background">
          {searchLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-text-faint">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Buscando usuários…
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-faint">
              Nenhum usuário encontrado para "{searchQuery}"
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {searchResults.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => onViewProfile?.(u.user_id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-smooth hover:bg-secondary/40"
                >
                  <Avatar name={u.display_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight text-foreground">
                      {u.display_name}
                    </p>
                    <p className="truncate text-xs text-text-faint">
                      @{u.handle ?? "user"} {u.course ? `· ${u.course}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-text-subtle">
                    Ver Perfil
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
        
          {/*
          Stories (mock)
          <section className="border-b border-hairline">
            <div className="flex gap-4 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {stories.map((s) => (
                <button key={s.id} className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <div
                      className={`rounded-full p-[2px] ${s.isOwn ? "bg-hairline" : "bg-gradient-to-br from-foreground to-zinc-500"}`}
                    >
                      <div className="rounded-full bg-background p-[2px]">
                        <Avatar
                          name={s.isOwn ? (profile?.display_name ?? "Eu") : s.name}
                          color={s.color}
                          size="md"
                        />
                      </div>
                    </div>
                    {s.isOwn && (
                      <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-background bg-foreground text-background">
                        <Plus className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <span className="max-w-[60px] truncate text-[11px] text-text-subtle">
                    {s.isOwn ? "Você" : s.name}
                  </span>
                </button>
              ))}
            </div>
          </section>
          */}

          {/* Composer inline */}
          <button
            onClick={() => setComposerOpen(true)}
            className="flex items-center gap-3 border-b border-hairline px-4 py-3 text-left transition-smooth hover:bg-secondary/40"
          >
            <Avatar name={profile?.display_name ?? "?"} size="sm" />
            <span className="flex-1 text-sm text-text-faint">
              O que está acontecendo na Módulo?
            </span>
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
              Postar
            </span>
          </button>

          {/* Lista de posts */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-text-faint" />
            </div>
          ) : posts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-display text-base font-semibold">
                Sem posts ainda
              </p>
              <p className="mt-1 text-sm text-text-faint">
                Seja o primeiro a compartilhar algo ou siga perfis para ver publicações.
              </p>
              <button
                onClick={() => setComposerOpen(true)}
                className="mt-4 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background"
              >
                Criar primeiro post
              </button>
            </div>
          ) : (
            <section className="divide-y divide-hairline">
              {posts.map((p) => {
                const isMine = user?.id === p.user_id;
                const isTeacher =
                  p.author.role === "professor" || p.author.role === "admin";
                return (
                  <article key={p.id} className="px-4 py-4">
                    <header className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onViewProfile?.(p.user_id)}
                      >
                        <Avatar
                          name={p.author.display_name}
                          url={p.author.avatar_url}
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold leading-tight">
                              {p.author.display_name}
                            </p>
                            {isTeacher && (
                              <span
                                className="grid h-3.5 w-3.5 place-items-center rounded-full bg-foreground text-background"
                                title="Professor verificado"
                              >
                                <ShieldCheck className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-text-faint">
                            @{p.author.handle ?? "user"}
                            {p.author.course && ` · ${p.author.course}`}
                            {" · "}
                            {timeAgo(p.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          className="text-text-faint hover:text-foreground"
                          onClick={() =>
                            setOpenMenu(openMenu === p.id ? null : p.id)
                          }
                          aria-label="Mais opções"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        {openMenu === p.id && isMine && (
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              remove(p.id);
                            }}
                            className="absolute right-0 top-7 z-10 flex items-center gap-2 rounded-xl border border-hairline bg-surface-overlay px-3 py-2 text-xs font-medium text-destructive shadow-glow"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Apagar
                          </button>
                        )}
                      </div>
                    </header>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {p.content}
                    </p>

                    {p.media_url && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-hairline bg-secondary">
                        {p.media_type?.startsWith("video/") ? (
                          <video
                            src={p.media_url}
                            controls
                            className="max-h-[420px] w-full bg-black object-contain"
                          />
                        ) : (
                          <img
                            src={p.media_url}
                            alt="Mídia do post"
                            className="max-h-[420px] w-full object-cover"
                          />
                        )}
                      </div>
                    )}

                    <footer className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleLike(p)}
                          className="flex items-center gap-1.5 transition-smooth"
                        >
                          <Heart
                            className={cn(
                              "h-5 w-5 transition-smooth",
                              p.liked_by_me
                                ? "fill-destructive text-destructive"
                                : "text-text-subtle hover:text-foreground",
                            )}
                          />
                          <span className="text-xs font-medium text-text-subtle">
                            {p.likes_count}
                          </span>
                        </button>
                        <button
                          onClick={() => setOpenComments(p.id)}
                          className="flex items-center gap-1.5 text-text-subtle transition-smooth hover:text-foreground"
                        >
                          <MessageCircle className="h-5 w-5" />
                          <span className="text-xs font-medium">
                            {p.comments_count}
                          </span>
                        </button>
                        <button
                          className="text-text-subtle hover:text-foreground"
                          aria-label="Compartilhar"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      </div>
                      <button
                        onClick={() => toggleSave(p)}
                        className="text-text-subtle hover:text-foreground transition-smooth"
                        aria-label="Salvar"
                      >
                        <Bookmark
                          className={cn(
                            "h-5 w-5 transition-smooth",
                            p.saved_by_me
                              ? "fill-foreground text-foreground"
                              : "text-text-subtle hover:text-foreground",
                          )}
                        />
                      </button>
                    </footer>
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}

      {composerOpen && (
        <PostComposer
          profile={profile}
          onSubmit={create}
          onClose={() => setComposerOpen(false)}
        />
      )}
      {openComments && (
        <CommentsSheet
          postId={openComments}
          currentUser={user}
          onClose={() => setOpenComments(null)}
          onViewProfile={onViewProfile}
        />
      )}
      {notificationsOpen && (
        <NotificationsSheet
          notifications={notifications}
          loading={notifLoading}
          unreadCount={unreadCount}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
          onClose={() => setNotificationsOpen(false)}
          onViewProfile={onViewProfile}
        />
      )}
    </div>
  );
};
