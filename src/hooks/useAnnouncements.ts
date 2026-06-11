import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isProfessorModuloEmail } from "@/lib/authValidation";
import type { User } from "@supabase/supabase-js";

export type AnnouncementCategory = "academico" | "eventos" | "provas" | "aviso_geral";

export const categoryLabel: Record<AnnouncementCategory, string> = {
  academico: "Acadêmico",
  eventos: "Eventos",
  provas: "Provas",
  aviso_geral: "Aviso geral",
};

export interface Announcement {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  pinned: boolean;
  created_at: string;
  author: {
    display_name: string;
    department: string | null;
    email: string | null;
  };
}

export const useAnnouncements = (currentUser: User | null) => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("announcements")
      .select("id, user_id, title, body, category, pinned, created_at")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (!rows || rows.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, display_name, course, email")
      .in("user_id", ids);
    const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
    setItems(
      rows.map((r) => ({
        ...(r as Omit<Announcement, "author">),
        author: {
          display_name: map.get(r.user_id)?.display_name ?? "Professor(a)",
          department: map.get(r.user_id)?.course ?? null,
          email: map.get(r.user_id)?.email ?? null,
        },
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("announcements-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const create = async (input: {
    title: string;
    body: string;
    category: AnnouncementCategory;
    pinned: boolean;
  }) => {
    if (!currentUser) return { error: "Não autenticado" };
    if (!currentUser.email || !isProfessorModuloEmail(currentUser.email)) {
      return { error: "Somente professores com e-mail @prof.modulo.edu.br podem publicar." };
    }
    const { error } = await supabase.from("announcements").insert({
      user_id: currentUser.id,
      ...input,
    });
    if (!error) await load();
    return { error: error?.message };
  };

  const remove = async (id: string) => {
    if (!currentUser?.email || !isProfessorModuloEmail(currentUser.email)) {
      return;
    }
    await supabase.from("announcements").delete().eq("id", id);
    await load();
  };

  const togglePin = async (a: Announcement) => {
    if (!currentUser?.email || !isProfessorModuloEmail(currentUser.email)) {
      return;
    }
    await supabase.from("announcements").update({ pinned: !a.pinned }).eq("id", a.id);
    await load();
  };

  return { items, loading, create, remove, togglePin };
};
