import { Bookmark, Heart, MessageCircle, MoreHorizontal, Plus, Send, ShieldCheck } from "lucide-react";
import { Avatar } from "../Avatar";
import { TopBar } from "../TopBar";
import { feedPosts, stories, currentUser } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export const FeedScreenDemo = () => {
  return (
    <div className="flex flex-col">
      <TopBar
        rightSlot={
          <>
            <button className="rounded-full p-2 transition-smooth hover:bg-secondary" aria-label="Novo post">
              <Plus className="h-5 w-5" />
            </button>
            <button className="rounded-full p-2 transition-smooth hover:bg-secondary" aria-label="Mensagens">
              <Send className="h-5 w-5" />
            </button>
          </>
        }
      />

      {/* Stories 
      <section className="border-b border-hairline">
        <div className="flex gap-4 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {stories.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <div className={`rounded-full p-[2px] ${s.isOwn ? "bg-hairline" : "bg-gradient-to-br from-foreground to-zinc-500"}`}>
                  <div className="rounded-full bg-background p-[2px]">
                    <Avatar name={s.isOwn ? "Lucas Andrade" : s.name} color={s.color} size="md" />
                  </div>
                </div>
                {s.isOwn && (
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-background bg-foreground text-background">
                    <Plus className="h-3 w-3" />
                  </span>
                )}
              </div>
              <span className="max-w-[60px] truncate text-[11px] text-text-subtle">{s.isOwn ? "Você" : s.name}</span>
            </div>
          ))}
        </div>
      </section>*/}

      {/* Composer inline */}
      <div className="flex items-center gap-3 border-b border-hairline px-4 py-3 text-left">
        <Avatar name={currentUser.name} color={currentUser.avatarColor} size="sm" />
        <span className="flex-1 text-sm text-text-faint">O que está acontecendo na Módulo?</span>
        <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">Postar</span>
      </div>

      {/* Posts */}
      <section className="divide-y divide-hairline">
        {feedPosts.map((p) => (
          <article key={p.id} className="px-4 py-4">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={p.author} color={p.avatarColor} size="md" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold leading-tight">{p.author}</p>
                    {p.isTeacher && (
                      <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-foreground text-background" title="Professor verificado">
                        <ShieldCheck className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-faint">
                    @{p.handle} · {p.course} · {p.timeAgo}
                  </p>
                </div>
              </div>
              <button className="text-text-faint" aria-label="Mais">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </header>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{p.content}</p>

            <footer className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Heart className={cn("h-5 w-5", p.liked ? "fill-destructive text-destructive" : "text-text-subtle")} />
                  <span className="text-xs font-medium text-text-subtle">{p.likes}</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-subtle">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-xs font-medium">{p.comments}</span>
                </div>
                <Send className="h-5 w-5 text-text-subtle" />
              </div>
              <Bookmark className="h-5 w-5 text-text-subtle" />
            </footer>
          </article>
        ))}
      </section>
    </div>
  );
};
