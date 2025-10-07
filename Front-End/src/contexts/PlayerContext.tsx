/**
 * PlayerContext - Manages player state and controls
 */

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import { useQueue } from "./QueueContext";
import { getAudioUrl } from "@/services/api";

type PlayerState = "hidden" | "minimized" | "maximized";

interface PlayerContextType {
  // State
  playerState: PlayerState;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;

  // Actions
  setPlayerState: (state: PlayerState) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;

  // Audio element ref (for advanced control)
  audioRef: React.RefObject<HTMLAudioElement>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { currentSong, playNext } = useQueue();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [playerState, setPlayerState] = useState<PlayerState>("hidden");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(70);
  const [isMuted, setIsMuted] = useState(false);

  // Load new song when currentSong changes
  useEffect(() => {
    if (!currentSong || !audioRef.current) return;

    const audio = audioRef.current;
    const audioUrl = getAudioUrl(currentSong.audio_path);

    audio.src = audioUrl;
    audio.load();

    // Show player when song is loaded
    if (playerState === "hidden") {
      setPlayerState("maximized");
    }

    // Auto-play if was playing before
    if (isPlaying) {
      audio.play().catch((err) => {
        console.error("Failed to auto-play:", err);
        setIsPlaying(false);
      });
    }
  }, [currentSong]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(Math.floor(audio.duration));
    };

    const handleTimeUpdate = () => {
      setCurrentTime(Math.floor(audio.currentTime));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      playNext(); // Auto-play next song
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [playNext]);

  // Control volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error("Failed to play:", err);
      });
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(100, newVolume)));
    if (isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <PlayerContext.Provider
      value={{
        playerState,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        setPlayerState,
        play,
        pause,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        audioRef,
      }}
    >
      {children}
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
