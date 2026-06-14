import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author: {
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
    course: string | null;
    semester: string | null;
    role: string | null;
  };
  liked_by_me: boolean;
  saved_by_me: boolean;
}

export const usePosts = (currentUser: User | null, targetUserId?: string | null) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const isMissingMediaSchemaError = (message?: string | null) => {
    const text = (message ?? "").toLowerCase();
    return (
      text.includes("schema cache") ||
      text.includes("media_url") ||
      text.includes("media_type") ||
      text.includes("column")
    );
  };

  const isMissingStorageBucketError = (message?: string | null) => {
    const text = (message ?? "").toLowerCase();
    return (
      text.includes("bucket not found") ||
      text.includes("bucket") ||
      text.includes("not found")
    );
  };

  const load = async () => {
    if (!currentUser) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    let userIdsToFetch = [currentUser.id];
    if (targetUserId) {
      userIdsToFetch = [targetUserId];
    } else {
      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", currentUser.id);
      if (follows) {
        userIdsToFetch = [currentUser.id, ...follows.map((f) => f.following_id)];
      }
    }

    const { data: rawPosts, error: selectError } = await supabase
      .from("posts")
      .select(
        "id, user_id, content, media_url, media_type, likes_count, comments_count, created_at",
      )
      .in("user_id", userIdsToFetch)
      .order("created_at", { ascending: false })
      .limit(50);

    if (selectError && isMissingMediaSchemaError(selectError.message)) {
      const { data: legacyPosts, error: legacyError } = await supabase
        .from("posts")
        .select("id, user_id, content, likes_count, comments_count, created_at")
        .in("user_id", userIdsToFetch)
        .order("created_at", { ascending: false })
        .limit(50);

      if (legacyError || !legacyPosts || legacyPosts.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const normalized = legacyPosts.map((post) => ({
        ...post,
        media_url: null,
        media_type: null,
      }));

      const userIds = Array.from(new Set(normalized.map((p) => p.user_id)));
      const [{ data: profiles }, { data: roles }, { data: myLikes }, { data: mySaves }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, display_name, handle, avatar_url, course, semester")
            .in("user_id", userIds),
          supabase
            .from("user_roles")
            .select("user_id, role")
            .in("user_id", userIds),
          currentUser
            ? supabase
                .from("post_likes")
                .select("post_id")
                .eq("user_id", currentUser.id)
                .in(
                  "post_id",
                  normalized.map((p) => p.id),
                )
            : Promise.resolve({ data: [] as { post_id: string }[] }),
          currentUser
            ? supabase
                .from("post_saves")
                .select("post_id")
                .eq("user_id", currentUser.id)
                .in(
                  "post_id",
                  normalized.map((p) => p.id),
                )
            : Promise.resolve({ data: [] as { post_id: string }[] }),
        ]);

      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
      const likedSet = new Set((myLikes ?? []).map((l) => l.post_id));
      const savedSet = new Set((mySaves ?? []).map((s) => s.post_id));

      setPosts(
        normalized.map((p) => {
          const prof = profileMap.get(p.user_id);
          return {
            ...p,
            author: {
              display_name: prof?.display_name ?? "Usuário",
              handle: prof?.handle ?? null,
              avatar_url: prof?.avatar_url ?? null,
              course: prof?.course ?? null,
              semester: prof?.semester ?? null,
              role: roleMap.get(p.user_id) ?? null,
            },
            liked_by_me: likedSet.has(p.id),
            saved_by_me: savedSet.has(p.id),
          };
        }),
      );
      setLoading(false);
      return;
    }

    if (!rawPosts || rawPosts.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set(rawPosts.map((p) => p.user_id)));
    const [{ data: profiles }, { data: roles }, { data: myLikes }, { data: mySaves }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, display_name, handle, avatar_url, course, semester")
          .in("user_id", userIds),
        supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds),
        currentUser
          ? supabase
              .from("post_likes")
              .select("post_id")
              .eq("user_id", currentUser.id)
              .in(
                "post_id",
                rawPosts.map((p) => p.id),
              )
          : Promise.resolve({ data: [] as { post_id: string }[] }),
        currentUser
          ? supabase
              .from("post_saves")
              .select("post_id")
              .eq("user_id", currentUser.id)
              .in(
                "post_id",
                rawPosts.map((p) => p.id),
              )
          : Promise.resolve({ data: [] as { post_id: string }[] }),
      ]);

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
    const likedSet = new Set((myLikes ?? []).map((l) => l.post_id));
    const savedSet = new Set((mySaves ?? []).map((s) => s.post_id));

    setPosts(
      rawPosts.map((p) => {
        const prof = profileMap.get(p.user_id);
        return {
          ...p,
          author: {
            display_name: prof?.display_name ?? "Usuário",
            handle: prof?.handle ?? null,
            avatar_url: prof?.avatar_url ?? null,
            course: prof?.course ?? null,
            semester: prof?.semester ?? null,
            role: roleMap.get(p.user_id) ?? null,
          },
          liked_by_me: likedSet.has(p.id),
          saved_by_me: savedSet.has(p.id),
        };
      }),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // realtime
    const ch = supabase
      .channel("posts-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, targetUserId]);

  const create = async (content: string, media?: File | null) => {
    if (!currentUser) return { error: "Não autenticado" };

    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (media) {
      const isImage = media.type.startsWith("image/");
      const isVideo = media.type.startsWith("video/");

      if (!isImage && !isVideo) {
        return { error: "Envie apenas fotos ou vídeos." };
      }

      const maxSize = 30 * 1024 * 1024;
      if (media.size > maxSize) {
        return { error: "Arquivo muito grande. Use até 30 MB." };
      }

      const extensionFromName = media.name.split(".").pop()?.toLowerCase();
      const extensionFromType = isImage ? "jpg" : "mp4";
      const extension = extensionFromName || extensionFromType;
      const filePath = `${currentUser.id}/${crypto.randomUUID()}.${extension}`;

      const upload = await supabase.storage
        .from("post-media")
        .upload(filePath, media, {
          contentType: media.type,
          upsert: false,
        });

      if (upload.error) {
        if (isMissingStorageBucketError(upload.error.message)) {
          if (!content.trim()) {
            return {
              error:
                "O banco ainda não tem o bucket de mídia. Envie texto ou aplique a migration.",
            };
          }
          mediaUrl = null;
          mediaType = null;
        } else {
          return { error: upload.error.message };
        }
      }

      if (!mediaUrl && upload.data) {
        const { data: publicUrl } = supabase.storage
          .from("post-media")
          .getPublicUrl(upload.data.path);
        mediaUrl = publicUrl.publicUrl;
        mediaType = media.type;
      }
    }

    let { error } = await supabase.from("posts").insert({
      user_id: currentUser.id,
      content,
      media_url: mediaUrl,
      media_type: mediaType,
    });

    if (error && isMissingMediaSchemaError(error.message)) {
      if (mediaUrl) {
        const path = mediaUrl.split("/post-media/")[1];
        if (path) {
          await supabase.storage.from("post-media").remove([path]);
        }
      }

      if (!content.trim()) {
        return {
          error:
            "Seu banco ainda não suporta post com mídia. Envie texto por enquanto ou aplique as migrations.",
        };
      }

      const fallback = await supabase.from("posts").insert({
        user_id: currentUser.id,
        content,
      });
      error = fallback.error;
      if (!error && media) {
        return {
          error: undefined,
          warning:
            "Seu banco ainda não suporta mídia em posts. O texto foi publicado sem a foto/vídeo.",
        };
      }
    }

    if (!error && media && !mediaUrl) {
      return {
        error: undefined,
        warning:
          "Seu banco ainda não suporta mídia em posts. O texto foi publicado sem a foto/vídeo.",
      };
    }

    if (error && mediaUrl) {
      const path = mediaUrl.split("/post-media/")[1];
      if (path) {
        await supabase.storage.from("post-media").remove([path]);
      }
    }

    if (!error) await load();
    return { error: error?.message };
  };

  const toggleLike = async (post: FeedPost) => {
    if (!currentUser) return;
    // optimistic
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
               ...p,
               liked_by_me: !p.liked_by_me,
               likes_count: p.likes_count + (p.liked_by_me ? -1 : 1),
             }
          : p,
      ),
    );
    if (post.liked_by_me) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUser.id);
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: post.id, user_id: currentUser.id });
    }
  };

  const toggleSave = async (post: FeedPost) => {
    if (!currentUser) return;
    // optimistic
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
               ...p,
               saved_by_me: !p.saved_by_me,
             }
          : p,
      ),
    );
    if (post.saved_by_me) {
      await supabase
        .from("post_saves")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUser.id);
    } else {
      await supabase
        .from("post_saves")
        .insert({ post_id: post.id, user_id: currentUser.id });
    }
  };

  const remove = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
    await load();
  };

  return { posts, loading, create, toggleLike, toggleSave, remove, reload: load };
};

export interface PostComment {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  author: {
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
  };
}

export const useComments = (
  postId: string | null,
  currentUser: User | null,
) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);

  const isMissingMediaSchemaError = (message?: string | null) => {
    const text = (message ?? "").toLowerCase();
    return (
      text.includes("schema cache") ||
      text.includes("media_url") ||
      text.includes("media_type") ||
      text.includes("column")
    );
  };

  const isMissingStorageBucketError = (message?: string | null) => {
    const text = (message ?? "").toLowerCase();
    return (
      text.includes("bucket not found") ||
      text.includes("bucket") ||
      text.includes("not found")
    );
  };

  const load = async () => {
    if (!postId || !currentUser) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: raw, error: selectError } = await supabase
      .from("post_comments")
      .select("id, user_id, content, media_url, media_type, created_at")
      .eq("post_id", postId)
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: true });

    if (selectError && isMissingMediaSchemaError(selectError.message)) {
      const { data: legacyRaw, error: legacyError } = await supabase
        .from("post_comments")
        .select("id, user_id, content, created_at")
        .eq("post_id", postId)
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: true });

      if (legacyError || !legacyRaw || legacyRaw.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      const userIds = Array.from(new Set(legacyRaw.map((c) => c.user_id)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, handle, avatar_url")
        .in("user_id", userIds);
      const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
      setComments(
        legacyRaw.map((c) => ({
          ...c,
          media_url: null,
          media_type: null,
          author: {
            display_name: map.get(c.user_id)?.display_name ?? "Usuário",
            handle: map.get(c.user_id)?.handle ?? null,
            avatar_url: map.get(c.user_id)?.avatar_url ?? null,
          },
        })),
      );
      setLoading(false);
      return;
    }

    if (!raw || raw.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }
    const userIds = Array.from(new Set(raw.map((c) => c.user_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, display_name, handle, avatar_url")
      .in("user_id", userIds);
    const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
    setComments(
      raw.map((c) => ({
        ...c,
        author: {
          display_name: map.get(c.user_id)?.display_name ?? "Usuário",
          handle: map.get(c.user_id)?.handle ?? null,
          avatar_url: map.get(c.user_id)?.avatar_url ?? null,
        },
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    if (postId) load();
    else setComments([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const add = async (content: string, media?: File | null) => {
    if (!currentUser || !postId) return;

    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (media) {
      const isImage = media.type.startsWith("image/");
      const isVideo = media.type.startsWith("video/");

      if (!isImage && !isVideo) {
        return { error: "Envie apenas fotos ou vídeos." };
      }

      const maxSize = 15 * 1024 * 1024;
      if (media.size > maxSize) {
        return { error: "Arquivo muito grande. Use até 15 MB." };
      }

      const extensionFromName = media.name.split(".").pop()?.toLowerCase();
      const extensionFromType = isImage ? "jpg" : "mp4";
      const extension = extensionFromName || extensionFromType;
      const filePath = `${currentUser.id}/${postId}/${crypto.randomUUID()}.${extension}`;

      const upload = await supabase.storage
        .from("comment-media")
        .upload(filePath, media, {
          contentType: media.type,
          upsert: false,
        });

      if (upload.error) {
        if (isMissingStorageBucketError(upload.error.message)) {
          if (!content.trim()) {
            return {
              error:
                "O banco ainda não tem o bucket de mídia. Envie texto ou aplique a migration.",
            };
          }
          mediaUrl = null;
          mediaType = null;
        } else {
          return { error: upload.error.message };
        }
      }

      if (!mediaUrl && upload.data) {
        const { data: publicUrl } = supabase.storage
          .from("comment-media")
          .getPublicUrl(upload.data.path);
        mediaUrl = publicUrl.publicUrl;
        mediaType = media.type;
      }
    }

    let { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: currentUser.id,
      content,
      media_url: mediaUrl,
      media_type: mediaType,
    });

    if (error && isMissingMediaSchemaError(error.message)) {
      if (mediaUrl) {
        const path = mediaUrl.split("/comment-media/")[1];
        if (path) {
          await supabase.storage.from("comment-media").remove([path]);
        }
      }

      const fallback = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: currentUser.id,
        content,
      });
      error = fallback.error;
      if (!error && media) {
        return {
          error: undefined,
          warning:
            "Seu banco ainda não suporta mídia em comentários. O comentário foi publicado sem a foto/vídeo.",
        };
      }
    }

    if (!error && media && !mediaUrl) {
      return {
        error: undefined,
        warning:
          "Seu banco ainda não suporta mídia em comentários. O comentário foi publicado sem a foto/vídeo.",
      };
    }

    if (!error) await load();
    return { error: error?.message };
  };

  const remove = async (commentId: string) => {
    if (!currentUser || !postId) return { error: "Não autenticado" };

    const previousComments = comments;
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));

    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId)
      .eq("post_id", postId)
      .eq("user_id", currentUser.id);

    if (error) {
      setComments(previousComments);
      return { error: error.message };
    }

    return { error: null };
  };

  return { comments, loading, add, remove };
};
