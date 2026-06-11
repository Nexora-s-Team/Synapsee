import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface SinapseProfile {
  user_id: string;
  display_name: string;
  handle: string | null;
  email: string;
  account_type: string;
  course: string | null;
  semester: string | null;
  bio: string | null;
  avatar_url: string | null;
  last_username_change?: string | null;
}

export type SinapseRole =
  | "aluno"
  | "professor"
  | "instituicao"
  | "empresa"
  | "admin";

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SinapseProfile | null>(null);
  const [role, setRole] = useState<SinapseRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CRITICAL: subscribe BEFORE getSession
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (!newSession) {
          setProfile(null);
          setRole(null);
          setLoading(false);
        } else {
          setLoading(true);
          // Defer Supabase calls to avoid deadlocks inside the callback
          setTimeout(() => {
            void loadProfileAndRole(newSession.user).finally(() =>
              setLoading(false),
            );
          }, 0);
        }
      },
    );

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing) {
        setLoading(true);
        loadProfileAndRole(existing.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const loadProfileAndRole = async (authUser: User) => {
    const uid = authUser.id;
    const email = authUser.email ?? "";
    const metadata = authUser.user_metadata ?? {};
    const displayName =
      typeof metadata.display_name === "string" && metadata.display_name.trim()
        ? metadata.display_name.trim()
        : email.split("@")[0] || "Usuário";
    const handle =
      typeof metadata.handle === "string" && metadata.handle.trim()
        ? metadata.handle.trim()
        : email.split("@")[0] || null;
    const accountType =
      typeof metadata.account_type === "string" && metadata.account_type.trim()
        ? metadata.account_type.trim()
        : "pessoa";
    const course =
      typeof metadata.course === "string" && metadata.course.trim()
        ? metadata.course.trim()
        : null;
    const semester =
      typeof metadata.semester === "string" && metadata.semester.trim()
        ? metadata.semester.trim()
        : null;

    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .maybeSingle(),
    ]);

    if (!p) {
      const { data: insertedProfile } = await supabase
        .from("profiles")
        .insert({
          user_id: uid,
          display_name: displayName,
          handle,
          email,
          account_type: accountType,
          course,
          semester,
        })
        .select("*")
        .maybeSingle();

      if (insertedProfile) {
        setProfile(insertedProfile as SinapseProfile);
      }
    } else {
      setProfile(p as SinapseProfile);
    }

    if (!r) {
      const nextRole: SinapseRole =
        accountType === "instituicao"
          ? "instituicao"
          : accountType === "empresa"
            ? "empresa"
            : email.endsWith("@prof.modulo.edu.br")
              ? "professor"
              : "aluno";

      const { data: insertedRole } = await supabase
        .from("user_roles")
        .insert({ user_id: uid, role: nextRole })
        .select("role")
        .maybeSingle();

      if (insertedRole) {
        setRole(insertedRole.role as SinapseRole);
      }
    } else {
      setRole(r.role as SinapseRole);
    }

    const { data: refreshedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();
    if (refreshedProfile) setProfile(refreshedProfile as SinapseProfile);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const deleteAccount = async () => {
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      return { error: error.message };
    }

    await supabase.auth.signOut();
    return { error: null };
  };

  return { session, user, profile, role, loading, signOut, deleteAccount };
};
