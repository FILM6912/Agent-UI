import React from "react";
import { ChevronUp, Check, Sparkles, Pin, PinOff } from "lucide-react";
import { ModelConfig } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";

interface ModelSelectorProps {
  isOpen: boolean;
  onToggle: () => void;
  modelConfig: ModelConfig;
  agentModels: { id: string; name: string; desc: string }[];
  pinnedAgentId: string | null;
  onModelSelect: (modelId: string, modelName: string) => void;
  onPinAgent: (agentId: string) => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  isOpen,
  onToggle,
  modelConfig,
  agentModels,
  pinnedAgentId,
  onModelSelect,
  onPinAgent,
  menuRef,
}) => {
  const { t } = useLanguage();

  return (
    <div className="relative" ref={menuRef}>
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 flex flex-col animate-in slide-in-from-bottom-2 fade-in duration-200 overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            {t("chat.availableModels")}
          </div>
          <div className="p-1 max-h-60 overflow-y-auto scrollbar-hide">
            {/* Agent Models */}
            {agentModels.map((m) => (
              <div
                key={m.id}
                className="group relative flex items-center gap-2"
              >
                <button
                  onClick={() => {
                    onModelSelect(m.id, m.name);
                  }}
                  className={`flex-1 text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors ${
                    modelConfig.modelId === m.id
                      ? "bg-zinc-100 dark:bg-zinc-800/50"
                      : ""
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${modelConfig.modelId === m.id ? "bg-indigo-500" : "bg-zinc-400 dark:bg-zinc-700"}`}
                  ></div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium truncate">{m.name}</span>
                    <span className="text-[10px] opacity-60 truncate">
                      {m.desc}
                    </span>
                  </div>
                  {modelConfig.modelId === m.id && (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPinAgent(m.id);
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    pinnedAgentId === m.id
                      ? "text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
                      : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                  title={
                    pinnedAgentId === m.id
                      ? t("chat.unpinAgent")
                      : t("chat.pinAgent")
                  }
                >
                  {pinnedAgentId === m.id ? (
                    <Pin className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <PinOff className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}

            {/* Show message if no agents */}
            {agentModels.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="mb-1">
                  {t("chat.noAgents") || "No agents available"}
                </p>
                <p className="text-[10px]">
                  {t("chat.configureAgents") || "Configure agents in Settings"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
          isOpen
            ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        }`}
        title={t("chat.modelSettings")}
      >
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              pinnedAgentId === modelConfig.modelId
                ? "bg-amber-500"
                : modelConfig.provider === "google"
                  ? "bg-blue-500"
                  : "bg-blue-500"
            }`}
          ></div>
        </div>
        <span className="text-xs font-medium max-w-[100px] truncate">
          {modelConfig.name}
        </span>
        <ChevronUp
          className={`w-3 h-3 text-zinc-500 ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
};
