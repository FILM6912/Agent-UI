export interface AgentFlow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  customName?: string;
}

export interface NotificationConfig {
  type: "success" | "error" | "warning";
  title: string;
  message: string;
}
