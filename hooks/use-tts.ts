import { useCallback, useEffect, useRef, useState } from "react";

export type AvatarState = "idle" | "preparing" | "speaking" | "listening" | "thinking";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export function useTTS(onStateChange: (s: AvatarState) => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef(new Map<string, string>());
  const pendingRef = useRef(new Map<string, Promise<string>>());
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const playIdRef = useRef(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const fetchSpeech = useCallback(async (text: string): Promise<string> => {
    const normalized = text.trim();
    const cached = cacheRef.current.get(normalized);
    if (cached) return cached;

    const pending = pendingRef.current.get(normalized);
    if (pending) return pending;

    const request = (async () => {
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "tts", text: normalized }),
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`TTS error ${res.status}`);

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        cacheRef.current.set(normalized, url);
        return url;
      } finally {
        pendingRef.current.delete(normalized);
      }
    })();

    pendingRef.current.set(normalized, request);
    return request;
  }, []);

  const stopMeter = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const startMeter = useCallback((audio: HTMLAudioElement) => {
    stopMeter();

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = contextRef.current ?? new AudioContextClass();
      contextRef.current = context;
      if (context.state === "suspended") void context.resume();
      const analyser = context.createAnalyser();
      analyser.fftSize = 128;

      const source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const average = data.reduce((sum, value) => sum + value, 0) / data.length;
        setAudioLevel(Math.min(1, average / 110));
        frameRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch {
      setAudioLevel(0.65);
    }
  }, [stopMeter]);

  const preload = useCallback(
    async (texts: string | string[]) => {
      const list = Array.isArray(texts) ? texts : [texts];
      await Promise.allSettled(
        list.filter(Boolean).map((text) => fetchSpeech(text))
      );
    },
    [fetchSpeech]
  );

  const speak = useCallback(
    async (text: string): Promise<void> => {
      const playId = playIdRef.current + 1;
      playIdRef.current = playId;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopMeter();

      const normalized = text.trim();
      if (!normalized) return;

      if (!cacheRef.current.has(normalized)) {
        onStateChange("preparing");
      }

      try {
        const url = await fetchSpeech(normalized);
        if (playIdRef.current !== playId) return;

        const audio = new Audio(url);
        audioRef.current = audio;

        return new Promise((resolve) => {
          audio.onplaying = () => {
            if (playIdRef.current !== playId) return;
            onStateChange("speaking");
            startMeter(audio);
          };
          audio.onended = () => {
            if (playIdRef.current === playId) onStateChange("listening");
            stopMeter();
            resolve();
          };
          audio.onerror = () => {
            if (playIdRef.current === playId) onStateChange("idle");
            stopMeter();
            resolve();
          };
          audio.play().catch((err) => {
            console.error("Audio playback failed:", err);
            if (playIdRef.current === playId) onStateChange("listening");
            stopMeter();
            resolve();
          });
        });
      } catch (err) {
        console.error("TTS failed:", err);
        if (playIdRef.current === playId) onStateChange("listening");
      }
    },
    [fetchSpeech, onStateChange, startMeter, stopMeter]
  );

  const stop = useCallback(() => {
    playIdRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopMeter();
    onStateChange("idle");
  }, [onStateChange, stopMeter]);

  useEffect(() => {
    const cache = cacheRef.current;

    return () => {
      playIdRef.current += 1;
      audioRef.current?.pause();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      for (const url of cache.values()) URL.revokeObjectURL(url);
      void contextRef.current?.close();
    };
  }, []);

  return { speak, stop, preload, audioLevel };
}
