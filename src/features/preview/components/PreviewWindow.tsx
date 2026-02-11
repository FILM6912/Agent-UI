import { ProcessStep } from "@/types";
import React, { useState, useEffect } from "react";
import {
  Share2,
  PanelRightClose,
  Check,
  ArrowLeft,
  Copy,
  Eye,
  Code,
  RefreshCw,
  ExternalLink,
  Download,
  Save,
  Trash2,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import { FileTreeItem, FileNode } from "./FileTreeItem";
import { FileContentRenderer } from "./FileContentRenderer";
import { ProcessTab } from "./ProcessTab";
import { useClipboard } from "../hooks/useClipboard";
import { useWindowResize } from "../hooks/useWindowResize";
import { INITIAL_FILE_SYSTEM, MOCK_DASHBOARD_HTML } from "../data/mockData";

interface PreviewWindowProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
  isSidebarOpen?: boolean;
  previewContent?: string | null;
  isLoading?: boolean;
  steps?: ProcessStep[];
}

export const PreviewWindow: React.FC<PreviewWindowProps> = ({
  isOpen = true,
  onToggle,
  isMobile = false,
  isSidebarOpen = true,
  previewContent,
  isLoading = false,
  steps,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<"process" | "files" | "web">(
    "process",
  );
  const [fileSystem] = useState<FileNode[]>(INITIAL_FILE_SYSTEM);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const selectedFileName = selectedFile?.name ?? null;
  const [editContent, setEditContent] = useState<string>("");
  const [viewMode, setViewMode] = useState<"code" | "preview">("preview");
  const [iframeKey, setIframeKey] = useState(0);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(["src", "src/components", "public"]),
  );
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const { copied, copyToClipboard } = useClipboard();
  const { width, isResizing, startResizing } = useWindowResize(
    450,
    isSidebarOpen,
  );

  useEffect(() => {
    const content = previewContent || MOCK_DASHBOARD_HTML;
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [previewContent]);

  useEffect(() => {
    if (previewContent) setActiveTab("web");
  }, [previewContent]);

  const toggleFolder = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const handleFileSelect = (node: FileNode) => {
    setSelectedFile(node);
    setEditContent(node.content || "");
    const ext = node.name.split(".").pop()?.toLowerCase();
    if (
      [
        "md",
        "png",
        "jpg",
        "jpeg",
        "gif",
        "webp",
        "svg",
        "csv",
        "xlsx",
        "xls",
        "pdf",
      ].includes(ext || "")
    )
      setViewMode("preview");
    else setViewMode("code");
  };

  const handleSaveContent = () => {
    if (!selectedFile) return;
    setSelectedFile((prev) =>
      prev ? { ...prev, content: editContent } : null,
    );
    setViewMode("code");
  };

  const handleCopy = async () => {
    if (!selectedFile?.content) return;
    await copyToClipboard(selectedFile.content);
  };

  const handleDownload = (node: FileNode) => {
    if (!node.content) return;
    const blob = new Blob([node.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = node.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Agent Preview",
          text: "Check out this agent preview",
          url: url,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    const success = await copyToClipboard(url);
    if (success) {
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    }
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) window.open(previewUrl, "_blank");
  };

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleFileTreeSelect = (_path: string, node: FileNode) => {
    handleFileSelect(node);
  };

  const mobileClasses = `fixed inset-0 z-50 bg-background flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`;
  const desktopClasses = `h-screen bg-background border-l border-zinc-200 dark:border-zinc-800 flex flex-col flex-shrink-0 relative ease-in-out overflow-hidden ${isOpen ? "translate-x-0" : "translate-x-full border-l-0 opacity-0"} ${isResizing ? "" : "transition-all duration-300"}`;

  return (
    <div
      className={isMobile ? mobileClasses : desktopClasses}
      style={!isMobile ? { width: isOpen ? width : 0 } : {}}
    >
      {!isMobile && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 z-50 transition-colors"
          onMouseDown={startResizing}
        />
      )}
      <div className="w-full h-full flex flex-col">
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
          <span className="font-semibold text-foreground text-sm">
            {t("preview.title")}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="text-muted-foreground hover:text-foreground relative"
              title="Share"
            >
              {showShareTooltip ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              {showShareTooltip && (
                <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg whitespace-nowrap z-50 animate-in fade-in slide-in-from-top-1">
                  {t("preview.shareSuccess")}
                </div>
              )}
            </button>
            <button
              onClick={onToggle}
              className="text-muted-foreground hover:text-foreground"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => {
              setActiveTab("process");
              setSelectedFile(null);
            }}
            className={`text-sm font-medium pb-1 border-b-2 transition-all ${activeTab === "process" ? "text-foreground border-foreground opacity-100" : "text-muted-foreground border-transparent opacity-50 hover:text-foreground hover:opacity-75"}`}
          >
            {t("preview.tabProcess")}
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`text-sm font-medium pb-1 border-b-2 transition-all ${activeTab === "files" ? "text-foreground border-foreground opacity-100" : "text-muted-foreground border-transparent opacity-50 hover:text-foreground hover:opacity-75"}`}
          >
            {t("preview.tabFiles")}
          </button>
          <button
            onClick={() => setActiveTab("web")}
            className={`text-sm font-medium pb-1 border-b-2 transition-all ${activeTab === "web" ? "text-foreground border-foreground opacity-100" : "text-muted-foreground border-transparent opacity-50 hover:text-foreground hover:opacity-75"}`}
          >
            {t("preview.tabPreview")}
          </button>
        </div>

        <div className="flex-1 p-4 bg-muted/30 overflow-hidden relative flex flex-col transition-colors duration-200">
          {activeTab === "web" ? (
            <div className="w-full h-full bg-background rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col shadow-xl transition-colors duration-200">
              <div className="h-10 bg-muted border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-3 gap-3 transition-colors duration-200">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenInNewTab}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title={t("preview.openInNewTab")}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title={t("preview.reload")}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-background relative transition-colors duration-200">
                <iframe
                  key={iframeKey}
                  src={previewUrl}
                  className="w-full h-full border-0 bg-background"
                  style={{
                    colorScheme: isDark ? "dark" : "light",
                  }}
                  sandbox="allow-scripts"
                  title="Live Preview"
                />
              </div>
            </div>
          ) : activeTab === "process" ? (
            <ProcessTab steps={steps} />
          ) : (
            <div className="w-full h-full bg-background rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col shadow-xl relative transition-colors duration-200">
              {selectedFile ? (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300 bg-background transition-colors">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-muted transition-colors duration-200">
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="flex bg-muted border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 mr-2">
                        <button
                          onClick={() => setViewMode("code")}
                          className={`px-2 py-1 text-[10px] rounded-md transition-all flex items-center gap-1.5 ${viewMode === "code" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          <Code className="w-3 h-3" /> Code
                        </button>
                        {[
                          "md",
                          "png",
                          "jpg",
                          "jpeg",
                          "gif",
                          "webp",
                          "svg",
                          "csv",
                          "xlsx",
                          "xls",
                          "pdf",
                        ].includes(
                          selectedFile.name.split(".").pop()?.toLowerCase() ||
                            "",
                        ) && (
                          <button
                            onClick={() => setViewMode("preview")}
                            className={`px-2 py-1 text-[10px] rounded-md transition-all flex items-center gap-1.5 ${viewMode === "preview" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            <Eye className="w-3 h-3" /> Preview
                          </button>
                        )}
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        {selectedFile.name}
                      </span>
                      {viewMode === "code" && (
                        <button
                          onClick={handleSaveContent}
                          className="p-1.5 text-muted-foreground hover:text-emerald-500 hover:bg-accent rounded transition-colors"
                          title="Save"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(selectedFile)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCopy}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                        title="Copy code"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                        title="Delete File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto bg-background scrollbar-thin scrollbar-thumb-border transition-colors duration-200">
                    <FileContentRenderer
                      selectedFile={selectedFile}
                      editContent={editContent}
                      viewMode={viewMode}
                      isDark={isDark}
                      onEditContentChange={setEditContent}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-muted border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between transition-colors duration-200">
                    <span>Generated Files</span>
                    {isLoading && (
                      <div className="flex items-center gap-1.5 text-primary animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-[10px]">GENERATING</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 font-mono bg-background transition-colors duration-200">
                    {fileSystem.map((node, idx) => (
                      <FileTreeItem
                        key={idx}
                        node={node}
                        level={0}
                        path={node.name}
                        selectedFile={selectedFileName}
                        onToggle={toggleFolder}
                        onSelect={handleFileTreeSelect}
                        expandedPaths={expandedPaths}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
