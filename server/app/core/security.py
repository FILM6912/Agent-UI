import os
from typing import Optional
from fastapi import HTTPException
from app.core.config import get_settings

settings = get_settings()


def resolve_path(path: Optional[str] = None, base_dir: Optional[str] = None) -> str:
    if base_dir is None:
        base_dir = settings.UPLOAD_DIR
    
    if path:
        resolved = os.path.normpath(os.path.join(base_dir, path))
    else:
        resolved = base_dir
    
    abs_base = os.path.abspath(base_dir)
    abs_resolved = os.path.abspath(resolved)
    
    if not abs_resolved.startswith(abs_base):
        raise HTTPException(status_code=403, detail="Access denied: path outside allowed directory")
    
    return abs_resolved


def is_allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in settings.ALLOWED_EXTENSIONS


def get_mime_type(filename: str) -> str:
    import mimetypes
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "application/octet-stream"
