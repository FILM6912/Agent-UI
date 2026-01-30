import React from "react";
import { Check, AlertCircle, HelpCircle } from "lucide-react";
import { NotificationConfig } from "./types";

interface NotificationModalProps {
  config: NotificationConfig;
  onClose: () => void;
  okText: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  config,
  onClose,
  okText,
}) => {
  const getColors = () => {
    switch (config.type) {
      case "success":
        return {
          gradient: "from-green-500 to-emerald-500",
          bg: "bg-green-100 dark:bg-green-500/20",
          icon: (
            <Check className="w-8 h-8 text-green-600 dark:text-green-500" />
          ),
          shadow: "shadow-green-500/30",
        };
      case "error":
        return {
          gradient: "from-red-500 to-rose-500",
          bg: "bg-red-100 dark:bg-red-500/20",
          icon: (
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
          ),
          shadow: "shadow-red-500/30",
        };
      case "warning":
        return {
          gradient: "from-amber-500 to-orange-500",
          bg: "bg-amber-100 dark:bg-amber-500/20",
          icon: (
            <HelpCircle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
          ),
          shadow: "shadow-amber-500/30",
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-background rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-border">
        <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
        <div className="p-6">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${colors.bg}`}
          >
            {colors.icon}
          </div>
          <h3 className="text-xl font-bold text-center text-foreground mb-2">
            {config.title}
          </h3>
          <p className="text-sm text-center text-muted-foreground mb-6">
            {config.message}
          </p>
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg bg-gradient-to-r ${colors.gradient} hover:opacity-90 ${colors.shadow}`}
          >
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
};
