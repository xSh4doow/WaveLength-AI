import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music2, Play, Search, Loader2, Heart, Menu } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getSongs, getSongsByUser, getFriendsSongs, getAudioUrl, type Song } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQueue } from "@/contexts/QueueContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { SongTags } from "@/components/ui/song-tags";

export const Library = () => {
  const navigate = useNavigate();
  const { userId, userName, logout } = useAuth();
  const { setQueue } = useQueue();
  const { setPlayerState } = usePlayer();

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [mySongs, setMySongs] = useState<Song[]>([]);
  const [friendsSongs, setFriendsSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load songs from backend
  useEffect(() => {
    if (!userId) {
      return;
    }

    const loadSongs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load all tabs data in parallel
        const [all, mine, friends] = await Promise.all([
          getSongs(100, 0),
          getSongsByUser(userName || "", 100, 0),
          getFriendsSongs(userId, 100, 0),
        ]);

        setAllSongs(all);
        setMySongs(mine);
        setFriendsSongs(friends);

        // Set initial filtered songs based on active tab
        if (activeTab === "all") setFilteredSongs(all);
        else if (activeTab === "mine") setFilteredSongs(mine);
        else if (activeTab === "friends") setFilteredSongs(friends);
      } catch (err) {
        console.error("Error loading songs:", err);
        setError("Erro ao carregar músicas");
      } finally {
        setIsLoading(false);
      }
    };

    loadSongs();
  }, [userId, userName, activeTab]);

  // Filter and sort songs
  useEffect(() => {
    let sourceSongs: Song[] = [];
    if (activeTab === "all") sourceSongs = allSongs;
    else if (activeTab === "mine") sourceSongs = mySongs;
    else if (activeTab === "friends") sourceSongs = friendsSongs;

    let result = [...sourceSongs];

    // Search filter
    if (searchQuery) {
      result = result.filter(
        (song) =>
          song.song_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.tags?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Genre filter
    if (filterGenre !== "all") {
      result = result.filter((song) => song.genre?.toLowerCase() === filterGenre);
    }

    // Sort
    if (sortBy === "recent") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    setFilteredSongs(result);
  }, [allSongs, mySongs, friendsSongs, activeTab, searchQuery, filterGenre, sortBy]);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handlePlaySong = (song: Song) => {
    setQueue([song], 0);
    setPlayerState("maximized");
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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Início
              </button>
              <button className="text-foreground hover:text-primary transition-colors">
                Criações
              </button>
              <button
                onClick={handleLogout}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Sair
              </button>
            </nav>

            {/* Mobile Navigation */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-6">
                  <button
                    onClick={() => {
                      navigate("/dashboard");
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left text-lg font-semibold text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Início
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left text-lg font-semibold text-foreground hover:text-primary transition-colors py-2"
                  >
                    Criações
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left text-lg font-semibold text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Sair
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Biblioteca</h1>
            <p className="text-muted-foreground">
              Explore suas criações e músicas de amigos
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" className="mb-6" onValueChange={(value) => setActiveTab(value)}>
            <TabsList className="glass-effect">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="mine">Minhas</TabsTrigger>
              <TabsTrigger value="friends">Amigos</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="glass-effect rounded-3xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar músicas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Genre Filter */}
              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os gêneros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os gêneros</SelectItem>
                  <SelectItem value="ambient">Ambient</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="eletronica">Eletrônica</SelectItem>
                  <SelectItem value="lo-fi">Lo-fi</SelectItem>
                  <SelectItem value="classica">Clássica</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="popular">Mais populares</SelectItem>
                  <SelectItem value="oldest">Mais antigas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Carregando suas músicas...</p>
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
          {!isLoading && !error && filteredSongs.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <Music2 className="w-16 h-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchQuery || filterGenre !== "all"
                    ? "Nenhuma música encontrada com esses filtros"
                    : activeTab === "all"
                    ? "Nenhuma música disponível"
                    : activeTab === "mine"
                    ? "Você ainda não criou nenhuma música"
                    : "Nenhum amigo com músicas"}
                </p>
                {!searchQuery && filterGenre === "all" && activeTab === "mine" && (
                  <Button onClick={() => navigate("/create")}>Criar Primeira Música</Button>
                )}
              </div>
            </div>
          )}

          {/* Songs Grid */}
          {!isLoading && !error && filteredSongs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSongs.map((song) => {
                const imageUrl = song.image_path ? getAudioUrl(song.image_path) : "";

                return (
                  <div
                    key={song.id}
                    className="glass-effect rounded-xl p-4 hover:scale-105 transition-transform group cursor-pointer"
                    onClick={() => handlePlaySong(song)}
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
                      {/* Favorite indicator */}
                      {song.is_liked && (
                        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center">
                          <Heart className="w-4 h-4 text-primary-foreground fill-current" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                          <Play className="w-8 h-8 text-primary-foreground ml-1" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg truncate">
                        {song.song_name}
                      </h3>
                      {song.caption && (
                        <p className="text-xs text-muted-foreground truncate">
                          {song.caption}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm gap-2">
                        <SongTags song={song} maxTags={2} />
                        <span className="text-muted-foreground whitespace-nowrap">
                          {formatDuration(song.duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Library;
