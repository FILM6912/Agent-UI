import React from "react";
import { RotateCw, Sparkles } from "lucide-react";
import { SUGGESTIONS, Suggestion } from "../data/suggestions";

interface WelcomeScreenProps {
  language: string;
  onSuggestionClick: (prompt: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  language,
  onSuggestionClick,
}) => {
  const [randomSuggestions, setRandomSuggestions] = React.useState<Suggestion[]>([]);
  const [isShuffling, setIsShuffling] = React.useState(false);

  const shuffleSuggestions = React.useCallback(() => {
    setIsShuffling(true);
    // Select correct language pool, fallback to 'en' if not 'th'
    const pool = language === "th" ? SUGGESTIONS.th : SUGGESTIONS.en;
    // Shuffle and pick 4
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setRandomSuggestions(shuffled.slice(0, 4));

    setTimeout(() => setIsShuffling(false), 500);
  }, [language]);

  React.useEffect(() => {
    shuffleSuggestions();
  }, [shuffleSuggestions]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-20 h-20 rounded-full bg-linear-to-br from-[#1447E6] via-[#3d6ff7] to-[#0d35b8] flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/30 animate-in zoom-in duration-500 ring-4 ring-blue-100 dark:ring-blue-900/30">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-[#1447E6] to-[#0d35b8] dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent mb-3 text-center">
        {language === "th"
          ? "สวัสดี! ฉันคือ AI Agent"
          : "Hello! I'm your AI Agent"}
      </h1>

      <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 mb-8 text-center max-w-2xl">
        {language === "th"
          ? "ฉันพร้อมช่วยเหลือคุณในการทำงานต่างๆ เริ่มต้นด้วยการพิมพ์คำถามหรือคำสั่งของคุณด้านล่าง"
          : "I'm here to help you with various tasks. Start by typing your question or command below."}
      </p>

      {/* Quick Action Suggestions */}
      <div className="w-full max-w-2xl relative">
        <div className="absolute -top-12 right-0">
          <button
            onClick={shuffleSuggestions}
            className={`p-2 rounded-full text-zinc-400 hover:text-[#1447E6] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 ${isShuffling ? "animate-spin text-[#1447E6]" : ""}`}
            title={language === "th" ? "เปลี่ยนหัวข้อใหม่" : "Shuffle suggestions"}
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          {randomSuggestions.map((item, idx) => (
            <button
              key={idx + item.title}
              onClick={() => onSuggestionClick(item.prompt)}
              className="group p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-500/10 hover:bg-blue-50/30 dark:hover:from-blue-950/20 dark:hover:to-blue-900/20 transition-all duration-200 cursor-pointer text-left animate-in fade-in zoom-in-95 duration-300 fill-mode-both"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-1 group-hover:text-[#1447E6] dark:group-hover:text-blue-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {item.desc}
              </p>
            </button>
          ))}
        </div>
      </div>


      {/* Model Info */}

    </div>
  );
};
