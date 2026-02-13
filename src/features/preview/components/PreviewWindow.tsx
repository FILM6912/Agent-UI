import { ConfirmModal } from "@/components/ConfirmModal";
import { InputModal } from "@/components/InputModal";
import { ProcessStep } from "@/types";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Edit2,
} from "lucide-react";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import fileService from "../../chat/api/fileService";
import { FileItem } from "@/types/file-api";
import { FileTreeItem, FileNode } from "./FileTreeItem";
import { FileContentRenderer } from "./FileContentRenderer";
import { ProcessTab } from "./ProcessTab";
import { useClipboard } from "../hooks/useClipboard";
import { useWindowResize } from "../hooks/useWindowResize";
import { MOCK_DASHBOARD_HTML } from "../data/mockData";

interface PreviewWindowProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
  isSidebarOpen?: boolean;
  previewContent?: string | null;
  isLoading?: boolean;
  steps?: ProcessStep[];
  chatId?: string;
}

export const PreviewWindow: React.FC<PreviewWindowProps> = ({
  isOpen = true,
  onToggle,
  isMobile = false,
  isSidebarOpen = true,
  previewContent,
  isLoading = false,
  steps,
  chatId,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<"process" | "files" | "web">(
    "process",
  );
  const [fileSystem, setFileSystem] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const selectedFileName = selectedFile?.name ?? null;
  const [editContent, setEditContent] = useState<string>("");
  const [viewMode, setViewMode] = useState<"code" | "preview">("preview");
  const [iframeKey, setIframeKey] = useState(0);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "danger" | "info";
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "info",
  });

  const [inputModal, setInputModal] = useState<{
    isOpen: boolean;
    title: string;
    initialValue: string;
    onConfirm: (value: string) => void;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
    initialValue: "",
    onConfirm: () => {},
  });

  const { copied, copyToClipboard } = useClipboard();
  const { width, isResizing, startResizing } = useWindowResize(
    450,
    isSidebarOpen,
  );

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileNode;
  } | null>(null);
  const [isFilesLoading, setIsFilesLoading] = useState(false);

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

  const fetchFiles = async () => {
    if (!chatId) return;
    setIsFilesLoading(true);
    try {
      const response = await fileService.listFiles(undefined, chatId, true);
      
      const mapFileItemToNode = (f: FileItem): FileNode => ({
        id: f.path,
        name: f.name,
        type: f.type === "directory" ? "folder" : "file",
        children: f.children ? f.children.map(mapFileItemToNode) : (f.type === "directory" ? [] : undefined),
        content: undefined,
      });

      const nodes: FileNode[] = response.files.map(mapFileItemToNode);
      setFileSystem(nodes);
    } catch (error) {
      console.error("Failed to fetch files", error);
    } finally {
      setIsFilesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "files" && chatId) {
      fetchFiles();
    }
  }, [activeTab, chatId]);

  const toggleFolder = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const handleFileSelect = async (node: FileNode) => {
    setSelectedFile(node);
    setLoadError(null);
    
    // Determine file type
    const ext = node.name.split(".").pop()?.toLowerCase();
    const isBinary = ["png", "jpg", "jpeg", "gif", "webp", "pdf"].includes(ext || "");
    const isExcel = ["xlsx", "xls"].includes(ext || "");
    const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "");
    
    const blobToDataURL = (blob: Blob): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === "string") resolve(result);
          else reject(new Error("Failed to convert blob to data URL"));
        };
        reader.onerror = () => reject(new Error("Failed to read blob"));
        reader.readAsDataURL(blob);
      });
    
    let content = node.content;
    
    // Check if we need to reload content
    // Reload if:
  // - No content
  // - Binary content is not a URL (blob:, http(s):, data:)
  // - Excel content looks like raw binary or not JSON
  const looksLikeUrl = (s: string) => s.startsWith("blob:") || s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:");
  const needsReload =
    !content ||
    (isBinary && !looksLikeUrl(content)) ||
    (isExcel && (content.startsWith("PK") || !content.trim().startsWith("{")));

    if (needsReload) {
      const fullPath = node.id;
      const lastSlashIndex = fullPath.lastIndexOf("/");
      const dirPath = lastSlashIndex > -1 ? fullPath.substring(0, lastSlashIndex) : undefined;

      try {
        if (isBinary) {
          // For binary files, use the download URL directly
          // We can construct it manually or fetch it as blob and create object URL
          // Using object URL is safer and cleaner for auth/headers if needed later
          const blob = await fileService.downloadFile(node.name, { path: dirPath }, chatId);
          
          if (blob.type === 'application/json') {
             // This suggests an error response that was returned as a blob
             const text = await blob.text();
             console.error("Failed to download file, received JSON:", text);
             try {
               const error = JSON.parse(text);
               throw new Error(error.detail || error.error || "Failed to download file");
             } catch (e) {
               throw new Error("Failed to download file: " + text);
             }
          }
          
          content = isImage ? await blobToDataURL(blob) : URL.createObjectURL(blob);
        } else if (isExcel) {
          // For Excel, fetch as blob and parse all sheets
          const blob = await fileService.downloadFile(node.name, { path: dirPath }, chatId);
          const arrayBuffer = await blob.arrayBuffer();
          
          let result;
          try {
            // Try ExcelJS first for images support
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);
            
            const sheets: Record<string, any> = {};
            const sheetNames: string[] = [];
            
            workbook.eachSheet((worksheet) => {
              sheetNames.push(worksheet.name);
              
              // Extract data
              const data: string[][] = [];
              worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                const rowVals: any = row.values;
                let rowData: string[] = [];
                
                if (Array.isArray(rowVals)) {
                  // ExcelJS values are 1-based, index 0 is undefined
                  rowData = rowVals.slice(1).map((v: any) => {
                    if (v === null || v === undefined) return "";
                    if (typeof v === 'object') {
                       // Handle rich text or other objects
                       if (v.richText) return v.richText.map((rt: any) => rt.text).join("");
                       if (v.text) return v.text;
                       if (v.result !== undefined) return v.result?.toString() ?? ""; // Formula result
                       return JSON.stringify(v);
                    }
                    return v.toString();
                  });
                } else if (typeof rowVals === 'object') {
                   // Fallback for object-based values
                   row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                     const v = cell.value;
                     let strVal = "";
                     if (v === null || v === undefined) strVal = "";
                     else if (typeof v === 'object') {
                        if ((v as any).richText) strVal = (v as any).richText.map((rt: any) => rt.text).join("");
                        else if ((v as any).text) strVal = (v as any).text;
                        else if ((v as any).result !== undefined) strVal = (v as any).result?.toString() ?? "";
                        else strVal = JSON.stringify(v);
                     } else {
                        strVal = v.toString();
                     }
                     rowData[colNumber - 1] = strVal;
                   });
                }
                
                // Fill any gaps in the row
                for (let i = 0; i < rowData.length; i++) {
                   if (rowData[i] === undefined) rowData[i] = "";
                }
                
                data[rowNumber - 1] = rowData;
              });
              
              // Fill empty rows
              for (let i = 0; i < data.length; i++) {
                if (!data[i]) data[i] = [];
              }
              
              // Extract images
              const images: any[] = [];
              worksheet.getImages().forEach((image) => {
                const imgId = image.imageId;
                const imgModel = workbook.getImage(imgId);
                
                if (imgModel && imgModel.buffer) {
                  // Convert buffer to base64
                  const bytes = new Uint8Array(imgModel.buffer as ArrayBufferLike);
                  let binary = '';
                  for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                  }
                  const base64 = window.btoa(binary);
                  
                  // Flatten range to plain numbers to avoid circular refs
                  const tlCol = Math.floor((image.range?.tl as any)?.nativeCol ?? 0);
                  const tlRow = Math.floor((image.range?.tl as any)?.nativeRow ?? 0);
                  const brCol = Math.floor((image.range?.br as any)?.nativeCol ?? tlCol);
                  const brRow = Math.floor((image.range?.br as any)?.nativeRow ?? tlRow);
                  
                  images.push({
                    range: {
                      tl: { nativeCol: tlCol, nativeRow: tlRow },
                      br: { nativeCol: brCol, nativeRow: brRow },
                    },
                    base64: `data:image/${imgModel.extension};base64,${base64}`,
                    extension: imgModel.extension
                  });
                }
              });
              
              sheets[worksheet.name] = {
                data,
                images
              };
            });
            
            result = {
              sheetNames,
              sheets,
              type: "exceljs"
            };
            
          } catch (e) {
            console.error("ExcelJS failed, falling back to XLSX", e);
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const sheets: Record<string, any[][]> = {};
            workbook.SheetNames.forEach(name => {
              const worksheet = workbook.Sheets[name];
              sheets[name] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            });
            
            result = {
              sheetNames: workbook.SheetNames,
              sheets
            };
          }
          
          content = JSON.stringify(result);
        } else {
          // For text files
          const response = await fileService.readFile(node.name, { path: dirPath }, chatId);
          content = response.content;
        }

        // Update local state
        setFileSystem((prev) => {
          const updateNode = (nodes: FileNode[]): FileNode[] => {
            return nodes.map((n) => {
              if (n.id === node.id) {
                return { ...n, content };
              }
              if (n.children) {
                return { ...n, children: updateNode(n.children) };
              }
              return n;
            });
          };
          return updateNode(prev);
        });

        const nodeWithContent = { ...node, content };
        setSelectedFile(nodeWithContent);
      } catch (error) {
        console.error("Failed to load file content:", error);
        setLoadError(error instanceof Error ? error.message : "Failed to load file");
      }
    }

    setEditContent(content || "");
    
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

  const handleSaveContent = async () => {
    if (!selectedFile || !chatId) return;
    
    try {
      const fullPath = selectedFile.id;
      const lastSlashIndex = fullPath.lastIndexOf("/");
      const dirPath = lastSlashIndex > -1 ? fullPath.substring(0, lastSlashIndex) : undefined;
      const filename = selectedFile.name;

      await fileService.writeFile(filename, editContent, { path: dirPath }, chatId);

      setSelectedFile((prev) =>
        prev ? { ...prev, content: editContent } : null,
      );
      setViewMode("code");
    } catch (error) {
      console.error("Failed to save file:", error);
      // You might want to add a toast notification here
    }
  };

  const handleDeleteFile = async () => {
    if (!selectedFile || !chatId) return;

    setConfirmModal({
      isOpen: true,
      title: t("preview.deleteFile"),
      message: t("preview.deleteFileConfirm").replace("{name}", selectedFile.name),
      type: "danger",
      confirmText: t("preview.delete"),
      cancelText: t("preview.cancel"),
      onConfirm: async () => {
        try {
          const fullPath = selectedFile.id;
          const lastSlashIndex = fullPath.lastIndexOf("/");
          const dirPath =
            lastSlashIndex > -1
              ? fullPath.substring(0, lastSlashIndex)
              : undefined;
          const filename = selectedFile.name;

          await fileService.deleteFile(filename, { path: dirPath }, chatId);

          setSelectedFile(null);
          await fetchFiles();
        } catch (error) {
          console.error("Failed to delete file:", error);
          // You might want to add a toast notification here
        }
      },
    });
  };

  const handleCopy = async () => {
    if (!selectedFile?.content) return;
    await copyToClipboard(selectedFile.content);
  };

  const handleDownload = async (node: FileNode | null) => {
    if (!node || !chatId) return;
    try {
      const fullPath = node.id;
      const lastSlashIndex = fullPath.lastIndexOf("/");
      const dirPath =
        lastSlashIndex > -1 ? fullPath.substring(0, lastSlashIndex) : undefined;
      
      const blob = await fileService.downloadFile(node.name, { path: dirPath }, chatId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = node.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("preview.shareTitle"),
          text: t("preview.shareText"),
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

  const handleRenameNode = (node: FileNode) => {
    if (!node || !chatId) return;
    setRenamingNodeId(node.id || null);
  };

  const handleRenameCancel = () => {
    setRenamingNodeId(null);
  };

  const handleRenameSubmit = async (node: FileNode, newName: string) => {
    setRenamingNodeId(null);
    if (!node || !chatId || !newName || newName === node.name) return;

    try {
      const fullPath = node.id;
      const lastSlashIndex = fullPath.lastIndexOf("/");
      const dirPath =
        lastSlashIndex > -1 ? fullPath.substring(0, lastSlashIndex) : undefined;

      await fileService.moveFile(
        node.name,
        newName,
        dirPath,
        dirPath,
        chatId,
      );

      await fetchFiles();
    } catch (error) {
      console.error("Failed to rename node:", error);
    }
  };

  const handleDeleteNode = async (node: FileNode) => {
    if (!node || !chatId) return;

    setConfirmModal({
      isOpen: true,
      title: t("preview.deleteFile"),
      message: t("preview.deleteFileConfirm").replace("{name}", node.name),
      type: "danger",
      confirmText: t("preview.delete"),
      cancelText: t("preview.cancel"),
      onConfirm: async () => {
        try {
          const fullPath = node.id;
          const lastSlashIndex = fullPath.lastIndexOf("/");
          const dirPath =
            lastSlashIndex > -1
              ? fullPath.substring(0, lastSlashIndex)
              : undefined;
          const filename = node.name;

          await fileService.deleteFile(filename, { path: dirPath }, chatId);

          if (selectedFile && selectedFile.id === node.id) {
            setSelectedFile(null);
          }

          await fetchFiles();
        } catch (error) {
          console.error("Failed to delete node:", error);
        }
      },
    });
  };



  const handleFileDrop = async (
    sourceNode: FileNode,
    targetNode: FileNode | null,
  ) => {
    if (!sourceNode || !chatId) return;

    // Prevent moving to itself
    if (targetNode && targetNode.id === sourceNode.id) return;

    const sourcePath = sourceNode.id;
    const lastSlashIndex = sourcePath.lastIndexOf("/");
    const sourceDir =
      lastSlashIndex > -1 ? sourcePath.substring(0, lastSlashIndex) : undefined;

    const destDir = targetNode ? targetNode.id : undefined;

    // Prevent moving to same directory
    if (sourceDir === destDir) return;

    // Prevent moving folder into itself or its children
    if (
      sourceNode.type === "folder" &&
      destDir &&
      destDir.startsWith(sourcePath + "/")
    )
      return;

    try {
      await fileService.moveFile(
        sourceNode.name,
        sourceNode.name,
        sourceDir,
        destDir,
        chatId,
      );
      await fetchFiles();
    } catch (error) {
      console.error("Failed to move file:", error);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleFileTreeSelect = async (path: string, node: FileNode) => {
    // Delegate content loading to handleFileSelect.
    // It knows how to properly load binary files (via download) and text/excel accordingly.
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
              title={t("preview.share")}
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
                      <ArrowLeft className="w-3.5 h-3.5" /> {t("preview.back")}
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="flex bg-muted border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 mr-2">
                        <button
                          onClick={() => setViewMode("code")}
                          className={`px-2 py-1 text-[10px] rounded-md transition-all flex items-center gap-1.5 ${viewMode === "code" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          <Code className="w-3 h-3" /> {t("preview.code")}
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
                            <Eye className="w-3 h-3" /> {t("preview.previewMode")}
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
                        title={t("preview.save")}
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(selectedFile)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                      title={t("preview.download")}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                      title={t("preview.copy")}
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={handleDeleteFile}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                      title={t("preview.deleteFile")}
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
                error={loadError}
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
                  <div
                    className="flex-1 overflow-y-auto p-2 font-mono bg-background transition-colors duration-200"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const sourceNode = JSON.parse(
                          e.dataTransfer.getData("application/json"),
                        );
                        handleFileDrop(sourceNode, null);
                      } catch (err) {}
                    }}
                  >
                    {isFilesLoading ? (
                      <div className="space-y-1 p-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 py-1.5 px-2"
                          >
                            <div className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                            <div
                              className="h-3 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse"
                              style={{ width: `${60 + Math.random() * 80}px` }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      fileSystem.map((node, idx) => (
                        <FileTreeItem
                          key={node.id || idx}
                          node={node}
                          level={0}
                          path={node.name}
                          selectedFile={selectedFileName}
                          onToggle={toggleFolder}
                          onSelect={handleFileTreeSelect}
                          onDelete={handleDeleteNode}
                          onRename={handleRenameNode}
                          onDownload={handleDownload}
                          onFileDrop={handleFileDrop}
                          onContextMenu={handleContextMenu}
                          expandedPaths={expandedPaths}
                          renamingNodeId={renamingNodeId}
                          onRenameSubmit={handleRenameSubmit}
                          onRenameCancel={handleRenameCancel}
                        />
                      ))
                    )}
                  </div>
                  
                  {contextMenu && createPortal(
                    <>
                      <div
                        className="fixed inset-0 z-[9998]"
                        onClick={() => setContextMenu(null)}
                      />
                      <div
                        className="fixed z-[9999] min-w-[160px] bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 animate-in fade-in zoom-in-95 duration-100"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                      >
                        {contextMenu.node.type === "file" && (
                          <button
                            onClick={() => {
                              handleDownload(contextMenu.node);
                              setContextMenu(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4 text-zinc-500" />
                            {t("preview.download")}
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            handleRenameNode(contextMenu.node);
                            setContextMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4 text-zinc-500" />
                          {t("preview.rename")}
                        </button>
                        
                        <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />
                        
                        <button
                          onClick={() => {
                            handleDeleteNode(contextMenu.node);
                            setContextMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t("preview.delete")}
                        </button>
                      </div>
                    </>,
                    document.body
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
      />
      <InputModal
        isOpen={inputModal.isOpen}
        onClose={() => setInputModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={inputModal.onConfirm}
        title={inputModal.title}
        initialValue={inputModal.initialValue}
        placeholder={inputModal.placeholder}
        confirmText={inputModal.confirmText}
        cancelText={inputModal.cancelText}
      />
    </div>
  );
};
