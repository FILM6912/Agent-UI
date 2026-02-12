import React from "react";
import { Sparkles, Brain, Loader2 } from "lucide-react";
import { ModelConfig } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";

interface LoadingIndicatorProps {
  modelConfig: ModelConfig;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  modelConfig,
}) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 items-start">
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className="w-6 h-6 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs text-zinc-500 font-medium">
          {modelConfig.name.toUpperCase()}
        </span>
      </div>
      <div className="pl-4 py-2 flex items-center gap-4">
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce"></div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-xs">
          <div className="relative flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <Loader2 className="w-4 h-4 text-blue-400/40 absolute animate-spin" />
          </div>
          <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider animate-pulse">
             {t("process.thinking") || "Thinking..."}
           </span>
        </div>
      </div>
    </div>
  );
};
