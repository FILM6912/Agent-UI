export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: number;
  mime_type?: string | null;
  children?: FileItem[];
}

export interface FileListResponse {
  files: FileItem[];
  path: string;
  error?: string;
}

export interface FileUploadResponse {
  success: boolean;
  filename: string;
  path: string;
  size: number;
  mime_type?: string;
  error?: string;
}

export interface MultipleFileUploadResponse {
  results: FileUploadResponse[];
  total: number;
  success_count: number;
}

export interface FileReadResponse {
  filename: string;
  path: string;
  content: string;
  mime_type?: string;
  size: number;
  error?: string;
}

export interface FileWriteResponse {
  success: boolean;
  filename: string;
  path: string;
  size: number;
  error?: string;
}

export interface DirectoryCreateResponse {
  success: boolean;
  path: string;
  name: string;
  error?: string;
}

export interface FileDeleteResponse {
  success: boolean;
  message?: string;
  path?: string;
  error?: string;
}

export interface FileSearchResult {
  name: string;
  path: string;
  relative_path: string;
  size: number;
  mime_type?: string;
}

export interface FileSearchResponse {
  results: FileSearchResult[];
  query: string;
  count: number;
  error?: string;
}

export interface FileInfoResponse {
  filename: string;
  path: string;
  size: number;
  modified: number;
  created: number;
  is_directory: boolean;
  is_file: boolean;
  mime_type?: string | null;
  error?: string;
}

export interface FileMoveResponse {
  success: boolean;
  source: string;
  destination: string;
  error?: string;
}

export interface FileCopyResponse {
  success: boolean;
  source: string;
  destination: string;
  error?: string;
}

export interface FileUploadOptions {
  path?: string;
}

export interface FileReadOptions {
  path?: string;
}

export interface FileWriteOptions {
  path?: string;
  createDirs?: boolean;
}

export interface FileDeleteOptions {
  path?: string;
}

export interface FileSearchOptions {
  path?: string;
  extensions?: string;
}

export interface DirectoryInfo {
  path: string;
  name: string;
  parent?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolsResponse {
  tools: MCPTool[];
}

export interface FileApiClient {
  listFiles(path?: string): Promise<FileListResponse>;
  uploadFile(file: File, options?: FileUploadOptions): Promise<FileUploadResponse>;
  uploadMultipleFiles(files: File[], options?: FileUploadOptions): Promise<MultipleFileUploadResponse>;
  downloadFile(filename: string, options?: FileReadOptions): Promise<Blob>;
  readFile(filename: string, options?: FileReadOptions): Promise<FileReadResponse>;
  writeFile(filename: string, content: string, options?: FileWriteOptions): Promise<FileWriteResponse>;
  createDirectory(name: string, options?: FileDeleteOptions): Promise<DirectoryCreateResponse>;
  deleteFile(filename: string, options?: FileDeleteOptions): Promise<FileDeleteResponse>;
  searchFiles(query: string, options?: FileSearchOptions): Promise<FileSearchResponse>;
  getFileInfo(filename: string, options?: FileReadOptions): Promise<FileInfoResponse>;
  moveFile(source: string, destination: string, sourcePath?: string, destPath?: string): Promise<FileMoveResponse>;
  copyFile(source: string, destination: string, sourcePath?: string, destPath?: string): Promise<FileCopyResponse>;
}
