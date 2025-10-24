import { useState, useEffect, useRef } from "react";
import { API_URL } from "@/services/api";

export interface TaskPollingResult {
  status: "PENDING" | "GENERATING" | "SUCCESS" | "FAILED" | "IDLE";
  song: any | null;
  error: string | null;
  progress: number;
}

export interface UseTaskPollingOptions {
  taskId: string | null;
  songId: string | null;
  enabled?: boolean;
  interval?: number; // milliseconds
  onComplete?: (song: any) => void;
  onError?: (error: string) => void;
}

/**
 * Custom hook for polling SunoAPI task status
 *
 * Features:
 * - Automatic polling at specified interval
 * - localStorage persistence (survives F5)
 * - Progress estimation
 * - Callbacks for completion/error
 */
export function useTaskPolling({
  taskId,
  songId,
  enabled = true,
  interval = 10000, // 10 seconds default
  onComplete,
  onError,
}: UseTaskPollingOptions): TaskPollingResult {
  const [status, setStatus] = useState<TaskPollingResult["status"]>("IDLE");
  const [song, setSong] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Restore state from localStorage
  useEffect(() => {
    if (taskId) {
      const savedState = localStorage.getItem(`task_polling_${taskId}`);
      if (savedState) {
        try {
          const data = JSON.parse(savedState);
          setStatus(data.status || "PENDING");
          setProgress(data.progress || 0);
          startTimeRef.current = data.startTime || Date.now();
        } catch (e) {
          console.error("[useTaskPolling] Failed to restore state:", e);
        }
      }
    }
  }, [taskId]);

  // Save state to localStorage
  useEffect(() => {
    if (taskId && status !== "IDLE") {
      const data = {
        taskId,
        songId,
        status,
        progress,
        startTime: startTimeRef.current,
      };
      localStorage.setItem(`task_polling_${taskId}`, JSON.stringify(data));
    }
  }, [taskId, songId, status, progress]);

  // Poll task status
  const checkStatus = async () => {
    if (!taskId || !enabled) return;

    try {
      const response = await fetch(`${API_URL}/generate/status/${taskId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Update status
      setStatus(data.status);

      if (data.status === "SUCCESS") {
        // Task completed successfully
        setSong(data.song);
        setProgress(100);
        setError(null);

        // Clear localStorage
        if (taskId) {
          localStorage.removeItem(`task_polling_${taskId}`);
        }

        // Stop polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // Trigger callback
        if (onComplete && data.song) {
          onComplete(data.song);
        }
      } else if (data.status === "FAILED") {
        // Task failed
        setError(data.error || "Music generation failed");
        setProgress(0);

        // Clear localStorage
        if (taskId) {
          localStorage.removeItem(`task_polling_${taskId}`);
        }

        // Stop polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // Trigger callback
        if (onError) {
          onError(data.error || "Music generation failed");
        }
      } else {
        // Still generating - update progress estimate
        const elapsed = (Date.now() - startTimeRef.current) / 1000; // seconds
        const estimatedDuration = 180; // 3 minutes estimate
        const estimatedProgress = Math.min(90, (elapsed / estimatedDuration) * 90);
        setProgress(estimatedProgress);
      }
    } catch (err) {
      console.error("[useTaskPolling] Error checking status:", err);
      setError(err instanceof Error ? err.message : "Failed to check status");

      // Don't stop polling on error - might be temporary
      // Just update progress slower
      setProgress((prev) => Math.min(90, prev + 1));
    }
  };

  // Start/stop polling based on status
  useEffect(() => {
    if (!taskId || !enabled) {
      // Clear interval if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // If already completed or failed, don't poll
    if (status === "SUCCESS" || status === "FAILED") {
      return;
    }

    // Initial check
    checkStatus();

    // Start polling
    intervalRef.current = setInterval(checkStatus, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [taskId, enabled, status, interval]);

  return {
    status,
    song,
    error,
    progress,
  };
}
