/**
 * PlayerOverlay - Player maximizado em tela cheia
 * Com controles e visualizador (sem letras - todas as músicas são instrumentais)
 */

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  Share2,
  Download,
  ChevronDown,
  Mic,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/contexts/PlayerContext";
import { useQueue } from "@/contexts/QueueContext";
import { getAudioUrl, toggleLike, parseImagePaths, parseImageCaptions } from "@/services/api";
import { downloadSong } from "@/utils/downloadSong";
import { QueuePanel } from "./QueuePanel";
import { ImageCarousel } from "@/components/ImageCarousel";
import { toast } from "@/hooks/use-toast";

// Memoized PlayerControls component
const PlayerControls = memo(({
  isPlaying,
  togglePlay,
  playNext,
  playPrevious,
  shuffle,
  toggleShuffle,
  repeat,
  cycleRepeat,
}: {
  isPlaying: boolean;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  shuffle: boolean;
  toggleShuffle: () => void;
  repeat: string;
  cycleRepeat: () => void;
}) => (
  <div className="flex items-center justify-center gap-6 px-4">
    <Button
      variant={shuffle ? "default" : "ghost"}
      size="icon"
      onClick={toggleShuffle}
    >
      <Shuffle className="w-5 h-5" />
    </Button>

    <Button
      variant="ghost"
      size="icon"
      className="hover:scale-110 transition-transform"
      onClick={playPrevious}
    >
      <SkipBack className="w-6 h-6" />
    </Button>

    <Button
      variant="hero"
      size="icon"
      className="w-20 h-20 rounded-full hover:scale-105 transition-transform"
      onClick={togglePlay}
    >
      {isPlaying ? (
        <Pause className="w-8 h-8" />
      ) : (
        <Play className="w-8 h-8 ml-1" />
      )}
    </Button>

    <Button
      variant="ghost"
      size="icon"
      className="hover:scale-110 transition-transform"
      onClick={playNext}
    >
      <SkipForward className="w-6 h-6" />
    </Button>

    <Button
      variant={repeat !== "off" ? "default" : "ghost"}
      size="icon"
      onClick={cycleRepeat}
    >
      <Repeat className="w-5 h-5" />
      {repeat === "one" && (
        <span className="absolute top-1 right-1 text-xs">1</span>
      )}
    </Button>
  </div>
));

PlayerControls.displayName = "PlayerControls";

// Memoized ProgressBar component
const ProgressBar = memo(({
  currentTime,
  duration,
  onSeek,
}: {
  currentTime: number;
  duration: number;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const progress = useMemo(
    () => (duration > 0 ? (currentTime / duration) * 100 : 0),
    [currentTime, duration]
  );

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return (
    <div className="space-y-2 px-4">
      <input
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        onChange={onSeek}
        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
        style={{
          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%, hsl(var(--muted)) 100%)`,
        }}
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
});

ProgressBar.displayName = "ProgressBar";

export function PlayerOverlay() {
  const {
    playerState,
    isPlaying,
    togglePlay,
    setPlayerState,
    currentTime,
    duration,
    seek,
    volume,
    setVolume,
    isMuted,
    toggleMute,
  } = usePlayer();

  const {
    currentSong,
    playNext,
    playPrevious,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    updateSongInQueue,
  } = useQueue();

  const [isLiked, setIsLiked] = useState(currentSong?.is_liked || false);
  const [showQueuePanel, setShowQueuePanel] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  // Sync isLiked with currentSong
  useEffect(() => {
    if (currentSong) {
      setIsLiked(currentSong.is_liked);
    }
  }, [currentSong]);

  // Memoize images and captions
  const imagePaths = useMemo(
    () => (currentSong ? parseImagePaths(currentSong) : []),
    [currentSong]
  );

  const imageCaptions = useMemo(
    () => (currentSong ? parseImageCaptions(currentSong) : []),
    [currentSong]
  );

  // DIAGNOSTIC LOGS
  console.log('[PlayerOverlay] Current song data:', {
    songId: currentSong?.id,
    songName: currentSong?.song_name,
    image_path: currentSong?.image_path,
    image_paths: currentSong?.image_paths,
    image_captions: currentSong?.image_captions,
    parsedImagePaths: imagePaths,
    parsedImageCaptions: imageCaptions,
  });

  // Memoize handlers
  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      seek(Number(e.target.value));
    },
    [seek]
  );

  const handleDownload = useCallback(async () => {
    if (!currentSong) return;
    try {
      await downloadSong(currentSong.audio_path, currentSong.song_name);
      toast({
        title: "Download iniciado",
        description: currentSong.song_name,
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a música",
        variant: "destructive",
      });
    }
  }, [currentSong]);

  const handleShare = useCallback(async () => {
    if (!currentSong) return;
    const shareUrl = `${window.location.origin}/play/${currentSong.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentSong.song_name,
          text: `Ouça "${currentSong.song_name}" no WaveLength!`,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share canceled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert("Link copiado para a área de transferência!");
    }
  }, [currentSong]);

  const handleToggleLike = useCallback(async () => {
    if (!currentSong) return;

    const newLikedState = !isLiked;

    // Optimistic update - update UI immediately
    setIsLiked(newLikedState);
    updateSongInQueue(currentSong.id, { is_liked: newLikedState });

    // Persist to backend
    try {
      await toggleLike(currentSong.id, newLikedState);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      // Revert on error
      setIsLiked(!newLikedState);
      updateSongInQueue(currentSong.id, { is_liked: !newLikedState });
    }
  }, [currentSong, isLiked, updateSongInQueue]);

  if (playerState !== "maximized" || !currentSong) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={() => setPlayerState("minimized")}
      />

      {/* Player Content */}
      <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md">
        {/* Header */}
        <header className="p-4 border-b border-border/50">
          <div className="container mx-auto max-w-2xl flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPlayerState("minimized")}
            >
              <ChevronDown className="w-6 h-6" />
            </Button>
            <span className="text-sm font-medium">Tocando Agora</span>
            <div className="w-10" /> {/* Spacer for center alignment */}
          </div>
        </header>

        {/* Main Content - Single column centered layout */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-2xl px-4 py-8">
            <div className="space-y-8">
              {/* Album Art - Carousel for multiple images */}
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <ImageCarousel
                  images={imagePaths}
                  captions={imageCaptions}
                  alt={currentSong.song_name}
                  className="w-full h-full"
                  showArrows={true}
                  showIndicators={true}
                  showCaptions={true}
                />
              </div>

              {/* Song Info */}
              <div className="text-center space-y-3 px-4">
                <h1 className="text-4xl font-bold">{currentSong.song_name}</h1>
                <p className="text-lg text-muted-foreground">{currentSong.user_name}</p>
                {currentSong.caption && (
                  <p className="text-sm text-muted-foreground italic">{currentSong.caption}</p>
                )}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {currentSong.genre && (
                    <span className="px-3 py-1 rounded-full glass-effect text-sm">
                      {currentSong.genre}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full glass-effect text-sm">
                    🎵 Instrumental
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <ProgressBar
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
              />

              {/* Main Controls */}
              <PlayerControls
                isPlaying={isPlaying}
                togglePlay={togglePlay}
                playNext={playNext}
                playPrevious={playPrevious}
                shuffle={shuffle}
                toggleShuffle={toggleShuffle}
                repeat={repeat}
                cycleRepeat={cycleRepeat}
              />

              {/* Secondary Controls + Volume */}
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  {currentSong?.has_lyrics && currentSong?.lyrics && (
                    <Button
                      variant={showLyrics ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setShowLyrics(!showLyrics)}
                      title="Mostrar/Ocultar Letra"
                    >
                      <Mic className="w-5 h-5" />
                    </Button>
                  )}
                  <Button
                    variant={showQueuePanel ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setShowQueuePanel(true)}
                    title="Fila de Reprodução"
                  >
                    <List className="w-5 h-5" />
                  </Button>
                  <Button
                    variant={isLiked ? "default" : "ghost"}
                    size="icon"
                    onClick={handleToggleLike}
                    title="Curtir"
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleShare} title="Compartilhar">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleDownload} title="Download">
                    <Download className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={toggleMute}>
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-24 h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${isMuted ? 0 : volume}%, hsl(var(--muted)) ${isMuted ? 0 : volume}%, hsl(var(--muted)) 100%)`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Lyrics Panel (conditional) */}
            {showLyrics && currentSong?.has_lyrics && currentSong?.lyrics && (
              <div className="absolute right-4 top-24 bottom-24 w-96 glass-effect rounded-2xl p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Letra</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowLyrics(false)}>
                    <ChevronDown className="w-5 h-5 rotate-90" />
                  </Button>
                </div>
                <div className="h-full overflow-y-auto pr-2">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {currentSong.lyrics}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Queue Panel */}
      <QueuePanel isOpen={showQueuePanel} onClose={() => setShowQueuePanel(false)} />
    </>
  );
}
