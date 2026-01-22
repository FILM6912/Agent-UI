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

type SettingsTab = "general" | "account" | "tools" | "langflow";

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

  // General Settings State
  const [voiceDelay, setVoiceDelay] = useState(modelConfig.voiceDelay || 0.5);
  const [systemPromptOpen, setSystemPromptOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    modelConfig.systemPrompt || "",
  );

  // LangFlow State
  // Separate the input state from the committed configuration state to prevent iframe reload on every keystroke
  const [langflowUrlInput, setLangflowUrlInput] = useState(
    modelConfig.langflowUrl || "",
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
  }, []);

  // Sync general settings to model config when changed (debounced/on blur)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (modelConfig.voiceDelay !== voiceDelay) {
        onModelConfigChange({ ...modelConfig, voiceDelay });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [voiceDelay]);

  const handleSystemPromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const val = e.target.value;
    setSystemPrompt(val);
  };

  const saveSystemPrompt = () => {
    onModelConfigChange({ ...modelConfig, systemPrompt });
  };

  const saveLangflowUrl = () => {
    onModelConfigChange({ ...modelConfig, langflowUrl: langflowUrlInput });
    // Force iframe reload by updating key
    setIframeKey((prev) => prev + 1);
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
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "translations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      alert("Language imported successfully!");
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-full w-full bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-200 font-sans overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] flex flex-col transition-colors duration-200">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800/50">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {t("settings.title")}
          </h1>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {[
            { id: "general", icon: Settings, label: t("settings.general") },
            { id: "account", icon: User, label: t("settings.account") },
            { id: "tools", icon: Wrench, label: t("settings.myTools") },
            { id: "langflow", icon: Workflow, label: t("settings.langflow") },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id as SettingsTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                activeTab === item.id
                  ? item.id === "langflow"
                    ? "bg-indigo-50 dark:bg-[#27272a] text-indigo-600 dark:text-indigo-400 font-medium shadow-sm"
                    : "bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white font-medium shadow-sm border border-zinc-200 dark:border-transparent"
                  : item.id === "langflow"
                  ? "text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-800/50"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              }`}
            >
              <item.icon
                className={`w-4 h-4 ${activeTab === item.id ? (item.id === "langflow" ? "text-indigo-500 dark:text-indigo-400" : "text-indigo-500 dark:text-indigo-400") : ""}`}
              />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("settings.back")}
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
              {activeTab === "langflow" && (
                <Workflow className="w-5 h-5 text-indigo-500" />
              )}

              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-wide">
                {activeTab === "general" && t("settings.general")}
                {activeTab === "account" && t("settings.account")}
                {activeTab === "tools" && t("settings.myTools")}
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
              <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
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
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as "en" | "th")}
                    className="bg-zinc-100 dark:bg-[#1e1e20] text-zinc-900 dark:text-zinc-200 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 min-w-[100px]"
                  >
                    <option value="en">English</option>
                    <option value="th">ไทย</option>
                  </select>
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

              {/* Voice Delay */}
              <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-sm dark:shadow-none">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-[#1e1e20] text-green-500 dark:text-green-400 border border-zinc-200 dark:border-zinc-800">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm">
                      {t("settings.voiceDelay")}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {t("settings.voiceDelayDesc")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={voiceDelay}
                    onChange={(e) => setVoiceDelay(parseFloat(e.target.value))}
                    className="w-32 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 min-w-[30px] text-right">
                    {voiceDelay}s
                  </span>
                </div>
              </div>

              {/* System Prompt */}
              <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
                <button
                  onClick={() => setSystemPromptOpen(!systemPromptOpen)}
                  className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-[#1e1e20] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-[#1e1e20] text-indigo-500 dark:text-indigo-400 border border-zinc-200 dark:border-zinc-800">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm">
                        {t("settings.systemPrompt")}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {t("settings.systemPromptDesc")}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 transition-transform ${systemPromptOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {systemPromptOpen && (
                  <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0c0c0e] animate-in slide-in-from-top-2">
                    <textarea
                      className="w-full h-32 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-800 dark:text-zinc-300 font-mono focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 resize-none mb-2"
                      placeholder="You are a helpful AI assistant..."
                      value={systemPrompt}
                      onChange={handleSystemPromptChange}
                      onBlur={saveSystemPrompt}
                    />
                    <div className="flex justify-end">
                      <span className="text-[10px] text-zinc-500">
                        Auto-saved
                      </span>
                    </div>
                  </div>
                )}
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
                  onClick={onClearAllChats}
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

          {/* LANGFLOW TAB */}
          <div className={`flex flex-col h-full ${activeTab === "langflow" ? "block" : "hidden"}`}>
              <div className="flex-1 bg-zinc-100 dark:bg-black relative">
                {modelConfig.langflowUrl ? (
                  <iframe
                    src={modelConfig.langflowUrl}
                    className="w-full h-full border-0"
                    title="LangFlow Interface"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <Workflow className="w-12 h-12 mb-2 opacity-50" />
                    <span>Please configure LangFlow URL</span>
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
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
