import {
  BookOpen,
  GraduationCap,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Avatar } from "../Avatar";
import { TopBar } from "../TopBar";
import { currentUser } from "@/lib/mockData";

export const PerfilScreenDemo = () => {
  const handle = currentUser.handle;

  return (
    <div className="flex flex-col">
      <TopBar
        showLogo={false}
        title={`@${handle}`}
        rightSlot={
          <>
            <Settings className="mx-1 h-5 w-5 text-text-subtle" />
            <LogOut className="mx-1 h-5 w-5 text-text-subtle" />
          </>
        }
      />

      <section className="px-4 pt-5">
        <div className="flex items-center gap-4">
          <Avatar
            name={currentUser.name}
            size="sm"
            color={currentUser.avatarColor}
          />
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            {[
              { n: "47", l: "posts" },
              { n: "312", l: "conexões" },
              { n: "184", l: "seguindo" },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-display text-lg font-semibold">{s.n}</p>
                <p className="text-[11px] text-text-faint">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-semibold">
              {currentUser.name}
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-text-faint">
            Aluno(a)
          </p>
          <p className="mt-0.5 text-xs text-text-subtle">
            {currentUser.course} · {currentUser.semester}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            {currentUser.bio}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-hairline bg-surface-elevated p-3.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground text-background">
            <Mail className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-text-faint">
              E-mail institucional
            </p>
            <p className="truncate text-sm font-semibold">
              {currentUser.email}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-online/20 px-2 py-0.5 text-[10px] font-semibold text-online">
            verificado
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-foreground py-2.5 text-center text-sm font-semibold text-background">
            Editar perfil
          </div>
          <div className="rounded-xl bg-secondary py-2.5 text-center text-sm font-semibold text-foreground">
            Compartilhar
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-hairline bg-gradient-card p-3.5">
            <GraduationCap className="h-5 w-5 text-text-subtle" />
            <p className="mt-2 text-[11px] text-text-faint">Curso</p>
            <p className="text-sm font-semibold">{currentUser.course}</p>
          </div>
          <div className="rounded-2xl border border-hairline bg-gradient-card p-3.5">
            <BookOpen className="h-5 w-5 text-text-subtle" />
            <p className="mt-2 text-[11px] text-text-faint">Período</p>
            <p className="text-sm font-semibold">{currentUser.semester}</p>
          </div>
        </div>
      </section>

      <div className="mt-6 flex border-y border-hairline">
        {["Publicações", "Salvos", "Vagas"].map((t, i) => (
          <div
            key={t}
            className={
              "flex-1 py-3 text-center text-xs font-semibold " +
              (i === 0
                ? "border-t-2 border-foreground -mt-px text-foreground"
                : "text-text-faint")
            }
          >
            {t}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gradient-accent ring-1 ring-hairline"
          />
        ))}
      </div>
    </div>
  );
};
