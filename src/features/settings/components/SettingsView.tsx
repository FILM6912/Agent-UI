import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Wrench,
  Bot,
  Workflow,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ModelConfig, ChatSession } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import { GeneralTab } from "./tabs/GeneralTab";
import { AccountTab } from "./tabs/AccountTab";
import { ToolsTab } from "./tabs/ToolsTab";
import { AgentTab } from "./tabs/AgentTab";
import { LangflowTab } from "./tabs/LangflowTab";

interface SettingsViewProps {
  modelConfig: ModelConfig;
  onModelConfigChange: (config: ModelConfig) => void;
  onBack: () => void;
  chatHistory: ChatSession[];
  onDeleteChat: (id: string) => void;
  onClearAllChats: () => void;
  initialTab?: SettingsTab;
  onTabChange?: (tab: SettingsTab) => void;
}

type SettingsTab = "general" | "account" | "tools" | "agent" | "langflow";

export const SettingsView: React.FC<SettingsViewProps> = ({
  modelConfig,
  onModelConfigChange,
  onBack,
  chatHistory,
  onDeleteChat,
  onClearAllChats,
  initialTab = "general",
  onTabChange,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="flex h-full w-full bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-200 font-sans overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <div
        className={`border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] flex flex-col transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-16"}`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800/50">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {t("settings.title")}
            </h1>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors ml-auto"
            title={isSidebarOpen ? "ปิด Sidebar" : "เปิด Sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {[
            { id: "general", icon: Settings, label: t("settings.general") },
            { id: "account", icon: User, label: t("settings.account") },
            { id: "tools", icon: Wrench, label: t("settings.myTools") },
            { id: "agent", icon: Bot, label: t("settings.agent") },
            { id: "langflow", icon: Workflow, label: t("settings.langflow") },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id as SettingsTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 outline-none focus:outline-none focus-visible:outline-none active:outline-none ${
                activeTab === item.id
                  ? item.id === "langflow" || item.id === "agent"
                    ? "bg-indigo-50 dark:bg-[#27272a] text-indigo-600 dark:text-indigo-400 font-medium shadow-sm"
                    : "bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white font-medium shadow-sm"
                  : item.id === "langflow" || item.id === "agent"
                    ? "text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-800/50"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              }`}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <item.icon
                className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? (item.id === "langflow" || item.id === "agent" ? "text-indigo-500 dark:text-indigo-400" : "text-indigo-500 dark:text-indigo-400") : ""}`}
              />
              {isSidebarOpen && item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium ${!isSidebarOpen ? "justify-center w-full" : ""}`}
            title={!isSidebarOpen ? t("settings.back") : undefined}
          >
            <ArrowLeft className="w-4 h-4" />
            {isSidebarOpen && t("settings.back")}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-zinc-50 dark:bg-black flex flex-col overflow-hidden transition-colors duration-200">
        {/* Header - Hidden for LangFlow tab */}
        {activeTab !== "langflow" && (
          <div className="h-16 flex items-center justify-between px-8 border-b border-zinc-200 dark:border-zinc-800/50 flex-shrink-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {activeTab === "general" && (
                <Settings className="w-5 h-5 text-blue-500" />
              )}
              {activeTab === "account" && (
                <User className="w-5 h-5 text-blue-500" />
              )}
              {activeTab === "tools" && (
                <Wrench className="w-5 h-5 text-blue-500" />
              )}
              {activeTab === "agent" && (
                <Bot className="w-5 h-5 text-indigo-500" />
              )}

              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-wide">
                {activeTab === "general" && t("settings.general")}
                {activeTab === "account" && t("settings.account")}
                {activeTab === "tools" && t("settings.myTools")}
                {activeTab === "agent" && t("settings.agent")}
              </h2>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div
          className={`flex-1 overflow-y-auto ${activeTab === "langflow" ? "p-0" : "p-8"} custom-scrollbar`}
        >
          {activeTab === "general" && (
            <GeneralTab
              chatHistory={chatHistory}
              onClearAllChats={onClearAllChats}
            />
          )}

          {activeTab === "account" && <AccountTab />}

          {activeTab === "tools" && (
            <ToolsTab
              modelConfig={modelConfig}
              onModelConfigChange={onModelConfigChange}
            />
          )}

          {activeTab === "agent" && (
            <AgentTab
              modelConfig={modelConfig}
              onModelConfigChange={onModelConfigChange}
            />
          )}

          {activeTab === "langflow" && (
            <LangflowTab
              modelConfig={modelConfig}
              onModelConfigChange={onModelConfigChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};
