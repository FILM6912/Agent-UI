import React from "react";
import { Sparkles } from "lucide-react";
import { ModelConfig } from "@/types";

interface LoadingIndicatorProps {
  modelConfig: ModelConfig;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  modelConfig,
}) => {
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
      <div className="pl-4 py-2">
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};
