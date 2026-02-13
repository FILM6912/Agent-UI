import React, { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, ChevronDown, RefreshCw, Search, MoreVertical, Trash2, Edit, Copy, Download } from 'lucide-react';
import type { FileItem } from '@/types/file-api';
import { fileService } from '@/features/chat/api/fileService';
import { formatBytes } from '@/lib/utils';

interface FileBrowserProps {
  onFileSelect?: (file: FileItem) => void;
  onDirectorySelect?: (file: FileItem) => void;
  chatId?: string;
  className?: string;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  onFileSelect,
  onDirectorySelect,
  chatId,
  className = ''
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null);

  const loadFiles = async (path?: string) => {
    if (!chatId) return;
    setLoading(true);
    try {
      const response = await fileService.listFiles(path, chatId);
      setFiles(response.files || []);
      setCurrentPath(response.path || '');
      
      if (path !== undefined) {
        const newHistory = pathHistory.slice(0, historyIndex + 1);
        newHistory.push(path);
        setPathHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [chatId]);

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'directory') {
      if (onDirectorySelect) {
        onDirectorySelect(file);
      }
    } else {
      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  };

  const handleDirectoryDoubleClick = (file: FileItem) => {
    if (file.type === 'directory') {
      loadFiles(file.path);
    }
  };

  const navigateBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadFiles(pathHistory[newIndex]);
    }
  };

  const navigateForward = () => {
    if (historyIndex < pathHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadFiles(pathHistory[newIndex]);
    }
  };

  const navigateUp = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const parentPath = pathParts.slice(0, -1).join('/') || '';
      loadFiles(parentPath);
    }
  };

  const handleSearch = async () => {
    if (!chatId || !searchQuery.trim()) {
      loadFiles(currentPath);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fileService.searchFiles(searchQuery, { path: currentPath }, chatId);
      const results = response.results || [];
      const fileItems: FileItem[] = results.map(r => ({
        name: r.name,
        path: r.path,
        type: 'file',
        size: r.size,
        modified: 0,
        mime_type: r.mime_type
      }));
      setFiles(fileItems);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDirExpanded = (path: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleDelete = async (file: FileItem) => {
    if (!chatId || !confirm(`Are you sure you want to delete "${file.name}"?`)) return;
    
    try {
      await fileService.deleteFile(file.name, { path: currentPath }, chatId);
      await loadFiles(currentPath);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete file');
    }
  };

  const handleDownload = async (file: FileItem) => {
    if (!chatId) return;
    try {
      const blob = await fileService.downloadFile(file.name, { path: currentPath }, chatId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const getFileIcon = (file: FileItem) => {
    return file.type === 'directory' ? (
      <Folder className="w-5 h-5 text-blue-500" />
    ) : (
      <File className="w-5 h-5 text-zinc-400" />
    );
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 ${className}`}>
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            File Browser
          </h2>
          <button
            onClick={() => loadFiles(currentPath)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={navigateBack}
            disabled={historyIndex <= 0}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Back"
          >
            <ChevronRight className="w-4 h-4 text-zinc-500 rotate-180" />
          </button>
          <button
            onClick={navigateForward}
            disabled={historyIndex >= pathHistory.length - 1}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Forward"
          >
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>
          <button
            onClick={navigateUp}
            disabled={!currentPath}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Up"
          >
            <ChevronUp className="w-4 h-4 text-zinc-500 rotate-180" />
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      <div className="p-4">
        {currentPath && (
          <div className="mb-3 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">
              {currentPath}
            </p>
          </div>
        )}

        <div className="space-y-1 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <Folder className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No files found</p>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.path}
                className="flex items-center gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors group"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, file });
                }}
                onClick={() => handleFileClick(file)}
                onDoubleClick={() => handleDirectoryDoubleClick(file)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (file.type === 'directory') {
                      toggleDirExpanded(file.path);
                    }
                  }}
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                >
                  {file.type === 'directory' ? (
                    expandedDirs.has(file.path) ? (
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    )
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                </button>

                {getFileIcon(file)}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                    {file.name}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {file.type === 'file' && (
                    <span className="hidden sm:block">{formatBytes(file.size)}</span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, file });
                  }}
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
          <div
            className="fixed z-50 min-w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-1"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                onFileSelect?.(contextMenu.file);
                closeContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => {
                handleDownload(contextMenu.file);
                closeContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            {contextMenu.file.type === 'file' && (
              <button
                onClick={async () => {
                  if (!chatId) {
                    closeContextMenu();
                    return;
                  }
                  try {
                    await fileService.copyFile(
                      contextMenu.file.name,
                      `${contextMenu.file.name}.copy`,
                      currentPath,
                      currentPath,
                      chatId
                    );
                    await loadFiles(currentPath);
                  } catch (error) {
                    console.error('Copy failed:', error);
                  }
                  closeContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
            )}
            <button
              onClick={() => {
                handleDelete(contextMenu.file);
                closeContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};
