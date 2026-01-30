import { ModelConfig, ChatSession } from "@/types";

export type SettingsTab =
  | "general"
  | "account"
  | "tools"
  | "agent"
  | "langflow";

export interface SettingsViewProps {
  modelConfig: ModelConfig;
  onModelConfigChange: (config: ModelConfig) => void;
  onBack: () => void;
  chatHistory: ChatSession[];
  onDeleteChat: (id: string) => void;
  onClearAllChats: () => void;
  initialTab?: SettingsTab;
  onTabChange?: (tab: SettingsTab) => void;
}

export interface AgentFlow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  customName?: string;
}
