import React, { useState } from 'react';
import { FileBrowser } from './components/FileBrowser';
import { FileUpload } from './components/FileUpload';
import { FileEditor } from './components/FileEditor';
import { FolderPlus, RefreshCw, Settings, Server } from 'lucide-react';
import type { FileItem } from '@/types/file-api';
import { fileService } from '@/features/chat/api/fileService';

interface FileViewProps {
  className?: string;
}

export const FileView: React.FC<FileViewProps> = ({ className = '' }) => {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      await fileService.listFiles();
      setServerStatus('online');
    } catch (error) {
      setServerStatus('offline');
    }
  };

  React.useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      setShowEditor(true);
    }
  };

  const handleDirectorySelect = (file: FileItem) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
    }
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setSelectedFile(null);
  };

  const handleCreateDirectory = async () => {
    const name = prompt('Enter directory name:');
    if (name) {
      try {
        await fileService.createDirectory(name, { path: currentPath });
        checkServerStatus();
      } catch (error) {
        console.error('Failed to create directory:', error);
        alert('Failed to create directory');
      }
    }
  };

  const handleUploadComplete = () => {
    checkServerStatus();
  };

  return (
    <div className={`h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 ${className}`}>
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Server className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              File Manager
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${
                serverStatus === 'online' ? 'bg-green-500' : 
                serverStatus === 'offline' ? 'bg-red-500' : 
                'bg-yellow-500 animate-pulse'
              }`} />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {serverStatus === 'online' ? 'Server Online' : 
                 serverStatus === 'offline' ? 'Server Offline' : 
                 'Checking...'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={checkServerStatus}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Refresh Server Status"
          >
            <RefreshCw className="w-5 h-5 text-zinc-500" />
          </button>
          <button
            onClick={handleCreateDirectory}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">API URL:</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100">
              {fileService.getBaseUrl()}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6 h-full">
            <FileBrowser
              currentPath={currentPath}
              onFileSelect={handleFileSelect}
              onDirectorySelect={handleDirectorySelect}
              className="flex-1"
            />
            <FileUpload
              currentPath={currentPath}
              onUploadComplete={handleUploadComplete}
            />
          </div>

          <div className="h-full">
            {showEditor && selectedFile ? (
              <FileEditor
                file={selectedFile}
                onClose={handleEditorClose}
                onSave={checkServerStatus}
                className="h-full"
              />
            ) : (
              <div className="h-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full inline-block mb-4">
                    <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    No File Selected
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Select a file from the browser to view and edit its contents
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
