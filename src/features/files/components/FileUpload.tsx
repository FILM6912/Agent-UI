import React, { useState, useRef } from 'react';
import { Upload, X, File, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { fileService } from '@/features/chat/api/fileService';
import type { FileUploadResponse } from '@/types/file-api';

interface FileUploadProps {
  currentPath?: string;
  chatId?: string;
  onUploadComplete?: (responses: FileUploadResponse[]) => void;
  className?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  currentPath = '',
  chatId,
  onUploadComplete,
  className = ''
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFiles = (files: File[]) => {
    const newUploads: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));

    setUploads(prev => [...prev, ...newUploads]);
    
    newUploads.forEach(upload => {
      uploadFile(upload.file);
    });
  };

  const uploadFile = async (file: File) => {
    if (!chatId) return;
    setUploads(prev => 
      prev.map(u => 
        u.file === file 
          ? { ...u, status: 'uploading', progress: 10 }
          : u
      )
    );

    try {
      const response = await fileService.uploadFile(file, { path: currentPath }, chatId);
      
      setUploads(prev => 
        prev.map(u => 
          u.file === file 
            ? { ...u, status: 'success', progress: 100 }
            : u
        )
      );

      onUploadComplete?.([response]);
    } catch (error) {
      setUploads(prev => 
        prev.map(u => 
          u.file === file 
            ? { 
                u, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : u
        )
      );
    }
  };

  const uploadMultiple = async () => {
    if (!chatId) return;
    const pendingFiles = uploads
      .filter(u => u.status === 'pending')
      .map(u => u.file);

    if (pendingFiles.length === 0) return;

    setUploads(prev => 
      prev.map(u => 
        u.status === 'pending' 
          ? { ...u, status: 'uploading', progress: 10 }
          : u
      )
    );

    try {
      const response = await fileService.uploadMultipleFiles(pendingFiles, { path: currentPath }, chatId);
      
      setUploads(prev => 
        prev.map(u => 
          u.status === 'uploading' || u.status === 'pending'
            ? { ...u, status: 'success', progress: 100 }
            : u
        )
      );

      onUploadComplete?.(response.results);
    } catch (error) {
      setUploads(prev => 
        prev.map(u => 
          (u.status === 'uploading' || u.status === 'pending')
            ? { 
                u, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : u
        )
      );
    }
  };

  const retryUpload = (file: File) => {
    setUploads(prev => prev.filter(u => u.file !== file));
    uploadFile(file);
  };

  const removeUpload = (file: File) => {
    setUploads(prev => prev.filter(u => u.file !== file));
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(u => u.status !== 'success'));
  };

  const clearAll = () => {
    setUploads([]);
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 ${className}`}>
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Upload Files
          </h2>
          <div className="flex gap-2">
            {uploads.some(u => u.status === 'pending') && (
              <button
                onClick={uploadMultiple}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Upload All
              </button>
            )}
            {uploads.some(u => u.status === 'success') && (
              <button
                onClick={clearCompleted}
                className="px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                Clear Completed
              </button>
            )}
            {uploads.length > 0 && (
              <button
                onClick={clearAll}
                className="px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-sm text-red-600 dark:text-red-400 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer block"
          >
            <Upload className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
            <p className="text-sm text-zinc-900 dark:text-zinc-100 mb-1">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {currentPath ? `Upload to: ${currentPath}` : 'Upload to current directory'}
            </p>
          </label>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="p-4 max-h-80 overflow-y-auto">
          <div className="space-y-2">
            {uploads.map((upload, idx) => (
              <div
                key={`${upload.file.name}-${idx}`}
                className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {upload.status === 'success' ? (
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                  ) : upload.status === 'error' ? (
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                  ) : upload.status === 'uploading' ? (
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="p-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg">
                      <File className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                    {upload.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          upload.status === 'success'
                            ? 'bg-green-500'
                            : upload.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 w-12 text-right">
                      {upload.progress}%
                    </span>
                  </div>
                  {upload.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {upload.error}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {upload.status === 'error' && (
                    <button
                      onClick={() => retryUpload(upload.file)}
                      className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                      title="Retry"
                    >
                      <RefreshCw className="w-4 h-4 text-zinc-500" />
                    </button>
                  )}
                  <button
                    onClick={() => removeUpload(upload.file)}
                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>{uploads.length} file(s)</span>
            <span>
              {uploads.filter(u => u.status === 'success').length} completed,{' '}
              {uploads.filter(u => u.status === 'error').length} failed
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
