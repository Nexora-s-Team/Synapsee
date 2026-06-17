import React, { useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Search, ArrowLeft, UserPlus, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/sinapse/Avatar";
import { Button } from "@/components/ui/button";
import { useConnections, ConnectionUser } from "@/hooks/useConnections";
import { useFollow } from "@/hooks/useFollow";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav, Tab } from "@/components/sinapse/BottomNav";

export const ConnectionsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const initialTab =
    (searchParams.get("tab") as "followers" | "following") || "followers";

  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { followers, following, isLoading, refresh } = useConnections(userId!);
  const { follow, unfollow, loading: followLoading } = useFollow();

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const currentList = useMemo(() => {
    return activeTab === "followers" ? followers : following;
  }, [activeTab, followers, following]);

  const filteredUsers = useMemo(() => {
    if (!currentList) return [];
    return currentList.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [currentList, searchQuery]);

  const goBack = () => navigate(-1);
  const isOwnProfile = currentUser?.id === userId;

  const handleFollowAction = async (
    targetUserId: string,
    isFollowing: boolean,
  ) => {
    if (isFollowing) {
      await unfollow(targetUserId);
    } else {
      await follow(targetUserId);
    }
    await refresh();
  };

  if (!userId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Usuário não encontrado.
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-background font-sans text-foreground shadow-glow">
      <div className="flex flex-1 flex-col overflow-hidden">
      <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur-sm">
        <button
          onClick={goBack}
          className="mr-3 rounded-full p-1.5 hover:bg-secondary"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Conexões</h1>
      </header>

      <Tabs
        defaultValue={initialTab}
        onValueChange={(val) => {
          setActiveTab(val);
          setSearchQuery("");
        }}
        className="flex flex-1 flex-col"
      >
        <TabsList className="w-full justify-start rounded-none bg-transparent p-0 border-b border-border h-12">
          <TabsTrigger
            value="followers"
            className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent font-medium text-sm transition-all"
          >
            {followers?.length || 0} seguidores
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent font-medium text-sm transition-all"
          >
            {following?.length || 0} seguindo
          </TabsTrigger>
        </TabsList>

        <div className="p-4 sticky top-14 bg-background z-10">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/50 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="followers" className="m-0 h-full">
            <UserList
              users={filteredUsers}
              type="followers"
              isLoading={isLoading}
              currentUserId={currentUser?.id}
              isOwnProfile={isOwnProfile}
              onAction={handleFollowAction}
              followLoading={followLoading}
            />
          </TabsContent>
          <TabsContent value="following" className="m-0 h-full">
            <UserList
              users={filteredUsers}
              type="following"
              isLoading={isLoading}
              currentUserId={currentUser?.id}
              isOwnProfile={isOwnProfile}
              onAction={handleFollowAction}
              followLoading={followLoading}
            />
          </TabsContent>
        </div>
      </Tabs>
      </div>
      <BottomNav active="perfil" onChange={(tab: Tab) => navigate(`/app/${tab}`)} />
    </main>
  );
};

interface UserListProps {
  users: ConnectionUser[];
  type: "followers" | "following";
  isLoading: boolean;
  currentUserId?: string;
  isOwnProfile: boolean;
  onAction: (targetUserId: string, isFollowing: boolean) => Promise<void>;
  followLoading: boolean;
}

const UserList: React.FC<UserListProps> = ({
  users,
  type,
  isLoading,
  currentUserId,
  isOwnProfile,
  onAction,
  followLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground animate-pulse">
        Carregando lista...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <p className="text-sm font-medium text-muted-foreground">
          {type === "followers"
            ? "Nenhum seguidor ainda."
            : "Você não está seguindo ninguém."}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full px-4 pb-4">
      <div className="space-y-4">
        {users.map((user) => {
          const isFollowedByMe = user.is_followed_by_me || false;
          const showAction =
            currentUserId && currentUserId !== user.id && isOwnProfile;

          return (
            <div
              key={user.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                <Avatar
                  url={user.avatar_url}
                  name={user.username || "Usuário"}
                  className="h-11 w-11 rounded-full border border-border"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate text-foreground hover:underline">
                    {user.username || "usuario"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.full_name || "Nome do Usuário"}
                  </span>
                </div>
              </div>

              {showAction && (
                <div className="flex-shrink-0">
                  {type === "followers" ? (
                    isFollowedByMe ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onAction(user.id, true)}
                        disabled={followLoading}
                        className="h-8 rounded-lg text-xs font-semibold px-4 bg-muted hover:bg-muted/80 text-foreground"
                      >
                        <UserCheck className="mr-1 h-3.5 w-3.5" />
                        Seguindo
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onAction(user.id, false)}
                        disabled={followLoading}
                        className="h-8 rounded-lg text-xs font-semibold px-4 bg-primary text-primary-foreground hover:bg-primary/95"
                      >
                        <UserPlus className="mr-1 h-3.5 w-3.5" />
                        Seguir de volta
                      </Button>
                    )
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onAction(user.id, true)}
                      disabled={followLoading}
                      className="h-8 rounded-lg text-xs font-semibold px-4 bg-muted hover:bg-muted/80 text-foreground"
                    >
                      <UserCheck className="mr-1 h-3.5 w-3.5" />
                      Seguindo
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};