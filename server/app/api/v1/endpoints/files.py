import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse
from typing import Optional

from app.schemas.file import (
    FileListResponse,
    FileUploadResponse,
    MultipleFileUploadResponse,
    FileReadResponse,
    FileWriteResponse,
    DirectoryCreateResponse,
    FileDeleteResponse,
    FileSearchResponse,
    FileInfoResponse,
    FileMoveRequest,
    FileMoveResponse,
    FileCopyRequest,
    FileCopyResponse
)
from app.services.file_service import file_service
from app.core.security import get_mime_type, resolve_path

router = APIRouter()


@router.get("/", response_model=FileListResponse, operation_id="list_files")
async def list_files(path: Optional[str] = Query(None, description="Directory path to list")):
    return await file_service.list_files(path)


@router.post("/upload", response_model=FileUploadResponse, operation_id="upload_file")
async def upload_file(
    file: UploadFile = File(..., description="File to upload"),
    path: Optional[str] = Form(None, description="Target directory path")
):
    return await file_service.upload_file(file, path)


@router.post("/upload/multiple", response_model=MultipleFileUploadResponse, operation_id="upload_multiple_files")
async def upload_multiple_files(
    files: list[UploadFile] = File(..., description="Files to upload"),
    path: Optional[str] = Form(None, description="Target directory path")
):
    return await file_service.upload_multiple_files(files, path)


@router.get("/download/{filename:path}", operation_id="download_file")
async def download_file(filename: str, path: Optional[str] = Query(None)):
    target_dir = resolve_path(path)
    file_path = f"{target_dir}/{filename}"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    if os.path.isdir(file_path):
        raise HTTPException(status_code=400, detail="Cannot download directory")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=get_mime_type(filename)
    )


@router.get("/read/{filename:path}", response_model=FileReadResponse, operation_id="read_file")
async def read_file(filename: str, path: Optional[str] = Query(None)):
    return await file_service.read_file(filename, path)


@router.put("/write/{filename:path}", response_model=FileWriteResponse, operation_id="write_file")
async def write_file(
    filename: str,
    content: str = Form(..., description="Content to write"),
    path: Optional[str] = Form(None, description="Target directory path")
):
    return await file_service.write_file(filename, content, path)


@router.post("/directory", response_model=DirectoryCreateResponse, operation_id="create_directory", status_code=status.HTTP_201_CREATED)
async def create_directory(
    name: str = Form(..., description="Directory name"),
    path: Optional[str] = Form(None, description="Parent directory path")
):
    return await file_service.create_directory(name, path)


@router.delete("/{filename:path}", response_model=FileDeleteResponse, operation_id="delete_file")
async def delete_file(filename: str, path: Optional[str] = Query(None)):
    return await file_service.delete_file(filename, path)


@router.get("/search", response_model=FileSearchResponse, operation_id="search_files")
async def search_files(
    query: str = Query(..., description="Search query"),
    path: Optional[str] = Query(None, description="Directory to search"),
    extensions: Optional[str] = Query(None, description="Comma-separated file extensions")
):
    return await file_service.search_files(query, path, extensions)


@router.get("/info/{filename:path}", response_model=FileInfoResponse, operation_id="get_file_info")
async def get_file_info(filename: str, path: Optional[str] = Query(None)):
    return await file_service.get_file_info(filename, path)


@router.post("/move", response_model=FileMoveResponse, operation_id="move_file")
async def move_file(request: FileMoveRequest):
    return await file_service.move_file(request)


@router.post("/copy", response_model=FileCopyResponse, operation_id="copy_file")
async def copy_file(request: FileCopyRequest):
    return await file_service.copy_file(request)
