import React from "react";
import { RotateCw } from "lucide-react";

interface ConfirmClearNameModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  t: (key: string) => string;
}

export const ConfirmClearNameModal: React.FC<ConfirmClearNameModalProps> = ({
  onConfirm,
  onCancel,
  t,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="bg-background border border-border w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <RotateCw className="w-6 h-6 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t("settings.clearCustomNameTitle") || "Clear Custom Name"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {t("settings.clearCustomNameWarning") ||
              "This will reset the agent name to the original name from LangFlow. The name will update automatically when changed in LangFlow."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white transition-colors"
            >
              {t("settings.clearName") || "Clear"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
