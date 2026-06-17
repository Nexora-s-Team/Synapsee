import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useFollow() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const follow = async (targetUserId: string) => {
    if (!user) {
      toast.error("Você precisa estar logado.");
      return false;
    }
    setLoading(true);
    const { error } = await supabase
      .from("user_follows")
      .insert({ follower_id: user.id, following_id: targetUserId });
    setLoading(false);
    if (error) {
      toast.error("Erro ao seguir: " + error.message);
      return false;
    }
    toast.success("Seguindo!");
    return true;
  };

  const unfollow = async (targetUserId: string) => {
    if (!user) {
      toast.error("Você precisa estar logado.");
      return false;
    }
    setLoading(true);
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .match({ follower_id: user.id, following_id: targetUserId });
    setLoading(false);
    if (error) {
      toast.error("Erro ao deixar de seguir: " + error.message);
      return false;
    }
    toast.success("Deixou de seguir.");
    return true;
  };

  return { follow, unfollow, loading };
}
