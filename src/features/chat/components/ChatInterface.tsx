import React, { useRef, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Message, ModelConfig, AIProvider, Attachment } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import { SettingsMenu } from "./SettingsMenu";
import { WelcomeScreen } from "./WelcomeScreen";
import { MessageItem } from "./MessageItem";
import { LoadingIndicator } from "./LoadingIndicator";
import { ImageLightbox } from "./ImageLightbox";
import { ChatInput } from "./ChatInput";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useAgentModels } from "../hooks/useAgentModels";
import { useFileHandling } from "../hooks/useFileHandling";
import { useMarkdownComponents } from "../hooks/useMarkdownComponents";

export const getPresetModels = (
  t: (key: string) => string,
): Record<AIProvider, { id: string; name: string; desc: string }[]> => ({
  google: [
    {
      id: "gemini-3-flash-preview",
      name: "Gemini 3.0 Flash",
      desc: t("models.gemini-3-flash-preview"),
    },
    {
      id: "gemini-3-pro-preview",
      name: "Gemini 3.0 Pro",
      desc: t("models.gemini-3-pro-preview"),
    },
    {
      id: "gemini-2.5-flash-lite-latest",
      name: "Flash Lite",
      desc: t("models.gemini-2.5-flash-lite-latest"),
    },
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o", desc: t("models.gpt-4o") },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", desc: t("models.gpt-4-turbo") },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      desc: t("models.gpt-3.5-turbo"),
    },
  ],
});

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  onSend: (message: string, attachments: Attachment[]) => void;
  onRegenerate: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  isLoading: boolean;
  isStreaming?: boolean;
  modelConfig: ModelConfig;
  onModelConfigChange: (config: ModelConfig) => void;
  onProviderChange?: (provider: AIProvider) => void;
  onVersionChange?: (messageId: string, newIndex: number) => void;
  isPreviewOpen?: boolean;
  onPreviewRequest?: (content: string) => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  input,
  setInput,
  onSend,
  onRegenerate,
  onEdit,
  isLoading,
  isStreaming,
  modelConfig,
  onModelConfigChange,
  onVersionChange,
  isPreviewOpen = false,
  onPreviewRequest,
  onOpenSettings,
  onLogout,
}) => {
  const { t, language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Menu Refs for click outside handling
  const mcpMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Dropdown States
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showMcpMenu, setShowMcpMenu] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Custom Hooks
  const { isListening, speechError, toggleListening } = useSpeechRecognition({
    language,
    input,
    setInput,
  });

  const { agentModels, pinnedAgentId, handlePinAgent } = useAgentModels({
    modelConfig,
    onModelConfigChange,
  });

  const {
    attachments,
    isDragging,
    handleFileSelect,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeAttachment,
    clearAttachments,
  } = useFileHandling();

  const markdownComponents = useMarkdownComponents({
    onPreviewRequest,
    onViewImage: setViewingImage,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isStreaming, editingId, input]);

  // Click outside handler for menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showModelMenu &&
        modelMenuRef.current &&
        !modelMenuRef.current.contains(event.target as Node)
      ) {
        setShowModelMenu(false);
      }
      if (
        showMcpMenu &&
        mcpMenuRef.current &&
        !mcpMenuRef.current.contains(event.target as Node)
      ) {
        setShowMcpMenu(false);
      }
      if (
        showSettingsMenu &&
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node)
      ) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModelMenu, showMcpMenu, showSettingsMenu]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendClick = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || isStreaming)
      return;

    onSend(input, attachments);
    clearAttachments();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const startEditing = (msg: Message) => {
    setEditingId(msg.id);
    setEditValue(msg.content);
  };

  const submitEdit = (id: string) => {
    if (editValue.trim() && onEdit) {
      onEdit(id, editValue);
      setEditingId(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleModelSelect = (modelId: string, modelName: string) => {
    onModelConfigChange({
      ...modelConfig,
      modelId,
      name: modelName,
    });
    setShowModelMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 relative transition-colors duration-200">
      {/* Settings Button - Top Right */}
      {onOpenSettings && (
        <div className="relative" ref={settingsMenuRef}>
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className={`absolute top-4 z-30 p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all ${
              isPreviewOpen ? "right-4" : "right-12"
            } ${showSettingsMenu ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
            title={t("settings.title")}
          >
            <Settings className="w-4 h-4" />
          </button>

          <SettingsMenu
            isOpen={showSettingsMenu}
            onClose={() => setShowSettingsMenu(false)}
            onOpenSettings={onOpenSettings}
            onLogout={onLogout}
            isPreviewOpen={isPreviewOpen}
            menuRef={settingsMenuRef as React.RefObject<HTMLDivElement>}
            languageDropdownRef={
              languageDropdownRef as React.RefObject<HTMLDivElement>
            }
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto scroll-smooth" ref={scrollRef}>
        <div className="max-w-5xl mx-auto px-4 pb-32 md:pb-40 pt-8 space-y-8">
          {/* Welcome Screen */}
          {messages.length === 0 && (
            <WelcomeScreen language={language} modelConfig={modelConfig} />
          )}

          {/* Agent Warning - Show if selected model is an agent but not enabled */}
          {messages.length > 0 &&
            (() => {
              const savedAgents = localStorage.getItem("agent_flows");
              let isAgentDisabled = false;

              if (savedAgents && modelConfig.modelId) {
                try {
                  const parsed = JSON.parse(savedAgents);
                  if (Array.isArray(parsed)) {
                    const agent = parsed.find(
                      (a: any) => a.id === modelConfig.modelId,
                    );
                    if (agent && agent.enabled !== true) {
                      isAgentDisabled = true;
                    } else if (
                      agent &&
                      !agentModels.find((m) => m.id === modelConfig.modelId)
                    ) {
                      isAgentDisabled = true;
                    }
                  }
                } catch (e) {
                  console.error("Failed to parse saved agents:", e);
                }
              }

              if (isAgentDisabled) {
                return (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                      <Settings className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        {language === "th"
                          ? "เอเจนต์ถูกปิดใช้งาน"
                          : "Agent Disabled"}
                      </h3>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                        {language === "th"
                          ? `เอเจนต์ "${modelConfig.name}" ถูกปิดใช้งาน กรุณาเปิดใช้งานในหน้าตั้งค่าหรือเลือก model อื่น`
                          : `Agent "${modelConfig.name}" is disabled. Please enable it in settings or select another model.`}
                      </p>
                      <button
                        onClick={() => onOpenSettings?.()}
                        className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline"
                      >
                        {language === "th"
                          ? "ไปที่การตั้งค่า"
                          : "Go to Settings"}
                      </button>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

          {/* Messages */}
          {messages.map((msg, index) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isLastMessage={index === messages.length - 1}
              isLoading={isLoading}
              isStreaming={isStreaming || false}
              copiedId={copiedId}
              modelConfig={modelConfig}
              onCopy={handleCopy}
              onRegenerate={onRegenerate}
              onEdit={onEdit}
              onVersionChange={onVersionChange}
              onViewImage={setViewingImage}
              editingId={editingId}
              editValue={editValue}
              onStartEdit={startEditing}
              onSubmitEdit={submitEdit}
              onCancelEdit={cancelEdit}
              setEditValue={setEditValue}
              markdownComponents={markdownComponents}
            />
          ))}

          {/* Loading Indicator */}
          {isLoading && <LoadingIndicator modelConfig={modelConfig} />}
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        imageUrl={viewingImage}
        onClose={() => setViewingImage(null)}
      />

      {/* Input Area */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple
      />
      <ChatInput
        input={input}
        setInput={setInput}
        attachments={attachments}
        onRemoveAttachment={removeAttachment}
        onSend={handleSendClick}
        onFileSelect={() => fileInputRef.current?.click()}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        isDragging={isDragging}
        isLoading={isLoading}
        isStreaming={isStreaming || false}
        isListening={isListening}
        speechError={speechError}
        onToggleListening={toggleListening}
        textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
        fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
        showModelMenu={showModelMenu}
        setShowModelMenu={setShowModelMenu}
        modelConfig={modelConfig}
        agentModels={agentModels}
        pinnedAgentId={pinnedAgentId}
        onModelSelect={handleModelSelect}
        onPinAgent={handlePinAgent}
        modelMenuRef={modelMenuRef as React.RefObject<HTMLDivElement>}
        showMcpMenu={showMcpMenu}
        setShowMcpMenu={setShowMcpMenu}
        mcpServers={modelConfig.mcpServers || []}
        mcpMenuRef={mcpMenuRef as React.RefObject<HTMLDivElement>}
      />
    </div>
  );
};
