import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music2, Play, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import demoPhoto from "@/assets/demo-photo.jpg";

// Mock data - biblioteca global
const allSongs = [
  {
    id: "1",
    name: "Sunset Dreams",
    image: demoPhoto,
    creator: "Usuário Demo",
    createdAt: "2024-01-15",
    duration: "3:24",
    genre: "Ambient",
  },
  {
    id: "2",
    name: "Mountain Vibes",
    image: demoPhoto,
    creator: "João Silva",
    createdAt: "2024-01-14",
    duration: "2:45",
    genre: "Rock",
  },
  {
    id: "3",
    name: "Ocean Waves",
    image: demoPhoto,
    creator: "Maria Santos",
    createdAt: "2024-01-13",
    duration: "4:12",
    genre: "Eletrônica",
  },
  {
    id: "4",
    name: "City Lights",
    image: demoPhoto,
    creator: "Pedro Costa",
    createdAt: "2024-01-12",
    duration: "3:56",
    genre: "Lo-fi",
  },
  {
    id: "5",
    name: "Forest Path",
    image: demoPhoto,
    creator: "Ana Paula",
    createdAt: "2024-01-11",
    duration: "5:18",
    genre: "Clássica",
  },
  {
    id: "6",
    name: "Rainy Day",
    image: demoPhoto,
    creator: "Carlos Lima",
    createdAt: "2024-01-10",
    duration: "2:33",
    genre: "Jazz",
  },
];

export const Library = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Criações</h1>
            <p className="text-muted-foreground">
              Explore músicas geradas por toda a comunidade
            </p>
          </div>

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

          {/* Songs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allSongs.map((song) => (
              <div
                key={song.id}
                className="glass-effect rounded-xl p-4 hover:scale-105 transition-transform group cursor-pointer"
                onClick={() => navigate(`/player/${song.id}`)}
              >
                <div className="aspect-square rounded-lg overflow-hidden mb-4 relative">
                  <img
                    src={song.image}
                    alt={song.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                      <Play className="w-8 h-8 text-primary-foreground ml-1" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg truncate">
                    {song.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    Por {song.creator}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="px-2 py-1 rounded-full glass-effect text-xs">
                      {song.genre}
                    </span>
                    <span className="text-muted-foreground">
                      {song.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Library;
