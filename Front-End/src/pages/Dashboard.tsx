import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music2, Plus, Play, MoreVertical, Download, Trash2, Loader2, PlayCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSongsByUser, getAudioUrl, deleteSong, type Song } from "@/services/api";
import { useUser } from "@/contexts/UserContext";
import { useQueue } from "@/contexts/QueueContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { toast } from "@/hooks/use-toast";

export const Dashboard = () => {
  const navigate = useNavigate();
  const { userName, clearUser } = useUser();
  const { setQueue } = useQueue();
  const { setPlayerState } = usePlayer();

  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load songs from backend
  useEffect(() => {
    if (!userName) {
      navigate("/");
      return;
    }

    const loadSongs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userSongs = await getSongsByUser(userName);
        setSongs(userSongs);
      } catch (err) {
        console.error("Error loading songs:", err);
        setError("Erro ao carregar músicas");
        setSongs([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSongs();
  }, [userName, navigate]);

  const handleLogout = () => {
    clearUser();
    navigate("/");
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    setQueue(songs, 0);
    setPlayerState("maximized");
    toast({
      title: "Tocando todas as músicas",
      description: `${songs.length} música(s) na fila`,
    });
  };

  const handlePlaySong = (song: Song) => {
    setQueue([song], 0);
    setPlayerState("maximized");
  };

  const handleDelete = async (songId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta música?")) return;

    try {
      await deleteSong(songId);
      setSongs((prev) => prev.filter((s) => s.id !== songId));
      toast({
        title: "Música excluída",
        description: "A música foi removida com sucesso",
      });
    } catch (err) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a música",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground">
                  {userName ? userName[0].toUpperCase() : "U"}
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{userName || "Usuário"}</h1>
                  <p className="text-muted-foreground">
                    {songs.length} música{songs.length !== 1 ? "s" : ""} criada{songs.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Play All Button */}
              {songs.length > 0 && (
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handlePlayAll}
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Ouvir Minhas Músicas
                </Button>
              )}
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

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Carregando sua biblioteca...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <p className="text-destructive">{error}</p>
                  <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && songs.length === 0 && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <Music2 className="w-16 h-16 mx-auto text-muted-foreground" />
                  <p className="text-xl font-semibold">Comece sua jornada musical!</p>
                  <p className="text-muted-foreground">
                    Crie sua primeira música a partir de uma foto
                  </p>
                  <Button size="lg" onClick={() => navigate("/create")}>
                    <Plus className="w-5 h-5 mr-2" />
                    Criar Primeira Música
                  </Button>
                </div>
              </div>
            )}

            {/* Songs Grid */}
            {!isLoading && !error && songs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {songs.slice(0, 6).map((song) => {
                  const imageUrl = song.image_path ? getAudioUrl(song.image_path) : "";

                  return (
                    <div
                      key={song.id}
                      className="glass-effect rounded-xl p-4 hover:scale-105 transition-transform group"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden mb-4 relative">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={song.song_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
                        )}
                        <button
                          onClick={() => handlePlaySong(song)}
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
                            {song.song_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDuration(song.duration)}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePlaySong(song)}>
                              <Play className="w-4 h-4 mr-2" />
                              Reproduzir
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const audioUrl = getAudioUrl(song.audio_path);
                                const link = document.createElement("a");
                                link.href = audioUrl;
                                link.download = `${song.song_name}.wav`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Baixar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(song.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View All Button */}
            {!isLoading && !error && songs.length > 6 && (
              <div className="mt-8 text-center">
                <Button variant="outline" size="lg" onClick={() => navigate("/library")}>
                  Ver Todas as Músicas ({songs.length})
                </Button>
              </div>
            )}
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
