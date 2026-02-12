from typing import Optional, List
from pydantic import BaseModel, Field


class FileItem(BaseModel):
    name: str
    path: str
    type: str = Field(..., description="'file' or 'directory'")
    size: int
    modified: float
    mime_type: Optional[str] = None
    chat_id: str


class FileListResponse(BaseModel):
    files: List[FileItem]
    path: str
    count: int
    chat_id: str


class FileUploadResponse(BaseModel):
    success: bool
    filename: str
    path: str
    size: int
    mime_type: Optional[str] = None
    chat_id: str


class MultipleFileUploadResponse(BaseModel):
    results: List[FileUploadResponse]
    total: int
    success_count: int
    chat_id: str


class FileReadResponse(BaseModel):
    filename: str
    path: str
    content: str
    mime_type: Optional[str]
    size: int
    chat_id: str


class FileWriteResponse(BaseModel):
    success: bool
    filename: str
    path: str
    size: int
    chat_id: str


class DirectoryCreateResponse(BaseModel):
    success: bool
    path: str
    name: str
    chat_id: str


class FileDeleteResponse(BaseModel):
    success: bool
    message: str
    path: str
    chat_id: str


class FileSearchResult(BaseModel):
    name: str
    path: str
    relative_path: str
    size: int


class FileSearchResponse(BaseModel):
    results: List[FileSearchResult]
    query: str
    count: int


class FileInfoResponse(BaseModel):
    filename: str
    path: str
    size: int
    modified: float
    created: float
    is_directory: bool
    is_file: bool
    mime_type: Optional[str]


class FileMoveRequest(BaseModel):
    source: str = Field(..., description="Source file/directory name")
    destination: str = Field(..., description="Destination file/directory name")
    source_path: Optional[str] = Field(None, description="Source directory path")
    dest_path: Optional[str] = Field(None, description="Destination directory path")


class FileMoveResponse(BaseModel):
    success: bool
    source: str
    destination: str


class FileCopyRequest(BaseModel):
    source: str = Field(..., description="Source file/directory name")
    destination: str = Field(..., description="Destination file/directory name")
    source_path: Optional[str] = Field(None, description="Source directory path")
    dest_path: Optional[str] = Field(None, description="Destination directory path")


class FileCopyResponse(BaseModel):
    success: bool
    source: str
    destination: str
