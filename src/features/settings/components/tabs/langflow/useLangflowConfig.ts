import { useState, useEffect } from "react";
import { ModelConfig } from "@/types";

interface UseLangflowConfigProps {
  modelConfig: ModelConfig;
  onModelConfigChange: (config: ModelConfig) => void;
  onSuccess: (
    type: "success" | "error" | "warning",
    title: string,
    message: string,
  ) => void;
}

export const useLangflowConfig = ({
  modelConfig,
  onModelConfigChange,
  onSuccess,
}: UseLangflowConfigProps) => {
  const [urlInput, setUrlInput] = useState(modelConfig.langflowUrl || "");
  const [apiKeyInput, setApiKeyInput] = useState(
    modelConfig.langflowApiKey || "",
  );
  const [iframeKey, setIframeKey] = useState(0);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Load LangFlow config on mount
  useEffect(() => {
    const savedLangflowConfig = localStorage.getItem("langflow_config");
    if (savedLangflowConfig) {
      try {
        const config = JSON.parse(savedLangflowConfig);
        setUrlInput(config.url || "");
        setApiKeyInput(config.apiKey || "");

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

  const saveConfig = (successTitle: string, successMessage: string) => {
    const newConfig = {
      ...modelConfig,
      langflowUrl: urlInput,
      langflowApiKey: apiKeyInput,
    };

    onModelConfigChange(newConfig);

    localStorage.setItem(
      "langflow_config",
      JSON.stringify({
        url: urlInput,
        apiKey: apiKeyInput,
      }),
    );

    setIframeKey((prev) => prev + 1);
    setShowConfigModal(false);
    onSuccess("success", successTitle, successMessage);
  };

  const getIframeUrl = () => {
    if (!modelConfig.langflowUrl) return "";

    try {
      const url = new URL(modelConfig.langflowUrl);

      if (modelConfig.langflowApiKey) {
        url.searchParams.set("api_key", modelConfig.langflowApiKey);
      }

      return url.toString();
    } catch (error) {
      console.error("Invalid URL:", error);
      return modelConfig.langflowUrl;
    }
  };

  return {
    urlInput,
    apiKeyInput,
    iframeKey,
    showConfigModal,
    setUrlInput,
    setApiKeyInput,
    setShowConfigModal,
    saveConfig,
    getIframeUrl,
  };
};
