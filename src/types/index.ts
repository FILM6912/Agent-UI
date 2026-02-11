export type AIProvider = "google" | "openai";

export type ApiType = 'langflow' | 'openai';

export interface ModelConfig {
  provider: AIProvider;
  baseUrl: string;
  modelId: string;
  name: string;
  mcpServers?: string[];
  enabledConnections?: string[];
  enabledModels?: string[];
  systemPrompt?: string;
  voiceDelay?: number;
  langflowUrl?: string;
  langflowApiKey?: string;
  apiType?: ApiType;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar?: string;
  color?: string;
}

export interface ProcessStep {
  id: string;
  type: "thinking" | "command" | "edit" | "error" | "success";
  title?: string;
  content: string;
  duration?: string;
  isExpanded?: boolean;
  status: "running" | "completed" | "pending";
}

export interface Attachment {
  name: string;
  type: "file" | "image";
  content: string;
  mimeType?: string;
}

export interface AIRegenVersion {
  content: string;
  attachments?: Attachment[];
  steps?: ProcessStep[];
  suggestions?: string[];
  timestamp: number;
}

export interface AIVersion {
  content: string;
  attachments?: Attachment[];
  steps?: ProcessStep[];
  suggestions?: string[];
  timestamp: number;
  regenVersions?: AIRegenVersion[];
  currentRegenIndex?: number;
}

export interface MessageVersion {
  content: string;
  attachments?: Attachment[];
  steps?: ProcessStep[];
  suggestions?: string[];
  timestamp: number;
  // For user messages: AI versions with regen versions
  aiVersions?: AIVersion[];
  currentAIIndex?: number;
  // For assistant messages: tail messages (legacy)
  tail?: Message[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  steps?: ProcessStep[];
  versions?: MessageVersion[];
  currentVersionIndex?: number;
  suggestions?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}
