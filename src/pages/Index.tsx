import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { BottomNav, Tab } from "@/components/sinapse/BottomNav";
import { LoginScreen } from "@/components/sinapse/screens/LoginScreen";
import { FeedScreen } from "@/components/sinapse/screens/FeedScreen";
import { AvisosScreen } from "@/components/sinapse/screens/AvisosScreen";
import { VagasScreen } from "@/components/sinapse/screens/VagasScreen";
import { MensagensScreen } from "@/components/sinapse/screens/MensagensScreen";
import { PerfilScreen } from "@/components/sinapse/screens/PerfilScreen";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";

const DEFAULT_TAB: Tab = "feed";

const isTab = (value: string | undefined): value is Tab => {
  return (
    value === "feed" ||
    value === "avisos" ||
    value === "vagas" ||
    value === "mensagens" ||
    value === "perfil"
  );
};

const Index = () => {
  const { session, user, profile, role, loading, signOut, deleteAccount } =
    useAuth();
  const navigate = useNavigate();
  const { tab: routeTab } = useParams<{ tab?: string }>();
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const tab: Tab = isTab(routeTab) ? routeTab : DEFAULT_TAB;

  useEffect(() => {
    if (loading) return;

    if (!session) {
      if (routeTab) navigate("/", { replace: true });
      return;
    }

    if (!isTab(routeTab)) navigate(`/app/${DEFAULT_TAB}`, { replace: true });
  }, [loading, session, routeTab, navigate]);

  const handleChangeTab = (nextTab: Tab) => {
    setViewingUserId(null);
    navigate(`/app/${nextTab}`);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-background font-sans text-foreground shadow-glow">
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-text-faint" />
        </div>
      ) : !session ? (
        <LoginScreen />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto pb-2">
            {viewingUserId ? (
              <PerfilScreen
                currentUser={user}
                onLogout={signOut}
                onDeleteAccount={deleteAccount}
                profile={profile}
                role={role}
                emailVerified={Boolean(user?.email_confirmed_at)}
                targetUserId={viewingUserId}
                onBack={() => setViewingUserId(null)}
                onViewProfile={setViewingUserId}
              />
            ) : (
              <>
                {tab === "feed" && (
                  <FeedScreen
                    user={user}
                    profile={profile}
                    onViewProfile={setViewingUserId}
                  />
                )}
                {tab === "avisos" && <AvisosScreen user={user} role={role} />}
                {tab === "vagas" && <VagasScreen />}
                {tab === "mensagens" && <MensagensScreen />}
                {tab === "perfil" && (
                  <PerfilScreen
                    currentUser={user}
                    onLogout={signOut}
                    onDeleteAccount={deleteAccount}
                    profile={profile}
                    role={role}
                    emailVerified={Boolean(user?.email_confirmed_at)}
                    onViewProfile={setViewingUserId}
                  />
                )}
              </>
            )}
          </div>
          <BottomNav active={tab} onChange={handleChangeTab} />
        </>
      )}
    </main>
  );
};

export default Index;
