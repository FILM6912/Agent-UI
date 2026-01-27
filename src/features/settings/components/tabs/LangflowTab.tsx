import React, { useState, useEffect } from "react";
import {
  Workflow,
  Settings,
  X,
  Globe,
  ShieldAlert,
  HelpCircle,
  Save,
  ExternalLink,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { ModelConfig } from "@/types";

interface LangflowTabProps {
  modelConfig: ModelConfig;
  onModelConfigChange: (config: ModelConfig) => void;
}

export const LangflowTab: React.FC<LangflowTabProps> = ({
  modelConfig,
  onModelConfigChange,
}) => {
  const { t } = useLanguage();

  const [langflowUrlInput, setLangflowUrlInput] = useState(
    modelConfig.langflowUrl || "",
  );
  const [langflowApiKeyInput, setLangflowApiKeyInput] = useState(
    modelConfig.langflowApiKey || "",
  );
  const [iframeKey, setIframeKey] = useState(0);
  const [showLangflowConfigModal, setShowLangflowConfigModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: "success" | "error" | "warning";
    title: string;
    message: string;
  }>({
    type: "success",
    title: "",
    message: "",
  });

  const showNotification = (
    type: "success" | "error" | "warning",
    title: string,
    message: string,
  ) => {
    setModalConfig({ type, title, message });
    setShowModal(true);
  };

  // Load LangFlow config on mount
  useEffect(() => {
    const savedLangflowConfig = localStorage.getItem("langflow_config");
    if (savedLangflowConfig) {
      try {
        const config = JSON.parse(savedLangflowConfig);
        setLangflowUrlInput(config.url || "");
        setLangflowApiKeyInput(config.apiKey || "");

        if (!modelConfig.langflowUrl && config.url) {
          onModelConfigChange({
            ...modelConfig,
            langflowUrl: config.url,
            langflowApiKey: config.apiKey,
          });
        }
      } catch (error) {
        console.error("Failed to load LangFlow config:", error);
      }
    }
  }, []);

  // Keyboard shortcut for Ctrl+Q
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "q" || e.code === "KeyQ")
      ) {
        e.preventDefault();
        setShowLangflowConfigModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveLangflowUrl = () => {
    const newConfig = {
      ...modelConfig,
      langflowUrl: langflowUrlInput,
      langflowApiKey: langflowApiKeyInput,
    };

    onModelConfigChange(newConfig);

    localStorage.setItem(
      "langflow_config",
      JSON.stringify({
        url: langflowUrlInput,
        apiKey: langflowApiKeyInput,
      }),
    );

    setIframeKey((prev) => prev + 1);
    setShowLangflowConfigModal(false);
    showNotification(
      "success",
      t("settings.configSaved"),
      t("settings.configSavedMessage"),
    );
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 bg-zinc-100 dark:bg-black relative">
          {modelConfig.langflowUrl ? (
            <iframe
              key={iframeKey}
              src={modelConfig.langflowUrl}
              className="w-full h-full border-0"
              title="LangFlow Interface"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
              <Workflow className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {t("settings.configureLangflowUrl")}
              </p>
              <p className="text-sm mb-4">{t("settings.pressCtrlQ")}</p>
              <button
                onClick={() => setShowLangflowConfigModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
              >
                <Settings className="w-4 h-4" />
                {t("settings.configureLangflow")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LangFlow Configuration Modal */}
      {showLangflowConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowLangflowConfigModal(false)}
          />

          <div className="relative bg-zinc-900 dark:bg-zinc-950 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-700 dark:border-zinc-800">
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
                  onClick={() => setShowLangflowConfigModal(false)}
                  className="p-2 hover:bg-zinc-700 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 bg-zinc-900 dark:bg-zinc-950">
              <div>
                <label className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-zinc-400" />
                  {t("settings.langflowUrl")}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={langflowUrlInput}
                  onChange={(e) => setLangflowUrlInput(e.target.value)}
                  placeholder="http://localhost:7860"
                  className="w-full bg-zinc-800 dark:bg-zinc-900 border-2 border-zinc-700 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 font-mono transition-colors"
                />
                <p className="text-xs text-zinc-500 mt-1.5 ml-1">
                  {t("settings.langflowUrlHint")}
                </p>
              </div>

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
                  value={langflowApiKeyInput}
                  onChange={(e) => setLangflowApiKeyInput(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-zinc-800 dark:bg-zinc-900 border-2 border-zinc-700 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 font-mono transition-colors"
                />
                <p className="text-xs text-zinc-500 mt-1.5 ml-1">
                  {t("settings.apiKeyHint")}
                </p>
              </div>

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

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={saveLangflowUrl}
                  disabled={!langflowUrlInput.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-100 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg disabled:shadow-none"
                >
                  <Save className="w-5 h-5" />
                  {t("settings.saveAndReload")}
                </button>

                {modelConfig.langflowUrl && (
                  <a
                    href={modelConfig.langflowUrl}
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
      )}

      {/* Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white dark:bg-[#121212] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800">
            <div
              className={`h-2 ${
                modalConfig.type === "success"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : modalConfig.type === "error"
                    ? "bg-gradient-to-r from-red-500 to-rose-500"
                    : "bg-gradient-to-r from-amber-500 to-orange-500"
              }`}
            />
            <div className="p-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  modalConfig.type === "success"
                    ? "bg-green-100 dark:bg-green-500/20"
                    : modalConfig.type === "error"
                      ? "bg-red-100 dark:bg-red-500/20"
                      : "bg-amber-100 dark:bg-amber-500/20"
                }`}
              >
                {modalConfig.type === "success" && (
                  <Settings className="w-8 h-8 text-green-600 dark:text-green-500" />
                )}
                {modalConfig.type === "error" && (
                  <X className="w-8 h-8 text-red-600 dark:text-red-500" />
                )}
                {modalConfig.type === "warning" && (
                  <HelpCircle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                )}
              </div>
              <h3 className="text-xl font-bold text-center text-zinc-900 dark:text-white mb-2">
                {modalConfig.title}
              </h3>
              <p className="text-sm text-center text-zinc-600 dark:text-zinc-400 mb-6">
                {modalConfig.message}
              </p>
              <button
                onClick={() => setShowModal(false)}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg ${
                  modalConfig.type === "success"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/30"
                    : modalConfig.type === "error"
                      ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-500/30"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30"
                }`}
              >
                {t("common.ok")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
