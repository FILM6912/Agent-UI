import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { ModelConfig } from "@/types";
import { useAgentFlows } from "./agent/useAgentFlows";
import { useNotification } from "./agent/useNotification";
import { AgentCard } from "./agent/AgentCard";
import { AgentEmptyState } from "./agent/AgentEmptyState";
import { NotificationModal } from "./agent/NotificationModal";
import { ConfirmClearNameModal } from "./agent/ConfirmClearNameModal";

interface AgentTabProps {
  modelConfig: ModelConfig;
  onModelConfigChange: (config: ModelConfig) => void;
}

export const AgentTab: React.FC<AgentTabProps> = ({
  modelConfig,
  onModelConfigChange,
}) => {
  const { t } = useLanguage();
  const [agentToClearName, setAgentToClearName] = useState<string | null>(null);

  const { showModal, config, showNotification, hideNotification } =
    useNotification();

  const { agentFlows, loading, fetchAgents, toggleEnabled, updateCustomName } =
    useAgentFlows({
      modelConfig,
      onModelConfigChange,
      onError: showNotification,
      t,
    });

  const handleClearName = () => {
    if (agentToClearName) {
      updateCustomName(agentToClearName, undefined);
      setAgentToClearName(null);
    }
  };

  return (
    <>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-muted-foreground text-sm">
              {t("settings.agentDesc")}
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono">
                Ctrl
              </kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono">
                Q
              </kbd>
              <span className="ml-1">{t("settings.toClose")}</span>
            </div>
          </div>
          <button
            onClick={fetchAgents}
            disabled={loading}
            className="flex items-center gap-2 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground px-4 py-2 rounded-lg text-xs font-medium transition-opacity shadow-lg shadow-primary/20"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? t("settings.loading") : t("settings.fetchAgents")}
          </button>
        </div>

        {/* Agent List */}
        <div className="space-y-3">
          {agentFlows.length === 0 ? (
            <AgentEmptyState
              onFetch={fetchAgents}
              fetchText={t("settings.fetchAgentsNow")}
              emptyText={t("settings.noAgents")}
            />
          ) : (
            agentFlows.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onToggleEnabled={toggleEnabled}
                onUpdateName={updateCustomName}
                onRequestClearName={setAgentToClearName}
                t={t}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <NotificationModal
          config={config}
          onClose={hideNotification}
          okText={t("common.ok")}
        />
      )}

      {agentToClearName && (
        <ConfirmClearNameModal
          onConfirm={handleClearName}
          onCancel={() => setAgentToClearName(null)}
          t={t}
        />
      )}
    </>
  );
};
