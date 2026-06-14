import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type NotificationType = "follow" | "like" | "comment";

export interface AppNotification {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor: {
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
  };
}

export const useNotifications = (currentUser: User | null) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = currentUser?.id;
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const load = useCallback(async () => {
    if (!currentUserId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: rawNotifs, error } = await supabase
      .from("notifications")
      .select("id, user_id, actor_id, type, post_id, read, created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error || !rawNotifs || rawNotifs.length === 0) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // Busca perfis dos atores
    const actorIds = Array.from(new Set(rawNotifs.map((n) => n.actor_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, handle, avatar_url")
      .in("user_id", actorIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p]),
    );

    setNotifications(
      rawNotifs.map((n) => {
        const actor = profileMap.get(n.actor_id);
        return {
          ...n,
          type: n.type as NotificationType,
          actor: {
            display_name: actor?.display_name ?? "Usuário",
            handle: actor?.handle ?? null,
            avatar_url: actor?.avatar_url ?? null,
          },
        };
      }),
    );
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    load();

    if (!currentUserId) return;

    const channel = supabase
      .channel(`notifications-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => load(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, load]);

  const markAllRead = useCallback(async () => {
    if (!currentUserId || unreadCount === 0) return;

    // Otimista
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", currentUserId)
      .eq("read", false);
  }, [currentUserId, unreadCount]);

  const markRead = useCallback(
    async (id: string) => {
      if (!currentUserId) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
        .eq("user_id", currentUserId);
    },
    [currentUserId],
  );

  return { notifications, loading, unreadCount, markAllRead, markRead };
};
