import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Shot from "./pages/Shot";
import NotFound from "./pages/NotFound";
import { ConnectionsPage } from "@/components/sinapse/ConnectionsPage";

const queryClient = new QueryClient();

<Route
  path="/connections/:userId"
  element={<ConnectionsPage />}
/>

const App = () => {
  const basename = import.meta.env.MODE === "production" ? "/" : "/";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={basename}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/app" element={<Index />} />
            <Route path="/app/:tab" element={<Index />} />
            <Route path="/shot/:screen" element={<Shot />} />
            {/* Rota da página de conexões */}
            <Route path="/perfil/:userId/conexoes" element={<ConnectionsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;