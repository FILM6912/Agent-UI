import os
import shutil
import asyncio
from typing import Optional, List
from fastapi import HTTPException, UploadFile

from app.schemas.file import (
    FileItem,
    FileListResponse,
    FileUploadResponse,
    MultipleFileUploadResponse,
    FileReadResponse,
    FileWriteResponse,
    DirectoryCreateResponse,
    FileDeleteResponse,
    FileSearchResult,
    FileSearchResponse,
    FileInfoResponse,
    FileMoveRequest,
    FileMoveResponse,
    FileCopyRequest,
    FileCopyResponse
)
from app.core.config import get_settings
from app.core.security import resolve_path, is_allowed_file, get_mime_type

settings = get_settings()


class FileService:
    def __init__(self):
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    def _get_chat_dir(self, chat_id: str) -> str:
        return os.path.join(settings.UPLOAD_DIR, chat_id)

    async def list_files(self, chat_id: str, path: Optional[str] = None, recursive: bool = False) -> FileListResponse:
        chat_dir = self._get_chat_dir(chat_id)
        
        # Auto-create chat directory if it doesn't exist (e.g. new chat)
        if not os.path.exists(chat_dir):
            os.makedirs(chat_dir, exist_ok=True)

        base_dir = resolve_path(path, base_dir=chat_dir)
        
        if not os.path.exists(base_dir):
            raise HTTPException(status_code=404, detail="Path not found")
        
        if not os.path.isdir(base_dir):
            raise HTTPException(status_code=400, detail="Path is not a directory")
        
        def scan_directory(directory: str) -> List[FileItem]:
            items = []
            try:
                with os.scandir(directory) as it:
                    for entry in it:
                        is_dir = entry.is_dir()
                        item_path = entry.path
                        stat = entry.stat()
                        
                        file_item = FileItem(
                            name=entry.name,
                            path=item_path,
                            type="directory" if is_dir else "file",
                            size=stat.st_size if not is_dir else 0,
                            modified=stat.st_mtime,
                            mime_type=get_mime_type(entry.name) if not is_dir else None,
                            chat_id=chat_id,
                            children=scan_directory(item_path) if is_dir and recursive else None
                        )
                        items.append(file_item)
                
                items.sort(key=lambda x: (x.type == "file", x.name.lower()))
                return items
            except PermissionError:
                return []

        try:
            files = scan_directory(base_dir)
            return FileListResponse(files=files, path=base_dir, count=len(files), chat_id=chat_id)
        except PermissionError:
            raise HTTPException(status_code=403, detail="Permission denied")

    async def upload_file(
        self,
        chat_id: str,
        file: UploadFile,
        path: Optional[str] = None
    ) -> FileUploadResponse:
        chat_dir = self._get_chat_dir(chat_id)
        target_dir = resolve_path(path, base_dir=chat_dir)
        os.makedirs(target_dir, exist_ok=True)
        
        filename = file.filename or "unnamed"
        file_path = os.path.join(target_dir, filename)
        
        if not is_allowed_file(filename):
            raise HTTPException(status_code=400, detail="File type not allowed")
        
        try:
            content = await file.read()
            if len(content) > settings.MAX_UPLOAD_SIZE:
                raise HTTPException(status_code=413, detail="File too large")
            
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            
            return FileUploadResponse(
                success=True,
                filename=filename,
                path=file_path,
                size=os.path.getsize(file_path),
                mime_type=get_mime_type(filename),
                chat_id=chat_id
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    async def upload_multiple_files(
        self,
        chat_id: str,
        files: List[UploadFile],
        path: Optional[str] = None
    ) -> MultipleFileUploadResponse:
        chat_dir = self._get_chat_dir(chat_id)
        target_dir = resolve_path(path, base_dir=chat_dir)
        os.makedirs(target_dir, exist_ok=True)
        
        results = []
        success_count = 0
        
        tasks = [self._upload_single_file(chat_id, file, target_dir) for file in files]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, Exception):
                results.append(FileUploadResponse(
                    success=False,
                    filename="",
                    path="",
                    size=0,
                    mime_type=None,
                    chat_id=chat_id
                ))
            else:
                if result.success:
                    success_count += 1
                results.append(result)
        
        return MultipleFileUploadResponse(
            results=results,
            total=len(files),
            success_count=success_count,
            chat_id=chat_id
        )

    async def _upload_single_file(
        self,
        chat_id: str,
        file: UploadFile,
        target_dir: str
    ) -> FileUploadResponse:
        filename = file.filename or "unnamed"
        file_path = os.path.join(target_dir, filename)
        
        if not is_allowed_file(filename):
            return FileUploadResponse(
                success=False,
                filename=filename,
                path="",
                size=0,
                mime_type=None,
                chat_id=chat_id
            )
        
        try:
            content = await file.read()
            if len(content) > settings.MAX_UPLOAD_SIZE:
                return FileUploadResponse(
                    success=False,
                    filename=filename,
                    path="",
                    size=0,
                    mime_type=None,
                    chat_id=chat_id
                )
            
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            
            return FileUploadResponse(
                success=True,
                filename=filename,
                path=file_path,
                size=os.path.getsize(file_path),
                mime_type=get_mime_type(filename),
                chat_id=chat_id
            )
        except Exception:
            return FileUploadResponse(
                success=False,
                filename=filename,
                path="",
                size=0,
                mime_type=None,
                chat_id=chat_id
            )

    async def read_file(self, chat_id: str, filename: str, path: Optional[str] = None) -> FileReadResponse:
        chat_dir = self._get_chat_dir(chat_id)
        target_dir = resolve_path(path, base_dir=chat_dir)
        file_path = os.path.join(target_dir, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        if os.path.isdir(file_path):
            raise HTTPException(status_code=400, detail="Cannot read directory as file")
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            return FileReadResponse(
                filename=filename,
                path=file_path,
                content=content,
                mime_type=get_mime_type(filename),
                size=os.path.getsize(file_path),
                chat_id=chat_id
            )
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File is not text-readable")

    async def write_file(
        self,
        chat_id: str,
        filename: str,
        content: str,
        path: Optional[str] = None
    ) -> FileWriteResponse:
        chat_dir = self._get_chat_dir(chat_id)
        target_dir = resolve_path(path, base_dir=chat_dir)
        os.makedirs(target_dir, exist_ok=True)
        file_path = os.path.join(target_dir, filename)
        
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            
            return FileWriteResponse(
                success=True,
                filename=filename,
                path=file_path,
                size=os.path.getsize(file_path),
                chat_id=chat_id
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Write failed: {str(e)}")

    async def create_directory(self, chat_id: str, name: str, path: Optional[str] = None) -> DirectoryCreateResponse:
        chat_dir = self._get_chat_dir(chat_id)
        base_dir = resolve_path(path, base_dir=chat_dir)
        os.makedirs(base_dir, exist_ok=True)
        new_dir_path = os.path.join(base_dir, name)
        
        if os.path.exists(new_dir_path):
            raise HTTPException(status_code=400, detail="Directory already exists")
        
        try:
            os.makedirs(new_dir_path)
            return DirectoryCreateResponse(
                success=True,
                path=new_dir_path,
                name=name,
                chat_id=chat_id
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Create directory failed: {str(e)}")

    async def delete_file(self, chat_id: str, filename: str, path: Optional[str] = None) -> FileDeleteResponse:
        chat_dir = self._get_chat_dir(chat_id)
        target_dir = resolve_path(path, base_dir=chat_dir)
        file_path = os.path.join(target_dir, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        try:
            if os.path.isdir(file_path):
                shutil.rmtree(file_path)
            else:
                os.remove(file_path)
            
            return FileDeleteResponse(
                success=True,
                message=f"Deleted {filename}",
                path=file_path,
                chat_id=chat_id
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

    async def search_files(
        self,
        chat_id: str,
        query: str,
        path: Optional[str] = None,
        extensions: Optional[str] = None
    ) -> FileSearchResponse:
        chat_dir = self._get_chat_dir(chat_id)
        search_dir = resolve_path(path, base_dir=chat_dir)
        
        if not os.path.exists(search_dir):
            raise HTTPException(status_code=404, detail="Search path not found")
        
        results = []
        allowed_extensions = extensions.split(',') if extensions else None
        
        for root, dirs, files in os.walk(search_dir):
            for file in files:
                if query.lower() in file.lower():
                    if allowed_extensions:
                        file_ext = file.rsplit('.', 1)[1].lower() if '.' in file else ''
                        if file_ext not in [e.strip() for e in allowed_extensions]:
                            continue
                    
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, search_dir)
                    results.append(FileSearchResult(
                        name=file,
                        path=file_path,
                        relative_path=rel_path,
                        size=os.path.getsize(file_path)
                    ))
        
        return FileSearchResponse(
            results=results,
            query=query,
            count=len(results)
        )

    async def get_file_info(self, chat_id: str, filename: str, path: Optional[str] = None) -> FileInfoResponse:
        chat_dir = self._get_chat_dir(chat_id)
        target_dir = resolve_path(path, base_dir=chat_dir)
        file_path = os.path.join(target_dir, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        stat = os.stat(file_path)
        return FileInfoResponse(
            filename=filename,
            path=file_path,
            size=stat.st_size,
            modified=stat.st_mtime,
            created=stat.st_ctime,
            is_directory=os.path.isdir(file_path),
            is_file=os.path.isfile(file_path),
            mime_type=get_mime_type(filename) if os.path.isfile(file_path) else None
        )

    async def move_file(self, chat_id: str, request: FileMoveRequest) -> FileMoveResponse:
        chat_dir = self._get_chat_dir(chat_id)
        src_dir = resolve_path(request.source_path, base_dir=chat_dir)
        dst_dir = resolve_path(request.dest_path, base_dir=chat_dir)
        
        src_file = os.path.join(src_dir, request.source)
        dst_file = os.path.join(dst_dir, request.destination)
        
        if not os.path.exists(src_file):
            raise HTTPException(status_code=404, detail="Source file not found")
        
        try:
            os.makedirs(dst_dir, exist_ok=True)
            shutil.move(src_file, dst_file)
            return FileMoveResponse(
                success=True,
                source=src_file,
                destination=dst_file
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Move failed: {str(e)}")

    async def copy_file(self, chat_id: str, request: FileCopyRequest) -> FileCopyResponse:
        chat_dir = self._get_chat_dir(chat_id)
        src_dir = resolve_path(request.source_path, base_dir=chat_dir)
        dst_dir = resolve_path(request.dest_path, base_dir=chat_dir)
        
        src_file = os.path.join(src_dir, request.source)
        dst_file = os.path.join(dst_dir, request.destination)
        
        if not os.path.exists(src_file):
            raise HTTPException(status_code=404, detail="Source file not found")
        
        try:
            os.makedirs(dst_dir, exist_ok=True)
            if os.path.isdir(src_file):
                shutil.copytree(src_file, dst_file)
            else:
                shutil.copy2(src_file, dst_file)
            return FileCopyResponse(
                success=True,
                source=src_file,
                destination=dst_file
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Copy failed: {str(e)}")


file_service = FileService()
