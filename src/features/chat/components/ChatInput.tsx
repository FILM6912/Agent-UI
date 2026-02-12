import React from "react";
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  X,
  File as FileIcon,
  Square,
} from "lucide-react";
import { Attachment } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useResizeObserver } from "@/hooks/useResizeObserver";
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
  onStop?: () => void;
  isListening: boolean;
  speechError: string | null;
  onToggleListening: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;

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
  onStop,
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
  const isSmallScreen = useMediaQuery("(max-width: 1024px)");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width: containerWidth } = useResizeObserver(containerRef);

  // Consider "small" if window is small OR container is narrow (< 650px)
  const isNarrowContainer = containerWidth !== undefined && containerWidth < 650;
  const isResponsiveSmall = isSmallScreen || isNarrowContainer;

  // Persistent state for layout mode to prevent flickering
  const [isModeMulti, setModeMulti] = React.useState(false);
  const isModeMultiRef = React.useRef(isModeMulti);

  // Derived state for layout
  const isStacked = isModeMulti || isResponsiveSmall;

  const autoResize = React.useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = newHeight + "px";

      // Manage overflow
      if (!isStacked) {
        textareaRef.current.style.overflowY = "hidden";
      } else {
        if (newHeight > textareaRef.current.clientHeight) {
          textareaRef.current.style.overflowY = "auto";
        } else {
          textareaRef.current.style.overflowY = "hidden";
        }
      }
    }
  }, [isStacked, textareaRef]);

  // Handle auto-resize on any state change that affects layout or content
  React.useLayoutEffect(() => {
    autoResize();
  }, [input, isStacked, autoResize]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
      // Keep focus on textarea after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  // Sync ref
  React.useEffect(() => {
    isModeMultiRef.current = isModeMulti;
  }, [isModeMulti]);

  // Check layout on input change
  React.useEffect(() => {
    if (!textareaRef.current) return;

    // Use ref to check current mode to avoid adding isModeMulti to dependency array
    const currentMode = isModeMultiRef.current;

    const hasNewline = input.includes("\n");
    const isOverflowing = textareaRef.current.scrollHeight > 76;

    if (!currentMode) {
      // Currently in Single-line mode
      if (hasNewline || isOverflowing) {
        setModeMulti(true);
      }
    } else {
      // Currently in Multi-line mode
      // Switch back ONLY if empty to prevent flickering due to width differences
      if (input.trim().length === 0) {
        setModeMulti(false);
      }
    }
  }, [input]); // Only depend on input changing

  // Cosmic CSS Styles
  const cosmicStyles = `
    .cosmic-container {
      --bg-deep: #0a0e1a;
      --accent-light: #3d6ff7;
      --accent-main: #1447E6;
      --accent-dim: #0d35b8;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      border-radius: 16px;
      isolation: isolate;
    }

    .stardust, .cosmic-ring, .starfield, .nebula {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: -1;
      border-radius: 16px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.5s ease-out;
    }

    .stardust { filter: blur(1px); }
    .cosmic-ring { filter: blur(0.3px); }
    .starfield { filter: blur(8px); }
    .nebula { filter: blur(60px); }

    /* Show effects only on hover and focus - with reduced opacity for light mode */
    .cosmic-container:hover .stardust,
    .cosmic-container:hover .cosmic-ring,
    .cosmic-container:focus-within .stardust,
    .cosmic-container:focus-within .cosmic-ring {
      opacity: 0.4;
    }

    .cosmic-container:hover .starfield,
    .cosmic-container:hover .nebula,
    .cosmic-container:focus-within .starfield,
    .cosmic-container:focus-within .nebula {
      opacity: 0.15;
    }

    /* Dark mode - full opacity */
    .dark .cosmic-container:hover .stardust,
    .dark .cosmic-container:hover .cosmic-ring,
    .dark .cosmic-container:focus-within .stardust,
    .dark .cosmic-container:focus-within .cosmic-ring {
      opacity: 1;
    }

    .dark .cosmic-container:hover .starfield,
    .dark .cosmic-container:hover .nebula,
    .dark .cosmic-container:focus-within .starfield,
    .dark .cosmic-container:focus-within .nebula {
      opacity: 0.5;
    }

    .cosmic-container:focus-within .nebula {
      opacity: 0.08;
    }

    .dark .cosmic-container:focus-within .nebula {
      opacity: 0.3;
    }

    .stardust::before, .cosmic-ring::before, .starfield::before, .nebula::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 200vmax;
      height: 200vmax;
      background-repeat: no-repeat;
      background-position: center;
      transition: transform 2s ease-out;
      will-change: transform;
    }

    .stardust::before {
      transform: translate(-50%, -50%) rotate(83deg);
      filter: brightness(1.4);
      background-image: conic-gradient(rgba(0,0,0,0) 0%, var(--accent-main), rgba(0,0,0,0) 12%, rgba(0,0,0,0) 50%, var(--accent-dim), rgba(0,0,0,0) 62%);
    }

    .cosmic-ring::before {
      transform: translate(-50%, -50%) rotate(70deg);
      filter: brightness(1.3);
      background-image: conic-gradient(var(--bg-deep), var(--accent-main) 8%, var(--bg-deep) 18%, var(--bg-deep) 50%, var(--accent-dim) 65%, var(--bg-deep) 72%);
    }

    .starfield::before {
      transform: translate(-50%, -50%) rotate(82deg);
      background-image: conic-gradient(rgba(0,0,0,0), #2563eb, rgba(0,0,0,0) 10%, rgba(0,0,0,0) 50%, #1d4ed8, rgba(0,0,0,0) 60%);
    }

    .nebula::before {
      transform: translate(-50%, -50%) rotate(60deg);
      background-image: conic-gradient(#000, #1447E6 5%, #000 38%, #000 50%, #0d35b8 60%, #000 87%);
    }

    .cosmic-container:hover .starfield::before { transform: translate(-50%, -50%) rotate(-98deg); }
    .cosmic-container:hover .nebula::before { transform: translate(-50%, -50%) rotate(-120deg); }
    .cosmic-container:hover .stardust::before { transform: translate(-50%, -50%) rotate(-97deg); }
    .cosmic-container:hover .cosmic-ring::before { transform: translate(-50%, -50%) rotate(-110deg); }

    .cosmic-container:focus-within .starfield::before { transform: translate(-50%, -50%) rotate(442deg); transition: transform 4s ease-out; }
    .cosmic-container:focus-within .nebula::before { transform: translate(-50%, -50%) rotate(420deg); transition: transform 4s ease-out; }
    .cosmic-container:focus-within .stardust::before { transform: translate(-50%, -50%) rotate(443deg); transition: transform 4s ease-out; }
    .cosmic-container:focus-within .cosmic-ring::before { transform: translate(-50%, -50%) rotate(430deg); transition: transform 4s ease-out; }

    #cosmic-glow {
      pointer-events: none;
      width: 40px;
      height: 25px;
      position: absolute;
      background: var(--accent-main);
      top: 20px;
      left: 20px;
      filter: blur(25px);
      opacity: 0;
      transition: opacity 0.3s ease-out;
    }
    
    .cosmic-container:hover #cosmic-glow,
    .cosmic-container:focus-within #cosmic-glow {
      opacity: 0.15;
      transition: opacity 0.3s ease-in, all 2s;
    }

    .dark .cosmic-container:hover #cosmic-glow,
    .dark .cosmic-container:focus-within #cosmic-glow {
      opacity: 0.6;
    }
    
    .cosmic-container:hover #cosmic-glow {
      opacity: 0;
      transition: all 2s;
    }

    @keyframes wormhole-rotate {
      100% { transform: translate(-50%, -50%) rotate(450deg); }
    }
    .wormhole-spin::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(90deg);
      width: 400px;
      height: 400px;
      background-image: conic-gradient(rgba(0,0,0,0), var(--accent-main), rgba(0,0,0,0) 50%, rgba(0,0,0,0) 50%, var(--accent-dim), rgba(0,0,0,0) 100%);
      animation: wormhole-rotate 4s linear infinite;
      filter: brightness(1.2);
      opacity: 0.35;
    }

    .dark .wormhole-spin::before {
      opacity: 0.8;
      filter: brightness(1.3);
    }

    .action-bar-transition {
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;

  return (
    <>
      <style>{cosmicStyles}</style>
      <div className="absolute bottom-6 left-0 w-full px-4 z-20 pointer-events-none">
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <div
            ref={containerRef}
            className="cosmic-container relative w-full group transition-all duration-500"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {/* Background Layers */}
            <div className="nebula"></div>
            <div className="starfield"></div>
            <div className="stardust"></div>
            <div className="stardust opacity-50 translate-x-1"></div>
            <div className="cosmic-ring"></div>
            <div id="cosmic-glow"></div>

            {/* Inner Content Wrapper - removed overflow-hidden */}
            <div className="relative z-10 w-full flex flex-col bg-white dark:bg-zinc-900 backdrop-blur-md rounded-2xl border border-zinc-200/60 dark:border-zinc-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-zinc-950/50">
              {/* Drag Overlay */}
              {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-50/95 dark:bg-blue-950/95 backdrop-blur-sm rounded-2xl">
                  <div className="flex flex-col items-center gap-3 text-[#1447E6] dark:text-blue-400">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#1447E6] blur-xl opacity-40 rounded-full animate-pulse"></div>
                      <Paperclip className="w-10 h-10 relative z-10" />
                    </div>
                    <span className="font-semibold tracking-wide text-sm">
                      {t("chat.dropFiles") || "Drop files here"}
                    </span>
                  </div>
                </div>
              )}

              {/* Attachments Area */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 pt-4 pb-0 max-h-32 overflow-y-auto custom-scrollbar relative z-20">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg pl-2 pr-2 py-1.5 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 animate-in fade-in zoom-in-95 group/file relative overflow-hidden"
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
                        <FileIcon className="w-3.5 h-3.5 text-[#1447E6] dark:text-blue-400" />
                      )}
                      <span className="max-w-[150px] truncate">
                        {file.name}
                      </span>
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

              {/* Input Area */}
              <div className={`w-full flex transition-all duration-500 ease-in-out ${isStacked ? "flex-col" : "items-center"}`}>

                {/* Left Actions - Rendered first in Single Line mode, or inside wrapper in Multi Line */}
                {!isStacked && (
                  <div className="flex items-center gap-2 py-2 pl-3 animate-in fade-in slide-in-from-left-2 duration-500">
                    <button
                      onClick={onFileSelect}
                      className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-xl transition-colors"
                      title={t("chat.attachFile") || "Attach File"}
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <MCPServerList
                      isOpen={showMcpMenu}
                      onToggle={() => setShowMcpMenu(!showMcpMenu)}
                      servers={mcpServers}
                      menuRef={mcpMenuRef}
                    />
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  onPaste={onPaste}
                  placeholder={t("chat.placeholder")}
                  className={`w-full bg-transparent text-zinc-700 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none resize-none min-h-[56px] max-h-[30vh] text-base leading-relaxed px-4 py-4`}
                  rows={1}
                />

                {/* Right Actions - Rendered last in Single Line mode */}
                {!isStacked && (
                  <div className="flex items-center gap-2 pr-3 py-2 animate-in fade-in slide-in-from-right-2 duration-500">
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

                    {/* Speech Button */}
                    <div className="relative">
                      {speechError && (
                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500/90 text-white text-[10px] px-2 py-1 rounded border border-red-400 backdrop-blur-sm z-50">
                          {speechError}
                        </div>
                      )}
                      <button
                        onClick={onToggleListening}
                        className={`p-2 rounded-xl transition-all duration-300 ${isListening
                          ? "bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse border border-red-500/50"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                          }`}
                        title={
                          isListening
                            ? t("chat.stopRecording") || "Stop recording"
                            : t("chat.startRecording") || "Start recording"
                        }
                      >
                        {isListening ? (
                          <MicOff className="w-5 h-5" />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Wormhole Send Button */}
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <div
                        className={`absolute inset-0 rounded-xl overflow-hidden pointer-events-none transition-opacity duration-300 ${(input.trim() || attachments.length > 0) && !isLoading
                          ? "opacity-100"
                          : "opacity-0"
                          }`}
                      >
                        <div className="wormhole-spin w-full h-full relative"></div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (isStreaming) {
                            onStop?.();
                          } else {
                            onSend();
                            // Keep focus on textarea after clicking send
                            setTimeout(() => {
                              textareaRef.current?.focus();
                            }, 0);
                          }
                        }}
                        disabled={
                          !isStreaming && ((!input.trim() && attachments.length === 0) || isLoading)
                        }
                        className={`relative z-10 w-9 h-9 flex items-center justify-center rounded-[10px] transition-all duration-300 ${isStreaming
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105"
                          : (input.trim() || attachments.length > 0) &&
                          !isLoading
                          ? "bg-linear-to-br from-[#1447E6] to-[#0d35b8] text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
                          }`}
                        title={isStreaming ? "Stop" : (t("chat.send") || "Send")}
                      >
                        {isStreaming ? <Square className="w-3.5 h-3.5" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Multi-line Action Bar (Bottom) */}
                {isStacked && (
                  <div className="flex items-center justify-between px-3 pb-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Left Actions Group */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onFileSelect}
                        className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-xl transition-colors"
                        title={t("chat.attachFile") || "Attach File"}
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <MCPServerList
                        isOpen={showMcpMenu}
                        onToggle={() => setShowMcpMenu(!showMcpMenu)}
                        servers={mcpServers}
                        menuRef={mcpMenuRef}
                      />
                    </div>

                    {/* Right Actions Group */}
                    <div className="flex items-center gap-2">
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

                      {/* Speech Button */}
                      <div className="relative">
                        {speechError && (
                          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500/90 text-white text-[10px] px-2 py-1 rounded border border-red-400 backdrop-blur-sm z-50">
                            {speechError}
                          </div>
                        )}
                        <button
                          onClick={onToggleListening}
                          className={`p-2 rounded-xl transition-all duration-300 ${isListening
                            ? "bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse border border-red-500/50"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                            }`}
                          title={
                            isListening
                              ? t("chat.stopRecording") || "Stop recording"
                              : t("chat.startRecording") || "Start recording"
                          }
                        >
                          {isListening ? (
                            <MicOff className="w-5 h-5" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Wormhole Send Button */}
                      <div className="relative w-10 h-10 flex items-center justify-center">
                        <div
                          className={`absolute inset-0 rounded-xl overflow-hidden pointer-events-none transition-opacity duration-300 ${(input.trim() || attachments.length > 0) && !isLoading
                            ? "opacity-100"
                            : "opacity-0"
                            }`}
                        >
                          <div className="wormhole-spin w-full h-full relative"></div>
                        </div>

                        <button
                          onClick={() => {
                            if (isStreaming) {
                              onStop?.();
                            } else {
                              onSend();
                              // Keep focus on textarea after clicking send
                              setTimeout(() => {
                                textareaRef.current?.focus();
                              }, 0);
                            }
                          }}
                          disabled={
                            !isStreaming && ((!input.trim() && attachments.length === 0) || isLoading)
                          }
                          className={`relative z-10 w-9 h-9 flex items-center justify-center rounded-[10px] transition-all duration-300 ${isStreaming
                            ? "bg-red-500 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105"
                            : (input.trim() || attachments.length > 0) &&
                            !isLoading
                            ? "bg-linear-to-br from-[#1447E6] to-[#0d35b8] text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
                            }`}
                          title={isStreaming ? "Stop" : (t("chat.send") || "Send")}
                        >
                          {isStreaming ? <Square className="w-3.5 h-3.5" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
