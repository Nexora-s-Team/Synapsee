import { useState } from "react";
import {
  Loader2,
  Pin,
  PinOff,
  Plus,
  ShieldCheck,
  Trash2,
  BookOpen,
  Calendar,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { Avatar } from "../Avatar";
import { TopBar } from "../TopBar";
import { AnnouncementComposer } from "../AnnouncementComposer";
import {
  useAnnouncements,
  categoryLabel,
  type AnnouncementCategory,
} from "@/hooks/useAnnouncements";
import { timeAgo } from "@/lib/timeAgo";
import { isProfessorModuloEmail } from "@/lib/authValidation";
import type { User } from "@supabase/supabase-js";
import type { SinapseRole } from "@/hooks/useAuth";

interface AvisosScreenProps {
  user: User | null;
  role: SinapseRole | null;
}

const filters: { id: "all" | AnnouncementCategory; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "academico", label: "Acadêmico" },
  { id: "eventos", label: "Eventos" },
  { id: "provas", label: "Provas" },
  { id: "aviso_geral", label: "Aviso geral" },
];

const categoryIcons: Record<AnnouncementCategory, typeof BookOpen> = {
  academico: BookOpen,
  eventos: Calendar,
  provas: Pencil,
  aviso_geral: AlertCircle,
};

const categoryColors: Record<
  AnnouncementCategory,
  { bg: string; text: string; badge: string }
> = {
  academico: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    badge: "bg-blue-100 text-blue-800",
  },
  eventos: {
    bg: "bg-purple-500/10",
    text: "text-purple-600",
    badge: "bg-purple-100 text-purple-800",
  },
  provas: {
    bg: "bg-orange-500/10",
    text: "text-orange-600",
    badge: "bg-orange-100 text-orange-800",
  },
  aviso_geral: {
    bg: "bg-red-500/10",
    text: "text-red-600",
    badge: "bg-red-100 text-red-800",
  },
};

export const AvisosScreen = ({ user, role }: AvisosScreenProps) => {
  const { items, loading, create, remove, togglePin } = useAnnouncements(user);
  const [filter, setFilter] = useState<"all" | AnnouncementCategory>("all");
  const [composerOpen, setComposerOpen] = useState(false);

  console.log("AvisosScreen Auth Check:", {
    role,
    email: user?.email,
    isProfEmail: user?.email ? isProfessorModuloEmail(user.email) : false,
  });

  const canPost =
    (role === "professor" &&
      !!user?.email &&
      isProfessorModuloEmail(user.email)) ||
    role === "admin";
  const visible =
    filter === "all" ? items : items.filter((a) => a.category === filter);

  return (
    <div className="flex flex-col">
      <TopBar
        showLogo={false}
        title="Avisos & Notícias"
        rightSlot={
          canPost && (
            <button
              onClick={() => setComposerOpen(true)}
              className="rounded-full p-2 transition-smooth hover:bg-secondary"
              aria-label="Novo aviso"
            >
              <Plus className="h-5 w-5" />
            </button>
          )
        }
      />

      {/* Banner — quem pode postar */}
      <div className="mx-4 mt-4 rounded-xl border border-hairline bg-surface-elevated p-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold">Canal oficial da Faculdade</p>
            <p className="text-[11px] text-text-faint">
              {canPost
                ? "Você pode publicar avisos para todos os alunos."
                : "Apenas professores e direção podem publicar."}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-smooth " +
              (filter === c.id
                ? "bg-foreground text-background"
                : "bg-secondary text-text-subtle hover:bg-accent")
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-text-faint" />
        </div>
      ) : visible.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-display text-base font-semibold">
            Nenhum aviso por aqui
          </p>
          <p className="mt-1 text-sm text-text-faint">
            {canPost
              ? "Publique o primeiro aviso para os alunos."
              : "Quando houver avisos da faculdade, eles aparecerão aqui."}
          </p>
          {canPost && (
            <button
              onClick={() => setComposerOpen(true)}
              className="mt-4 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background"
            >
              Criar aviso
            </button>
          )}
        </div>
      ) : (
        <section className="space-y-3 px-4 pb-2">
          {visible.map((a) => {
            const isMine = user?.id === a.user_id;
            return (
              <article
                key={a.id}
                className="relative overflow-hidden rounded-2xl border border-hairline bg-gradient-card p-4 shadow-soft"
              >
                {a.pinned && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
                    <Pin className="h-3 w-3" /> Fixado
                  </span>
                )}
                <div className="flex items-center gap-2.5">
                  <Avatar
                    name={a.author.display_name}
                    color="from-zinc-200 to-zinc-400"
                    size="sm"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold">
                        {a.author.display_name}
                      </p>
                      <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-foreground text-background">
                        <ShieldCheck className="h-2.5 w-2.5" />
                      </span>
                    </div>
                    <p className="text-[10px] text-text-faint">
                      {a.author.department ?? "Faculdade Módulo"} ·{" "}
                      {timeAgo(a.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-subtle">
                    {categoryLabel[a.category]}
                  </span>
                  <h3 className="mt-2 font-display text-base font-semibold leading-snug">
                    {a.title}
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text-subtle">
                    {a.body}
                  </p>
                </div>

                {isMine && canPost && (
                  <div className="mt-3 flex items-center gap-2 border-t border-hairline pt-3">
                    <button
                      onClick={() => togglePin(a)}
                      className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-medium text-text-subtle hover:bg-accent"
                    >
                      {a.pinned ? (
                        <PinOff className="h-3 w-3" />
                      ) : (
                        <Pin className="h-3 w-3" />
                      )}
                      {a.pinned ? "Desafixar" : "Fixar"}
                    </button>
                    <button
                      onClick={() => remove(a.id)}
                      className="flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1.5 text-[11px] font-medium text-destructive hover:bg-destructive/25"
                    >
                      <Trash2 className="h-3 w-3" /> Apagar
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {composerOpen && canPost && (
        <AnnouncementComposer
          onSubmit={create}
          onClose={() => setComposerOpen(false)}
        />
      )}
    </div>
  );
};
