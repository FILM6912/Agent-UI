import { useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionProps {
  language: string;
  input: string;
  setInput: (value: string) => void;
}

export const useSpeechRecognition = ({
  language,
  input,
  setInput,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === "th" ? "th-TH" : "en-US";

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          const currentInput = input;
          const trailingSpace =
            currentInput.length > 0 && !currentInput.endsWith(" ") ? " " : "";
          setInput(currentInput + trailingSpace + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === "network") {
          setSpeechError("Network error: Check connection");
        } else if (event.error === "not-allowed") {
          setSpeechError("Microphone denied");
        } else {
          setSpeechError("Speech failed");
        }
        setTimeout(() => setSpeechError(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language, input, setInput]);

  // Update language for speech recognition if changed
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === "th" ? "th-TH" : "en-US";
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError("Speech recognition not supported");
      setTimeout(() => setSpeechError(null), 3000);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setSpeechError(null);
      } catch (e) {
        console.error(e);
        setIsListening(false);
      }
    }
  };

  return {
    isListening,
    speechError,
    toggleListening,
  };
};
