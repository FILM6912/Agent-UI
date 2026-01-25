import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  User,
  Plug,
  Cpu,
  Wrench,
  Bot,
  ShieldAlert,
  ArrowLeft,
  Plus,
  Globe,
  Search,
  RotateCw,
  Check,
  Pencil,
  Trash2,
  Zap,
  Play,
  List,
  CheckSquare,
  AlertCircle,
  Sun,
  Moon,
  Laptop,
  Languages,
  Mic,
  MessageSquare,
  ChevronDown,
  Camera,
  Eye,
  EyeOff,
  Save,
  MessageSquareX,
  FileText,
  Monitor,
  Upload,
  Download,
  Activity,
  HardDrive,
  MemoryStick,
  Wifi,
  X,
  Workflow,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ModelConfig, ChatSession, Agent } from "../types";
import { useLanguage } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import { getPresetModels } from "./ChatInterface";

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
  const { t, language, setLanguage, updateTranslations, exportTranslations } =
    useLanguage();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const [mcpInput, setMcpInput] = useState("");
  const [searchModel, setSearchModel] = useState("");

  // Agent State
  interface AgentFlow {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    customName?: string;
  }
  const [agentFlows, setAgentFlows] = useState<AgentFlow[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editingAgentName, setEditingAgentName] = useState("");
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  }>({
    type: 'success',
    title: '',
    message: ''
  });
  
  // LangFlow Config Modal
  const [showLangflowConfigModal, setShowLangflowConfigModal] = useState(false);
  
  // Clear All Chats Confirmation Modal
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  
  // Clear Custom Name Confirmation
  const [agentToClearName, setAgentToClearName] = useState<string | null>(null);

  // LangFlow State
  // Separate the input state from the committed configuration state to prevent iframe reload on every keystroke
  const [langflowUrlInput, setLangflowUrlInput] = useState(
    modelConfig.langflowUrl || "",
  );
  const [langflowApiKeyInput, setLangflowApiKeyInput] = useState(
    modelConfig.langflowApiKey || "",
  );
  const [iframeKey, setIframeKey] = useState(0);

  // Account Settings State
  const [profile, setProfile] = useState({
    displayName: "Administrator",
    email: "admin@gmail.com",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    // Profile
    const savedProfile = localStorage.getItem("user_profile");
    if (savedProfile) {
      setProfile((prev) => ({ ...prev, ...JSON.parse(savedProfile) }));
    }

    // Don't load saved agent flows - fetch fresh from API instead
    
    // Load LangFlow config
    const savedLangflowConfig = localStorage.getItem("langflow_config");
    if (savedLangflowConfig) {
      try {
        const config = JSON.parse(savedLangflowConfig);
        setLangflowUrlInput(config.url || "");
        setLangflowApiKeyInput(config.apiKey || "");
        
        // Update modelConfig if not already set
        if (!modelConfig.langflowUrl && config.url) {
          onModelConfigChange({
            ...modelConfig,
            langflowUrl: config.url,
            langflowApiKey: config.apiKey
          });
        }
      } catch (error) {
        console.error("Failed to load LangFlow config:", error);
      }
    }
  }, []);

  // Auto fetch agents when entering Agent tab
  useEffect(() => {
    if (activeTab === 'agent' && modelConfig.langflowUrl && modelConfig.langflowApiKey) {
      fetchAgentFlows();
    }
  }, [activeTab, modelConfig.langflowUrl, modelConfig.langflowApiKey]);

  // Click outside handler for language dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLanguageDropdown && languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown]);

  const saveLangflowUrl = () => {
    const newConfig = { 
      ...modelConfig, 
      langflowUrl: langflowUrlInput,
      langflowApiKey: langflowApiKeyInput 
    };
    
    onModelConfigChange(newConfig);
    
    // Save to localStorage
    localStorage.setItem('langflow_config', JSON.stringify({
      url: langflowUrlInput,
      apiKey: langflowApiKeyInput
    }));
    
    // Force iframe reload by updating key
    setIframeKey((prev) => prev + 1);
    setShowLangflowConfigModal(false);
    showNotification('success', t("settings.configSaved"), t("settings.configSavedMessage"));
  };

  const handleAddMcp = () => {
    if (!mcpInput.trim()) return;
    const currentServers = modelConfig.mcpServers || [];
    if (!currentServers.includes(mcpInput)) {
      onModelConfigChange({
        ...modelConfig,
        mcpServers: [...currentServers, mcpInput],
      });
    }
    setMcpInput("");
  };

  const handleRemoveMcp = (server: string) => {
    const currentServers = modelConfig.mcpServers || [];
    onModelConfigChange({
      ...modelConfig,
      mcpServers: currentServers.filter((s) => s !== server),
    });
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    // Save minimal profile info to local storage
    localStorage.setItem(
      "user_profile",
      JSON.stringify({
        displayName: profile.displayName,
        email: profile.email,
      }),
    );

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 1000);
  };

  // CSV Logic
  const handleExportCSV = () => {
    const csvContent = exportTranslations();
    // Add BOM for UTF-8 to ensure proper encoding in Excel and other programs
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "translations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n");
      const newTranslations: { en: any; th: any } = { en: {}, th: {} };

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Simple parsing assuming "key","val","val" format
        // Regex to handle quoted CSV values properly
        const match = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (match && match.length >= 3) {
          const key = match[0].replace(/"/g, "");
          const enVal = match[1].replace(/"/g, "");
          const thVal = match[2].replace(/"/g, "");

          // Deep set
          const setDeep = (obj: any, path: string, val: string) => {
            const keys = path.split(".");
            let current = obj;
            for (let j = 0; j < keys.length - 1; j++) {
              if (!current[keys[j]]) current[keys[j]] = {};
              current = current[keys[j]];
            }
            current[keys[keys.length - 1]] = val;
          };

          setDeep(newTranslations.en, key, enVal);
          setDeep(newTranslations.th, key, thVal);
        }
      }
      updateTranslations(newTranslations);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showNotification('success', t("settings.importSuccess"), t("settings.importSuccessMessage"));
    };
    reader.readAsText(file);
  };

  // Agent Functions
  const showNotification = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setShowModal(true);
  };

  const fetchAgentFlows = async () => {
    if (!modelConfig.langflowUrl) {
      showNotification('warning', t("settings.configRequired"), t("settings.configureLangflowFirst"));
      return;
    }

    setLoadingAgents(true);
    try {
      const baseUrl = modelConfig.langflowUrl.replace(/\/+$/, "");
      
      // Build URL with query parameters
      const url = new URL(`${baseUrl}/api/v1/flows/`);
      url.searchParams.append('remove_example_flows', 'false');
      url.searchParams.append('components_only', 'false');
      url.searchParams.append('get_all', 'true');
      url.searchParams.append('header_flows', 'false');
      url.searchParams.append('page', '1');
      url.searchParams.append('size', '50');
      
      // Add API Key as query parameter if provided
      if (modelConfig.langflowApiKey) {
        url.searchParams.append('x-api-key', modelConfig.langflowApiKey);
      }
      
      const apiUrl = url.toString();
      
      const headers: HeadersInit = {
        "accept": "application/json"
      };
      
      // Debug: Log request details
      console.log("LangFlow URL:", modelConfig.langflowUrl);
      console.log("API Key exists:", !!modelConfig.langflowApiKey);
      console.log("API Key length:", modelConfig.langflowApiKey?.length || 0);
      console.log("Fetching from:", apiUrl);
      
      const response = await fetch(apiUrl, { headers });
      
      console.log("Response status:", response.status);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        showNotification('error', t("settings.authRequired"), t("settings.authRequiredMessage"));
        setAgentFlows([]); // Clear agents on auth error
        setLoadingAgents(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const flows = await response.json();
      
      // Check if flows is an array
      if (!Array.isArray(flows)) {
        throw new Error("Invalid response format");
      }
      
      console.log("Fetched flows:", flows.length);
      
      // Load existing enabled/disabled state from localStorage
      const savedAgents = localStorage.getItem('agent_flows');
      let enabledMap: Record<string, boolean> = {};
      let customNameMap: Record<string, string> = {};
      let hasCustomNameMap: Record<string, boolean> = {}; // Track if user has set custom name
      
      if (savedAgents) {
        try {
          const parsed = JSON.parse(savedAgents);
          if (Array.isArray(parsed)) {
            parsed.forEach((agent: any) => {
              enabledMap[agent.id] = agent.enabled !== false; // Default to true if not specified
              if (agent.customName && agent.customName !== agent.name) {
                // Only preserve customName if it's different from the original name
                customNameMap[agent.id] = agent.customName;
                hasCustomNameMap[agent.id] = true;
              }
            });
          }
        } catch (e) {
          console.error('Failed to parse saved agents:', e);
        }
      }
      
      // List of flow names to exclude
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
        "YouTube Analysis"
      ];

      // Map flows to agent format, preserving enabled state from localStorage
      // Filter out flows with names matching the excluded list
      const newAgents: AgentFlow[] = flows
        .filter((flow: any) => !excludedFlowNames.includes(flow.name))
        .map((flow: any) => {
          // If user has set a custom name, keep it. Otherwise, use the current name from LangFlow
          const displayName = hasCustomNameMap[flow.id] ? customNameMap[flow.id] : flow.name;
          
          return {
            id: flow.id,
            name: flow.name, // Original name from LangFlow (used as FLOW_ID)
            description: flow.description || "No description available",
            enabled: enabledMap[flow.id] === true, // Use saved state, default to false (disabled)
            customName: displayName !== flow.name ? displayName : undefined // Only set customName if different
          };
        });
      
      setAgentFlows(newAgents);
      // Save to localStorage to persist state
      localStorage.setItem('agent_flows', JSON.stringify(newAgents));
      // Don't show success notification, only show errors
    } catch (error) {
      console.error("Failed to fetch agent flows:", error);
      showNotification('error', t("settings.fetchError"), t("settings.fetchErrorMessage"));
      setAgentFlows([]); // Clear agents on error
    } finally {
      setLoadingAgents(false);
    }
  };

  const toggleAgentEnabled = (id: string) => {
    const updated = agentFlows.map(agent =>
      agent.id === id ? { ...agent, enabled: !agent.enabled } : agent
    );
    setAgentFlows(updated);
    // Save to localStorage so ChatInterface can filter
    localStorage.setItem('agent_flows', JSON.stringify(updated));
    
    // If disabling the currently selected model, switch to another available model
    const disabledAgent = updated.find(agent => agent.id === id);
    if (disabledAgent && !disabledAgent.enabled && modelConfig.modelId === id) {
      // Find first enabled agent or fallback to preset model
      const firstEnabledAgent = updated.find(agent => agent.enabled);
      if (firstEnabledAgent) {
        onModelConfigChange({
          ...modelConfig,
          modelId: firstEnabledAgent.id,
          name: firstEnabledAgent.customName || firstEnabledAgent.name
        });
      } else {
        // Fallback to first preset model
        const presetModels = getPresetModels(t);
        const firstPreset = presetModels.google[0];
        onModelConfigChange({
          ...modelConfig,
          modelId: firstPreset.id,
          name: firstPreset.name
        });
      }
    }
  };

  const startEditingAgent = (agent: AgentFlow) => {
    setEditingAgentId(agent.id);
    setEditingAgentName(agent.customName || agent.name);
  };

  const saveAgentName = (id: string) => {
    const updated = agentFlows.map(agent => {
      if (agent.id === id) {
        // Set customName only if it's different from the original name
        const newCustomName = editingAgentName !== agent.name ? editingAgentName : undefined;
        return { ...agent, customName: newCustomName };
      }
      return agent;
    });
    setAgentFlows(updated);
    // Save to localStorage so ChatInterface can use custom names
    localStorage.setItem('agent_flows', JSON.stringify(updated));
    setEditingAgentId(null);
    setEditingAgentName("");
  };

  const cancelEditingAgent = () => {
    setEditingAgentId(null);
    setEditingAgentName("");
  };

  const clearCustomName = (id: string) => {
    const updated = agentFlows.map(agent => {
      if (agent.id === id) {
        return { ...agent, customName: undefined };
      }
      return agent;
    });
    setAgentFlows(updated);
    localStorage.setItem('agent_flows', JSON.stringify(updated));
    setAgentToClearName(null); // Close confirmation modal
  };
  
  const confirmClearCustomName = () => {
    if (agentToClearName) {
      clearCustomName(agentToClearName);
    }
  };

  // Keyboard shortcut for Ctrl+Q (support all keyboard layouts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Q or Cmd+Q using both key and code
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'q' || e.code === 'KeyQ')) {
        e.preventDefault();
        if (activeTab === 'langflow' || activeTab === 'agent') {
          setShowLangflowConfigModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  return (
    <div className="flex h-full w-full bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-200 font-sans overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <div className={`border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800/50">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {t("settings.title")}
            </h1>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors ml-auto"
            title={isSidebarOpen ? 'ปิด Sidebar' : 'เปิด Sidebar'}
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                activeTab === item.id
                  ? item.id === "langflow" || item.id === "agent"
                    ? "bg-indigo-50 dark:bg-[#27272a] text-indigo-600 dark:text-indigo-400 font-medium shadow-sm"
                    : "bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white font-medium shadow-sm border border-zinc-200 dark:border-transparent"
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
            className={`flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium ${!isSidebarOpen ? 'justify-center w-full' : ''}`}
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
              {activeTab === "langflow" && (
                <Workflow className="w-5 h-5 text-indigo-500" />
              )}

              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-wide">
                {activeTab === "general" && t("settings.general")}
                {activeTab === "account" && t("settings.account")}
                {activeTab === "tools" && t("settings.myTools")}
                {activeTab === "agent" && t("settings.agent")}
                {activeTab === "langflow" && t("settings.langflow")}
              </h2>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div
          className={`flex-1 overflow-y-auto ${activeTab === "langflow" ? "p-0" : "p-8"} custom-scrollbar`}
        >
          {/* GENERAL TAB */}
          <div className={`max-w-4xl space-y-6 ${activeTab === "general" ? "block" : "hidden"}`}>
              <div className="mb-2">
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                  {t("settings.generalDesc")}
                </p>
              </div>

              {/* Theme & Language Group */}
              <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-visible shadow-sm dark:shadow-none">
                {/* Theme Row */}
                <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-[#1e1e20] text-blue-500 dark:text-blue-400 border border-zinc-200 dark:border-zinc-800">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm">
                        {t("sidebar.theme")}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {theme === "system"
                          ? t("sidebar.system")
                          : theme === "dark"
                            ? t("sidebar.dark")
                            : t("sidebar.light")}
                      </div>
                    </div>
                  </div>
                  <div className="flex bg-zinc-100 dark:bg-[#1e1e20] rounded-lg p-1 border border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={() => setTheme("light")}
                      className={`p-2 rounded-md transition-colors ${theme === "light" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`p-2 rounded-md transition-colors ${theme === "dark" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                    >
                      <Moon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTheme("system")}
                      className={`p-2 rounded-md transition-colors ${theme === "system" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                    >
                      <Laptop className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Language Row */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-[#1e1e20] text-purple-500 dark:text-purple-400 border border-zinc-200 dark:border-zinc-800">
                      <Languages className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm">
                        {t("sidebar.language")}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {language === "th" ? "ไทย" : "English"}
                      </div>
                    </div>
                  </div>
                  <div className="relative min-w-[120px]" ref={languageDropdownRef}>
                    <button
                      onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                      className="w-full flex items-center justify-between bg-zinc-100 dark:bg-[#1e1e20] text-zinc-900 dark:text-zinc-200 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <span>{language === 'en' ? 'English' : 'ไทย'}</span>
                      <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ml-2 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showLanguageDropdown && (
                      <div className="absolute top-full right-0 mt-1 w-full bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-1 duration-150">
                        <button
                          onClick={() => {
                            setLanguage('en');
                            setShowLanguageDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                            language === 'en'
                              ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <span>English</span>
                          {language === 'en' && <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setLanguage('th');
                            setShowLanguageDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                            language === 'th'
                              ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <span>ไทย</span>
                          {language === 'th' && <Check className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Manage Language Card */}
              <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm dark:shadow-none">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                    {t("settings.manageLanguage")}
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 mb-6 ml-8">
                  {t("settings.manageLanguageDesc")}
                </p>

                <div className="flex items-center justify-between ml-8">
                  <div className="flex gap-3">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleImportCSV}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        {t("settings.importCSV")}
                      </button>
                    </div>
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 bg-zinc-100 dark:bg-[#1e1e20] hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {t("settings.exportCSV")}
                    </button>
                  </div>
                  <button className="flex items-center gap-2 text-red-600 dark:text-red-500/80 hover:text-red-700 dark:hover:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 px-4 py-2 rounded-lg text-xs font-medium transition-colors">
                    <Trash2 className="w-4 h-4" />
                    {t("settings.resetDefaults")}
                  </button>
                </div>
              </div>

              {/* Clear Chat History (Retained as requested) */}
              <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-sm dark:shadow-none">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-[#1e1e20] text-red-500 dark:text-red-400 border border-zinc-200 dark:border-zinc-800">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm">
                      {t("settings.clearHistory")}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {t("settings.clearHistoryDesc")}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowClearAllConfirm(true)}
                  className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/30 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  {t("settings.clearAll")}
                </button>
              </div>
          </div>

          {/* ACCOUNT TAB */}
          <div className={`max-w-4xl ${activeTab === "account" ? "block" : "hidden"}`}>
              <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 mb-6 flex flex-col items-center shadow-sm dark:shadow-none">
                <div className="relative group cursor-pointer mb-4">
                  <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-2xl font-bold border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden">
                    {profile.displayName
                      ? profile.displayName.substring(0, 2).toUpperCase()
                      : "AD"}
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full border-2 border-white dark:border-[#121212]">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                </div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {profile.displayName}
                </h2>
                <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded mt-2 border border-zinc-200 dark:border-zinc-700">
                  ADMIN
                </span>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {t("settings.displayName")}
                    </label>
                    <input
                      type="text"
                      value={profile.displayName}
                      onChange={(e) =>
                        setProfile({ ...profile, displayName: e.target.value })
                      }
                      className="w-full bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm dark:shadow-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {t("settings.email")}
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      className="w-full bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm dark:shadow-none"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4 flex items-center gap-2">
                    <LockIcon className="w-4 h-4" />
                    {t("settings.changePassword")}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        placeholder={t("settings.currentPassword")}
                        className="w-full bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-4 pr-10 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm dark:shadow-none"
                      />
                      <button
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            current: !showPasswords.current,
                          })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        placeholder={t("settings.newPassword")}
                        className="w-full bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-4 pr-10 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm dark:shadow-none"
                      />
                      <button
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            new: !showPasswords.new,
                          })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        placeholder={t("settings.confirmPassword")}
                        className="w-full bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-4 pr-10 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm dark:shadow-none"
                      />
                      <button
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            confirm: !showPasswords.confirm,
                          })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md ${saveSuccess ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                  >
                    {saveSuccess ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saveSuccess
                      ? t("settings.saved")
                      : t("settings.saveChanges")}
                  </button>
                </div>
              </div>
          </div>

          {/* TOOLS TAB (MCP) */}
          <div className={`max-w-4xl space-y-6 ${activeTab === "tools" ? "block" : "hidden"}`}>
              <div className="flex justify-between items-center mb-6">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                  {t("settings.toolsDesc")}
                </p>
                <div className="flex gap-3">
                  <div className="relative group">
                    <input
                      type="text"
                      value={mcpInput}
                      onChange={(e) => setMcpInput(e.target.value)}
                      placeholder="http://192.168.99.1:9000/mcp"
                      className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-500 w-72 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-mono shadow-sm dark:shadow-none"
                      onKeyDown={(e) => e.key === "Enter" && handleAddMcp()}
                    />
                  </div>
                  <button
                    onClick={handleAddMcp}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-blue-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    {t("settings.addTool")}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {!modelConfig.mcpServers ||
                modelConfig.mcpServers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-500 text-sm border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-[#121212]/50">
                    <Wrench className="w-8 h-8 mb-3 opacity-50" />
                    <span>{t("settings.noTools")}</span>
                  </div>
                ) : (
                  modelConfig.mcpServers.map((server, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group shadow-sm dark:shadow-none"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-[#1e1e20] flex items-center justify-center border border-zinc-200 dark:border-zinc-800 text-orange-600/80">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm">
                            amr
                          </div>{" "}
                          {/* Mock name for visual match */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                              SSE
                            </span>
                            <div className="text-xs text-zinc-500 truncate max-w-[300px] font-mono">
                              {server}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500">
                        <button className="p-2 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                          <Play className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                          <List className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors">
                          <CheckSquare className="w-4 h-4 text-green-500" />
                        </button>

                        <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 px-2.5 py-1 rounded-md text-[10px] font-bold border border-green-200 dark:border-green-500/20 uppercase tracking-wider mx-2">
                          <Check className="w-3 h-3" />
                          {t("settings.active")}
                        </div>

                        <button className="p-2 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveMcp(server)}
                          className="p-2 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
          </div>

          {/* AGENT TAB */}
          <div className={`max-w-4xl space-y-6 ${activeTab === "agent" ? "block" : "hidden"}`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    {t("settings.agentDesc")}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
                    <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 font-mono">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 font-mono">Q</kbd>
                    <span className="ml-1">{t("settings.toClose")}</span>
                  </div>
                </div>
                <button
                  onClick={fetchAgentFlows}
                  disabled={loadingAgents}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingAgents ? 'animate-spin' : ''}`} />
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
                          {(agent.customName || agent.name).substring(0, 2).toUpperCase()}
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
                                  if (e.key === 'Enter') saveAgentName(agent.id);
                                  if (e.key === 'Escape') cancelEditingAgent();
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
                                {/* Show indicator if custom name is set */}
                                {agent.customName && agent.customName !== agent.name && (
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
                        {/* Toggle Switch */}
                        <button
                          onClick={() => toggleAgentEnabled(agent.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            agent.enabled
                              ? 'bg-green-500'
                              : 'bg-zinc-300 dark:bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              agent.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>

                        {/* Status Badge */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                          agent.enabled
                            ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 border-green-200 dark:border-green-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                        }`}>
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

                        {/* Edit Button */}
                        {editingAgentId !== agent.id && (
                          <>
                            <button
                              onClick={() => startEditingAgent(agent)}
                              className="p-2 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors text-zinc-500"
                              title={t("settings.editName") || "Edit name"}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            
                            {/* Clear Custom Name Button - Only show if custom name is set */}
                            {agent.customName && agent.customName !== agent.name && (
                              <button
                                onClick={() => setAgentToClearName(agent.id)}
                                className="p-2 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors text-zinc-500"
                                title={t("settings.clearCustomName") || "Clear custom name"}
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

          {/* LANGFLOW TAB */}
          <div className={`flex flex-col h-full ${activeTab === "langflow" ? "block" : "hidden"}`}>
              {/* Iframe */}
              <div className="flex-1 bg-zinc-100 dark:bg-black relative">
                {modelConfig.langflowUrl ? (
                  <iframe
                    key={iframeKey}
                    src={modelConfig.langflowUrl}
                    className="w-full h-full border-0"
                    title="LangFlow Interface"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
                    <Workflow className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">{t("settings.configureLangflowUrl")}</p>
                    <p className="text-sm mb-4">{t("settings.pressCtrlQ")}</p>
                    <button
                      onClick={() => setShowLangflowConfigModal(true)}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      <Settings className="w-4 h-4" />
                      {t("settings.configureLangflow")}
                    </button>
                  </div>
                )}
                
                {/* Floating Config Button */}
                {modelConfig.langflowUrl && (
                  <button
                    onClick={() => setShowLangflowConfigModal(true)}
                    className="absolute bottom-6 right-6 p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
                    title={t("settings.configureLangflow")}
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* LangFlow Configuration Modal */}
      {showLangflowConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowLangflowConfigModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-zinc-900 dark:bg-zinc-950 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-700 dark:border-zinc-800">
            {/* Header */}
            <div className="bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-700 dark:bg-zinc-800 rounded-xl">
                    <Workflow className="w-6 h-6 text-zinc-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-100">
                      {t("settings.langflowConfig")}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {t("settings.configureLangflowDesc")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLangflowConfigModal(false)}
                  className="p-2 hover:bg-zinc-700 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5 bg-zinc-900 dark:bg-zinc-950">
              {/* URL Input */}
              <div>
                <label className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-zinc-400" />
                  {t("settings.langflowUrl")}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={langflowUrlInput}
                  onChange={(e) => setLangflowUrlInput(e.target.value)}
                  placeholder="http://localhost:7860"
                  className="w-full bg-zinc-800 dark:bg-zinc-900 border-2 border-zinc-700 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 font-mono transition-colors"
                />
                <p className="text-xs text-zinc-500 mt-1.5 ml-1">
                  {t("settings.langflowUrlHint")}
                </p>
              </div>

              {/* API Key Input */}
              <div>
                <label className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-zinc-400" />
                  {t("settings.apiKey")}
                  <span className="text-xs font-normal text-zinc-500">({t("settings.optional")})</span>
                </label>
                <input
                  type="password"
                  value={langflowApiKeyInput}
                  onChange={(e) => setLangflowApiKeyInput(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-zinc-800 dark:bg-zinc-900 border-2 border-zinc-700 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 font-mono transition-colors"
                />
                <p className="text-xs text-zinc-500 mt-1.5 ml-1">
                  {t("settings.apiKeyHint")}
                </p>
              </div>

              {/* Keyboard Hint */}
              <div className="bg-zinc-800 dark:bg-zinc-900 border border-zinc-700 dark:border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <HelpCircle className="w-4 h-4" />
                  <span className="font-medium">{t("settings.quickTip")}:</span>
                  <kbd className="px-2 py-1 bg-zinc-700 dark:bg-zinc-800 rounded border border-zinc-600 dark:border-zinc-700 font-mono text-xs text-zinc-300">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-2 py-1 bg-zinc-700 dark:bg-zinc-800 rounded border border-zinc-600 dark:border-zinc-700 font-mono text-xs text-zinc-300">Q</kbd>
                  <span>{t("settings.toOpenConfig")}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={saveLangflowUrl}
                  disabled={!langflowUrlInput.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-100 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg disabled:shadow-none"
                >
                  <Save className="w-5 h-5" />
                  {t("settings.saveAndReload")}
                </button>
                
                {modelConfig.langflowUrl && (
                  <a
                    href={modelConfig.langflowUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 px-6 py-3 rounded-xl font-semibold transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    {t("settings.openExternal")}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-[#121212] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800">
            {/* Header with colored accent */}
            <div className={`h-2 ${
              modalConfig.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              modalConfig.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
              'bg-gradient-to-r from-amber-500 to-orange-500'
            }`} />
            
            <div className="p-6">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                modalConfig.type === 'success' ? 'bg-green-100 dark:bg-green-500/20' :
                modalConfig.type === 'error' ? 'bg-red-100 dark:bg-red-500/20' :
                'bg-amber-100 dark:bg-amber-500/20'
              }`}>
                {modalConfig.type === 'success' && (
                  <Check className="w-8 h-8 text-green-600 dark:text-green-500" />
                )}
                {modalConfig.type === 'error' && (
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
                )}
                {modalConfig.type === 'warning' && (
                  <HelpCircle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                )}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-center text-zinc-900 dark:text-white mb-2">
                {modalConfig.title}
              </h3>

              {/* Message */}
              <p className="text-sm text-center text-zinc-600 dark:text-zinc-400 mb-6">
                {modalConfig.message}
              </p>

              {/* Button */}
              <button
                onClick={() => setShowModal(false)}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg ${
                  modalConfig.type === 'success' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/30' :
                  modalConfig.type === 'error'
                    ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-500/30' :
                    'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30'
                }`}
              >
                {t("common.ok")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Chats Confirmation Modal */}
      {showClearAllConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowClearAllConfirm(false)}
        >
          <div
            className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {t("settings.clearHistory")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                {t("settings.clearHistoryWarning") || "Are you sure you want to delete all conversation history? This action cannot be undone."}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearAllConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => {
                    onClearAllChats();
                    setShowClearAllConfirm(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  {t("common.delete")}
                </button>
              </div>
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
                {t("settings.clearCustomNameWarning") || "This will reset the agent name to the original name from LangFlow. The name will update automatically when changed in LangFlow."}
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
    </div>
  );
};

const LockIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
