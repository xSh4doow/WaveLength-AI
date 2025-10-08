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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/contexts/PlayerContext";
import { useQueue } from "@/contexts/QueueContext";
import { getAudioUrl, toggleLike } from "@/services/api";

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

  // Sync isLiked with currentSong
  useEffect(() => {
    if (currentSong) {
      setIsLiked(currentSong.is_liked);
    }
  }, [currentSong]);

  // Memoize imageUrl
  const imageUrl = useMemo(
    () => (currentSong?.image_path ? getAudioUrl(currentSong.image_path) : ""),
    [currentSong?.image_path]
  );

  // Memoize handlers
  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      seek(Number(e.target.value));
    },
    [seek]
  );

  const handleDownload = useCallback(() => {
    if (!currentSong) return;
    const audioUrl = getAudioUrl(currentSong.audio_path);
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${currentSong.song_name}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              {/* Album Art - Larger and centered */}
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={currentSong.song_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
                )}
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
                  <Button
                    variant={isLiked ? "default" : "ghost"}
                    size="icon"
                    onClick={handleToggleLike}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleDownload}>
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
          </div>
        </main>
      </div>
    </>
  );
}
