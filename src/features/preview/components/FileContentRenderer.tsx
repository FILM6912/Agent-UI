import React from "react";
import { Share2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileNode } from "./FileTreeItem";
import { SpreadsheetViewer } from "./SpreadsheetViewer";
import { useLanguage } from "@/hooks/useLanguage";

interface FileContentRendererProps {
  selectedFile: FileNode;
  editContent: string;
  viewMode: "code" | "preview";
  isDark: boolean;
  onEditContentChange: (content: string) => void;
  error?: string | null;
}

const getLanguage = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  
  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
      return "javascript";
    case "css":
    case "scss":
    case "sass":
    case "less":
      return "css";
    case "json":
      return "json";
    case "html":
    case "htm":
    case "xml":
    case "svg":
      return "markup";
    case "md":
    case "markdown":
      return "markdown";
    case "py":
      return "python";
    case "java":
      return "java";
    case "c":
    case "h":
      return "c";
    case "cpp":
    case "hpp":
    case "cc":
      return "cpp";
    case "cs":
      return "csharp";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "php":
      return "php";
    case "rb":
      return "ruby";
    case "sh":
    case "bash":
    case "zsh":
      return "bash";
    case "yaml":
    case "yml":
      return "yaml";
    case "sql":
      return "sql";
    case "dockerfile":
      return "docker";
    case "ini":
    case "toml":
    case "cfg":
      return "ini";
    default:
      return "plaintext";
  }
};

export const FileContentRenderer: React.FC<FileContentRendererProps> = ({
  selectedFile,
  editContent,
  viewMode,
  isDark,
  onEditContentChange,
  error,
}) => {
  const { t } = useLanguage();
  const ext = selectedFile.name.split(".").pop()?.toLowerCase();
  
  const [imageError, setImageError] = React.useState(false);
  
  // Reset error state when file changes
  React.useEffect(() => {
    setImageError(false);
  }, [selectedFile.id]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-100 dark:bg-zinc-900 text-red-500 p-8 text-center">
         <div className="flex flex-col items-center gap-2">
           <span className="text-4xl">⚠️</span>
           <p>Failed to load file</p>
           <p className="text-sm text-zinc-500">{error}</p>
         </div>
      </div>
    );
  }

  if (viewMode === "code") {
    return (
      <div className="relative w-full h-full bg-white dark:bg-[#1e1e1e]">
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ padding: 0, margin: 0 }}
        >
          <SyntaxHighlighter
            language={getLanguage(selectedFile.name)}
            style={isDark ? vscDarkPlus : vs}
            customStyle={{
              margin: 0,
              padding: "1.5rem",
              height: "100%",
              width: "100%",
              background: "transparent",
              fontSize: "14px",
              lineHeight: "1.5",
              fontFamily: "monospace",
            }}
            codeTagProps={{
              style: {
                fontFamily: "monospace",
                fontSize: "14px",
                lineHeight: "1.5",
              },
            }}
            wrapLongLines={false}
          >
            {editContent + "\n"}
          </SyntaxHighlighter>
        </div>
        <textarea
          className="absolute inset-0 w-full h-full bg-transparent text-transparent p-[1.5rem] font-mono text-[14px] leading-[1.5] outline-none resize-none caret-black dark:caret-white whitespace-pre"
          value={editContent}
          onChange={(e) => onEditContentChange(e.target.value)}
          spellCheck={false}
          onScroll={(e) => {
            const container = e.currentTarget.parentElement;
            const pre = container?.querySelector("pre");
            if (pre) {
              pre.scrollTop = e.currentTarget.scrollTop;
              pre.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
          style={{ fontFamily: "monospace" }}
        />
      </div>
    );
  }

  switch (ext) {
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      if (!selectedFile.content) {
        return (
          <div className="flex items-center justify-center h-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
              <span>Loading image...</span>
            </div>
          </div>
        );
      }
      
      if (imageError) {
        return (
          <div className="flex items-center justify-center h-full bg-zinc-100 dark:bg-zinc-900 text-red-500 p-8 text-center">
             <div className="flex flex-col items-center gap-2">
               <span className="text-4xl">⚠️</span>
               <p>Failed to load image</p>
               <p className="text-sm text-zinc-500">The image data might be corrupted or the format is unsupported.</p>
             </div>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center h-full bg-[url('https://transparenttextures.com/patterns/stardust.png')] bg-zinc-200 dark:bg-zinc-900 p-8">
          <img
            src={selectedFile.content}
            alt={selectedFile.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-zinc-300 dark:border-zinc-800"
            onError={() => setImageError(true)}
          />
        </div>
      );
    case "svg":
      const svgContent = selectedFile.content || "";
      const isSvgUrl =
        svgContent.trim().startsWith("http") ||
        svgContent.trim().startsWith("data:");
      if (isSvgUrl) {
        return (
          <div className="flex items-center justify-center h-full bg-[url('https://transparenttextures.com/patterns/stardust.png')] bg-zinc-200 dark:bg-zinc-900 p-8">
            <img
              src={svgContent}
              alt={selectedFile.name}
              className="max-w-full max-h-full"
            />
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center h-full bg-[url('https://transparenttextures.com/patterns/stardust.png')] bg-zinc-200 dark:bg-zinc-900 p-8">
          <div
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto text-zinc-900 dark:text-zinc-100"
          />
        </div>
      );
    case "pdf":
      return (
        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex flex-col">
          <div className="bg-zinc-200 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-800 p-2 flex justify-between items-center text-xs text-zinc-600 dark:text-zinc-400">
            <span>{t("preview.pdfViewer")}</span>
            <a
              href={selectedFile.content}
              target="_blank"
              rel="noreferrer"
              className="hover:text-black dark:hover:text-white flex items-center gap-1"
            >
              <Share2 className="w-3 h-3" /> {t("preview.openExternal")}
            </a>
          </div>
          <iframe
            src={selectedFile.content}
            className="flex-1 w-full border-0 bg-white"
            title={selectedFile.name}
          />
        </div>
      );
    case "csv":
      return <SpreadsheetViewer content={selectedFile.content || ""} />;
    case "xlsx":
    case "xls":
      if (!selectedFile.content) {
        return (
          <div className="flex items-center justify-center h-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
              <span>Loading spreadsheet...</span>
            </div>
          </div>
        );
      }
      return <SpreadsheetViewer content={selectedFile.content} isExcel />;
    case "md":
      return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto prose prose-zinc dark:prose-invert prose-sm">
          <Markdown remarkPlugins={[remarkGfm]}>
            {selectedFile.content || ""}
          </Markdown>
        </div>
      );
    default:
      return (
        <div className="relative w-full h-full bg-white dark:bg-[#1e1e1e]">
          <textarea
            className="absolute inset-0 w-full h-full bg-transparent text-transparent p-[1.5rem] font-mono text-[14px] leading-[1.5] outline-none resize-none caret-black dark:caret-white whitespace-pre"
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            spellCheck={false}
          />
        </div>
      );
  }
};
