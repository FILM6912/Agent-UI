import React, { useState, useEffect } from "react";
import {
  Bot,
  RefreshCw,
  Check,
  X,
  Pencil,
  RotateCw,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { ModelConfig } from "@/types";
import { getPresetModels } from "@/features/chat";

interface AgentFlow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  customName?: string;
}

interface AgentTabProps {
  modelConfig: ModelConfig;
  onModelConfigChange: (config: ModelConfig) => void;
}

export const AgentTab: React.FC<AgentTabProps> = ({
  modelConfig,
  onModelConfigChange,
}) => {
  const { t } = useLanguage();

  const [agentFlows, setAgentFlows] = useState<AgentFlow[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editingAgentName, setEditingAgentName] = useState("");
  const [agentToClearName, setAgentToClearName] = useState<string | null>(null);

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

  // Auto fetch agents when component mounts if config is available
  useEffect(() => {
    if (modelConfig.langflowUrl && modelConfig.langflowApiKey) {
      fetchAgentFlows();
    }
  }, []);

  const fetchAgentFlows = async () => {
    if (!modelConfig.langflowUrl) {
      showNotification(
        "warning",
        t("settings.configRequired"),
        t("settings.configureLangflowFirst"),
      );
      return;
    }

    setLoadingAgents(true);
    try {
      const baseUrl = modelConfig.langflowUrl.replace(/\/+$/, "");
      const url = new URL(`${baseUrl}/api/v1/flows/`);
      url.searchParams.append("remove_example_flows", "false");
      url.searchParams.append("components_only", "false");
      url.searchParams.append("get_all", "true");
      url.searchParams.append("header_flows", "false");
      url.searchParams.append("page", "1");
      url.searchParams.append("size", "50");

      if (modelConfig.langflowApiKey) {
        url.searchParams.append("x-api-key", modelConfig.langflowApiKey);
      }

      const apiUrl = url.toString();
      const headers: HeadersInit = { accept: "application/json" };
      const response = await fetch(apiUrl, { headers });

      if (response.status === 401) {
        showNotification(
          "error",
          t("settings.authRequired"),
          t("settings.authRequiredMessage"),
        );
        setAgentFlows([]);
        setLoadingAgents(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const flows = await response.json();

      if (!Array.isArray(flows)) {
        throw new Error("Invalid response format");
      }

      const savedAgents = localStorage.getItem("agent_flows");
      let enabledMap: Record<string, boolean> = {};
      let customNameMap: Record<string, string> = {};
      let hasCustomNameMap: Record<string, boolean> = {};

      if (savedAgents) {
        try {
          const parsed = JSON.parse(savedAgents);
          if (Array.isArray(parsed)) {
            parsed.forEach((agent: any) => {
              enabledMap[agent.id] = agent.enabled !== false;
              if (agent.customName && agent.customName !== agent.name) {
                customNameMap[agent.id] = agent.customName;
                hasCustomNameMap[agent.id] = true;
              }
            });
          }
        } catch (e) {
          console.error("Failed to parse saved agents:", e);
        }
      }

      const excludedFlowNames = [
        "Basic Prompt Chaining",
        "Basic Prompting",
        "Blog Writer",
        "Custom Component Generator",
        "Document Q&A",
        "Financial Report Parser",
        "Hybrid Search RAG",
        "Image Sentiment Analysis",
        "Instagram Copywriter",
        "Invoice Summarizer",
        "Knowledge Ingestion",
        "Knowledge Retrieval",
        "Market Research",
        "Meeting Summary",
        "Memory Chatbot",
        "NVIDIA RTX Remix",
        "News Aggregator",
        "Pokédex Agent",
        "Portfolio Website Code Generator",
        "Price Deal Finder",
        "Research Agent",
        "Research Translation Loop",
        "SaaS Pricing",
        "SEO Keyword Generator",
        "Search agent",
        "Sequential Tasks Agents",
        "Simple Agent",
        "Social Media Agent",
        "Text Sentiment Analysis",
        "Travel Planning Agents",
        "Twitter Thread Generator",
        "Vector Store RAG",
        "YouTube Analysis",
      ];

      const newAgents: AgentFlow[] = flows
        .filter((flow: any) => !excludedFlowNames.includes(flow.name))
        .map((flow: any) => {
          const displayName = hasCustomNameMap[flow.id]
            ? customNameMap[flow.id]
            : flow.name;

          return {
            id: flow.id,
            name: flow.name,
            description: flow.description || "No description available",
            enabled: enabledMap[flow.id] === true,
            customName: displayName !== flow.name ? displayName : undefined,
          };
        });

      setAgentFlows(newAgents);
      localStorage.setItem("agent_flows", JSON.stringify(newAgents));
    } catch (error) {
      console.error("Failed to fetch agent flows:", error);
      showNotification(
        "error",
        t("settings.fetchError"),
        t("settings.fetchErrorMessage"),
      );
      setAgentFlows([]);
    } finally {
      setLoadingAgents(false);
    }
  };

  const toggleAgentEnabled = (id: string) => {
    const updated = agentFlows.map((agent) =>
      agent.id === id ? { ...agent, enabled: !agent.enabled } : agent,
    );
    setAgentFlows(updated);
    localStorage.setItem("agent_flows", JSON.stringify(updated));

    const disabledAgent = updated.find((agent) => agent.id === id);
    if (disabledAgent && !disabledAgent.enabled && modelConfig.modelId === id) {
      const firstEnabledAgent = updated.find((agent) => agent.enabled);
      if (firstEnabledAgent) {
        onModelConfigChange({
          ...modelConfig,
          modelId: firstEnabledAgent.id,
          name: firstEnabledAgent.customName || firstEnabledAgent.name,
        });
      } else {
        const presetModels = getPresetModels(t);
        const firstPreset = presetModels.google[0];
        onModelConfigChange({
          ...modelConfig,
          modelId: firstPreset.id,
          name: firstPreset.name,
        });
      }
    }
  };

  const startEditingAgent = (agent: AgentFlow) => {
    setEditingAgentId(agent.id);
    setEditingAgentName(agent.customName || agent.name);
  };

  const saveAgentName = (id: string) => {
    const updated = agentFlows.map((agent) => {
      if (agent.id === id) {
        const newCustomName =
          editingAgentName !== agent.name ? editingAgentName : undefined;
        return { ...agent, customName: newCustomName };
      }
      return agent;
    });
    setAgentFlows(updated);
    localStorage.setItem("agent_flows", JSON.stringify(updated));
    setEditingAgentId(null);
    setEditingAgentName("");
  };

  const cancelEditingAgent = () => {
    setEditingAgentId(null);
    setEditingAgentName("");
  };

  const clearCustomName = (id: string) => {
    const updated = agentFlows.map((agent) => {
      if (agent.id === id) {
        return { ...agent, customName: undefined };
      }
      return agent;
    });
    setAgentFlows(updated);
    localStorage.setItem("agent_flows", JSON.stringify(updated));
    setAgentToClearName(null);
  };

  const confirmClearCustomName = () => {
    if (agentToClearName) {
      clearCustomName(agentToClearName);
    }
  };

  return (
    <>
      <div className="max-w-4xl space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              {t("settings.agentDesc")}
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
              <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 font-mono">
                Ctrl
              </kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 font-mono">
                Q
              </kbd>
              <span className="ml-1">{t("settings.toClose")}</span>
            </div>
          </div>
          <button
            onClick={fetchAgentFlows}
            disabled={loadingAgents}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingAgents ? "animate-spin" : ""}`}
            />
            {loadingAgents ? t("settings.loading") : t("settings.fetchAgents")}
          </button>
        </div>

        <div className="space-y-3">
          {agentFlows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-500 text-sm border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-[#121212]/50">
              <Bot className="w-8 h-8 mb-3 opacity-50" />
              <span>{t("settings.noAgents")}</span>
              <button
                onClick={fetchAgentFlows}
                className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline text-xs"
              >
                {t("settings.fetchAgentsNow")}
              </button>
            </div>
          ) : (
            agentFlows.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group shadow-sm dark:shadow-none"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {(agent.customName || agent.name)
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1">
                    {editingAgentId === agent.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingAgentName}
                          onChange={(e) => setEditingAgentName(e.target.value)}
                          className="bg-white dark:bg-[#1e1e20] border border-indigo-300 dark:border-indigo-700 rounded-lg px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveAgentName(agent.id);
                            if (e.key === "Escape") cancelEditingAgent();
                          }}
                        />
                        <button
                          onClick={() => saveAgentName(agent.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditingAgent}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm">
                            {agent.customName || agent.name}
                          </div>
                          {agent.customName &&
                            agent.customName !== agent.name && (
                              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-700">
                                Custom
                              </span>
                            )}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                          {agent.description}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleAgentEnabled(agent.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      agent.enabled
                        ? "bg-green-500"
                        : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        agent.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>

                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                      agent.enabled
                        ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 border-green-200 dark:border-green-500/20"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {agent.enabled ? (
                      <>
                        <Check className="w-3 h-3" />
                        {t("settings.enabled")}
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        {t("settings.disabled")}
                      </>
                    )}
                  </div>

                  {editingAgentId !== agent.id && (
                    <>
                      <button
                        onClick={() => startEditingAgent(agent)}
                        className="p-2 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors text-zinc-500"
                        title={t("settings.editName") || "Edit name"}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {agent.customName && agent.customName !== agent.name && (
                        <button
                          onClick={() => setAgentToClearName(agent.id)}
                          className="p-2 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors text-zinc-500"
                          title={
                            t("settings.clearCustomName") || "Clear custom name"
                          }
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
                  <Check className="w-8 h-8 text-green-600 dark:text-green-500" />
                )}
                {modalConfig.type === "error" && (
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
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

      {/* Clear Custom Name Confirmation Modal */}
      {agentToClearName && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setAgentToClearName(null)}
        >
          <div
            className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <RotateCw className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {t("settings.clearCustomNameTitle") || "Clear Custom Name"}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                {t("settings.clearCustomNameWarning") ||
                  "This will reset the agent name to the original name from LangFlow. The name will update automatically when changed in LangFlow."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setAgentToClearName(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={confirmClearCustomName}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                >
                  {t("settings.clearName") || "Clear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
