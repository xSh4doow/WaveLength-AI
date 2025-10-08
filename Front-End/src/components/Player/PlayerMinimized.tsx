/**
 * PlayerMinimized - Barra de player minimizada (inferior)
 * Visível em todas as páginas quando há música tocando
 */

import { Play, Pause, SkipForward, SkipBack, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/contexts/PlayerContext";
import { useQueue } from "@/contexts/QueueContext";
import { getAudioUrl } from "@/services/api";

export function PlayerMinimized() {
  const { isPlaying, togglePlay, setPlayerState, currentTime, duration } = usePlayer();
  const { currentSong, playNext, playPrevious } = useQueue();

  if (!currentSong) return null;

  const imageUrl = currentSong.image_path ? getAudioUrl(currentSong.image_path) : "";
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border/50">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Song Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={currentSong.song_name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate text-sm">
                {currentSong.song_name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {currentSong.user_name}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => playPrevious()}
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => togglePlay()}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => playNext()}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Expand Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPlayerState("maximized")}
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
