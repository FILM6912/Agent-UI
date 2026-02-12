import React from "react";
import {
  Workflow,
  X,
  Globe,
  ShieldAlert,
  HelpCircle,
  Save,
  ExternalLink,
  Radio,
} from "lucide-react";
import { ApiType } from "@/types";

interface LangflowConfigModalProps {
  urlInput: string;
  apiKeyInput: string;
  apiTypeInput: ApiType;
  currentUrl: string;
  onUrlChange: (url: string) => void;
  onApiKeyChange: (key: string) => void;
  onApiTypeChange: (type: ApiType) => void;
  onSave: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

export const LangflowConfigModal: React.FC<LangflowConfigModalProps> = ({
  urlInput,
  apiKeyInput,
  apiTypeInput,
  currentUrl,
  onUrlChange,
  onApiKeyChange,
  onApiTypeChange,
  onSave,
  onClose,
  t,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative bg-zinc-900 dark:bg-zinc-950 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-700 dark:border-zinc-800">
        {/* Header */}
        <div className="bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-zinc-700 dark:bg-zinc-800 rounded-xl">
                <Workflow className="w-6 h-6 text-zinc-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-100">
                  {t("settings.langflowConfig")}
                </h3>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {t("settings.configureLangflowDesc")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-700 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 bg-zinc-900 dark:bg-zinc-950">
          {/* URL Input */}
          <div>
            <label className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-400" />
              {t("settings.langflowUrl")}
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="http://localhost:7860"
              className="w-full bg-zinc-800 dark:bg-zinc-900 border-2 border-zinc-700 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 font-mono transition-colors"
            />
            <p className="text-xs text-zinc-500 mt-1.5 ml-1">
              {t("settings.langflowUrlHint")}
            </p>
          </div>

          {/* API Key Input */}
          <div>
            <label className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-zinc-400" />
              {t("settings.apiKey")}
              <span className="text-xs font-normal text-zinc-500">
                ({t("settings.optional")})
              </span>
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-zinc-800 dark:bg-zinc-900 border-2 border-zinc-700 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 font-mono transition-colors"
            />
            <p className="text-xs text-zinc-500 mt-1.5 ml-1">
              {t("settings.apiKeyHint")}
            </p>
          </div>

          {/* API Type Selector */}
          <div>
            <label className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 text-zinc-400" />
              {t("settings.apiType")}
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onApiTypeChange("langflow")}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                  apiTypeInput === "langflow"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                    : "bg-zinc-800 dark:bg-zinc-900 border-zinc-700 dark:border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                }`}
              >
                {t("settings.apiTypeLangflow")}
              </button>
              <button
                type="button"
                onClick={() => onApiTypeChange("openai")}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                  apiTypeInput === "openai"
                    ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                    : "bg-zinc-800 dark:bg-zinc-900 border-zinc-700 dark:border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                }`}
              >
                {t("settings.apiTypeOpenAI")}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-1.5 ml-1">
              {t("settings.apiTypeHint")}
            </p>
          </div>

          {/* Help Sections */}
          <div className="space-y-3">
            {/* Quick Tip */}
            <div className="bg-zinc-800 dark:bg-zinc-900 border border-zinc-700 dark:border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <HelpCircle className="w-4 h-4" />
                <span className="font-medium">{t("settings.quickTip")}:</span>
                <kbd className="px-2 py-1 bg-zinc-700 dark:bg-zinc-800 rounded border border-zinc-600 dark:border-zinc-700 font-mono text-xs text-zinc-300">
                  Ctrl
                </kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-zinc-700 dark:bg-zinc-800 rounded border border-zinc-600 dark:border-zinc-700 font-mono text-xs text-zinc-300">
                  Q
                </kbd>
                <span>{t("settings.toOpenConfig")}</span>
              </div>
            </div>

            {/* Auth Warning */}
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-amber-400">
                    {t("settings.langflowAuthRequired")}
                  </p>
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    {t("settings.langflowAuthDesc")}
                  </p>
                  <div className="bg-zinc-900/50 rounded-lg p-3 mt-2">
                    <p className="text-xs text-zinc-400 mb-2 font-medium">
                      {t("settings.langflowSetupSteps")}:
                    </p>
                    <ol className="text-xs text-zinc-300 space-y-1.5 list-decimal list-inside">
                      <li>{t("settings.langflowStep1")}</li>
                      <li>{t("settings.langflowStep2")}</li>
                      <li>{t("settings.langflowStep3")}</li>
                    </ol>
                    <div className="mt-3 p-2 bg-zinc-800 rounded border border-zinc-700">
                      <code className="text-xs text-green-400 font-mono break-all">
                        LANGFLOW_SKIP_AUTH_AUTO_LOGIN=true
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onSave}
              disabled={!urlInput.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-100 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg disabled:shadow-none"
            >
              <Save className="w-5 h-5" />
              {t("settings.saveAndReload")}
            </button>

            {currentUrl && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                {t("settings.openExternal")}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
