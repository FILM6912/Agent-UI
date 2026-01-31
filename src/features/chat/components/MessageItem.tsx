import React from "react";
import {
  Copy,
  RotateCw,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  File as FileIcon,
} from "lucide-react";
import { Message, ModelConfig } from "@/types";
import { ProcessStep } from "@/features/preview/components/ProcessStep";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "@/hooks/useLanguage";
import { CachedImage } from "./CachedImage";

interface MessageItemProps {
  message: Message;
  isLastMessage: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  copiedId: string | null;
  modelConfig: ModelConfig;
  onCopy: (id: string, text: string) => void;
  onRegenerate: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onVersionChange?: (id: string, newIndex: number) => void;
  onViewImage: (url: string) => void;
  editingId: string | null;
  editValue: string;
  onStartEdit: (msg: Message) => void;
  onSubmitEdit: (id: string) => void;
  onCancelEdit: () => void;
  setEditValue: (value: string) => void;
  markdownComponents: any;
  onSuggestionClick?: (suggestion: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message: msg,
  isLastMessage,
  isLoading,
  isStreaming,
  copiedId,
  modelConfig,
  onCopy,
  onRegenerate,
  onEdit,
  onVersionChange,
  onViewImage,
  editingId,
  editValue,
  onStartEdit,
  onSubmitEdit,
  onCancelEdit,
  setEditValue,
  markdownComponents,
  onSuggestionClick,
}) => {
  const { t } = useLanguage();
  const isAssistant = msg.role === "assistant";
  const isGenerating =
    isStreaming && isAssistant && (isLastMessage || !msg.content);
  const hasVersions = msg.versions && msg.versions.length > 1;
  const currentVersion = (msg.currentVersionIndex || 0) + 1;
  const totalVersions = msg.versions?.length || 1;
  const isEditing = editingId === msg.id;

  return (
    <div
      className={`flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 group ${msg.role === "user" ? "items-end" : "items-start"}`}
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        {isAssistant && (
          <div className="w-6 h-6 rounded-full bg-linear-to-br from-[#1447E6] to-[#0d35b8] flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        )}
        <span className="text-xs text-zinc-500 font-medium">
          {msg.role === "user" ? t("chat.you") : modelConfig.name.toUpperCase()}
        </span>
      </div>

      {isAssistant && msg.steps && (
        <div className="w-full mb-4 space-y-1">
          {msg.steps.map((step) => (
            <ProcessStep key={step.id} step={step} />
          ))}
        </div>
      )}

      {/* Assistant Message Controls */}

      {isAssistant && msg.content && (
        <div className="w-full">
          {/* Thinking Process Display */}
          {(() => {
            const hasThinkTag = msg.content.includes('<think>');
            if (!hasThinkTag) return null;

            const thinkBlocks = [];
            // Match closed blocks
            const closedMatches = [...msg.content.matchAll(/<think>([\s\S]*?)<\/think>/g)];
            for (const match of closedMatches) {
              thinkBlocks.push({ content: match[1], isComplete: true });
            }

            // Match open block at the end (if any) - simply check if there is a <think> after the last </think>
            const lastCloseIndex = msg.content.lastIndexOf('</think>');
            const lastOpenIndex = msg.content.lastIndexOf('<think>');

            if (lastOpenIndex > lastCloseIndex) {
              const openContent = msg.content.substring(lastOpenIndex + 7);
              thinkBlocks.push({ content: openContent, isComplete: false });
            }

            if (thinkBlocks.length === 0) return null;

            return (
              <div className="mb-2 w-full space-y-2">
                {thinkBlocks.map((block, idx) => (
                  <details
                    key={idx}
                    className="group/think bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800/50 rounded-lg overflow-hidden shadow-sm"
                    open={!block.isComplete && isStreaming} // Auto-open if streaming and incomplete
                  >
                    <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-xs font-medium text-zinc-500 select-none">
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${!block.isComplete && isStreaming ? 'bg-blue-500 animate-pulse' : 'bg-zinc-400 group-open/think:bg-blue-500'}`} />
                      {t("chat.thoughtProcess") || "Thought Process"}
                      {!block.isComplete && isStreaming && <span className="opacity-50 ml-1">...</span>}
                    </summary>
                    <div className="px-3 pb-3 pt-1 text-xs text-zinc-600 dark:text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed opacity-90">
                      {block.content}
                      {!block.isComplete && isStreaming && <span className="animate-pulse">_</span>}
                    </div>
                  </details>
                ))}
              </div>
            );
          })()}

          {/* Main Content */}
          <div className={`leading-relaxed group relative ${msg.role === "user"
            ? "w-full flex flex-col items-end"
            : "w-full text-zinc-800 dark:text-zinc-300 pl-1"
            }`}>
            {(() => {
              // Remove <think>... </think> (closed)
              let mainContent = msg.content.replace(/<think>[\s\S]*?<\/think>/g, '');
              // Remove <think>... (open/incomplete at end)
              mainContent = mainContent.replace(/<think>[\s\S]*$/, '');

              mainContent = mainContent.trim();

              if (!mainContent) return null;

              return (
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents as any}
                >
                  {mainContent}
                </Markdown>
              );
            })()}
          </div>
        </div>
      )}

      {/* User Message (Simple Display) */}
      {!isAssistant && (
        <div className={`text-sm md:text-base leading-relaxed group relative ${msg.role === "user"
          ? "w-full flex flex-col items-end"
          : "w-full text-zinc-800 dark:text-zinc-300 pl-1"
          }`}>
          {msg.role === "user" ? (
            isEditing ? (
              <div className="w-full bg-background dark:bg-zinc-900 rounded-2xl p-3 border border-border dark:border-zinc-700 shadow-sm">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-transparent text-zinc-700 dark:text-zinc-100 resize-none outline-none text-sm leading-relaxed p-1"
                  rows={Math.max(2, editValue.split("\n").length)}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <button
                    onClick={onCancelEdit}
                    className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    {t("chat.cancel")}
                  </button>
                  <button
                    onClick={() => onSubmitEdit(msg.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-linear-to-r from-[#1447E6] to-[#0d35b8] text-white hover:from-[#0d35b8] hover:to-[#082a8f] rounded-lg transition-colors shadow-sm"
                  >
                    {t("chat.saveSubmit")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1 w-full">
                {/* Attachments Display */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap justify-end gap-2 mb-1 w-full">
                    {msg.attachments.map((att, i) =>
                      att.type === "image" ? (
                        <div
                          key={i}
                          onClick={() => onViewImage(att.content)}
                          className="group/img relative rounded-xl overflow-hidden border border-border bg-muted cursor-zoom-in"
                        >
                          <CachedImage
                            src={att.content}
                            alt={att.name}
                            className="max-w-[150px] max-h-[150px] object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-muted border border-border px-3 py-2 rounded-xl text-xs text-foreground"
                        >
                          <FileIcon className="w-3.5 h-3.5 text-[#1447E6] dark:text-blue-400" />
                          <span className="truncate max-w-[120px]">
                            {att.name}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {msg.content && (
                  <div className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 text-zinc-700 dark:text-zinc-100 px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm border border-blue-200 dark:border-blue-900/50 whitespace-pre-wrap text-left relative group">
                    {msg.content}
                  </div>
                )}

                {/* User Message Controls (Edit / Versions) */}
                <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                  {hasVersions && onVersionChange && (
                    <div className="flex items-center gap-1 p-0.5">
                      <button
                        onClick={() =>
                          onVersionChange(
                            msg.id,
                            (msg.currentVersionIndex || 0) - 1,
                          )
                        }
                        disabled={(msg.currentVersionIndex || 0) === 0}
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] font-medium text-zinc-500 px-1 min-w-[24px] text-center">
                        {currentVersion} / {totalVersions}
                      </span>
                      <button
                        onClick={() =>
                          onVersionChange(
                            msg.id,
                            (msg.currentVersionIndex || 0) + 1,
                          )
                        }
                        disabled={currentVersion === totalVersions}
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => onStartEdit(msg)}
                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                    title={t("chat.edit")}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onCopy(msg.id, msg.content)}
                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                    title={t("chat.copy")}
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )
          ) : (
            null
          )}
        </div>
      )}



      {/* Assistant Message Controls */}
      {
        isAssistant && !isGenerating && (
          <div className="flex items-center gap-4 mt-3 pl-1 select-none">
            {hasVersions && onVersionChange && (
              <div className="flex items-center gap-1 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() =>
                    onVersionChange(msg.id, (msg.currentVersionIndex || 0) - 1)
                  }
                  disabled={(msg.currentVersionIndex || 0) === 0}
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-medium text-zinc-500 px-1 min-w-[30px] text-center">
                  {currentVersion} / {totalVersions}
                </span>
                <button
                  onClick={() =>
                    onVersionChange(msg.id, (msg.currentVersionIndex || 0) + 1)
                  }
                  disabled={currentVersion === totalVersions}
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onCopy(msg.id, msg.content)}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                title={t("chat.copy")}
              >
                {copiedId === msg.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => onRegenerate(msg.id)}
                disabled={isLoading || isStreaming}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                title={t("chat.regenerate")}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )
      }

      {/* Suggestion Chips */}
      {
        isAssistant && isLastMessage && msg.suggestions && msg.suggestions.length > 0 && !isStreaming && !isLoading && (
          <div className="flex flex-wrap gap-2 mt-2 pl-1 animate-in fade-in slide-in-from-top-1 duration-500 delay-300 fill-mode-both">
            {msg.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
                className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )
      }
    </div >
  );
};
