/**
 * PlaylistDetail - View songs in a specific playlist
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, MoreVertical, X, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SongTags } from "@/components/ui/song-tags";
import { useToast } from "@/hooks/use-toast";
import { useQueue } from "@/contexts/QueueContext";
import { usePlayer } from "@/contexts/PlayerContext";
import {
  getPlaylist,
  getPlaylistSongs,
  removeSongFromPlaylist,
  type Playlist,
  type Song,
} from "@/services/api";
import { getAudioUrl } from "@/services/api";
import { downloadSong } from "@/utils/downloadSong";

export default function PlaylistDetail() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToQueue, setQueue } = useQueue();
  const { setPlayerState } = usePlayer();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (playlistId) {
      loadPlaylistData();
    }
  }, [playlistId]);

  const loadPlaylistData = async () => {
    if (!playlistId) return;

    try {
      setLoading(true);
      const [playlistData, songsData] = await Promise.all([
        getPlaylist(parseInt(playlistId)),
        getPlaylistSongs(parseInt(playlistId)),
      ]);
      setPlaylist(playlistData);
      setSongs(songsData);
    } catch (error) {
      console.error("Failed to load playlist:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a playlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    setQueue(songs);
    setPlayerState("maximized");
    toast({ title: "Tocando playlist", description: `${songs.length} músicas` });
  };

  const handleRemoveSong = async (songId: string, songName: string) => {
    if (!playlistId) return;

    try {
      await removeSongFromPlaylist(parseInt(playlistId), songId);
      toast({ title: "Removida da playlist", description: songName });
      loadPlaylistData(); // Reload
    } catch (error) {
      console.error("Failed to remove song:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a música",
        variant: "destructive",
      });
    }
  };

  const handlePlaySong = (song: Song) => {
    addToQueue(song);
    setPlayerState("maximized");
  };

  const handleDownload = async (song: Song) => {
    try {
      await downloadSong(song.audio_path, song.song_name);
      toast({ title: "Download iniciado", description: song.song_name });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a música",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Playlist não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        {/* Back Button */}
        <Button variant="ghost" size="icon" onClick={() => navigate("/playlists")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Playlist Icon */}
        <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <Music className="w-24 h-24 text-white" />
        </div>

        {/* Playlist Info */}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">
            {playlist.is_public ? "Playlist Pública" : "Playlist Privada"}
          </p>
          <h1 className="text-5xl font-bold mb-4">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-muted-foreground mb-4">{playlist.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold">{playlist.user_name}</span>
            <span>•</span>
            <span>{songs.length} músicas</span>
          </div>

          {/* Play Button */}
          <Button
            className="mt-6"
            size="lg"
            onClick={handlePlayAll}
            disabled={songs.length === 0}
          >
            <Play className="w-5 h-5 mr-2" />
            Tocar Todas
          </Button>
        </div>
      </div>

      {/* Songs List */}
      {songs.length === 0 ? (
        <div className="text-center py-12">
          <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">Nenhuma música na playlist</p>
          <p className="text-sm text-muted-foreground mt-2">
            Adicione músicas usando o menu nas suas músicas
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {songs.map((song, index) => (
            <div
              key={song.id}
              className="group flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors"
            >
              {/* Index */}
              <div className="w-8 text-center text-muted-foreground group-hover:hidden">
                {index + 1}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 hidden group-hover:flex"
                onClick={() => handlePlaySong(song)}
              >
                <Play className="w-4 h-4" />
              </Button>

              {/* Image */}
              <img
                src={song.image_path ? getAudioUrl(song.image_path) : "/placeholder.png"}
                alt={song.song_name}
                className="w-16 h-16 rounded-lg object-cover cursor-pointer"
                onClick={() => handlePlaySong(song)}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate cursor-pointer hover:underline" onClick={() => handlePlaySong(song)}>
                  {song.song_name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{song.user_name}</p>
              </div>

              {/* Tags */}
              <div className="hidden md:block">
                <SongTags song={song} maxTags={2} />
              </div>

              {/* Duration */}
              <div className="text-sm text-muted-foreground">
                {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, "0")}
              </div>

              {/* Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handlePlaySong(song)}>
                    <Play className="w-4 h-4 mr-2" />
                    Tocar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload(song)}>
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRemoveSong(song.id, song.song_name)}
                    className="text-destructive"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remover da Playlist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
