import React from "react";
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  X,
  File as FileIcon,
} from "lucide-react";
import { Attachment } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import { ModelSelector } from "./ModelSelector";
import { MCPServerList } from "./MCPServerList";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  attachments: Attachment[];
  onRemoveAttachment: (index: number) => void;
  onSend: () => void;
  onFileSelect: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragging: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  isListening: boolean;
  speechError: string | null;
  onToggleListening: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;

  // Model Selector Props
  showModelMenu: boolean;
  setShowModelMenu: (show: boolean) => void;
  modelConfig: any;
  agentModels: { id: string; name: string; desc: string }[];
  pinnedAgentId: string | null;
  onModelSelect: (modelId: string, modelName: string) => void;
  onPinAgent: (agentId: string) => void;
  modelMenuRef: React.RefObject<HTMLDivElement>;

  // MCP Props
  showMcpMenu: boolean;
  setShowMcpMenu: (show: boolean) => void;
  mcpServers: string[];
  mcpMenuRef: React.RefObject<HTMLDivElement>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  attachments,
  onRemoveAttachment,
  onSend,
  onFileSelect,
  onPaste,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
  isLoading,
  isStreaming,
  isListening,
  speechError,
  onToggleListening,
  textareaRef,
  fileInputRef,
  showModelMenu,
  setShowModelMenu,
  modelConfig,
  agentModels,
  pinnedAgentId,
  onModelSelect,
  onPinAgent,
  modelMenuRef,
  showMcpMenu,
  setShowMcpMenu,
  mcpServers,
  mcpMenuRef,
}) => {
  const { t } = useLanguage();

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="absolute bottom-6 left-0 w-full px-4 z-20 pointer-events-none">
      <div className="max-w-5xl mx-auto pointer-events-auto">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md border rounded-2xl shadow-2xl transition-all relative ${
            isDragging
              ? "border-indigo-500 border-2 border-dashed bg-indigo-50/50 dark:bg-indigo-900/20"
              : "border-zinc-200 dark:border-zinc-700/80 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 focus-within:ring-1"
          }`}
        >
          {/* Overlay for drag state */}
          {isDragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400 animate-bounce">
                <Paperclip className="w-8 h-8" />
                <span className="font-semibold">
                  {t("chat.dropFiles") || "Drop files here"}
                </span>
              </div>
            </div>
          )}

          {/* Attachments List */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-4 pb-1 max-h-32 overflow-y-auto custom-scrollbar">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg pl-2 pr-2 py-1.5 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 animate-in fade-in zoom-in-95 group relative overflow-hidden"
                >
                  {file.type === "image" ? (
                    <div className="relative w-8 h-8 rounded overflow-hidden shrink-0 border border-zinc-300 dark:border-zinc-600">
                      <img
                        src={file.content}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <FileIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  )}
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    onClick={() => onRemoveAttachment(index)}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            onPaste={onPaste}
            placeholder={t("chat.placeholder")}
            className="w-full bg-transparent text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 px-4 py-4 pr-12 outline-none resize-none max-h-[30vh] min-h-[56px] text-sm leading-relaxed"
            rows={1}
            disabled={isLoading || isStreaming}
          />

          <div className="flex justify-between items-center px-3 pb-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={onFileSelect}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-xl transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* MCP Quick Select Dropdown */}
              <MCPServerList
                isOpen={showMcpMenu}
                onToggle={() => setShowMcpMenu(!showMcpMenu)}
                servers={mcpServers}
                menuRef={mcpMenuRef}
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Model Selector Dropdown */}
              <ModelSelector
                isOpen={showModelMenu}
                onToggle={() => setShowModelMenu(!showModelMenu)}
                modelConfig={modelConfig}
                agentModels={agentModels}
                pinnedAgentId={pinnedAgentId}
                onModelSelect={onModelSelect}
                onPinAgent={onPinAgent}
                menuRef={modelMenuRef}
              />

              <div className="relative">
                {speechError && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500 text-white text-[10px] px-2 py-1 rounded-md shadow-lg animate-in fade-in slide-in-from-bottom-1 z-50 pointer-events-none font-medium">
                    {speechError}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-500"></div>
                  </div>
                )}
                <button
                  onClick={onToggleListening}
                  className={`p-2 rounded-xl transition-all ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                  title={
                    isListening
                      ? t("chat.stopRecording") || "Stop recording"
                      : t("chat.startRecording") || "Start recording"
                  }
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>

              <button
                onClick={onSend}
                disabled={
                  (!input.trim() && attachments.length === 0) ||
                  isLoading ||
                  isStreaming
                }
                className={`p-2 rounded-xl transition-all ${(input.trim() || attachments.length > 0) && !isLoading && !isStreaming ? "bg-black dark:bg-zinc-100 text-white dark:text-black hover:opacity-90" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 opacity-50"}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
