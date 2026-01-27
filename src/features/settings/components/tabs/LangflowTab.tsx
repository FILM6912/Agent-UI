import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { ModelConfig } from "@/types";
import { LangflowEmptyState } from "./langflow/LangflowEmptyState";
import { LangflowConfigModal } from "./langflow/LangflowConfigModal";
import { NotificationModal } from "./langflow/NotificationModal";
import { useLangflowConfig } from "./langflow/useLangflowConfig";
import { useNotification } from "./langflow/useNotification";
import { useKeyboardShortcut } from "./langflow/useKeyboardShortcut";

interface LangflowTabProps {
  modelConfig: ModelConfig;
  onModelConfigChange: (config: ModelConfig) => void;
}

export const LangflowTab: React.FC<LangflowTabProps> = ({
  modelConfig,
  onModelConfigChange,
}) => {
  const { t } = useLanguage();
  const { showModal, config, showNotification, hideNotification } =
    useNotification();

  const {
    urlInput,
    apiKeyInput,
    iframeKey,
    showConfigModal,
    setUrlInput,
    setApiKeyInput,
    setShowConfigModal,
    saveConfig,
    getIframeUrl,
  } = useLangflowConfig({
    modelConfig,
    onModelConfigChange,
    onSuccess: showNotification,
  });

  useKeyboardShortcut({
    key: "q",
    ctrlKey: true,
    metaKey: true,
    onTrigger: () => setShowConfigModal(true),
  });

  const handleSave = () => {
    saveConfig(t("settings.configSaved"), t("settings.configSavedMessage"));
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 relative">
          {modelConfig.langflowUrl ? (
            <iframe
              key={iframeKey}
              src={getIframeUrl()}
              className="w-full h-full border-0 bg-zinc-950"
              style={{
                colorScheme: "dark",
              }}
              title="LangFlow Interface"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation allow-downloads"
              referrerPolicy="no-referrer"
              allow="clipboard-read; clipboard-write"
            />
          ) : (
            <LangflowEmptyState
              onConfigure={() => setShowConfigModal(true)}
              t={t}
            />
          )}
        </div>
      </div>

      {showConfigModal && (
        <LangflowConfigModal
          urlInput={urlInput}
          apiKeyInput={apiKeyInput}
          currentUrl={modelConfig.langflowUrl || ""}
          onUrlChange={setUrlInput}
          onApiKeyChange={setApiKeyInput}
          onSave={handleSave}
          onClose={() => setShowConfigModal(false)}
          t={t}
        />
      )}

      {showModal && (
        <NotificationModal
          config={config}
          onClose={hideNotification}
          okText={t("common.ok")}
        />
      )}
    </>
  );
};
