import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,

  Brain,
  FileEdit,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { ProcessStep as ProcessStepType } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ProcessStepProps {
  step: ProcessStepType;
  forceExpanded?: boolean;
}

export const ProcessStep: React.FC<ProcessStepProps> = ({ step, forceExpanded = false }) => {
  const { t } = useLanguage();
  // Default expanded state
  const [expanded, setExpanded] = useState(forceExpanded || (step.isExpanded ?? true));

  const getIcon = () => {
    switch (step.type) {
      case "thinking":
        return (
          <Brain className="w-4 h-4 text-purple-500 dark:text-purple-400" />
        );
      case "command":
        return (
          <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        );
      case "edit":
        return (
          <FileEdit className="w-4 h-4 text-blue-500 dark:text-blue-400" />
        );
      case "error":
        return <div className="w-2 h-2 rounded-full bg-red-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getTitle = () => {
    if (step.title === "Deep Thinking" || step.type === "thinking")
      return t("process.thinking");
    if (step.title === "Reasoning") return t("process.thinking");

    if (step.title) return step.title;

    switch (step.type) {
      case "command":
        return t("process.toolExecution");
      case "edit":
        return t("process.edit");
      default:
        return t("process.default");
    }
  };

  const getContent = () => {
    if (step.content.includes("Analyzing technical requirements"))
      return t("process.analyzing") + "...";
    if (step.content.includes("Deconstructing the problem"))
      return t("process.deconstructing") + "...";
    return step.content;
  };



  return (
    <div className="mb-2 last:mb-0 rounded-xl bg-zinc-100 dark:bg-[#0c0c0e] overflow-hidden group transition-all duration-200 border border-zinc-300 dark:border-white/10 shadow-sm">
      <div
        className="flex items-center gap-3 p-3 min-h-[44px] cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-center w-4 h-4 text-zinc-500 dark:text-zinc-600 group-hover:text-zinc-800 dark:group-hover:text-zinc-400 transition-colors">
          {!forceExpanded && (
            expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )
          )}
        </div>

        <div className="flex items-center gap-3 flex-1 overflow-hidden min-w-0">
          <div className="shrink-0 flex items-center justify-center">
            {getIcon()}
          </div>

          <span
            className="text-sm font-medium whitespace-nowrap shrink-0 text-zinc-800 dark:text-zinc-200"
          >
            {getTitle()}
          </span>


        </div>

          <div className="flex items-center gap-3 pl-2 shrink-0">
          {step.duration && (
            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
              {step.duration}
            </span>
          )}
          {step.status === "running" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 dark:text-zinc-500" />
          ) : step.status === "completed" ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : null}
        </div>
      </div>

      {expanded && (
        <div className="pl-10 pr-4 pb-3">
          {step.type === "thinking" && (
            <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4 py-1">
              {getContent()}
            </div>
          )}

          {step.type === "command" && (
            <div className="mt-1 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Parse and display content in Input/Output format */}
              {(() => {
                const content = step.content;
                const lines = content.split("\n");



                // Find Input and Output sections
                const inputIndex = lines.findIndex(
                  (line) => line.trim() === "Input:",
                );
                const outputIndex = lines.findIndex(
                  (line) => line.trim() === "Output:",
                );

                let inputContent = "";
                let outputContent = "";

                if (inputIndex !== -1) {
                  const inputEnd =
                    outputIndex !== -1 ? outputIndex : lines.length;
                  inputContent = lines
                    .slice(inputIndex + 1, inputEnd)
                    .join("\n")
                    .trim();
                  // Remove markdown code blocks
                  inputContent = inputContent
                    .replace(/```json\n?/g, "")
                    .replace(/```\n?/g, "")
                    .trim();
                }

                if (outputIndex !== -1) {
                  outputContent = lines
                    .slice(outputIndex + 1)
                    .join("\n")
                    .trim();
                }

                return (
                  <>


                    {/* Input Section */}
                    {inputContent && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                          Input
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                          <pre className="whitespace-pre-wrap wrap-break-word">
                            {(() => {
                              try {
                                const parsed = JSON.parse(inputContent);
                                const formatted = JSON.stringify(
                                  parsed,
                                  null,
                                  2,
                                );

                                // JSON syntax highlighting with VS Code-like colors
                                return formatted.split("\n").map((line, i) => {
                                  // Color keys (property names) - Cyan
                                  line = line.replace(
                                    /"([^"]+)":/g,
                                    '<span class="text-cyan-500 dark:text-cyan-400">"$1"</span>:',
                                  );
                                  // Color string values - Orange
                                  line = line.replace(
                                    /: "([^"]*)"/g,
                                    ': <span class="text-orange-500 dark:text-orange-400">"$1"</span>',
                                  );
                                  // Color numbers - Green
                                  line = line.replace(
                                    /: (\d+\.?\d*)/g,
                                    ': <span class="text-green-600 dark:text-green-400">$1</span>',
                                  );
                                  // Color booleans - Cyan (like keywords)
                                  line = line.replace(
                                    /: (true|false)/g,
                                    ': <span class="text-cyan-500 dark:text-cyan-400">$1</span>',
                                  );
                                  // Color null - Cyan
                                  line = line.replace(
                                    /: (null)/g,
                                    ': <span class="text-cyan-500 dark:text-cyan-400">$1</span>',
                                  );
                                  // Color brackets - Light gray
                                  line = line.replace(
                                    /([{}[\]])/g,
                                    '<span class="text-zinc-400 dark:text-zinc-500">$1</span>',
                                  );

                                  return (
                                    <div
                                      key={i}
                                      dangerouslySetInnerHTML={{
                                        __html: line || "&nbsp;",
                                      }}
                                    />
                                  );
                                });
                              } catch {
                                return (
                                  <span className="text-zinc-700 dark:text-zinc-300">
                                    {inputContent}
                                  </span>
                                );
                              }
                            })()}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Output Section */}
                    {outputContent && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                          Output
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto prose prose-sm dark:prose-invert max-w-none">
                          <Markdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="my-1 last:mb-0">{children}</p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-bold text-blue-600 dark:text-blue-400">
                                  {children}
                                </strong>
                              ),
                              code: ({
                                className,
                                children,
                                ...props
                              }: any) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code
                                    className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-[0.9em]"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {outputContent}
                          </Markdown>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {step.type !== "thinking" && step.type !== "command" && (
            <div className="text-xs font-mono text-zinc-600 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-900/30 p-2 rounded break-all whitespace-pre-wrap animate-in fade-in slide-in-from-top-1 duration-200">
              {step.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
