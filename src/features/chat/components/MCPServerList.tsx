import React from "react";
import { Plug } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface MCPServerListProps {
  isOpen: boolean;
  onToggle: () => void;
  servers: string[];
  menuRef: React.RefObject<HTMLDivElement>;
}

export const MCPServerList: React.FC<MCPServerListProps> = ({
  isOpen,
  onToggle,
  servers,
  menuRef,
}) => {
  const { t } = useLanguage();

  return (
    <div className="relative" ref={menuRef}>
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex justify-between items-center">
            <span>{t("chat.mcpTitle")}</span>
            <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 rounded-sm">
              {servers.length}
            </span>
          </div>
          <div className="p-2 max-h-48 overflow-y-auto">
            {servers.length === 0 ? (
              <div className="text-xs text-zinc-500 text-center py-4 italic">
                {t("chat.noServers") || "No servers connected"}
              </div>
            ) : (
              servers.map((server) => (
                <div
                  key={server}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate flex-1">
                    {server}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
          isOpen || servers.length > 0
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-zinc-800 text-emerald-700 dark:text-emerald-400"
            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
        }`}
        title={t("chat.mcpTitle")}
      >
        <Plug className="w-3.5 h-3.5" />
        {servers.length > 0 && (
          <span className="text-xs font-bold">{servers.length}</span>
        )}
      </button>
    </div>
  );
};
