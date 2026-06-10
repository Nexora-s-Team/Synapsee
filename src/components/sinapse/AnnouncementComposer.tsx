import { useState } from "react";
import {
  Loader2,
  Pin,
  X,
  BookOpen,
  Calendar,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  categoryLabel,
  type AnnouncementCategory,
} from "@/hooks/useAnnouncements";

interface AnnouncementComposerProps {
  onSubmit: (input: {
    title: string;
    body: string;
    category: AnnouncementCategory;
    pinned: boolean;
  }) => Promise<{ error?: string }>;
  onClose: () => void;
}

const categories: AnnouncementCategory[] = [
  "academico",
  "eventos",
  "provas",
  "aviso_geral",
];

const categoryIcons: Record<AnnouncementCategory, typeof BookOpen> = {
  academico: BookOpen,
  eventos: Calendar,
  provas: Pencil,
  aviso_geral: AlertCircle,
};

const categoryDescriptions: Record<AnnouncementCategory, string> = {
  academico: "Conteúdo acadêmico, material de aula, recursos de estudo",
  eventos: "Eventos, palestras, encontros, atividades extracurriculares",
  provas: "Provas, avaliações, datas de submissão, critérios de avaliação",
  aviso_geral: "Avisos gerais, comunicados importantes, alterações de horário",
};

export const AnnouncementComposer = ({
  onSubmit,
  onClose,
}: AnnouncementComposerProps) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("aviso_geral");
  const [pinned, setPinned] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const b = body.trim();
    if (t.length < 3) {
      toast.error("Título muito curto");
      return;
    }
    if (b.length < 3) {
      toast.error("Conteúdo muito curto");
      return;
    }
    setSending(true);
    const res = await onSubmit({ title: t, body: b, category, pinned });
    setSending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Aviso publicado!");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="mx-auto mt-12 flex w-full max-w-[440px] flex-col gap-3 rounded-3xl border border-hairline bg-surface-overlay p-4 shadow-glow"
      >
        <header className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">Novo aviso</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-secondary"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do aviso"
          maxLength={140}
          className="w-full rounded-xl border border-hairline bg-surface-elevated px-3.5 py-3 text-sm font-semibold placeholder:text-text-faint focus:border-foreground/60 focus:outline-none"
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Detalhes do aviso para os alunos…"
          rows={5}
          maxLength={4000}
          className="w-full resize-none rounded-xl border border-hairline bg-surface-elevated px-3.5 py-3 text-sm placeholder:text-text-faint focus:border-foreground/60 focus:outline-none"
        />

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-text-faint">
            Selecione a Categoria
          </p>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((c) => {
              const Icon = categoryIcons[c];
              const isSelected = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex flex-col items-start gap-1.5 rounded-xl border transition-smooth p-2.5 ${
                    isSelected
                      ? "border-foreground bg-foreground/10 shadow-md"
                      : "border-hairline bg-surface-elevated hover:border-foreground/50 hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className={`h-4 w-4 ${isSelected ? "text-foreground" : "text-text-subtle"}`}
                    />
                    <span
                      className={`text-xs font-semibold ${isSelected ? "text-foreground" : "text-text-subtle"}`}
                    >
                      {categoryLabel[c]}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-faint leading-tight">
                    {categoryDescriptions[c]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-hairline bg-surface-elevated px-3.5 py-2.5">
          <span className="flex items-center gap-2 text-sm">
            <Pin className="h-4 w-4 text-text-subtle" />
            Fixar no topo
          </span>
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="h-4 w-4 accent-foreground"
          />
        </label>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-faint">
            {body.length}/4000
          </span>
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background disabled:opacity-50"
          >
            {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Publicar aviso
          </button>
        </div>
      </form>
    </div>
  );
};
