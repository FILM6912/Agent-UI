import os
from typing import Optional
from fastapi import HTTPException
from app.core.config import get_settings

settings = get_settings()


def resolve_path(path: Optional[str] = None) -> str:
    base_dir = os.path.abspath(path or settings.UPLOAD_DIR)
    
    if not base_dir.startswith(os.path.abspath(settings.UPLOAD_DIR)):
        raise HTTPException(status_code=403, detail="Access denied: path outside allowed directory")
    
    return base_dir


def is_allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in settings.ALLOWED_EXTENSIONS


def get_mime_type(filename: str) -> str:
    import mimetypes
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "application/octet-stream"
