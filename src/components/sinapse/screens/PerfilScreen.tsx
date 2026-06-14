import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Camera,
  ChevronRight,
  GraduationCap,
  KeyRound,
  LogOut,
  Mail,
  MoreVertical,
  Settings,
  ShieldCheck,
  Trash2,
  ChevronLeft,
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "../Avatar";
import { TopBar } from "../TopBar";
import { CommentsSheet } from "../CommentsSheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import type { SinapseProfile, SinapseRole } from "@/hooks/useAuth";
import { usePosts, FeedPost } from "@/hooks/usePosts";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

const isRateLimitError = (message: string) => {
  const text = message.toLowerCase();
  return text.includes("rate limit") || text.includes("too many requests");
};

interface PerfilScreenProps {
  onLogout: () => void;
  onDeleteAccount: () => Promise<{ error: string | null }>;
  profile: SinapseProfile | null;
  role: SinapseRole | null;
  emailVerified: boolean;
  targetUserId?: string | null;
  onBack?: () => void;
  currentUser?: User | null;
  onViewProfile?: (userId: string) => void;
}

const roleLabel: Record<SinapseRole, string> = {
  aluno: "Aluno(a)",
  professor: "Professor(a)",
  instituicao: "Instituição",
  empresa: "Empresa",
  admin: "Admin",
};

export const PerfilScreen = ({
  onLogout,
  onDeleteAccount,
  profile,
  role,
  emailVerified,
  targetUserId,
  onBack,
  currentUser,
  onViewProfile,
}: PerfilScreenProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftUsername, setDraftUsername] = useState("");
  const [profileCourse, setProfileCourse] = useState("");
  const [draftCourse, setDraftCourse] = useState("");
  const [profileSemester, setProfileSemester] = useState("");
  const [draftSemester, setDraftSemester] = useState("");
  const [draftEmailLocal, setDraftEmailLocal] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [lastUsernameChange, setLastUsernameChange] = useState<string | null>(
    null,
  );

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Profile and Stats states
  const [targetProfile, setTargetProfile] = useState<SinapseProfile | null>(null);
  const [targetRole, setTargetRole] = useState<SinapseRole | null>(null);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "vagas">("posts");

  // Comments & Post Actions
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [openPostMenu, setOpenPostMenu] = useState<string | null>(null);

  // Saved posts state
  const [savedPosts, setSavedPosts] = useState<FeedPost[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  const isOwnProfile = !targetUserId || targetUserId === profile?.user_id;
  const displayProfile = isOwnProfile ? profile : targetProfile;
  const displayRole = isOwnProfile ? role : targetRole;

  const {
    posts,
    loading: loadingPosts,
    toggleLike: toggleLikePost,
    toggleSave: toggleSavePost,
    remove: removePost,
  } = usePosts(currentUser, targetUserId || profile?.user_id);

  const loadProfileStats = async (uid: string) => {
    try {
      const [postsRes, followersRes, followingRes] = await Promise.all([
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
        supabase
          .from("user_follows")
          .select("id", { count: "exact", head: true })
          .eq("following_id", uid),
        supabase
          .from("user_follows")
          .select("id", { count: "exact", head: true })
          .eq("follower_id", uid),
      ]);

      setStats({
        posts: postsRes.count ?? 0,
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      });
    } catch (err) {
      console.error("Error loading stats", err);
    }
  };

  const checkFollowStatus = async (followerId: string, followingId: string) => {
    if (followerId === followingId) return;
    const { data } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const loadSavedPosts = async () => {
    if (!profile?.user_id) return;
    setSavedLoading(true);

    const { data: rawSaves, error } = await supabase
      .from("post_saves")
      .select(`
        post_id,
        posts (
          id,
          user_id,
          content,
          media_url,
          media_type,
          likes_count,
          comments_count,
          created_at
        )
      `)
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false });

    if (error || !rawSaves) {
      setSavedPosts([]);
      setSavedLoading(false);
      return;
    }

    const postsList = rawSaves
      .map((s) => s.posts)
      .filter((p): p is NonNullable<typeof p> => p !== null);

    if (postsList.length === 0) {
      setSavedPosts([]);
      setSavedLoading(false);
      return;
    }

    const authorIds = Array.from(new Set(postsList.map((p) => p.user_id)));
    const [{ data: authorProfiles }, { data: authorRoles }, { data: myLikes }] =
  await Promise.all([
    supabase
      .from("profiles")
      .select(
        "user_id, display_name, handle, avatar_url, course, semester"
      )
      .in("user_id", authorIds),

    supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", authorIds),

    supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", profile.user_id)
      .in(
        "post_id",
        postsList.map((p) => p.id)
      ),
  ]);

const profileMap = new Map(
  (authorProfiles ?? []).map((p) => [p.user_id, p])
);

const roleMap = new Map(
  (authorRoles ?? []).map((r) => [r.user_id, r.role])
);

const likedSet = new Set(
  (myLikes ?? []).map((l) => l.post_id)
);

const formatted: FeedPost[] = postsList.map((p) => {
  const prof = profileMap.get(p.user_id);

  return {
    id: p.id,
    user_id: p.user_id,
    content: p.content,
    media_url: p.media_url,
    media_type: p.media_type,
    likes_count: p.likes_count,
    comments_count: p.comments_count,
    created_at: p.created_at,

    author: {
      display_name: prof?.display_name ?? "Usuário",
      handle: prof?.handle ?? "user",
      avatar_url: prof?.avatar_url ?? null,
      course: prof?.course ?? null,
      semester: prof?.semester ?? null,
      role: (roleMap.get(p.user_id) as SinapseRole) ?? "aluno",
    },

    liked_by_me: likedSet.has(p.id),
    saved_by_me: true,
  };
});

setSavedPosts(formatted);
    setSavedLoading(false);
  };

  const toggleLikeSavedPost = async (post: FeedPost) => {
    if (!profile?.user_id) return;
    setSavedPosts((prev) =>
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
        .eq("user_id", profile.user_id);
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: post.id, user_id: profile.user_id });
    }
  };

  const toggleSaveSavedPost = async (post: FeedPost) => {
    if (!profile?.user_id) return;
    setSavedPosts((prev) => prev.filter((p) => p.id !== post.id));
    await supabase
      .from("post_saves")
      .delete()
      .eq("post_id", post.id)
      .eq("user_id", profile.user_id);
  };

  const toggleFollow = async () => {
    if (!profile?.user_id || !targetUserId) return;
    setFollowLoading(true);
    if (isFollowing) {
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", profile.user_id)
        .eq("following_id", targetUserId);
      if (!error) {
        setIsFollowing(false);
        setStats((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
        toast.success("Deixou de seguir");
      }
    } else {
      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: profile.user_id, following_id: targetUserId });
      if (!error) {
        setIsFollowing(true);
        setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
        toast.success("Seguindo");
      }
    }
    setFollowLoading(false);
  };

  useEffect(() => {
    const initProfile = async () => {
      const activeUid = targetUserId || profile?.user_id;
      if (!activeUid) return;

      setLoadingProfile(true);

      let currentProf = profile;
      let currentR = role;

      if (targetUserId && targetUserId !== profile?.user_id) {
        const [{ data: p }, { data: r }] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", targetUserId).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", targetUserId).maybeSingle(),
        ]);

        if (p) {
          currentProf = p as SinapseProfile;
          currentR = (r?.role as SinapseRole) ?? null;
          setTargetProfile(currentProf);
          setTargetRole(currentR);
        }
        if (profile?.user_id) {
          await checkFollowStatus(profile.user_id, targetUserId);
        }
      } else {
        setTargetProfile(null);
        setTargetRole(null);
        setIsFollowing(false);
      }

      if (currentProf) {
        setProfileName(currentProf.display_name);
        setDraftName(currentProf.display_name);
        setProfileUsername(currentProf.handle ?? currentProf.email.split("@")[0] ?? "");
        setDraftUsername(currentProf.handle ?? currentProf.email.split("@")[0] ?? "");
        setProfileCourse(currentProf.course ?? "");
        setDraftCourse(currentProf.course ?? "");
        setProfileSemester(currentProf.semester ?? "");
        setDraftSemester(currentProf.semester ?? "");
        setDraftEmailLocal(currentProf.email.split("@")[0] ?? "");
        setLastUsernameChange(currentProf.last_username_change ?? null);
        setAvatarUrl(currentProf.avatar_url ?? null);
      }

      await loadProfileStats(activeUid);
      setLoadingProfile(false);
    };

    initProfile();
    setActiveTab("posts");
  }, [targetUserId, profile, role]);

  useEffect(() => {
    if (activeTab === "saved") {
      loadSavedPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (loadingProfile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <TopBar showLogo={false} title="Perfil" onBack={onBack} />
        <div className="flex flex-1 items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-text-faint" />
        </div>
      </div>
    );
  }

  if (!displayProfile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <TopBar showLogo={false} title="Perfil" onBack={onBack} />
        <div className="flex flex-1 items-center justify-center py-24 text-sm text-text-faint">
          Perfil não encontrado.
        </div>
      </div>
    );
  }

  const emailParts = displayProfile.email.split("@");
  const currentEmailLocal = emailParts[0] ?? "";
  const currentEmailDomain = emailParts.slice(1).join("@");
  const previewEmail = `${draftEmailLocal || currentEmailLocal}@${currentEmailDomain}`;
  const emailLocalValue = draftEmailLocal.slice(0, 15);
  const emailLimitReached = emailLocalValue.length >= 15;
  const usernameValue = profileUsername.trim().slice(0, 24);
  const courseValue = draftCourse.replace(/[^a-zA-Z\s]/g, "").slice(0, 50);
  const semesterValue = draftSemester.replace(/\D/g, "").slice(0, 2);

  const tabs = isOwnProfile ? ["Publicações", "Salvos", "Vagas"] : ["Publicações"];

  return (
    <div className="flex flex-col">
      <TopBar
        showLogo={false}
        title={usernameValue ? `@${usernameValue}` : "Sem nome de usuário"}
        onBack={onBack}
        rightSlot={
          isOwnProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full p-2 transition-smooth hover:bg-secondary"
                  aria-label="Abrir menu de perfil"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={(event) => {
                    event.preventDefault();
                    setSettingsOpen(true);
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2" onSelect={() => onLogout()}>
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onSelect={(event) => {
                    event.preventDefault();
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null
        }
      />

      <section className="px-4 pt-5">
        <div className="flex items-center gap-4">
          <Avatar
            name={profileName}
            url={isOwnProfile ? avatarUrl : displayProfile.avatar_url}
            color="from-zinc-300 to-zinc-500"
            size="xl"
            ring
          />
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            {[
              { n: stats.posts.toString(), l: "posts" },
              { n: stats.followers.toString(), l: "seguidores" },
              { n: stats.following.toString(), l: "seguindo" },
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
              {profileName}
            </h2>
            {displayRole && (displayRole === "professor" || displayRole === "admin") && (
              <span
                className="grid h-4 w-4 place-items-center rounded-full bg-foreground text-background"
                title="Verificado"
              >
                <ShieldCheck className="h-3 w-3" />
              </span>
            )}
          </div>
          {displayRole && (
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-text-faint">
              {roleLabel[displayRole]}
            </p>
          )}
          {(displayProfile.course || displayProfile.semester) && (
            <p className="mt-0.5 text-xs text-text-subtle">
              {[displayProfile.course, displayProfile.semester].filter(Boolean).join(" · ")}
            </p>
          )}
          {displayProfile.bio && (
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              {displayProfile.bio}
            </p>
          )}
        </div>

        {/* Email card */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-hairline bg-surface-elevated p-3.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground text-background">
            <Mail className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-text-faint">
              E-mail institucional
            </p>
            <p className="truncate text-sm font-semibold">{displayProfile.email}</p>
          </div>
          {emailVerified ? (
            <span className="shrink-0 rounded-full bg-online/20 px-2 py-0.5 text-[10px] font-semibold text-online">
              verificado
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-semibold text-destructive">
              pendente
            </span>
          )}
        </div>

        {isOwnProfile ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setDraftName(profileName);
                setEditOpen(true);
              }}
              className="rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-smooth hover:bg-foreground/90"
            >
              Editar perfil
            </button>
            <button className="rounded-xl bg-secondary py-2.5 text-sm font-semibold text-foreground transition-smooth hover:bg-accent">
              Compartilhar
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={cn(
                "rounded-xl py-2.5 text-sm font-semibold transition-smooth",
                isFollowing
                  ? "bg-secondary text-foreground hover:bg-accent"
                  : "bg-foreground text-background hover:bg-foreground/90"
              )}
            >
              {followLoading ? "Processando..." : isFollowing ? "Seguindo" : "Seguir"}
            </button>
            <button
              onClick={onBack}
              className="rounded-xl bg-secondary py-2.5 text-sm font-semibold text-foreground transition-smooth hover:bg-accent"
            >
              Voltar
            </button>
          </div>
        )}

        {(displayProfile.course || displayProfile.semester) && (
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-hairline bg-gradient-card p-3.5">
              <GraduationCap className="h-5 w-5 text-text-subtle" />
              <p className="mt-2 text-[11px] text-text-faint">Curso</p>
              <p className="text-sm font-semibold">{displayProfile.course || "—"}</p>
            </div>
            <div className="rounded-2xl border border-hairline bg-gradient-card p-3.5">
              <BookOpen className="h-5 w-5 text-text-subtle" />
              <p className="mt-2 text-[11px] text-text-faint">Período</p>
              <p className="text-sm font-semibold">{displayProfile.semester || "—"}</p>
            </div>
          </div>
        )}
      </section>

      <div className="mt-6 flex border-y border-hairline">
        {tabs.map((t) => {
          const tabKey = t === "Publicações" ? "posts" : t === "Salvos" ? "saved" : "vagas";
          const isActive = activeTab === tabKey;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(tabKey)}
              className={cn(
                "flex-1 py-3 text-xs font-semibold transition-smooth",
                isActive
                  ? "border-t-2 border-foreground -mt-px text-foreground"
                  : "text-text-faint"
              )}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col">
        {activeTab === "posts" && (
          <div className="flex flex-col">
            {loadingPosts ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-text-faint" />
              </div>
            ) : posts.length === 0 ? (
              <p className="py-16 text-center text-sm text-text-faint">
                Nenhuma publicação ainda.
              </p>
            ) : (
              <section className="divide-y divide-hairline">
                {posts.map((p) => {
                  const isMine = currentUser?.id === p.user_id;
                  const isTeacher =
                    p.author.role === "professor" || p.author.role === "admin";
                  return (
                    <article key={p.id} className="px-4 py-4">
                      <header className="flex items-center justify-between">
                        <div
                          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            if (p.user_id !== displayProfile.user_id) {
                              onViewProfile?.(p.user_id);
                            }
                          }}
                        >
                          <Avatar name={p.author.display_name} size="md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold leading-tight">
                                {p.author.display_name}
                              </p>
                              {isTeacher && (
                                <span
                                  className="grid h-3.5 w-3.5 place-items-center rounded-full bg-foreground text-background"
                                  title="Professor verificado"
                                >
                                  <ShieldCheck className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-text-faint">
                              @{p.author.handle ?? "user"}
                              {p.author.course && ` · ${p.author.course}`}
                              {" · "}
                              {timeAgo(p.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            className="text-text-faint hover:text-foreground"
                            onClick={() =>
                              setOpenPostMenu(openPostMenu === p.id ? null : p.id)
                            }
                            aria-label="Mais opções"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                          {openPostMenu === p.id && isMine && (
                            <button
                              onClick={() => {
                                setOpenPostMenu(null);
                                removePost(p.id);
                              }}
                              className="absolute right-0 top-7 z-10 flex items-center gap-2 rounded-xl border border-hairline bg-surface-overlay px-3 py-2 text-xs font-medium text-destructive shadow-glow"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Apagar
                            </button>
                          )}
                        </div>
                      </header>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {p.content}
                      </p>

                      {p.media_url && (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-hairline bg-secondary">
                          {p.media_type?.startsWith("video/") ? (
                            <video
                              src={p.media_url}
                              controls
                              className="max-h-[420px] w-full bg-black object-contain"
                            />
                          ) : (
                            <img
                              src={p.media_url}
                              alt="Mídia do post"
                              className="max-h-[420px] w-full object-cover"
                            />
                          )}
                        </div>
                      )}

                      <footer className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => toggleLikePost(p)}
                            className="flex items-center gap-1.5 transition-smooth"
                          >
                            <Heart
                              className={cn(
                                "h-5 w-5 transition-smooth",
                                p.liked_by_me
                                  ? "fill-destructive text-destructive"
                                  : "text-text-subtle hover:text-foreground",
                              )}
                            />
                            <span className="text-xs font-medium text-text-subtle">
                              {p.likes_count}
                            </span>
                          </button>
                          <button
                            onClick={() => setOpenComments(p.id)}
                            className="flex items-center gap-1.5 text-text-subtle transition-smooth hover:text-foreground"
                          >
                            <MessageCircle className="h-5 w-5" />
                            <span className="text-xs font-medium">
                              {p.comments_count}
                            </span>
                          </button>
                          <button
                            className="text-text-subtle hover:text-foreground"
                            aria-label="Compartilhar"
                          >
                            <Send className="h-5 w-5" />
                          </button>
                        </div>
                        <button
                          onClick={() => toggleSavePost(p)}
                          className="text-text-subtle hover:text-foreground transition-smooth"
                          aria-label="Salvar"
                        >
                          <Bookmark
                            className={cn(
                              "h-5 w-5 transition-smooth",
                              p.saved_by_me
                                ? "fill-foreground text-foreground"
                                : "text-text-subtle hover:text-foreground",
                            )}
                          />
                        </button>
                      </footer>
                    </article>
                  );
                })}
              </section>
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="flex flex-col">
            {savedLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-text-faint" />
              </div>
            ) : savedPosts.length === 0 ? (
              <p className="py-16 text-center text-sm text-text-faint">
                Nenhuma publicação salva.
              </p>
            ) : (
              <section className="divide-y divide-hairline">
                {savedPosts.map((p) => {
                  const isTeacher =
                    p.author.role === "professor" || p.author.role === "admin";
                  return (
                    <article key={p.id} className="px-4 py-4">
                      <header className="flex items-center justify-between">
                        <div
                          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            if (p.user_id !== displayProfile.user_id) {
                              onViewProfile?.(p.user_id);
                            }
                          }}
                        >
                          <Avatar name={p.author.display_name} size="md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold leading-tight">
                                {p.author.display_name}
                              </p>
                              {isTeacher && (
                                <span
                                  className="grid h-3.5 w-3.5 place-items-center rounded-full bg-foreground text-background"
                                  title="Professor verificado"
                                >
                                  <ShieldCheck className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-text-faint">
                              @{p.author.handle ?? "user"}
                              {p.author.course && ` · ${p.author.course}`}
                              {" · "}
                              {timeAgo(p.created_at)}
                            </p>
                          </div>
                        </div>
                      </header>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {p.content}
                      </p>

                      {p.media_url && (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-hairline bg-secondary">
                          {p.media_type?.startsWith("video/") ? (
                            <video
                              src={p.media_url}
                              controls
                              className="max-h-[420px] w-full bg-black object-contain"
                            />
                          ) : (
                            <img
                              src={p.media_url}
                              alt="Mídia do post"
                              className="max-h-[420px] w-full object-cover"
                            />
                          )}
                        </div>
                      )}

                      <footer className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => toggleLikeSavedPost(p)}
                            className="flex items-center gap-1.5 transition-smooth"
                          >
                            <Heart
                              className={cn(
                                "h-5 w-5 transition-smooth",
                                p.liked_by_me
                                  ? "fill-destructive text-destructive"
                                  : "text-text-subtle hover:text-foreground",
                              )}
                            />
                            <span className="text-xs font-medium text-text-subtle">
                              {p.likes_count}
                            </span>
                          </button>
                          <button
                            onClick={() => setOpenComments(p.id)}
                            className="flex items-center gap-1.5 text-text-subtle transition-smooth hover:text-foreground"
                          >
                            <MessageCircle className="h-5 w-5" />
                            <span className="text-xs font-medium">
                              {p.comments_count}
                            </span>
                          </button>
                          <button
                            className="text-text-subtle hover:text-foreground"
                            aria-label="Compartilhar"
                          >
                            <Send className="h-5 w-5" />
                          </button>
                        </div>
                        <button
                          onClick={() => toggleSaveSavedPost(p)}
                          className="text-text-subtle hover:text-foreground transition-smooth"
                          aria-label="Salvar"
                        >
                          <Bookmark
                            className={cn(
                              "h-5 w-5 transition-smooth",
                              p.saved_by_me
                                ? "fill-foreground text-foreground"
                                : "text-text-subtle hover:text-foreground",
                            )}
                          />
                        </button>
                      </footer>
                    </article>
                  );
                })}
              </section>
            )}
          </div>
        )}

        {activeTab === "vagas" && (
          <p className="py-16 text-center text-sm text-text-faint">
            Nenhuma vaga compartilhada.
          </p>
        )}
      </div>

      {openComments && (
        <CommentsSheet
          postId={openComments}
          currentUser={currentUser || null}
          onClose={() => setOpenComments(null)}
          onViewProfile={(uid) => {
            setOpenComments(null);
            if (uid !== displayProfile.user_id) {
              onViewProfile?.(uid);
            }
          }}
        />
      )}

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!savingName && !uploadingAvatar) {
            setEditOpen(open);
            if (!open) {
              setAvatarFile(null);
              setAvatarPreview(null);
            }
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>
              Altere a foto, nome, curso e período do seu perfil.
            </DialogDescription>
          </DialogHeader>

          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar
                name={draftName || profileName}
                url={avatarPreview ?? avatarUrl}
                color="from-zinc-300 to-zinc-500"
                size="xl"
                ring
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background shadow-md hover:bg-foreground/80 transition-smooth"
                aria-label="Trocar foto de perfil"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("A foto deve ter no máximo 5 MB.");
                    return;
                  }
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }}
              />
            </div>
            <p className="text-[11px] text-text-faint">Toque na câmera para trocar a foto</p>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-text-faint">Nome</span>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={80}
              className="w-full rounded-xl border border-hairline bg-surface-elevated px-3 py-2.5 text-sm placeholder:text-text-faint focus:border-foreground/60 focus:outline-none"
              placeholder="Digite seu nome"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-text-faint">Curso</span>
              <input
                value={courseValue}
                onChange={(e) =>
                  setDraftCourse(
                    e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 50),
                  )
                }
                maxLength={50}
                className="w-full rounded-xl border border-hairline bg-surface-elevated px-3 py-2.5 text-sm placeholder:text-text-faint focus:border-foreground/60 focus:outline-none"
                placeholder="Ex: Engenharia"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-text-faint">
                Período
              </span>
              <input
                value={semesterValue}
                onChange={(e) =>
                  setDraftSemester(
                    e.target.value.replace(/\D/g, "").slice(0, 2),
                  )
                }
                inputMode="numeric"
                maxLength={2}
                className="w-full rounded-xl border border-hairline bg-surface-elevated px-3 py-2.5 text-sm placeholder:text-text-faint focus:border-foreground/60 focus:outline-none"
                placeholder="Ex: 5"
              />
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              disabled={savingName}
              onClick={() => {
                setDraftName(profileName);
                setDraftCourse(profileCourse);
                setDraftSemester(profileSemester);
                setEditOpen(false);
              }}
              className="rounded-xl border border-hairline bg-secondary px-4 py-2.5 text-sm font-semibold transition-smooth hover:bg-accent disabled:opacity-60"
            >
              Não salvar
            </button>
            <button
              type="button"
              disabled={savingName || uploadingAvatar}
              onClick={async () => {
                const trimmed = draftName.trim();
                if (trimmed.length < 2) {
                  toast.error("Digite um nome válido.");
                  return;
                }

                const courseText = draftCourse
                  .replace(/[^a-zA-Z\s]/g, "")
                  .trim();
                const semesterDigits = draftSemester
                  .replace(/\D/g, "")
                  .slice(0, 2);

                setSavingName(true);
                setUploadingAvatar(Boolean(avatarFile));

                try {
                  let newAvatarUrl: string | null = avatarUrl?.split("?")[0] ?? null;

                  if (avatarFile) {
                    if (!currentUser) {
                      toast.error("Faça login novamente para enviar a foto.");
                      return;
                    }

                    const ext = avatarFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
                    const filePath = `${currentUser.id}/avatar-${Date.now()}.${ext}`;
                    const { data: uploadData, error: uploadError } = await supabase.storage
                      .from("avatars")
                      .upload(filePath, avatarFile, {
                        contentType: avatarFile.type,
                        upsert: false,
                      });

                    if (uploadError) {
                      toast.error("Erro ao enviar foto: " + uploadError.message);
                      return;
                    }

                    const { data: pub } = supabase.storage
                      .from("avatars")
                      .getPublicUrl(uploadData.path);
                    newAvatarUrl = pub.publicUrl;
                  }

                  const { error } = await supabase
                    .from("profiles")
                    .update({
                      display_name: trimmed,
                      course: courseText || null,
                      semester: semesterDigits || null,
                      avatar_url: newAvatarUrl,
                    })
                    .eq("user_id", profile!.user_id);

                  if (error) {
                    toast.error(error.message);
                    return;
                  }

                  setProfileName(trimmed);
                  setProfileCourse(courseText);
                  setProfileSemester(semesterDigits);
                  setAvatarUrl(newAvatarUrl ? `${newAvatarUrl}?t=${Date.now()}` : null);
                  setAvatarFile(null);
                  setAvatarPreview(null);
                  setEditOpen(false);
                  toast.success("Perfil atualizado com sucesso.");
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? `Erro ao salvar perfil: ${error.message}`
                      : "Erro ao salvar perfil.",
                  );
                } finally {
                  setUploadingAvatar(false);
                  setSavingName(false);
                }
              }}
              className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-smooth hover:bg-foreground/90 disabled:opacity-60"
            >
              {savingName || uploadingAvatar ? "Salvando..." : "Salvar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={settingsOpen}
        onOpenChange={(open) => {
          if (!updatingPassword) {
            setSettingsOpen(open);
            if (!open) {
              setSecurityOpen(false);
              setEmailOpen(false);
              setUsernameOpen(false);
              setDraftEmailLocal(currentEmailLocal);
              setDraftUsername(profileUsername);
            }
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Configurações</DialogTitle>
            <DialogDescription>Gerencie sua conta.</DialogDescription>
          </DialogHeader>

          {!securityOpen && !emailOpen && !usernameOpen ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setUsernameOpen(true)}
                className="flex w-full items-center justify-between rounded-xl border border-hairline bg-surface-elevated px-3 py-3 text-left text-sm font-semibold transition-smooth hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Nome de usuário
                </span>
                <ChevronRight className="h-4 w-4 text-text-faint" />
              </button>
              <button
                type="button"
                onClick={() => setEmailOpen(true)}
                className="flex w-full items-center justify-between rounded-xl border border-hairline bg-surface-elevated px-3 py-3 text-left text-sm font-semibold transition-smooth hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Atualizar e-mail
                </span>
                <ChevronRight className="h-4 w-4 text-text-faint" />
              </button>
              <button
                type="button"
                onClick={() => setSecurityOpen(true)}
                className="flex w-full items-center justify-between rounded-xl border border-hairline bg-surface-elevated px-3 py-3 text-left text-sm font-semibold transition-smooth hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Senha e Segurança
                </span>
                <ChevronRight className="h-4 w-4 text-text-faint" />
              </button>
            </div>
          ) : usernameOpen ? (
            <div className="mx-auto w-full max-w-[320px] space-y-3">
              <label className="space-y-1">
                <span className="text-xs font-medium text-text-faint">
                  Nome de usuário
                </span>
                <div className="flex w-full max-w-full items-stretch overflow-hidden rounded-xl border border-hairline bg-surface-elevated">
                  <span className="border-r border-hairline px-3 py-2.5 text-sm text-text-faint">
                    @
                  </span>
                  <input
                    value={draftUsername}
                    onChange={(e) =>
                      setDraftUsername(
                        e.target.value
                          .replace(/[^a-z0-9._-]/gi, "")
                          .slice(0, 24),
                      )
                    }
                    placeholder="usuario"
                    maxLength={24}
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm placeholder:text-text-faint focus:outline-none"
                  />
                </div>
              </label>
              <p className="text-[11px] text-text-faint">
                O nome de usuário é diferente do nome exibido.
              </p>

              {lastUsernameChange &&
                (() => {
                  const lastChange = new Date(lastUsernameChange);
                  const nextChange = new Date(
                    lastChange.getTime() + 30 * 24 * 60 * 60 * 1000,
                  );
                  const now = new Date();
                  const canChange = now >= nextChange;
                  const daysLeft = Math.ceil(
                    (nextChange.getTime() - now.getTime()) /
                      (24 * 60 * 60 * 1000),
                  );

                  return (
                    <div
                      className={`rounded-xl border px-3 py-2 text-xs ${
                        canChange
                          ? "border-green-500/30 bg-green-500/10 text-green-700"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                      }`}
                    >
                      {canChange ? (
                        <p>✓ Você pode alterar seu nome de usuário agora.</p>
                      ) : (
                        <p>
                          Você poderá alterar em{" "}
                          <span className="font-semibold">
                            {daysLeft} dia{daysLeft !== 1 ? "s" : ""}
                          </span>
                          .
                        </p>
                      )}
                    </div>
                  );
                })()}

              <DialogFooter className="gap-2 sm:gap-0">
                <button
                  type="button"
                  disabled={savingUsername}
                  onClick={() => {
                    setDraftUsername(
                      profile.handle ?? profile.email.split("@")[0] ?? "",
                    );
                    setUsernameOpen(false);
                  }}
                  className="rounded-xl border border-hairline bg-secondary px-4 py-2.5 text-sm font-semibold transition-smooth hover:bg-accent disabled:opacity-60"
                >
                  Não salvar
                </button>
                <button
                  type="button"
                  disabled={
                    savingUsername ||
                    (() => {
                      if (!lastUsernameChange) return false;
                      const lastChange = new Date(lastUsernameChange);
                      const nextChange = new Date(
                        lastChange.getTime() + 30 * 24 * 60 * 60 * 1000,
                      );
                      return new Date() < nextChange;
                    })()
                  }
                  onClick={async () => {
                    const username = draftUsername.trim().toLowerCase();
                    if (username.length < 3) {
                      toast.error("Digite um nome de usuário válido.");
                      return;
                    }

                    if (!/^[a-z0-9._-]+$/i.test(username)) {
                      toast.error(
                        "Use apenas letras, números, ponto, hífen ou underline.",
                      );
                      return;
                    }

                    setSavingUsername(true);
                    const { error } = await supabase
                      .from("profiles")
                      .update({ handle: username })
                      .eq("user_id", profile.user_id);
                    setSavingUsername(false);

                    if (error) {
                      toast.error(error.message);
                      return;
                    }

                    setProfileUsername(username);
                    setLastUsernameChange(new Date().toISOString());
                    setUsernameOpen(false);
                    toast.success("Nome de usuário atualizado com sucesso.");
                  }}
                  className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-smooth hover:bg-foreground/90 disabled:opacity-60"
                >
                  {savingUsername ? "Salvando..." : "Salvar"}
                </button>
              </DialogFooter>
            </div>
          ) : emailOpen ? (
            <div className="mx-auto w-full max-w-[320px] space-y-3">
              <label className="space-y-1">
                <span className="text-xs font-medium text-text-faint">
                  E-mail
                </span>
                <div className="flex w-full max-w-full flex-col overflow-hidden rounded-xl border border-hairline bg-surface-elevated sm:flex-row sm:items-stretch">
                  <input
                    value={emailLocalValue}
                    onChange={(e) =>
                      setDraftEmailLocal(e.target.value.slice(0, 15))
                    }
                    placeholder="modulo"
                    maxLength={15}
                    className={
                      "min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm placeholder:text-text-faint focus:outline-none " +
                      (emailLimitReached ? "text-destructive" : "")
                    }
                  />
                  <div className="break-all border-t border-hairline px-3 py-2.5 text-sm text-text-faint sm:border-l sm:border-t-0 sm:whitespace-nowrap">
                    @{currentEmailDomain}
                  </div>
                </div>
              </label>
              <p
                className={
                  "text-[11px] " +
                  (emailLimitReached ? "text-destructive" : "text-text-faint")
                }
              >
                Limite de caracteres: 15. Você pode alterar apenas a parte antes
                do @.
              </p>
              <p className="break-words rounded-xl border border-hairline bg-secondary px-3 py-2 text-xs text-text-subtle">
                Novo e-mail:{" "}
                <span className="font-semibold text-foreground">
                  {previewEmail}
                </span>
              </p>

              <DialogFooter className="gap-2 sm:gap-0">
                <button
                  type="button"
                  disabled={savingEmail}
                  onClick={() => {
                    setDraftEmailLocal(currentEmailLocal);
                    setEmailOpen(false);
                  }}
                  className="rounded-xl border border-hairline bg-secondary px-4 py-2.5 text-sm font-semibold transition-smooth hover:bg-accent disabled:opacity-60"
                >
                  Não salvar
                </button>
                <button
                  type="button"
                  disabled={savingEmail}
                  onClick={async () => {
                    const localPart = draftEmailLocal.trim().toLowerCase();
                    if (localPart.length < 2) {
                      toast.error("Digite uma parte válida antes do @.");
                      return;
                    }

                    if (!/^[a-z0-9._-]+$/i.test(localPart)) {
                      toast.error(
                        "Use apenas letras, números, ponto, hífen ou underline.",
                      );
                      return;
                    }

                    const nextEmail = `${localPart}@${currentEmailDomain}`;
                    if (nextEmail === profile.email) {
                      toast.message("O e-mail já está igual ao atual.");
                      return;
                    }

                    setSavingEmail(true);
                    const [{ error: authError }, { error: profileError }] =
                      await Promise.all([
                        supabase.auth.updateUser({ email: nextEmail }),
                        supabase
                          .from("profiles")
                          .update({ email: nextEmail })
                          .eq("user_id", profile.user_id),
                      ]);
                    setSavingEmail(false);

                    if (authError) {
                      if (isRateLimitError(authError.message)) {
                        toast.error(
                          "Supabase limitou a troca de e-mail por enquanto. Tente mais tarde.",
                        );
                      } else {
                        toast.error(authError.message);
                      }
                      return;
                    }

                    if (profileError) {
                      toast.error(profileError.message);
                      return;
                    }

                    setEmailOpen(false);
                    toast.success("E-mail atualizado com sucesso.");
                  }}
                  className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-smooth hover:bg-foreground/90 disabled:opacity-60"
                >
                  {savingEmail ? "Salvando..." : "Salvar"}
                </button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="space-y-1">
                <span className="text-xs font-medium text-text-faint">
                  Nova senha
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-hairline bg-surface-elevated px-3 py-2.5 text-sm placeholder:text-text-faint focus:border-foreground/60 focus:outline-none"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-text-faint">
                  Confirmar nova senha
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full rounded-xl border border-hairline bg-surface-elevated px-3 py-2.5 text-sm placeholder:text-text-faint focus:border-foreground/60 focus:outline-none"
                />
              </label>

              <DialogFooter className="gap-2 sm:gap-0">
                <button
                  type="button"
                  disabled={updatingPassword}
                  onClick={() => {
                    setSecurityOpen(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="rounded-xl border border-hairline bg-secondary px-4 py-2.5 text-sm font-semibold transition-smooth hover:bg-accent disabled:opacity-60"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={updatingPassword}
                  onClick={async () => {
                    if (newPassword.length < 8) {
                      toast.error(
                        "A nova senha precisa ter no mínimo 8 caracteres.",
                      );
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      toast.error("As senhas não conferem.");
                      return;
                    }

                    setUpdatingPassword(true);
                    const { error } = await supabase.auth.updateUser({
                      password: newPassword,
                    });
                    setUpdatingPassword(false);

                    if (error) {
                      toast.error(error.message);
                      return;
                    }

                    toast.success("Senha atualizada com sucesso.");
                    setNewPassword("");
                    setConfirmPassword("");
                    setSecurityOpen(false);
                    setSettingsOpen(false);
                  }}
                  className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-smooth hover:bg-foreground/90 disabled:opacity-60"
                >
                  {updatingPassword ? "Salvando..." : "Alterar senha"}
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) setDeleteOpen(open);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Deletar conta?</DialogTitle>
            <DialogDescription>
              Essa ação apaga seu perfil, posts, comentários e acesso. Depois
              disso, você terá que criar a conta novamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
              className="rounded-xl border border-hairline bg-secondary px-4 py-2.5 text-sm font-semibold transition-smooth hover:bg-accent disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                const result = await onDeleteAccount();
                setDeleting(false);
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Conta deletada com sucesso.");
                setDeleteOpen(false);
              }}
              className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-background transition-smooth hover:bg-destructive/90 disabled:opacity-60"
            >
              {deleting ? "Deletando..." : "Sim, deletar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
