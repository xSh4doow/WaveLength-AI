import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { QueueProvider } from "./contexts/QueueContext";
import { PlayerProvider } from "./contexts/PlayerContext";
import { GlobalPlayer } from "./components/Player/GlobalPlayer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Create from "./pages/Create";
import Player from "./pages/Player";
import Library from "./pages/Library";
import Play from "./pages/Play";
import NotFound from "./pages/NotFound";
import { useAuth } from "./contexts/AuthContext";

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserProvider>
        <QueueProvider>
          <PlayerProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/play/:id" element={<Play />} /> {/* Public sharing route */}

                  {/* Protected routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
                  <Route path="/player/:id" element={<ProtectedRoute><Player /></ProtectedRoute>} />
                  <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />

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
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
