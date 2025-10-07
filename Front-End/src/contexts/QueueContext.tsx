/**
 * QueueContext - Manages music playback queue
 */

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Song {
  id: string;
  song_name: string;
  user_name: string;
  image_path?: string | null;
  audio_path: string;
  caption?: string | null;
  genre?: string | null;
  tags?: string | null;
  duration: number;
  has_vocals: boolean;
  has_lyrics: boolean;
  lyrics?: string | null;
  is_liked: boolean;
  created_at: string;
}

type RepeatMode = "off" | "all" | "one";

interface QueueContextType {
  queue: Song[];
  currentIndex: number;
  currentSong: Song | null;
  shuffle: boolean;
  repeat: RepeatMode;

  // Queue actions
  setQueue: (songs: Song[], startIndex?: number) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;

  // Playback actions
  playNext: () => void;
  playPrevious: () => void;
  playAt: (index: number) => void;

  // Settings
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export function QueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueueState] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");

  const currentSong = queue[currentIndex] || null;

  const setQueue = (songs: Song[], startIndex: number = 0) => {
    setQueueState(songs);
    setCurrentIndex(startIndex);
  };

  const addToQueue = (song: Song) => {
    setQueueState((prev) => [...prev, song]);
  };

  const removeFromQueue = (index: number) => {
    setQueueState((prev) => prev.filter((_, i) => i !== index));

    // Adjust current index if necessary
    if (index < currentIndex) {
      setCurrentIndex((prev) => prev - 1);
    } else if (index === currentIndex && currentIndex >= queue.length - 1) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const clearQueue = () => {
    setQueueState([]);
    setCurrentIndex(-1);
  };

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    setQueueState((prev) => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);

      // Adjust current index if necessary
      if (fromIndex === currentIndex) {
        setCurrentIndex(toIndex);
      } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
        setCurrentIndex((prev) => prev - 1);
      } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
        setCurrentIndex((prev) => prev + 1);
      }

      return newQueue;
    });
  };

  const playNext = () => {
    if (queue.length === 0) return;

    if (repeat === "one") {
      // Stay on same song
      return;
    }

    if (shuffle) {
      // Random next song (excluding current)
      const availableIndices = queue
        .map((_, i) => i)
        .filter((i) => i !== currentIndex);

      if (availableIndices.length === 0) {
        if (repeat === "all") {
          setCurrentIndex(0);
        }
        return;
      }

      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      setCurrentIndex(randomIndex);
    } else {
      // Normal next
      const nextIndex = currentIndex + 1;

      if (nextIndex >= queue.length) {
        if (repeat === "all") {
          setCurrentIndex(0);
        }
        // else: do nothing, end of queue
      } else {
        setCurrentIndex(nextIndex);
      }
    }
  };

  const playPrevious = () => {
    if (queue.length === 0) return;

    if (shuffle) {
      // Random previous song (excluding current)
      const availableIndices = queue
        .map((_, i) => i)
        .filter((i) => i !== currentIndex);

      if (availableIndices.length === 0) return;

      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      setCurrentIndex(randomIndex);
    } else {
      // Normal previous
      const prevIndex = currentIndex - 1;

      if (prevIndex < 0) {
        if (repeat === "all") {
          setCurrentIndex(queue.length - 1);
        }
        // else: do nothing, start of queue
      } else {
        setCurrentIndex(prevIndex);
      }
    }
  };

  const playAt = (index: number) => {
    if (index >= 0 && index < queue.length) {
      setCurrentIndex(index);
    }
  };

  const toggleShuffle = () => {
    setShuffle((prev) => !prev);
  };

  const cycleRepeat = () => {
    setRepeat((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  };

  return (
    <QueueContext.Provider
      value={{
        queue,
        currentIndex,
        currentSong,
        shuffle,
        repeat,
        setQueue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        reorderQueue,
        playNext,
        playPrevious,
        playAt,
        toggleShuffle,
        cycleRepeat,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
}
