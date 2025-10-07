import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { QueueProvider } from "./contexts/QueueContext";
import { PlayerProvider } from "./contexts/PlayerContext";
import { GlobalPlayer } from "./components/Player/GlobalPlayer";
import Index from "./pages/Index";
// import Auth from "./pages/Auth"; // TODO: Reativar autenticação futuramente
import Dashboard from "./pages/Dashboard";
import Create from "./pages/Create";
import Player from "./pages/Player";
import Library from "./pages/Library";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <QueueProvider>
        <PlayerProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* <Route path="/auth" element={<Auth />} /> */}
                {/* TODO: Autenticação temporariamente desabilitada */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create" element={<Create />} />
                <Route path="/player/:id" element={<Player />} />
                <Route path="/library" element={<Library />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              {/* Global Player - Visible on all pages */}
              <GlobalPlayer />
            </BrowserRouter>
          </TooltipProvider>
        </PlayerProvider>
      </QueueProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
