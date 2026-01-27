import React from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileType,
  File as FileIcon,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  FileSpreadsheet,
  FileText,
  Table as TableIcon,
  Globe,
} from "lucide-react";

export interface FileNode {
  id?: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  isOpen?: boolean;
  content?: string;
}

interface FileTreeItemProps {
  node: FileNode;
  level: number;
  path: string;
  selectedFile: string | null;
  onToggle: (path: string) => void;
  onSelect: (path: string, node: FileNode) => void;
  expandedPaths: Set<string>;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "tsx" || ext === "ts" || ext === "jsx" || ext === "js")
    return <FileCode className="w-4 h-4 text-blue-400" />;
  if (ext === "json") return <FileJson className="w-4 h-4 text-yellow-400" />;
  if (ext === "css" || ext === "scss")
    return <FileType className="w-4 h-4 text-pink-400" />;
  if (ext === "html") return <Globe className="w-4 h-4 text-orange-400" />;
  if (ext === "md" || ext === "txt")
    return <FileText className="w-4 h-4 text-zinc-400" />;
  if (ext === "png" || ext === "jpg" || ext === "svg" || ext === "gif")
    return <ImageIcon className="w-4 h-4 text-purple-400" />;
  if (ext === "csv") return <TableIcon className="w-4 h-4 text-green-400" />;
  if (ext === "xlsx" || ext === "xls")
    return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
  return <FileIcon className="w-4 h-4 text-zinc-500" />;
};

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  level,
  path,
  selectedFile,
  onToggle,
  onSelect,
  expandedPaths,
}) => {
  const isExpanded = expandedPaths.has(path);
  const isSelected = selectedFile === path;

  return (
    <div>
      <div
        onClick={() => {
          if (node.type === "folder") {
            onToggle(path);
          } else {
            onSelect(path, node);
          }
        }}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {node.type === "folder" ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 shrink-0 text-blue-400" />
            ) : (
              <Folder className="w-4 h-4 shrink-0 text-blue-400" />
            )}
          </>
        ) : (
          <>
            <div className="w-3.5" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>

      {node.type === "folder" && isExpanded && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <FileTreeItem
              key={`${path}/${child.name}-${idx}`}
              node={child}
              level={level + 1}
              path={`${path}/${child.name}`}
              selectedFile={selectedFile}
              onToggle={onToggle}
              onSelect={onSelect}
              expandedPaths={expandedPaths}
            />
          ))}
        </div>
      )}
    </div>
  );
};
