import { useState, useRef, useCallback } from "react";

type TranscriptMeta = { isFinal: boolean; source: "browser" | "whisper" };

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionAlternativeList {
  readonly length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
  isFinal: boolean;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternativeList;
  [index: number]: SpeechRecognitionAlternativeList;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

interface UseWhisperOptions {
  onTranscript: (text: string, meta?: TranscriptMeta) => void;
  onStateChange: (recording: boolean) => void;
}

export function useWhisper({ onTranscript, onStateChange }: UseWhisperOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const liveTranscriptRef = useRef("");
  const browserFinalRef = useRef("");

  const stopRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.onend = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.stop();
    recognitionRef.current = null;
  }, []);

  const startLiveTranscript = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    try {
      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let finalText = browserFinalRef.current;
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";

          if (result.isFinal) {
            finalText = `${finalText} ${transcript}`.trim();
          } else {
            interimText = `${interimText} ${transcript}`.trim();
          }
        }

        browserFinalRef.current = finalText;
        const fullText = `${finalText} ${interimText}`.trim();
        if (fullText) {
          liveTranscriptRef.current = fullText;
          onTranscript(fullText, { isFinal: false, source: "browser" });
        }
      };

      recognition.onerror = () => {
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Live speech recognition unavailable:", err);
    }
  }, [onTranscript]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      liveTranscriptRef.current = "";
      browserFinalRef.current = "";
      setIsTranscribing(false);

      // Prefer webm/opus; Safari falls back to mp4
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        stopRecognition();
        setIsTranscribing(true);

        const ext  = mimeType.includes("webm") ? "webm" : "mp4";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `recording.${ext}`, { type: mimeType });

        const formData = new FormData();
        formData.append("audio", file);
        formData.append("action", "transcribe"); // route reads this from FormData

        try {
          const res = await fetch("/api/ai", { method: "POST", body: formData });
          if (!res.ok) throw new Error(`Transcription error ${res.status}`);
          const { text } = await res.json();
          const finalText = (text || liveTranscriptRef.current || "").trim();
          onTranscript(finalText, { isFinal: true, source: "whisper" });
        } catch (err) {
          console.error("Whisper transcription failed:", err);
          onTranscript(liveTranscriptRef.current, { isFinal: true, source: "browser" });
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      startLiveTranscript();
      setIsRecording(true);
      onStateChange(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [onTranscript, onStateChange, startLiveTranscript, stopRecognition]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    stopRecognition();
    setIsRecording(false);
    onStateChange(false);
  }, [onStateChange, stopRecognition]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }

    void startRecording();
  }, [isRecording, startRecording, stopRecording]);

  return { isRecording, isTranscribing, startRecording, stopRecording, toggleRecording };
}
