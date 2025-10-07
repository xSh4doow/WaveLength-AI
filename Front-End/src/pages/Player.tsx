import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  MoreHorizontal
} from "lucide-react";
import demoPhoto from "@/assets/demo-photo.jpg";
import { getAudioUrl } from "@/services/api";

export const Player = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Extract data from navigation state
  const musicData = location.state?.musicData;
  const songName = location.state?.songName || "Música Gerada";
  const imagePreview = location.state?.imagePreview || demoPhoto;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: off, 1: all, 2: one
  const [isLiked, setIsLiked] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Setup audio element
  useEffect(() => {
    if (musicData?.audio_url) {
      const audio = new Audio(getAudioUrl(musicData.audio_url));
      audioRef.current = audio;

      // Set up event listeners
      audio.addEventListener('loadedmetadata', () => {
        setDuration(Math.floor(audio.duration));
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(Math.floor(audio.currentTime));
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      return () => {
        audio.pause();
        audio.remove();
      };
    }
  }, [musicData]);

  // Control playback
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Control volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleRepeat = () => {
    setRepeatMode((prev) => (prev + 1) % 3);
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border/50 p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <img
                src={imagePreview}
                alt={songName}
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{songName}</h3>
                <p className="text-sm text-muted-foreground truncate">{musicData?.metadata?.genre || "Música Gerada por IA"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMinimized(false)}
              >
                <ChevronDown className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
          <span className="text-sm font-medium">Tocando Agora</span>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div className="container mx-auto max-w-2xl space-y-8">
          {/* Album Art */}
          <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl max-w-md mx-auto">
            <img
              src={imagePreview}
              alt={songName}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
              style={{
                boxShadow: `0 40px 80px -20px hsl(var(--primary) / 0.4)`,
              }}
            />
          </div>

          {/* Music Info */}
          <div className="text-center space-y-3 px-4">
            <h1 className="text-4xl font-bold">{songName}</h1>
            <p className="text-lg text-muted-foreground">{musicData?.caption || "Música Gerada por IA"}</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {musicData?.metadata?.genre && (
                <span className="px-3 py-1 rounded-full glass-effect text-sm">{musicData.metadata.genre}</span>
              )}
              {musicData?.metadata?.mood && (
                <span className="px-3 py-1 rounded-full glass-effect text-sm">{musicData.metadata.mood}</span>
              )}
              {musicData?.metadata?.bpm && (
                <span className="px-3 py-1 rounded-full glass-effect text-sm">{musicData.metadata.bpm} BPM</span>
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
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(currentTime / duration) * 100}%, hsl(var(--muted)) ${(currentTime / duration) * 100}%, hsl(var(--muted)) 100%)`
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
              variant={isShuffled ? "default" : "ghost"}
              size="icon"
              onClick={() => setIsShuffled(!isShuffled)}
            >
              <Shuffle className="w-5 h-5" />
            </Button>

            <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform">
              <SkipBack className="w-6 h-6" />
            </Button>

            <Button
              variant="hero"
              size="icon"
              className="w-20 h-20 rounded-full hover:scale-105 transition-transform"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </Button>

            <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform">
              <SkipForward className="w-6 h-6" />
            </Button>

            <Button
              variant={repeatMode > 0 ? "default" : "ghost"}
              size="icon"
              onClick={handleRepeat}
            >
              <Repeat className="w-5 h-5" />
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
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Download className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVolumeToggle}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-24 h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${isMuted ? 0 : volume}%, hsl(var(--muted)) ${isMuted ? 0 : volume}%, hsl(var(--muted)) 100%)`
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Player;
