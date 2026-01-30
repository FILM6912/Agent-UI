import { useEffect, useState, useRef } from "react";
import { ModelConfig } from "@/types";

interface UseAgentModelsProps {
  modelConfig: ModelConfig;
  onModelConfigChange: (config: ModelConfig) => void;
}

export const useAgentModels = ({
  modelConfig,
  onModelConfigChange,
}: UseAgentModelsProps) => {
  const [agentModels, setAgentModels] = useState<
    { id: string; name: string; desc: string }[]
  >([]);
  const [pinnedAgentId, setPinnedAgentId] = useState<string | null>(null);

  // Store config in ref to avoid dependency array issues
  const langflowConfigRef = useRef({
    url: modelConfig.langflowUrl,
    apiKey: modelConfig.langflowApiKey,
  });

  useEffect(() => {
    langflowConfigRef.current = {
      url: modelConfig.langflowUrl,
      apiKey: modelConfig.langflowApiKey,
    };
  }, [modelConfig.langflowUrl, modelConfig.langflowApiKey]);

  useEffect(() => {
    const loadAgentModels = async () => {
      const { url, apiKey } = langflowConfigRef.current;

      if (!url || !apiKey) {
        setAgentModels([]);
        return;
      }

      try {
        const baseUrl = url.replace(/\/+$/, "");
        const apiUrl = new URL(`${baseUrl}/api/v1/flows/`);
        apiUrl.searchParams.append("remove_example_flows", "false");
        apiUrl.searchParams.append("components_only", "false");
        apiUrl.searchParams.append("get_all", "true");
        apiUrl.searchParams.append("header_flows", "false");
        apiUrl.searchParams.append("page", "1");
        apiUrl.searchParams.append("size", "50");
        apiUrl.searchParams.append("x-api-key", apiKey);

        const response = await fetch(apiUrl.toString(), {
          headers: { accept: "application/json" },
        });

        if (!response.ok) {
          console.error("Failed to fetch agents:", response.status);
          setAgentModels([]);
          return;
        }

        const flows = await response.json();
        if (!Array.isArray(flows)) {
          setAgentModels([]);
          return;
        }

        // Load enabled/disabled state from localStorage
        const savedAgents = localStorage.getItem("agent_flows");
        let enabledMap: Record<string, boolean> = {};

        if (savedAgents) {
          try {
            const parsed = JSON.parse(savedAgents);
            if (Array.isArray(parsed)) {
              parsed.forEach((agent: any) => {
                enabledMap[agent.id] = agent.enabled === true;
              });
            }
          } catch (e) {
            console.error("Failed to parse saved agents:", e);
          }
        }

        // Filter only enabled agents
        const agents = flows
          .filter((flow: any) => enabledMap[flow.id] === true)
          .map((flow: any) => ({
            id: flow.id,
            name: flow.name,
            desc: flow.description || "LangFlow Agent",
          }));

        setAgentModels(agents);

        // Load pinned agent and auto-select if available
        const savedPinnedId = localStorage.getItem("pinned_agent_id");
        if (savedPinnedId) {
          setPinnedAgentId(savedPinnedId);
          const pinnedAgent = agents.find((a) => a.id === savedPinnedId);
          if (pinnedAgent && modelConfig.modelId !== savedPinnedId) {
            onModelConfigChange({
              ...modelConfig,
              modelId: pinnedAgent.id,
              name: pinnedAgent.name,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load agent models:", error);
        setAgentModels([]);
      }
    };

    loadAgentModels();

    // Reload when window gains focus (after settings change)
    const handleFocus = () => loadAgentModels();
    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handlePinAgent = (agentId: string) => {
    if (pinnedAgentId === agentId) {
      // Unpin
      setPinnedAgentId(null);
      localStorage.removeItem("pinned_agent_id");
    } else {
      // Pin
      setPinnedAgentId(agentId);
      localStorage.setItem("pinned_agent_id", agentId);
    }
  };

  return {
    agentModels,
    pinnedAgentId,
    handlePinAgent,
  };
};
