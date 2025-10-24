/**
 * Playlists - User's playlists page
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Music, Lock, Globe, MoreVertical, Trash2, Edit, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { useQueue } from "@/contexts/QueueContext";
import {
  getUserPlaylists,
  getPlaylistSongs,
  createPlaylist,
  deletePlaylist,
  updatePlaylist,
  type Playlist,
} from "@/services/api";

export default function Playlists() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const { setQueue } = useQueue();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadPlaylists();
    }
  }, [user]);

  const loadPlaylists = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getUserPlaylists(user.id);
      setPlaylists(data);
    } catch (error) {
      console.error("Failed to load playlists:", error);
      toast({
        title: "Erro ao carregar playlists",
        description: "Não foi possível carregar suas playlists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!user?.id || !name.trim()) return;

    try {
      if (editingPlaylist) {
        // Update existing playlist
        await updatePlaylist(editingPlaylist.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          is_public: isPublic,
        });
        toast({ title: "Playlist atualizada!", description: name });
      } else {
        // Create new playlist
        await createPlaylist({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || undefined,
          is_public: isPublic,
        });
        toast({ title: "Playlist criada!", description: name });
      }

      // Reset form and reload
      setShowCreateDialog(false);
      setEditingPlaylist(null);
      setName("");
      setDescription("");
      setIsPublic(true);
      loadPlaylists();
    } catch (error) {
      console.error("Failed to save playlist:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a playlist",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlaylist = async (playlistId: number, playlistName: string) => {
    if (!confirm(`Deseja realmente excluir "${playlistName}"?`)) return;

    try {
      await deletePlaylist(playlistId);
      toast({ title: "Playlist excluída", description: playlistName });
      loadPlaylists();
    } catch (error) {
      console.error("Failed to delete playlist:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a playlist",
        variant: "destructive",
      });
    }
  };

  const handlePlayPlaylist = async (playlistId: number) => {
    try {
      const songs = await getPlaylistSongs(playlistId);
      if (songs.length === 0) {
        toast({
          title: "Playlist vazia",
          description: "Adicione músicas à playlist primeiro",
        });
        return;
      }

      setQueue(songs);
      toast({ title: "Tocando playlist", description: `${songs.length} músicas` });
    } catch (error) {
      console.error("Failed to load playlist songs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as músicas",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setName(playlist.name);
    setDescription(playlist.description || "");
    setIsPublic(playlist.is_public);
    setShowCreateDialog(true);
  };

  const openCreateDialog = () => {
    setEditingPlaylist(null);
    setName("");
    setDescription("");
    setIsPublic(true);
    setShowCreateDialog(true);
  };

  if (!user) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Minhas Playlists</h1>
          <p className="text-muted-foreground">Faça login para ver suas playlists</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Minhas Playlists</h1>
          <p className="text-muted-foreground">
            {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Playlist
        </Button>
      </div>

      {/* Playlists Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-12">
          <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground mb-4">Nenhuma playlist ainda</p>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Playlist
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="group relative glass-effect rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate(`/playlist/${playlist.id}`)}
            >
              {/* Playlist Icon */}
              <div className="aspect-square rounded-xl bg-gradient-to-br from-primary to-accent mb-4 flex items-center justify-center">
                <Music className="w-16 h-16 text-white" />
              </div>

              {/* Playlist Info */}
              <h3 className="font-bold text-lg mb-1 truncate">{playlist.name}</h3>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {playlist.description || "Sem descrição"}
              </p>

              {/* Meta */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {playlist.is_public ? (
                  <Globe className="w-3 h-3" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
                <span>{playlist.is_public ? "Pública" : "Privada"}</span>
                <span>•</span>
                <span>{playlist.song_count || 0} músicas</span>
              </div>

              {/* Dropdown Menu */}
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPlaylist(playlist.id);
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Tocar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(playlist);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlaylist(playlist.id, playlist.name);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Playlist Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlaylist ? "Editar Playlist" : "Nova Playlist"}
            </DialogTitle>
            <DialogDescription>
              {editingPlaylist
                ? "Edite os detalhes da sua playlist"
                : "Crie uma nova playlist para organizar suas músicas"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Favoritas, Treino, Relaxar..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição (opcional)"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-public">Playlist Pública</Label>
                <p className="text-xs text-muted-foreground">
                  Amigos podem ver playlists públicas
                </p>
              </div>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePlaylist} disabled={!name.trim()}>
              {editingPlaylist ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
