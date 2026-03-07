import { useState, useEffect } from "react";
import { ModelConfig, ApiType } from "@/types";

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
  const [apiTypeInput, setApiTypeInput] = useState<ApiType>(
    modelConfig.apiType || "langflow",
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
        setApiTypeInput(config.apiType || "langflow");

        if (!modelConfig.langflowUrl && config.url) {
          onModelConfigChange({
            ...modelConfig,
            langflowUrl: config.url,
            langflowApiKey: config.apiKey,
            apiType: config.apiType || "langflow",
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
      apiType: apiTypeInput,
    };

    onModelConfigChange(newConfig);

    localStorage.setItem(
      "langflow_config",
      JSON.stringify({
        url: urlInput,
        apiKey: apiKeyInput,
        apiType: apiTypeInput,
      }),
    );

    setIframeKey((prev) => prev + 1);
    setShowConfigModal(false);
    onSuccess("success", successTitle, successMessage);
  };

  const getIframeUrl = () => {
    if (!modelConfig.langflowUrl) return "";

    let baseUrl = modelConfig.langflowUrl;
    if (modelConfig.langflowApiKey) {
      const url = new URL(baseUrl);
      url.searchParams.set("api_key", modelConfig.langflowApiKey);
      baseUrl = url.toString();
    }

    return baseUrl;
  };

  return {
    urlInput,
    apiKeyInput,
    apiTypeInput,
    iframeKey,
    showConfigModal,
    setUrlInput,
    setApiKeyInput,
    setApiTypeInput,
    setShowConfigModal,
    saveConfig,
    getIframeUrl,
  };
};

