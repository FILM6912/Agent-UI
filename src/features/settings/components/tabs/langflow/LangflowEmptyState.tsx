import React from "react";
import { Workflow, Settings } from "lucide-react";

interface LangflowEmptyStateProps {
  onConfigure: () => void;
  t: (key: string) => string;
}

export const LangflowEmptyState: React.FC<LangflowEmptyStateProps> = ({
  onConfigure,
  t,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
      <Workflow className="w-16 h-16 mb-4 opacity-50" />
      <p className="text-lg font-medium mb-2">
        {t("settings.configureLangflowUrl")}
      </p>
      <p className="text-sm mb-4">{t("settings.pressCtrlQ")}</p>
      <button
        onClick={onConfigure}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
      >
        <Settings className="w-4 h-4" />
        {t("settings.configureLangflow")}
      </button>
    </div>
  );
};
