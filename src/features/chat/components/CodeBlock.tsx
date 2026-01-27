import React, { useState } from "react";
import { Play } from "lucide-react";

interface CodeBlockProps {
  className?: string;
  children: React.ReactNode;
  onPreviewRequest?: (content: string) => void;
  [key: string]: any;
}

export const CodeBlock = React.memo<CodeBlockProps>(
  ({ className, children, onPreviewRequest, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";
    const content = String(children).replace(/\n$/, "");
    const isInline = !match && !content.includes("\n");

    const isPreviewable = ["html", "svg"].includes(language);
    const [isPreview, setIsPreview] = useState(false);

    if (isInline) {
      return (
        <code
          className="bg-zinc-200 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-zinc-300 dark:border-zinc-700/50"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] overflow-hidden my-4 w-full shadow-md group">
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-[#18181b] border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
            </div>
            <span className="text-xs text-zinc-500 font-mono font-medium ml-2">
              {language || "text"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Run Button for HTML */}
            {language === "html" && onPreviewRequest && (
              <button
                onClick={() => onPreviewRequest(content)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 rounded transition-colors"
              >
                <Play className="w-3 h-3" />
                Run / Preview
              </button>
            )}

            {isPreviewable && (
              <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setIsPreview(false)}
                  className={`px-2 py-1 text-xs rounded-md transition-all font-medium ${!isPreview ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"}`}
                >
                  Code
                </button>
                <button
                  onClick={() => setIsPreview(true)}
                  className={`px-2 py-1 text-xs rounded-md transition-all font-medium ${isPreview ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"}`}
                >
                  Preview
                </button>
              </div>
            )}
          </div>
        </div>

        {isPreview && isPreviewable ? (
          <div className="bg-white p-0 overflow-hidden relative">
            <iframe
              srcDoc={content}
              className="w-full border-0 min-h-[300px]"
              sandbox="allow-scripts"
              title="Preview"
            />
          </div>
        ) : (
          <div className="p-4 overflow-x-auto text-sm">
            <code
              className={`font-mono text-zinc-800 dark:text-zinc-300 ${className}`}
              {...props}
            >
              {children}
            </code>
          </div>
        )}
      </div>
    );
  },
);

CodeBlock.displayName = "CodeBlock";
