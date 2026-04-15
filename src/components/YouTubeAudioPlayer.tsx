"use client";

import { useState, useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

function extractVideoId(url: string): string | null {
  // Handle youtube.com/watch?v=ID
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
    // Handle youtu.be/ID
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1);
    }
  } catch {
    // Not a valid URL
  }
  return null;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;
  apiLoadPromise = new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => resolve();
    document.head.appendChild(script);
  });
  return apiLoadPromise;
}

export default function YouTubeAudioPlayer({ youtubeUrl }: { youtubeUrl: string }) {
  const videoId = extractVideoId(youtubeUrl);
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval>>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);

  const startProgressTracking = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      const p = playerRef.current;
      if (p && typeof p.getCurrentTime === "function") {
        setCurrentTime(p.getCurrentTime());
        if (duration === 0 && typeof p.getDuration === "function") {
          const d = p.getDuration();
          if (d > 0) setDuration(d);
        }
      }
    }, 250);
  }, [duration]);

  const stopProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  useEffect(() => {
    if (!videoId) return;
    let destroyed = false;

    loadYouTubeAPI().then(() => {
      if (destroyed || !containerRef.current) return;
      // Create a div for the iframe inside our container
      const el = document.createElement("div");
      containerRef.current.appendChild(el);

      playerRef.current = new window.YT.Player(el, {
        videoId,
        height: "1",
        width: "1",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            if (destroyed) return;
            setReady(true);
            const d = playerRef.current?.getDuration?.() ?? 0;
            if (d > 0) setDuration(d);
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (destroyed) return;
            if (event.data === window.YT.PlayerState.PLAYING) {
              setPlaying(true);
            } else if (
              event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.ENDED
            ) {
              setPlaying(false);
              if (event.data === window.YT.PlayerState.ENDED) {
                setCurrentTime(0);
              }
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      stopProgressTracking();
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId, stopProgressTracking]);

  useEffect(() => {
    if (playing) {
      startProgressTracking();
    } else {
      stopProgressTracking();
    }
  }, [playing, startProgressTracking, stopProgressTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopProgressTracking();
  }, [stopProgressTracking]);

  if (!videoId) return null;

  function togglePlay() {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      p.pauseVideo();
    } else {
      p.playVideo();
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!duration || !playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTo = fraction * duration;
    playerRef.current.seekTo(seekTo, true);
    setCurrentTime(seekTo);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-300 px-4 py-3">
      {/* Hidden YouTube iframe */}
      <div
        ref={containerRef}
        className="absolute overflow-hidden"
        style={{ width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        disabled={!ready}
        className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-black text-white disabled:opacity-30"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="2" width="4" height="12" rx="1" />
            <rect x="9" y="2" width="4" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2.5v11l9-5.5z" />
          </svg>
        )}
      </button>

      {/* Time */}
      <span className="text-xs text-black tabular-nums w-10 text-right shrink-0">
        {formatTime(currentTime)}
      </span>

      {/* Progress bar */}
      <div
        className="flex-1 h-2 bg-zinc-200 rounded-full cursor-pointer relative"
        onClick={handleSeek}
      >
        <div
          className="absolute inset-y-0 left-0 bg-black rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Duration */}
      <span className="text-xs text-black tabular-nums w-10 shrink-0">
        {duration > 0 ? formatTime(duration) : "--:--"}
      </span>
    </div>
  );
}
