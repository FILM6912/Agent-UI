import { useState, useEffect } from "react";
import { AgentFlow } from "./types";
import { ModelConfig } from "@/types";
import { getPresetModels } from "@/features/chat";

const EXCLUDED_FLOW_NAMES = [
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

interface UseAgentFlowsProps {
  modelConfig: ModelConfig;
  onModelConfigChange: (config: ModelConfig) => void;
  onError: (type: "error" | "warning", title: string, message: string) => void;
  t: (key: string) => string;
}

export const useAgentFlows = ({
  modelConfig,
  onModelConfigChange,
  onError,
  t,
}: UseAgentFlowsProps) => {
  const [agentFlows, setAgentFlows] = useState<AgentFlow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modelConfig.langflowUrl && modelConfig.langflowApiKey) {
      fetchAgents();
    }
  }, []);

  const fetchAgents = async () => {
    if (!modelConfig.langflowUrl) {
      onError(
        "warning",
        t("settings.configRequired"),
        t("settings.configureLangflowFirst"),
      );
      return;
    }

    setLoading(true);
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

      const response = await fetch(url.toString(), {
        headers: { accept: "application/json" },
      });

      if (response.status === 401) {
        onError(
          "error",
          t("settings.authRequired"),
          t("settings.authRequiredMessage"),
        );
        setAgentFlows([]);
        setLoading(false);
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

      if (savedAgents) {
        try {
          const parsed = JSON.parse(savedAgents);
          if (Array.isArray(parsed)) {
            parsed.forEach((agent: AgentFlow) => {
              enabledMap[agent.id] = agent.enabled !== false;
              if (agent.customName && agent.customName !== agent.name) {
                customNameMap[agent.id] = agent.customName;
              }
            });
          }
        } catch (e) {
          console.error("Failed to parse saved agents:", e);
        }
      }

      const newAgents: AgentFlow[] = flows
        .filter((flow: any) => !EXCLUDED_FLOW_NAMES.includes(flow.name))
        .map((flow: any) => ({
          id: flow.id,
          name: flow.name,
          description: flow.description || "No description available",
          enabled: enabledMap[flow.id] === true,
          customName: customNameMap[flow.id],
        }));

      setAgentFlows(newAgents);
      localStorage.setItem("agent_flows", JSON.stringify(newAgents));
    } catch (error) {
      console.error("Failed to fetch agent flows:", error);
      onError(
        "error",
        t("settings.fetchError"),
        t("settings.fetchErrorMessage"),
      );
      setAgentFlows([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = (id: string) => {
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

  const updateCustomName = (id: string, customName: string | undefined) => {
    const updated = agentFlows.map((agent) =>
      agent.id === id ? { ...agent, customName } : agent,
    );
    setAgentFlows(updated);
    localStorage.setItem("agent_flows", JSON.stringify(updated));
  };

  return {
    agentFlows,
    loading,
    fetchAgents,
    toggleEnabled,
    updateCustomName,
  };
};
