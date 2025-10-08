/**
 * PlayerOverlay - Player maximizado em tela cheia
 * Com controles, letras e visualizador
 */

import { useState } from "react";
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
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/contexts/PlayerContext";
import { useQueue } from "@/contexts/QueueContext";
import { getAudioUrl } from "@/services/api";

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
  } = useQueue();

  const [isLiked, setIsLiked] = useState(currentSong?.is_liked || false);
  const [showQueue, setShowQueue] = useState(false);

  if (playerState !== "maximized" || !currentSong) return null;

  const imageUrl = currentSong.image_path ? getAudioUrl(currentSong.image_path) : "";
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  const handleDownload = () => {
    const audioUrl = getAudioUrl(currentSong.audio_path);
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${currentSong.song_name}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
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
  };

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
          <div className="container mx-auto max-w-6xl flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPlayerState("minimized")}
            >
              <ChevronDown className="w-6 h-6" />
            </Button>
            <span className="text-sm font-medium">Tocando Agora</span>
            <Button variant="ghost" size="icon" onClick={() => setShowQueue(!showQueue)}>
              <MoreHorizontal className="w-6 h-6" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-6xl px-4 py-8">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Left: Album Art + Controls */}
              <div className="space-y-8">
                {/* Album Art */}
                <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl max-w-md mx-auto">
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
                    {currentSong.has_vocals && (
                      <span className="px-3 py-1 rounded-full glass-effect text-sm">
                        🎤 Com Vocal
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 px-4">
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={handleSeek}
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

                {/* Main Controls */}
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
                    onClick={() => playPrevious()}
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
                    onClick={() => playNext()}
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

                {/* Secondary Controls */}
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isLiked ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setIsLiked(!isLiked)}
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

              {/* Right: Lyrics Panel */}
              {currentSong.has_lyrics && currentSong.lyrics && (
                <div className="glass-effect rounded-3xl p-8 max-h-[600px] overflow-y-auto">
                  <h2 className="text-2xl font-bold mb-6">Letra</h2>
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">
                      {currentSong.lyrics}
                    </pre>
                  </div>
                </div>
              )}

              {/* Placeholder if no lyrics */}
              {!currentSong.has_lyrics && (
                <div className="hidden lg:flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg">Música instrumental</p>
                    <p className="text-sm">Sem letra disponível</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
