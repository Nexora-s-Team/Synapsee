import { useState } from "react";
import {
  Building2,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SinapseLogo } from "../SinapseLogo";
import {
  isCompanyEmail,
  isModuloEmail,
  isProfessorModuloEmail,
  orgSignUpSchema,
  personSignUpSchema,
  signInSchema,
} from "@/lib/authValidation";

type Account = "pessoa" | "instituicao" | "empresa";
type Mode = "signin" | "signup";

const expectedAccountByRole = {
  aluno: "pessoa",
  professor: "instituicao",
  instituicao: "instituicao",
  empresa: "empresa",
  admin: "instituicao",
} as const;

const isRateLimitError = (message: string) => {
  const text = message.toLowerCase();
  return text.includes("rate limit") || text.includes("too many requests");
};

const buildUniqueHandle = (email: string) => {
  const [localPart = "user", domainPart = "modulo"] = email
    .toLowerCase()
    .split("@");
  const base = localPart.replace(/[^a-z0-9._-]/g, "").slice(0, 24) || "user";
  const domain =
    domainPart
      .split(".")[0]
      ?.replace(/[^a-z0-9_-]/g, "")
      .slice(0, 12) || "modulo";
  const token =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${base}_${domain}_${token}`;
};

export const LoginScreen = () => {
  const [account, setAccount] = useState<Account>("pessoa");
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");

  const handleSignIn = async () => {
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    if (account === "empresa" && !isCompanyEmail(parsed.data.email)) {
      toast.error("Para Empresa, use um e-mail corporativo da empresa.");
      return;
    }

    if (
      account === "instituicao" &&
      !isProfessorModuloEmail(parsed.data.email)
    ) {
      toast.error(
        "Para Instituição, use seu e-mail docente (@prof.modulo.edu.br).",
      );
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!error && data.user) {
      const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("account_type")
          .eq("user_id", data.user.id)
          .maybeSingle(),
      ]);

      const role = roleRow?.role as
        | keyof typeof expectedAccountByRole
        | undefined;
      const expectedByRole = role ? expectedAccountByRole[role] : undefined;
      const expectedByProfile =
        profileRow?.account_type === "pessoa" ||
        profileRow?.account_type === "instituicao" ||
        profileRow?.account_type === "empresa"
          ? profileRow.account_type
          : undefined;

      const expectedAccount = expectedByRole ?? expectedByProfile;
      if (expectedAccount && expectedAccount !== account) {
        await supabase.auth.signOut();
        setLoading(false);
        const label =
          expectedAccount === "pessoa"
            ? "Pessoa"
            : expectedAccount === "instituicao"
              ? "Instituição"
              : "Empresa";
        toast.error(`Este usuário deve entrar pela opção ${label}.`);
        return;
      }
    }

    setLoading(false);
    if (error) {
      if (isRateLimitError(error.message)) {
        toast.error(
          "Supabase limitou o envio de e-mails por um tempo. Tente novamente mais tarde ou desative a confirmação por e-mail no Dashboard.",
        );
      } else if (error.message.toLowerCase().includes("invalid")) {
        toast.error("E-mail ou senha incorretos.");
      } else if (error.message.toLowerCase().includes("not confirmed")) {
        toast.error(
          "Sua conta ainda não está liberada no Supabase. Em ambiente de teste, desative a confirmação de e-mail no Dashboard.",
        );
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Bem-vindo de volta!");
    }
  };

  const handleSignUp = async () => {
    const isOrg = account !== "pessoa";
    const schema = isOrg ? orgSignUpSchema : personSignUpSchema;
    const parsed = schema.safeParse({
      display_name: displayName,
      email,
      password,
      ...(isOrg ? {} : { course, semester }),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    if (account === "empresa" && !isCompanyEmail(parsed.data.email)) {
      toast.error("Cadastro de Empresa exige e-mail corporativo da empresa.");
      return;
    }

    if (
      account === "instituicao" &&
      !isProfessorModuloEmail(parsed.data.email)
    ) {
      toast.error(
        "Cadastro de Instituição exige e-mail docente (@prof.modulo.edu.br).",
      );
      return;
    }

    setLoading(true);
    const handle = buildUniqueHandle(parsed.data.email);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          display_name: parsed.data.display_name,
          handle,
          account_type: account,
          ...(isOrg
            ? {}
            : { course: course || null, semester: semester || null }),
        },
      },
    });
    setLoading(false);

    if (error) {
      if (isRateLimitError(error.message)) {
        toast.error(
          "Supabase limitou o envio de e-mails por um tempo. Tente novamente mais tarde ou desative a confirmação por e-mail no Dashboard.",
        );
      } else if (error.message.toLowerCase().includes("registered")) {
        toast.error("Este e-mail já está cadastrado. Faça login.");
        setMode("signin");
      } else if (
        error.message.toLowerCase().includes("database error saving new user")
      ) {
        toast.error(
          "Não foi possível criar a conta agora. Tente novamente em alguns segundos.",
        );
      } else {
        toast.error(error.message);
      }
      return;
    }

    if (data.session) {
      toast.success("Conta criada e logada com sucesso.");
      return;
    }

    toast.success(
      "Conta criada. Agora você já pode entrar com e-mail e senha.",
    );
    setMode("signin");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (mode === "signin") handleSignIn();
    else handleSignUp();
  };

  const emailHint =
    account === "pessoa"
      ? "seu.nome@aluno.modulo.edu.br"
      : account === "instituicao"
        ? "@prof.modulo.edu.br"
        : "ri@empresa.com.br";

  const showDomainNotice =
    mode === "signup" &&
    account === "pessoa" &&
    email.length > 0 &&
    !isModuloEmail(email);

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-hero px-6 py-8">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <svg
          className="h-full w-full"
          viewBox="0 0 400 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern
              id="dots"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-center pt-2">
          <SinapseLogo />
        </div>

        <div className="mt-8">
          <h1 className="font-display text-3xl font-semibold leading-tight">
            {mode === "signin" ? (
              <>
                Entre na rede da
                <br />
                <span className="text-text-subtle">Faculdade Módulo.</span>
              </>
            ) : (
              <>
                Crie sua conta no
                <br />
                <span className="text-text-subtle">Sinapse.</span>
              </>
            )}
          </h1>
          <p className="mt-2 text-sm text-text-faint">
            Conecte-se com colegas, professores e oportunidades — tudo num só
            lugar.
          </p>
        </div>

        {/* Tipo de conta */}
        <div className="mt-6 grid grid-cols-3 gap-1.5 rounded-2xl bg-secondary p-1">
          {[
            { id: "pessoa" as const, label: "Pessoa", icon: GraduationCap },
            {
              id: "instituicao" as const,
              label: "Instituição",
              icon: Building2,
            },
            { id: "empresa" as const, label: "Empresa", icon: Building2 },
          ].map((opt) => {
            const Icon = opt.icon;
            const active = account === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAccount(opt.id)}
                className={
                  "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-smooth " +
                  (active
                    ? "bg-foreground text-background shadow-soft"
                    : "text-text-subtle hover:text-foreground")
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          {mode === "signup" && (
            <label className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-elevated px-3.5 py-3 focus-within:border-foreground/60">
              <UserIcon className="h-4 w-4 text-text-faint" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={
                  account === "pessoa"
                    ? "Seu nome completo"
                    : "Nome da organização"
                }
                className="w-full bg-transparent text-sm placeholder:text-text-faint focus:outline-none"
                maxLength={120}
              />
            </label>
          )}

          <label className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-elevated px-3.5 py-3 focus-within:border-foreground/60">
            <Mail className="h-4 w-4 text-text-faint" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={emailHint}
              autoComplete="email"
              className="w-full bg-transparent text-sm placeholder:text-text-faint focus:outline-none"
              maxLength={255}
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-elevated px-3.5 py-3 focus-within:border-foreground/60">
            <Lock className="h-4 w-4 text-text-faint" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === "signup" ? "Crie uma senha (mín. 8)" : "Senha"
              }
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              className="w-full bg-transparent text-sm placeholder:text-text-faint focus:outline-none"
              maxLength={72}
            />
          </label>

          {mode === "signup" && account === "pessoa" && (
            <div className="grid grid-cols-2 gap-2">
              <input
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="Curso (opcional)"
                className="rounded-xl border border-hairline bg-surface-elevated px-3 py-2.5 text-sm placeholder:text-text-faint focus:border-foreground/60 focus:outline-none"
                maxLength={80}
              />
              <input
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="Período (opcional)"
                className="rounded-xl border border-hairline bg-surface-elevated px-3 py-2.5 text-sm placeholder:text-text-faint focus:border-foreground/60 focus:outline-none"
                maxLength={40}
              />
            </div>
          )}

          {showDomainNotice && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
              Cadastro de Pessoa restrito a e-mails do domínio @modulo.edu.br
              (incluindo subdomínios).
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-semibold text-background shadow-glow transition-smooth hover:bg-foreground/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[11px] text-text-faint">
          <span className="h-px flex-1 bg-hairline" />
          ou
          <span className="h-px flex-1 bg-hairline" />
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full rounded-xl border border-hairline bg-secondary py-3 text-sm font-semibold transition-smooth hover:bg-accent"
        >
          {mode === "signin" ? "Criar nova conta" : "Já tenho conta — entrar"}
        </button>

        <p className="mt-auto pt-6 text-center text-[11px] text-text-faint">
          Ao continuar você concorda com os{" "}
          <span className="underline">Termos</span> e a{" "}
          <span className="underline">Política de Privacidade</span> do Synapse.
        </p>
      </div>
    </div>
  );
};
