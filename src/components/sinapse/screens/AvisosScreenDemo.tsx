import { Pin, ShieldCheck } from "lucide-react";
import { Avatar } from "../Avatar";
import { TopBar } from "../TopBar";
import { announcements } from "@/lib/mockData";

const filters = ["Tudo", "Academico", "Eventos", "Provas", "Aviso geral"];

export const AvisosScreenDemo = () => {
  return (
    <div className="flex flex-col">
      <TopBar showLogo={false} title="Avisos & Noticias" />

      <div className="mx-4 mt-4 rounded-xl border border-hairline bg-surface-elevated p-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold">Canal oficial da Faculdade</p>
            <p className="text-[11px] text-text-faint">
              Somente professores com e-mail @prof.modulo.edu.br podem
              publicar.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((c, i) => (
          <span
            key={c}
            className={
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium " +
              (i === 0
                ? "bg-foreground text-background"
                : "bg-secondary text-text-subtle")
            }
          >
            {c}
          </span>
        ))}
      </div>

      <section className="space-y-3 px-4 pb-2">
        {announcements.map((a) => (
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
                name={a.author}
                color="from-zinc-200 to-zinc-400"
                size="sm"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold">{a.author}</p>
                  <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-foreground text-background">
                    <ShieldCheck className="h-2.5 w-2.5" />
                  </span>
                </div>
                <p className="text-[10px] text-text-faint">
                  {a.department} · {a.timeAgo}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-subtle">
                {a.tag}
              </span>
              <h3 className="mt-2 font-display text-base font-semibold leading-snug">
                {a.title}
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text-subtle">
                {a.body}
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};
