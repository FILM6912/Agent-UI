import React, { useState, useEffect } from 'react';
import { Save, Download, RefreshCw, Copy, Maximize2, Minimize2, X, FileText, Info } from 'lucide-react';
import { fileService } from '@/features/chat/api/fileService';
import type { FileItem } from '@/types/file-api';

interface FileEditorProps {
  file: FileItem | null;
  onClose?: () => void;
  onSave?: () => void;
  className?: string;
}

export const FileEditor: React.FC<FileEditorProps> = ({
  file,
  onClose,
  onSave,
  className = ''
}) => {
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [isModified, setIsModified] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (file) {
      loadFileContent();
    } else {
      setContent('');
      setOriginalContent('');
      setIsModified(false);
      setError('');
    }
  }, [file]);

  const loadFileContent = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    try {
      const response = await fileService.readFile(file.name);
      setContent(response.content);
      setOriginalContent(response.content);
      setIsModified(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file';
      setError(errorMessage);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!file || saving) return;

    setSaving(true);
    setError('');
    try {
      await fileService.writeFile(file.name, content);
      setOriginalContent(content);
      setIsModified(false);
      onSave?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save file';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    try {
      const blob = await fileService.downloadFile(file.name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download file';
      setError(errorMessage);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const handleRefresh = () => {
    loadFileContent();
  };

  const handleChange = (value: string) => {
    setContent(value);
    setIsModified(value !== originalContent);
    setError('');
  };

  const getLineCount = () => content.split('\n').length;

  if (!file) {
    return (
      <div className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 ${className}`}>
        <div className="p-8 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-500 dark:text-zinc-400">Select a file to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col ${isFullscreen ? 'fixed inset-4 z-50' : ''} ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {file.name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {file.path}
            </p>
          </div>
          {isModified && (
            <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
              Modified
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="File Info"
          >
            <Info className="w-4 h-4 text-zinc-500" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-zinc-500" />
            ) : (
              <Maximize2 className="w-4 h-4 text-zinc-500" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          )}
        </div>
      </div>

      {showInfo && (
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Type:</span>
              <span className="ml-2 text-zinc-900 dark:text-zinc-100">
                {file.mime_type || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Size:</span>
              <span className="ml-2 text-zinc-900 dark:text-zinc-100">
                {file.size.toLocaleString()} bytes
              </span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Lines:</span>
              <span className="ml-2 text-zinc-900 dark:text-zinc-100">
                {getLineCount()}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Modified:</span>
              <span className="ml-2 text-zinc-900 dark:text-zinc-100">
                {new Date(file.modified * 1000).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!isModified || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4 text-zinc-500" />
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Copy to Clipboard"
          >
            <Copy className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {getLineCount()} lines
        </div>
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-zinc-900">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading file...</p>
            </div>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full h-full p-4 bg-white dark:bg-zinc-900 text-sm font-mono text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none"
            spellCheck={false}
            placeholder="File content..."
          />
        )}
      </div>
    </div>
  );
};
