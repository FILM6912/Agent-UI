import React from "react";
import {
  Sparkles,
  Code,
  Wrench,
  Palette,
  Atom,
  Box,
  FileText,
  Mail,
  Megaphone,
  FileSearch,
  BarChart,
  Plane,
  Wallet,
  ChefHat,
  Gift,
  Lightbulb,
  Film,
  Music,
  Wind,
  Cloud,
  Smartphone,
  Theater,
  Target,
  Brain,
  BookOpen,
} from "lucide-react";
import { SUGGESTIONS, Suggestion } from "../data/suggestions";

const IconMap: Record<string, React.ReactNode> = {
  Code: <Code className="w-6 h-6" />,
  Wrench: <Wrench className="w-6 h-6" />,
  Palette: <Palette className="w-6 h-6" />,
  Atom: <Atom className="w-6 h-6" />,
  Box: <Box className="w-6 h-6" />,
  FileText: <FileText className="w-6 h-6" />,
  Mail: <Mail className="w-6 h-6" />,
  Megaphone: <Megaphone className="w-6 h-6" />,
  FileSearch: <FileSearch className="w-6 h-6" />,
  BarChart: <BarChart className="w-6 h-6" />,
  Plane: <Plane className="w-6 h-6" />,
  Wallet: <Wallet className="w-6 h-6" />,
  ChefHat: <ChefHat className="w-6 h-6" />,
  Gift: <Gift className="w-6 h-6" />,
  Lightbulb: <Lightbulb className="w-6 h-6" />,
  Film: <Film className="w-6 h-6" />,
  Music: <Music className="w-6 h-6" />,
  Wind: <Wind className="w-6 h-6" />,
  Cloud: <Cloud className="w-6 h-6" />,
  Smartphone: <Smartphone className="w-6 h-6" />,
  Theater: <Theater className="w-6 h-6" />,
  Target: <Target className="w-6 h-6" />,
  Brain: <Brain className="w-6 h-6" />,
  BookOpen: <BookOpen className="w-6 h-6" />,
};

interface WelcomeScreenProps {
  language: string;
  onSuggestionClick: (prompt: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  language,
  onSuggestionClick,
}) => {
  const [randomSuggestions, setRandomSuggestions] = React.useState<Suggestion[]>(
    []
  );

  React.useEffect(() => {
    // Select correct language pool, fallback to 'en' if not 'th'
    const pool = language === "th" ? SUGGESTIONS.th : SUGGESTIONS.en;
    // Shuffle and pick 4
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setRandomSuggestions(shuffled.slice(0, 4));
  }, [language]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {randomSuggestions.map((item, idx) => (
            <button
              key={idx + item.title}
              onClick={() => onSuggestionClick(item.prompt)}
              className="group relative p-5 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-[#1447E6] dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer text-left overflow-hidden animate-in fade-in zoom-in-95 duration-300 fill-mode-both"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Background Gradient Effect */}
              <div className="absolute inset-0 bg-linear-to-br from-blue-50/50 to-transparent dark:from-blue-900/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:scale-110 transition-all duration-300 shadow-sm text-[#1447E6] dark:text-blue-400">
                  {IconMap[item.icon] || <Sparkles className="w-6 h-6" />}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-[15px] font-bold text-zinc-800 dark:text-zinc-100 mb-1 group-hover:text-[#1447E6] dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                    {item.title}
                    <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Model Info */}
    </div>
  );
};
