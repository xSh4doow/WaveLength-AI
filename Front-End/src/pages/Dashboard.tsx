import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music2, Plus, Play, MoreVertical, Download, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import demoPhoto from "@/assets/demo-photo.jpg";

// Mock data
const mockSongs = [
  {
    id: "1",
    name: "Sunset Dreams",
    image: demoPhoto,
    createdAt: "2024-01-15",
    duration: "3:24",
  },
  {
    id: "2",
    name: "Mountain Vibes",
    image: demoPhoto,
    createdAt: "2024-01-14",
    duration: "2:45",
  },
  {
    id: "3",
    name: "Ocean Waves",
    image: demoPhoto,
    createdAt: "2024-01-13",
    duration: "4:12",
  },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const [songs] = useState(mockSongs);

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Music2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Wavelength
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <button className="text-foreground hover:text-primary transition-colors">
                Início
              </button>
              <button 
                onClick={() => navigate("/library")}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Criações
              </button>
              <button 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Sair
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Profile Section */}
          <div className="glass-effect rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground">
                U
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Usuário Demo</h1>
                <p className="text-muted-foreground">
                  {songs.length} músicas criadas
                </p>
              </div>
            </div>
          </div>

          {/* Library Section */}
          <div className="glass-effect rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Sua Biblioteca</h2>
              <Button 
                variant="hero" 
                size="lg"
                onClick={() => navigate("/create")}
              >
                <Plus className="w-5 h-5 mr-2" />
                Crie sua Música
              </Button>
            </div>

            {/* Songs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="glass-effect rounded-xl p-4 hover:scale-105 transition-transform group"
                >
                  <div className="aspect-square rounded-lg overflow-hidden mb-4 relative">
                    <img
                      src={song.image}
                      alt={song.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => navigate(`/player/${song.id}`)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <Play className="w-8 h-8 text-primary-foreground ml-1" />
                      </div>
                    </button>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate mb-1">
                        {song.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {song.duration}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/player/${song.id}`)}>
                          <Play className="w-4 h-4 mr-2" />
                          Reproduzir
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* FAB Button Mobile */}
      <button
        onClick={() => navigate("/create")}
        className="fixed bottom-6 right-6 md:hidden w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </button>
    </div>
  );
};

export default Dashboard;
