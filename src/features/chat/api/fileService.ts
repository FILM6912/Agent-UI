import type {
  FileListResponse,
  FileUploadResponse,
  MultipleFileUploadResponse,
  FileReadResponse,
  FileWriteResponse,
  DirectoryCreateResponse,
  FileDeleteResponse,
  FileSearchResponse,
  FileInfoResponse,
  FileMoveResponse,
  FileCopyResponse,
  FileApiClient,
  FileUploadOptions,
  FileReadOptions,
  FileWriteOptions,
  FileDeleteOptions,
  FileSearchOptions
} from "@/types/file-api";

const DEFAULT_BASE_URL = process.env.FILE_API_URL || 'http://localhost:8000';

class FileService implements FileApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async listFiles(path?: string): Promise<FileListResponse> {
    const params = new URLSearchParams();
    if (path) params.append('path', path);
    
    const query = params.toString();
    return this.request<FileListResponse>(`/api/v1/files${query ? `?${query}` : ''}`);
  }

  async uploadFile(file: File, options?: FileUploadOptions): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.path) {
      formData.append('path', options.path);
    }

    const url = `${this.baseUrl}/api/v1/files/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadMultipleFiles(files: File[], options?: FileUploadOptions): Promise<MultipleFileUploadResponse> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (options?.path) {
      formData.append('path', options.path);
    }

    const url = `${this.baseUrl}/api/v1/files/upload/multiple`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async downloadFile(filename: string, options?: FileReadOptions): Promise<Blob> {
    const params = new URLSearchParams();
    if (options?.path) params.append('path', options.path);
    
    const query = params.toString();
    const url = `${this.baseUrl}/api/v1/files/download/${encodeURIComponent(filename)}${query ? `?${query}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async readFile(filename: string, options?: FileReadOptions): Promise<FileReadResponse> {
    const params = new URLSearchParams();
    if (options?.path) params.append('path', options.path);
    
    const query = params.toString();
    return this.request<FileReadResponse>(`/api/v1/files/read/${encodeURIComponent(filename)}${query ? `?${query}` : ''}`);
  }

  async writeFile(filename: string, content: string, options?: FileWriteOptions): Promise<FileWriteResponse> {
    const formData = new FormData();
    formData.append('content', content);
    if (options?.path) {
      formData.append('path', options.path);
    }

    const url = `${this.baseUrl}/api/v1/files/write/${encodeURIComponent(filename)}`;
    const response = await fetch(url, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Write failed: ${response.statusText}`);
    }

    return response.json();
  }

  async createDirectory(name: string, options?: FileDeleteOptions): Promise<DirectoryCreateResponse> {
    const formData = new FormData();
    formData.append('name', name);
    if (options?.path) {
      formData.append('path', options.path);
    }

    const url = `${this.baseUrl}/api/v1/files/directory`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Create directory failed: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteFile(filename: string, options?: FileDeleteOptions): Promise<FileDeleteResponse> {
    const params = new URLSearchParams();
    if (options?.path) params.append('path', options.path);
    
    const query = params.toString();
    return this.request<FileDeleteResponse>(`/api/v1/files/${encodeURIComponent(filename)}${query ? `?${query}` : ''}`, {
      method: 'DELETE',
    });
  }

  async searchFiles(query: string, options?: FileSearchOptions): Promise<FileSearchResponse> {
    const params = new URLSearchParams({ query });
    if (options?.path) params.append('path', options.path);
    if (options?.extensions) params.append('extensions', options.extensions);
    
    const queryString = params.toString();
    return this.request<FileSearchResponse>(`/api/v1/files/search?${queryString}`);
  }

  async getFileInfo(filename: string, options?: FileReadOptions): Promise<FileInfoResponse> {
    const params = new URLSearchParams();
    if (options?.path) params.append('path', options.path);
    
    const query = params.toString();
    return this.request<FileInfoResponse>(`/api/v1/files/info/${encodeURIComponent(filename)}${query ? `?${query}` : ''}`);
  }

  async moveFile(source: string, destination: string, sourcePath?: string, destPath?: string): Promise<FileMoveResponse> {
    return this.request<FileMoveResponse>('/api/v1/files/move', {
      method: 'POST',
      body: JSON.stringify({ source, destination, source_path: sourcePath, dest_path: destPath }),
    });
  }

  async copyFile(source: string, destination: string, sourcePath?: string, destPath?: string): Promise<FileCopyResponse> {
    return this.request<FileCopyResponse>('/api/v1/files/copy', {
      method: 'POST',
      body: JSON.stringify({ source, destination, source_path: sourcePath, dest_path: destPath }),
    });
  }

  async getMCPTools() {
    return this.request('/api/v1/files/mcp/tools');
  }

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const fileService = new FileService();
export default fileService;
