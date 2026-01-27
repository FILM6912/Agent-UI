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
      className={`flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === "user" ? "items-end" : "items-start"}`}
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        {isAssistant && (
          <div className="w-6 h-6 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
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

      <div
        className={`text-sm md:text-base leading-relaxed group relative ${
          msg.role === "user"
            ? "w-full flex flex-col items-end"
            : "w-full text-zinc-800 dark:text-zinc-300 pl-1"
        }`}
      >
        {msg.role === "user" ? (
          isEditing ? (
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-3 border border-zinc-200 dark:border-zinc-700/50">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-transparent text-zinc-900 dark:text-zinc-200 resize-none outline-none text-sm leading-relaxed p-1"
                rows={Math.max(2, editValue.split("\n").length)}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/50">
                <button
                  onClick={onCancelEdit}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 rounded-lg transition-colors"
                >
                  {t("chat.cancel")}
                </button>
                <button
                  onClick={() => onSubmitEdit(msg.id)}
                  className="px-3 py-1.5 text-xs font-medium bg-black dark:bg-zinc-100 text-white dark:text-black hover:opacity-90 rounded-lg transition-colors"
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
                        className="group/img relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-zoom-in"
                      >
                        <img
                          src={att.content}
                          alt={att.name}
                          className="max-w-[150px] max-h-[150px] object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-700 dark:text-zinc-300"
                      >
                        <FileIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span className="truncate max-w-[120px]">
                          {att.name}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}

              {msg.content && (
                <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm dark:shadow-md border border-zinc-200 dark:border-zinc-700/30 whitespace-pre-wrap text-left relative group">
                  {msg.content}
                </div>
              )}

              {/* User Message Controls (Edit / Versions) */}
              <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                {hasVersions && onVersionChange && (
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-800">
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
          <>
            {msg.content ? (
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents as any}
              >
                {msg.content}
              </Markdown>
            ) : (
              // Show dots animation when content is empty
              <div className="flex space-x-1.5 py-2 h-6 items-center">
                <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce"></div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Assistant Message Controls */}
      {isAssistant && !isGenerating && (
        <div className="flex items-center gap-4 mt-3 pl-1 select-none">
          {hasVersions && onVersionChange && (
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-800">
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

          <div className="flex items-center gap-1">
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
      )}
    </div>
  );
};
