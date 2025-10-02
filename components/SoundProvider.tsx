"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";

export type UISound = "add" | "remove";

interface SoundContextValue {
  play: (name: UISound) => void;
}

const SoundContext = createContext<SoundContextValue>({ play: () => {} });

export function useSound() {
  return useContext(SoundContext);
}

export default function SoundProvider({ children }: { children: React.ReactNode }) {
  const soundsRef = useRef<Record<UISound, HTMLAudioElement | null>>({ add: null, remove: null });

  useEffect(() => {
    // Preload sounds from public/sounds
    const add = new Audio("/sounds/add.mp3");
    add.preload = "auto";
    add.volume = 0.6;

    const remove = new Audio("/sounds/remove.mp3");
    remove.preload = "auto";
    remove.volume = 0.6;

    soundsRef.current = { add, remove };

    return () => {
      // Cleanup references
      soundsRef.current = { add: null, remove: null };
    };
  }, []);

  const play = useCallback((name: UISound) => {
    const a = soundsRef.current[name];
    if (!a) return;
    try {
      a.currentTime = 0;
      // Some browsers require a user gesture; swallow rejections.
      void a.play().catch(() => {});
    } catch {}
  }, []);

  return <SoundContext.Provider value={{ play }}>{children}</SoundContext.Provider>;
}
