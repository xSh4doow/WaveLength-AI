import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Music2,
  Play as PlayIcon,
  Pause,
  Download,
  Share2,
  Home,
  Volume2,
  VolumeX,
  Loader2
} from "lucide-react";
import { getSong, getAudioUrl, type Song } from "@/services/api";
import { toast } from "@/hooks/use-toast";

export const Play = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Load song data
  useEffect(() => {
    if (!id) {
      setError("ID da música não fornecido");
      setIsLoading(false);
      return;
    }

    const loadSong = async () => {
      try {
        setIsLoading(true);
        const songData = await getSong(id);
        setSong(songData);
      } catch (err) {
        console.error("Error loading song:", err);
        setError("Música não encontrada");
      } finally {
        setIsLoading(false);
      }
    };

    loadSong();
  }, [id]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Number(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = Number(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume > 0 ? volume : 1;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const handleDownload = () => {
    if (!song) return;

    const audioUrl = getAudioUrl(song.audio_path);
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${song.song_name}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download iniciado",
      description: `${song.song_name}.wav`,
    });
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: song?.song_name || "Música WaveLength",
          text: song?.caption || "Ouça essa música criada no WaveLength!",
          url: shareUrl,
        });
        toast({
          title: "Compartilhado com sucesso!",
        });
      } catch (err) {
        console.log("Share cancelled", err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copiado!",
          description: "Cole o link para compartilhar",
        });
      } catch (err) {
        toast({
          title: "Erro ao copiar link",
          variant: "destructive",
        });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando música...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !song) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Music2 className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Música não encontrada</h1>
          <p className="text-muted-foreground">{error || "Esta música não existe ou foi removida"}</p>
          <Button onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-2" />
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  const imageUrl = song.image_path ? getAudioUrl(song.image_path) : "";
  const audioUrl = getAudioUrl(song.audio_path);

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 gradient-hero opacity-30" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Music2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Wavelength
              </span>
            </div>
            <Button variant="ghost" onClick={() => navigate("/")}>
              <Home className="w-5 h-5 mr-2" />
              Home
            </Button>
          </div>

          {/* Main Player Card */}
          <div className="glass-effect rounded-3xl p-8 space-y-8">
            {/* Album Art */}
            <div className="aspect-square rounded-2xl overflow-hidden relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={song.song_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* Song Info */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{song.song_name}</h1>
              <p className="text-muted-foreground">Por {song.user_name}</p>
              {song.caption && (
                <p className="text-sm text-muted-foreground italic">
                  "{song.caption}"
                </p>
              )}
              {song.genre && (
                <span className="inline-block px-3 py-1 rounded-full glass-effect text-sm">
                  {song.genre}
                </span>
              )}
            </div>

            {/* Audio Player */}
            <audio ref={audioRef} src={audioUrl} />

            {/* Controls */}
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max={song.duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(currentTime / song.duration) * 100}%, hsl(var(--muted)) ${(currentTime / song.duration) * 100}%, hsl(var(--muted)) 100%)`
                  }}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(song.duration)}</span>
                </div>
              </div>

              {/* Play/Pause and Volume */}
              <div className="flex items-center gap-4">
                {/* Play Button */}
                <Button
                  variant="hero"
                  size="lg"
                  onClick={togglePlayPause}
                  className="w-16 h-16 rounded-full"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6 ml-1" />
                  )}
                </Button>

                {/* Volume Control */}
                <div className="flex items-center gap-2 flex-1">
                  <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground">
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDownload}
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Lyrics (if available) */}
            {song.lyrics && (
              <div className="glass-effect rounded-xl p-6 space-y-2">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                  Letra
                </h3>
                <p className="text-sm whitespace-pre-wrap">{song.lyrics}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>Criado com WaveLength - Transforme fotos em música</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Play;
