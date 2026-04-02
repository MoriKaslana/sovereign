import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"; 
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { GameProvider, useGame } from "@/context/GameContext";
import AppSidebar from "@/components/AppSidebar";
import PlayerStatusBar from "@/components/PlayerStatusBar";
import AuthScreen from "@/components/AuthScreen";
import QuestBoard from "@/pages/QuestBoard";
import ReviewBoard from "@/pages/ReviewBoard";
import Tavern from "@/pages/Tavern";
import Codex from "@/pages/Codex";
import HallOfFame from "@/pages/HallOfFame";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react"; 

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { currentUser } = useGame();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Jika session hilang/logout dan URL bukan di /login, paksa pindah URL ke /login
    if (!currentUser && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
    // 2. Jika user sudah login tapi iseng ngetik /login di URL, balikin ke /quests
    if (currentUser && location.pathname === "/login") {
      navigate("/quests", { replace: true });
    }
  }, [currentUser, navigate, location.pathname]);

  // JIKA BELUM LOGIN: Tampilkan AuthScreen di rute /login
  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<AuthScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // JIKA SUDAH LOGIN: Tampilkan layout dashboard lo yang asli
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center justify-between border-b border-border px-2">
            <div className="flex items-center">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <span className="ml-3 font-heading text-sm text-muted-foreground">
                {currentUser.role === "guild_master" ? "👑 Guild Master" : "⚔️ Adventurer"} — {currentUser.username}
              </span>
            </div>
            <PlayerStatusBar />
          </header>
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/quests" element={<QuestBoard />} />
              <Route path="/review" element={<ReviewBoard />} />
              <Route path="/tavern" element={<Tavern />} />
              <Route path="/codex" element={<Codex />} />
              <Route path="/fame" element={<HallOfFame />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/" element={<Navigate to="/quests" replace />} />
              
              {/* 👇 TAMBAHAN GW DI SINI BIAR GAK ERROR 404 LAGI 👇 */}
              <Route path="/login" element={<Navigate to="/quests" replace />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GameProvider>
        <BrowserRouter>
          <AuthenticatedApp />
        </BrowserRouter>
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;