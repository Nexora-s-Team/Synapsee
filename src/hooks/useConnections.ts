import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ConnectionUser {
  id: string;
  username: string; // mapeado de handle
  full_name: string; // mapeado de display_name
  avatar_url: string | null;
  is_followed_by_me: boolean;
}

export const useConnections = (userId: string) => {
  const { user: currentUser } = useAuth();
  const [followers, setFollowers] = useState<ConnectionUser[]>([]);
  const [following, setFollowing] = useState<ConnectionUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConnections = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      // 1. Buscar IDs dos seguidores (quem segue este userId)
      const { data: followerRows, error: err1 } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("following_id", userId);

      if (err1) console.error("Erro ao buscar seguidores (IDs):", err1);

      // 2. Buscar IDs dos seguindo (quem este userId segue)
      const { data: followingRows, error: err2 } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", userId);

      if (err2) console.error("Erro ao buscar seguindo (IDs):", err2);

      const followerIds = (followerRows || [])
        .map((r) => r.follower_id)
        .filter(Boolean);
      const followingIds = (followingRows || [])
        .map((r) => r.following_id)
        .filter(Boolean);

      // 3. Buscar perfis completos para esses IDs
      let followersProfiles: ConnectionUser[] = [];
      let followingProfiles: ConnectionUser[] = [];

      if (followerIds.length > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("user_id, handle, display_name, avatar_url")
          .in("user_id", followerIds);
        if (!pErr && profiles) {
          followersProfiles = profiles.map((p) => ({
            id: p.user_id,
            username: p.handle || p.display_name,
            full_name: p.display_name,
            avatar_url: p.avatar_url,
            is_followed_by_me: false, // será preenchido depois
          }));
        } else {
          console.error("Erro ao buscar perfis de seguidores:", pErr);
        }
      }

      if (followingIds.length > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("user_id, handle, display_name, avatar_url")
          .in("user_id", followingIds);
        if (!pErr && profiles) {
          followingProfiles = profiles.map((p) => ({
            id: p.user_id,
            username: p.handle || p.display_name,
            full_name: p.display_name,
            avatar_url: p.avatar_url,
            is_followed_by_me: true,
          }));
        } else {
          console.error("Erro ao buscar perfis de seguindo:", pErr);
        }
      }

      // 4. Determinar quais seguidores o usuário atual segue
      let followedSet = new Set<string>();
      if (currentUser && followerIds.length > 0) {
        const { data: myFollows } = await supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", currentUser.id)
          .in("following_id", followerIds);
        followedSet = new Set((myFollows || []).map((f) => f.following_id));
      }

      // Atualizar is_followed_by_me nos seguidores
      const followersWithStatus = followersProfiles.map((p) => ({
        ...p,
        is_followed_by_me: currentUser ? followedSet.has(p.id) : false,
      }));

      setFollowers(followersWithStatus);
      setFollowing(followingProfiles);
    } catch (error) {
      console.error("Erro ao carregar conexões:", error);
    }

    setIsLoading(false);
  }, [userId, currentUser]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const followUser = async (targetUserId: string) => {
    if (!currentUser) return;
    await supabase
      .from("user_follows")
      .insert({ follower_id: currentUser.id, following_id: targetUserId });
    await loadConnections();
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!currentUser) return;
    await supabase
      .from("user_follows")
      .delete()
      .match({ follower_id: currentUser.id, following_id: targetUserId });
    await loadConnections();
  };

  const refresh = loadConnections;

  return {
    followers,
    following,
    isLoading,
    followUser,
    unfollowUser,
    refresh,
  };
};
