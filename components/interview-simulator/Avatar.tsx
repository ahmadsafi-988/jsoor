"use client";

import { Brain, Loader2, Mic2, Volume2 } from "lucide-react";
import type { AvatarState } from "@/hooks/use-tts";

interface Props {
  state: AvatarState;
  name?: string;
  audioLevel?: number;
}

const STATUS = {
  idle: { label: "Ready", icon: Brain, tone: "bg-[#eef3ef] text-[#3d4a41]" },
  preparing: { label: "Preparing question", icon: Loader2, tone: "bg-amber-50 text-amber-700" },
  speaking: { label: "Speaking", icon: Volume2, tone: "bg-emerald-50 text-[#006d43]" },
  listening: { label: "Listening", icon: Mic2, tone: "bg-[#eef8f2] text-[#006d43]" },
  thinking: { label: "Reviewing", icon: Brain, tone: "bg-amber-50 text-amber-700" },
} satisfies Record<AvatarState, { label: string; icon: typeof Brain; tone: string }>;

export default function InterviewAvatar({ state, name = "Saleh", audioLevel = 0 }: Props) {
  const status = STATUS[state];
  const StatusIcon = status.icon;
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isPreparing = state === "preparing";
  const isThinking = state === "thinking";

  const mouthHeight = isSpeaking ? 5 + Math.round(audioLevel * 15) : isListening ? 5 : 3;
  const mouthWidth = isSpeaking ? 16 + Math.round(audioLevel * 7) : 22;
  const haloScale = isSpeaking ? 1 + audioLevel * 0.16 : 1;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <div
          className={`absolute inset-2 rounded-full transition-all duration-200 ${
            isListening ? "bg-[#006d43]/10 animate-ping" : "bg-[#006d43]/5"
          }`}
          style={{ transform: `scale(${haloScale})` }}
        />
        <div className="absolute inset-6 rounded-full bg-white shadow-[0_18px_50px_rgba(0,0,0,0.08)]" />

        <div className="relative h-28 w-28 overflow-hidden rounded-[2rem] border border-[#dce7df] bg-gradient-to-b from-[#f9fbf8] to-[#eaf2ec] shadow-[0_14px_35px_rgba(0,108,67,0.12)]">
          <div className="absolute left-1/2 top-5 h-16 w-16 -translate-x-1/2 rounded-[44%_44%_48%_48%] bg-[#c99165]" />
          <div className="absolute left-1/2 top-3 h-9 w-20 -translate-x-1/2 rounded-t-[2rem] bg-[#2b2927]" />
          <div className="absolute left-[22px] top-[30px] h-7 w-4 rounded-full bg-[#c99165]" />
          <div className="absolute right-[22px] top-[30px] h-7 w-4 rounded-full bg-[#c99165]" />
          <div className="absolute left-1/2 top-[67px] h-16 w-24 -translate-x-1/2 rounded-t-[2rem] bg-[#006d43]" />
          <div className="absolute left-1/2 top-[73px] h-9 w-11 -translate-x-1/2 rounded-t-2xl bg-white/95" />

          <div className="absolute left-[42px] top-[42px] h-1.5 w-1.5 rounded-full bg-[#1c1b1b]" />
          <div className="absolute right-[42px] top-[42px] h-1.5 w-1.5 rounded-full bg-[#1c1b1b]" />
          <div className="absolute left-1/2 top-[50px] h-4 w-2 -translate-x-1/2 rounded-full border-r border-[#9d6d4d]" />

          <div
            className="absolute left-1/2 top-[61px] -translate-x-1/2 rounded-full bg-[#1c1b1b] transition-all duration-75"
            style={{
              width: `${mouthWidth}px`,
              height: `${mouthHeight}px`,
              borderRadius: isSpeaking ? "999px" : "0 0 999px 999px",
            }}
          />

          {isPreparing || isThinking ? (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-white"
                  style={{ animationDelay: `${dot * 120}ms` }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-semibold text-[#1c1b1b]">{name}</p>
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.tone}`}>
          <StatusIcon className={`h-3.5 w-3.5 ${isPreparing ? "animate-spin" : ""}`} />
          {status.label}
        </div>
      </div>
    </div>
  );
}
